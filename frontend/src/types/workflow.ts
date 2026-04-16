export type TriggerType = 
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'prompt_saved'
  | 'simulation_started'
  | 'simulation_personas_generated'
  | 'simulation_report_generated'
  | 'inbound_webhook'
  | 'manual';

export type ActionType =
  | 'webhook'
  | 'find_contact'
  | 'condition'
  | 'delay'
  | 'create_contact'
  | 'update_contact';

export type DelayMode = 'duration' | 'until';
export type DelayUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface TriggerNodeData {
  label: string;
  triggerType: TriggerType;
  description?: string;
}

export interface WebhookActionData {
  label: string;
  actionType: 'webhook';
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string;
  description?: string;
}

export interface FindContactActionData {
  label: string;
  actionType: 'find_contact';
  contactIdMapping: string; // e.g. "{{trigger.contact_id}}"
  description?: string;
}

export interface ConditionNodeData {
  label: string;
  actionType: 'condition';
  field: string;      // e.g. "{{find_contact.first_name}}"
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: string;
  description?: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface DelayActionData {
  label: string;
  actionType: 'delay';
  delayMode: DelayMode;
  delayValue: number;       // duration value (for 'duration' mode)
  delayUnit: DelayUnit;     // seconds/minutes/hours/days (for 'duration' mode)
  waitUntil: string;        // ISO datetime string (for 'until' mode)
  timezone: string;         // IANA timezone (for 'until' mode)
  description?: string;
}

export interface CreateContactActionData {
  label: string;
  actionType: 'create_contact';
  ghl_contact_id: string;
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface UpdateContactActionData {
  label: string;
  actionType: 'update_contact';
  ghl_contact_id: string;
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface SendSmsActionData {
  label: string;
  actionType: 'send_sms';
  message?: string;
  description?: string;
}

export interface WaitForReplyActionData {
  label: string;
  actionType: 'wait_for_reply';
  timeout_seconds?: number;
  description?: string;
}

export type WorkflowNodeData = TriggerNodeData | WebhookActionData | FindContactActionData | ConditionNodeData | DelayActionData | CreateContactActionData | UpdateContactActionData | SendSmsActionData | WaitForReplyActionData;

export interface WorkflowNodeType {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'find' | 'delay' | 'create_contact' | 'update_contact' | 'text_setter' | 'follow_up' | 'end' | 'send_sms' | 'wait_for_reply';
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdgeType {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface Workflow {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  nodes: WorkflowNodeType[];
  edges: WorkflowEdgeType[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  client_id: string;
  status: 'running' | 'completed' | 'failed';
  trigger_type: string;
  trigger_data: Record<string, any>;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface WorkflowExecutionStep {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Trigger definitions for the node palette
export const TRIGGER_DEFINITIONS: { type: TriggerType; label: string; description: string; outputFields: string[] }[] = [
  { type: 'contact_created', label: 'Contact Created', description: 'Fires when a new contact is created', outputFields: ['contact_id', 'client_id', 'first_name', 'last_name', 'phone', 'email', 'business_name', 'custom_fields', 'contact_data'] },
  { type: 'contact_updated', label: 'Contact Updated', description: 'Fires when a contact is updated', outputFields: ['contact_id', 'client_id', 'first_name', 'last_name', 'phone', 'email', 'business_name', 'custom_fields', 'contact_data', 'previous_first_name', 'previous_last_name', 'previous_phone', 'previous_email', 'previous_business_name'] },
  { type: 'contact_deleted', label: 'Contact Deleted', description: 'Fires when a contact is deleted', outputFields: ['contact_id', 'client_id'] },
  { type: 'prompt_saved', label: 'Prompt Saved', description: 'Fires when a prompt is saved', outputFields: ['prompt_id', 'client_id', 'slot_id', 'content'] },
  { type: 'simulation_started', label: 'Simulation Started', description: 'Fires when a simulation starts', outputFields: ['simulation_id', 'client_id'] },
  { type: 'simulation_personas_generated', label: 'Personas Generated', description: 'Fires when simulation personas are generated', outputFields: ['simulation_id', 'client_id', 'persona_count'] },
  { type: 'simulation_report_generated', label: 'Report Generated', description: 'Fires when a simulation report is generated', outputFields: ['simulation_id', 'client_id', 'report_data'] },
  { type: 'inbound_webhook', label: 'Inbound Webhook', description: 'Fires when an external system sends a POST request', outputFields: ['query', 'body', 'headers', 'received_at'] },
  { type: 'manual', label: 'Manual Trigger', description: 'Fires when leads are manually enrolled into this workflow', outputFields: ['contact_id', 'client_id', 'first_name', 'last_name', 'phone', 'email', 'business_name', 'custom_fields', 'contact_data'] },
];

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
] as const;
