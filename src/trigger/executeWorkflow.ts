import { task, wait } from "@trigger.dev/sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

type NodeStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay" | "find_contact";
  data: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string; // "true" or "false" for condition nodes
  target: string;
}

interface ExecutionContext {
  [nodeId: string]: Record<string, unknown>;
}

// ── Supabase client ───────────────────────────────────────────────────────────

const getMainSupabase = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── Template variable resolver ────────────────────────────────────────────────
// Supports both {{nodeId.field}} and deep paths like {{trigger.query.test}}

function resolvePath(obj: unknown, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function resolveTemplate(
  template: string,
  context: ExecutionContext
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, pathStr) => {
    const parts = pathStr.trim().split(".");
    const nodeId = parts[0];
    const rest = parts.slice(1);
    const nodeContext = context[nodeId];
    if (!nodeContext) return "";
    const value = rest.length > 0 ? resolvePath(nodeContext, rest) : nodeContext;
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

function resolveObject(
  obj: Record<string, unknown>,
  context: ExecutionContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      resolved[key] = resolveTemplate(value, context);
    } else if (typeof value === "object" && value !== null) {
      resolved[key] = resolveObject(value as Record<string, unknown>, context);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

// ── Step logger ───────────────────────────────────────────────────────────────

async function logStep(
  supabase: SupabaseClient,
  executionId: string,
  nodeId: string,
  nodeType: string,
  status: NodeStatus,
  inputData?: Record<string, unknown>,
  outputData?: Record<string, unknown>,
  errorMessage?: string
) {
  await supabase.from("workflow_execution_steps").upsert(
    {
      execution_id: executionId,
      node_id: nodeId,
      node_type: nodeType,
      status,
      input_data: inputData ?? {},
      output_data: outputData ?? {},
      error_message: errorMessage ?? null,
      started_at: status === "running" ? new Date().toISOString() : undefined,
      completed_at:
        status === "completed" || status === "failed"
          ? new Date().toISOString()
          : undefined,
    },
    { onConflict: "execution_id,node_id" }
  );
}

// ── Node handlers ─────────────────────────────────────────────────────────────

// WEBHOOK — Lovable stores as type="action", data.actionType="webhook"
// Body comes from data.params (object) if present, otherwise data.body (string)
async function handleWebhook(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const data = node.data as {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>; // key-value pairs used as body
    body?: string;
  };

  const url = resolveTemplate(data.url, context);
  const method = data.method ?? "POST";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (data.headers && Object.keys(data.headers).length > 0) {
    const resolvedHeaders = resolveObject(data.headers as Record<string, unknown>, context);
    Object.assign(headers, resolvedHeaders);
  }

  // Build body: prefer params (key-value map), fall back to body string
  let bodyString: string | undefined;
  if (data.params && Object.keys(data.params).length > 0) {
    bodyString = JSON.stringify(resolveObject(data.params, context));
  } else if (data.body && data.body.trim() !== "") {
    bodyString = resolveTemplate(data.body, context);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method !== "GET" ? bodyString : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `Webhook failed: ${method} ${url} returned ${response.status}`
    );
  }

  let responseData: Record<string, unknown> = {};
  try {
    responseData = await response.json();
  } catch {
    // Response may not be JSON — that's fine
  }

  return { status: response.status, ...responseData };
}

// CONDITION
function handleCondition(
  node: WorkflowNode,
  context: ExecutionContext
): { branch: "true" | "false" } {
  const config = node.data as {
    field: string;
    operator: string;
    value: string;
  };

  const fieldValue = resolveTemplate(config.field, context);
  const compareValue = resolveTemplate(config.value, context);

  let result = false;
  switch (config.operator) {
    case "equals":
      result = fieldValue === compareValue;
      break;
    case "not_equals":
      result = fieldValue !== compareValue;
      break;
    case "contains":
      result = fieldValue.includes(compareValue);
      break;
    case "not_contains":
      result = !fieldValue.includes(compareValue);
      break;
    case "is_empty":
      result = !fieldValue || fieldValue.trim() === "";
      break;
    case "is_not_empty":
      result = !!fieldValue && fieldValue.trim() !== "";
      break;
    case "greater_than":
      result = parseFloat(fieldValue) > parseFloat(compareValue);
      break;
    case "less_than":
      result = parseFloat(fieldValue) < parseFloat(compareValue);
      break;
    default:
      result = false;
  }

  return { branch: result ? "true" : "false" };
}

// DELAY
async function handleDelay(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const config = node.data as {
    mode?: "duration" | "until";
    delayMode?: "duration" | "until"; // Lovable may use either key
    amount?: number;
    delayValue?: number;
    unit?: "seconds" | "minutes" | "hours" | "days";
    delayUnit?: "seconds" | "minutes" | "hours" | "days";
    datetime?: string;
    timezone?: string;
  };

  const mode = config.mode ?? config.delayMode ?? "duration";
  let resumeAt: Date;

  if (mode === "until" && config.datetime) {
    const resolvedDatetime = resolveTemplate(config.datetime, context);
    resumeAt = new Date(resolvedDatetime);
  } else {
    const amount = config.amount ?? config.delayValue ?? 1;
    const unit = config.unit ?? config.delayUnit ?? "minutes";
    const ms = {
      seconds: amount * 1000,
      minutes: amount * 60 * 1000,
      hours: amount * 60 * 60 * 1000,
      days: amount * 24 * 60 * 60 * 1000,
    }[unit];
    resumeAt = new Date(Date.now() + ms);
  }

  console.log(`Delay: waiting until ${resumeAt.toISOString()}`);
  await wait.until({ date: resumeAt });

  return { resumed_at: resumeAt.toISOString() };
}

// FIND LEAD (was: FIND CONTACT)
async function handleFindContact(
  node: WorkflowNode,
  context: ExecutionContext,
  supabase: SupabaseClient,
  clientId: string
): Promise<Record<string, unknown>> {
  const { data: client } = await supabase
    .from("clients")
    .select("supabase_url, supabase_service_key, supabase_table_name")
    .eq("id", clientId)
    .single();

  if (!client?.supabase_url || !client?.supabase_service_key) {
    throw new Error("Client Supabase credentials not configured");
  }

  const clientSupabase = createClient(
    client.supabase_url,
    client.supabase_service_key
  );

  const config = node.data as {
    field: string;
    value: string;
  };

  const searchValue = resolveTemplate(config.value, context);
  const tableName = (client.supabase_table_name as string | null)?.trim() || "leads";

  const { data: lead, error } = await clientSupabase
    .from(tableName)
    .select("*")
    .eq(config.field, searchValue)
    .maybeSingle();

  if (error) {
    throw new Error(`Find lead failed: ${error.message}`);
  }

  return lead ?? { found: false };
}

// CREATE LEAD (was: CREATE CONTACT)
// Writes to both our internal leads table and the client's external Supabase leads table.
// Internal table: upsert by (client_id + lead_id). External table: upsert by id.
async function handleCreateContact(
  node: WorkflowNode,
  context: ExecutionContext,
  supabase: SupabaseClient,
  clientId: string
): Promise<Record<string, unknown>> {
  const { data: client } = await supabase
    .from("clients")
    .select("supabase_url, supabase_service_key, supabase_table_name")
    .eq("id", clientId)
    .single();

  if (!client?.supabase_url || !client?.supabase_service_key) {
    throw new Error("Client Supabase credentials not configured");
  }

  const config = node.data as {
    ghl_contact_id: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  const ghlContactId = resolveTemplate(config.ghl_contact_id, context);
  if (!ghlContactId) throw new Error("create_contact: ghl_contact_id resolved to empty string");

  const fullName = config.name ? resolveTemplate(config.name, context) : undefined;
  const email = config.email ? resolveTemplate(config.email, context) : undefined;
  const phone = config.phone ? resolveTemplate(config.phone, context) : undefined;

  // Split full name into first/last for the leads table schema
  const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  // ── Step 1: Upsert into internal leads table ─────────────────────────────────
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("client_id", clientId)
    .eq("lead_id", ghlContactId)
    .maybeSingle();

  let internalId: string | undefined;
  if (existing) {
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (firstName !== undefined) updateFields.first_name = firstName;
    if (lastName !== undefined) updateFields.last_name = lastName;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    await supabase.from("leads").update(updateFields).eq("id", existing.id);
    internalId = existing.id;
  } else {
    const insertFields: Record<string, unknown> = { client_id: clientId, lead_id: ghlContactId };
    if (firstName !== undefined) insertFields.first_name = firstName;
    if (lastName !== undefined) insertFields.last_name = lastName;
    if (email !== undefined) insertFields.email = email;
    if (phone !== undefined) insertFields.phone = phone;
    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert(insertFields)
      .select("id")
      .single();
    if (insertError) throw new Error(`Internal lead insert failed: ${insertError.message}`);
    internalId = inserted?.id;
  }

  // ── Step 2: Upsert into client's external Supabase leads table ───────────────
  const clientSupabase = createClient(client.supabase_url, client.supabase_service_key);
  const tableName = (client.supabase_table_name as string | null)?.trim() || "leads";

  const externalRecord: Record<string, unknown> = { id: ghlContactId };
  if (firstName !== undefined) externalRecord.first_name = firstName;
  if (lastName !== undefined) externalRecord.last_name = lastName;
  if (email !== undefined) externalRecord.email = email;
  if (phone !== undefined) externalRecord.phone = phone;

  const { error: extError } = await clientSupabase
    .from(tableName)
    .upsert(externalRecord, { onConflict: "id" });

  if (extError) {
    // Log but don't fail — the internal record was already created
    console.error(`create_contact: external upsert failed: ${extError.message}`);
  }

  return {
    internal_id: internalId,
    lead_id: ghlContactId,
    pushed_to_external: !extError,
  };
}

// UPDATE LEAD (was: UPDATE CONTACT)
// Updates an existing lead in both internal and external Supabase tables.
// Expects ghl_contact_id to match an existing record — skips gracefully if not found.
async function handleUpdateContact(
  node: WorkflowNode,
  context: ExecutionContext,
  supabase: SupabaseClient,
  clientId: string
): Promise<Record<string, unknown>> {
  const { data: client } = await supabase
    .from("clients")
    .select("supabase_url, supabase_service_key, supabase_table_name")
    .eq("id", clientId)
    .single();

  if (!client?.supabase_url || !client?.supabase_service_key) {
    throw new Error("Client Supabase credentials not configured");
  }

  const config = node.data as {
    ghl_contact_id: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  const ghlContactId = resolveTemplate(config.ghl_contact_id, context);
  if (!ghlContactId) throw new Error("update_contact: ghl_contact_id resolved to empty string");

  const fullName = config.name ? resolveTemplate(config.name, context) : undefined;
  const email = config.email ? resolveTemplate(config.email, context) : undefined;
  const phone = config.phone ? resolveTemplate(config.phone, context) : undefined;

  const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  // ── Step 1: Update internal leads table ──────────────────────────────────────
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("client_id", clientId)
    .eq("lead_id", ghlContactId)
    .maybeSingle();

  if (existing) {
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (firstName !== undefined) updateFields.first_name = firstName;
    if (lastName !== undefined) updateFields.last_name = lastName;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    await supabase.from("leads").update(updateFields).eq("id", existing.id);
  }

  // ── Step 2: Update external (client) Supabase leads table ────────────────────
  const clientSupabase = createClient(client.supabase_url, client.supabase_service_key);
  const tableName = (client.supabase_table_name as string | null)?.trim() || "leads";

  const externalUpdate: Record<string, unknown> = {};
  if (firstName !== undefined) externalUpdate.first_name = firstName;
  if (lastName !== undefined) externalUpdate.last_name = lastName;
  if (email !== undefined) externalUpdate.email = email;
  if (phone !== undefined) externalUpdate.phone = phone;

  const { error: extError } = await clientSupabase
    .from(tableName)
    .update(externalUpdate)
    .eq("id", ghlContactId);

  if (extError) {
    console.error(`update_contact: external update failed: ${extError.message}`);
  }

  return {
    lead_id: ghlContactId,
    internal_updated: !!existing,
    pushed_to_external: !extError,
  };
}

// ── Resolve actual node type ──────────────────────────────────────────────────
// Lovable uses type="action" + data.actionType for everything except trigger/condition
function getNodeType(node: WorkflowNode): string {
  if (node.type === "action") {
    return (node.data.actionType as string) ?? "action";
  }
  return node.type;
}

// ── Main task ─────────────────────────────────────────────────────────────────

export const executeWorkflow = task({
  id: "execute-workflow",
  maxDuration: 3600,
  retry: { maxAttempts: 2 },

  run: async (payload: {
    workflow_id: string;
    execution_id: string;
    client_id: string;
    trigger_data: Record<string, unknown>;
  }) => {
    const supabase = getMainSupabase();
    const { workflow_id, execution_id, client_id, trigger_data } = payload;

    await supabase
      .from("workflow_executions")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", execution_id);

    try {
      const { data: workflow, error: workflowError } = await supabase
        .from("workflows")
        .select("nodes, edges")
        .eq("id", workflow_id)
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Workflow not found: ${workflow_id}`);
      }

      const nodes = workflow.nodes as WorkflowNode[];
      const edges = workflow.edges as WorkflowEdge[];
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      const triggerNode = nodes.find((n) => n.type === "trigger");
      if (!triggerNode) throw new Error("No trigger node found in workflow");

      const context: ExecutionContext = {
        trigger: trigger_data,
      };

      let currentNodeId: string | null = triggerNode.id;

      while (currentNodeId) {
        const currentNode = nodeMap.get(currentNodeId);
        if (!currentNode) break;

        const resolvedType = getNodeType(currentNode);

        // Skip trigger node — it already fired
        if (currentNode.type === "trigger") {
          await logStep(supabase, execution_id, currentNode.id, "trigger", "completed", trigger_data, trigger_data);
          const nextEdge = edges.find((e) => e.source === currentNodeId);
          currentNodeId = nextEdge?.target ?? null;
          continue;
        }

        await logStep(supabase, execution_id, currentNode.id, resolvedType, "running");

        try {
          let output: Record<string, unknown> = {};

          if (resolvedType === "webhook") {
            output = await handleWebhook(currentNode, context);

          } else if (resolvedType === "condition") {
            const { branch } = handleCondition(currentNode, context);
            output = { branch };
            context[currentNode.id] = output;
            await logStep(supabase, execution_id, currentNode.id, "condition", "completed", {}, output);
            const nextEdge = edges.find(
              (e) => e.source === currentNodeId && e.sourceHandle === branch
            );
            currentNodeId = nextEdge?.target ?? null;
            continue;

          } else if (resolvedType === "delay") {
            output = await handleDelay(currentNode, context);

          } else if (resolvedType === "find_contact") {
            output = await handleFindContact(currentNode, context, supabase, client_id);

          } else if (resolvedType === "create_contact") {
            output = await handleCreateContact(currentNode, context, supabase, client_id);

          } else if (resolvedType === "update_contact") {
            output = await handleUpdateContact(currentNode, context, supabase, client_id);
          }

          context[currentNode.id] = output;
          await logStep(supabase, execution_id, currentNode.id, resolvedType, "completed", {}, output);

          const nextEdge = edges.find((e) => e.source === currentNodeId);
          currentNodeId = nextEdge?.target ?? null;

        } catch (stepError) {
          const errorMessage = (stepError as Error).message;
          await logStep(supabase, execution_id, currentNode.id, resolvedType, "failed", {}, {}, errorMessage);
          throw stepError;
        }
      }

      await supabase
        .from("workflow_executions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", execution_id);

      return { status: "completed", execution_id };

    } catch (error) {
      const errorMessage = (error as Error).message;
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", execution_id);

      throw error;
    }
  },
});
