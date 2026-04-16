import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getOpenRouterKey(
  primaryKey: string | null,
  clientSupabaseUrl: string | null,
  clientServiceKey: string | null
): Promise<string | null> {
  if (primaryKey) return primaryKey;
  if (!clientSupabaseUrl || !clientServiceKey) return null;

  try {
    const res = await fetch(
      `${clientSupabaseUrl}/rest/v1/credentials?select=value&key=eq.openrouter_api_key&limit=1`,
      {
        headers: {
          apikey: clientServiceKey,
          Authorization: `Bearer ${clientServiceKey}`,
        },
      }
    );
    if (!res.ok) {
      console.warn("Failed to fetch openrouter key from client Supabase:", res.status);
      return null;
    }
    const rows = await res.json();
    return rows?.[0]?.value || null;
  } catch (err) {
    console.warn("Error fetching openrouter key from client Supabase:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      clientId,
      timeRange,
      startDate,
      endDate,
      defaultMetrics,
      customMetrics,
      analyticsType,
    } = body;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Missing clientId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const triggerSecretKey = Deno.env.get("TRIGGER_SECRET_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!triggerSecretKey) {
      return new Response(
        JSON.stringify({ error: "TRIGGER_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Look up client credentials
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, supabase_url, supabase_service_key, supabase_table_name, openrouter_api_key")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: "Client not found", details: clientError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve OpenRouter API key
    const openrouterKey = await getOpenRouterKey(
      client.openrouter_api_key,
      client.supabase_url,
      client.supabase_service_key
    );

    // Step 2: Create analytics_executions row
    const { data: execution, error: execError } = await supabase
      .from("analytics_executions")
      .insert({
        client_id: clientId,
        status: "pending",
        time_range: timeRange || "7",
        start_date: startDate || null,
        end_date: endDate || null,
        stage_description: "Starting analytics computation...",
      })
      .select("id")
      .single();

    if (execError || !execution) {
      console.error("Failed to create analytics_executions row:", execError);
      return new Response(
        JSON.stringify({ error: "Failed to create execution record", details: execError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const executionId = execution.id;

    // Step 3: Trigger the Trigger.dev task
    let triggerRunId: string | null = null;
    try {
      const triggerResponse = await fetch(
        "https://api.trigger.dev/api/v1/tasks/compute-analytics/trigger",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${triggerSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: {
              execution_id: executionId,
              client_id: clientId,
              time_range: timeRange || "7",
              start_date: startDate || null,
              end_date: endDate || null,
              default_metrics: defaultMetrics || [],
              custom_metrics: customMetrics || [],
              analytics_type: analyticsType || "text",
              client_supabase_url: client.supabase_url,
              client_supabase_service_key: client.supabase_service_key,
              client_supabase_table_name: client.supabase_table_name,
              openrouter_api_key: openrouterKey,
            },
          }),
        }
      );

      if (!triggerResponse.ok) {
        const errText = await triggerResponse.text();
        throw new Error(`Trigger.dev API returned ${triggerResponse.status}: ${errText.slice(0, 200)}`);
      }

      const triggerResult = await triggerResponse.json();
      triggerRunId = triggerResult.id || null;
    } catch (triggerError: any) {
      // If Trigger.dev call fails, mark execution as failed
      await supabase
        .from("analytics_executions")
        .update({
          status: "failed",
          error_message: `Failed to trigger computation: ${triggerError.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      return new Response(
        JSON.stringify({
          execution_id: executionId,
          status: "failed",
          error: triggerError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Update execution with trigger_run_id
    if (triggerRunId) {
      await supabase
        .from("analytics_executions")
        .update({ trigger_run_id: triggerRunId })
        .eq("id", executionId);
    }

    console.info("Analytics run triggered via Trigger.dev", { executionId, clientId, triggerRunId, timeRange });

    return new Response(
      JSON.stringify({
        execution_id: executionId,
        status: "pending",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("run-analytics error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
