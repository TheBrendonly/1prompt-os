import { TRIGGER_DEFINITIONS } from '@/types/workflow';

/** Converts snake_case field keys to human-readable Title Case */
export function humanizeField(field: string): string {
  return field
    .split('_')
    .map(word => {
      if (word.length <= 2 && word === word.toLowerCase()) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const TRIGGER_FIELD_LABELS: Record<string, string> = {
  contact_id: 'Contact ID',
  client_id: 'Client ID',
  contact_data: 'Contact Data',
  previous_data: 'Previous Data',
  prompt_id: 'Prompt ID',
  slot_id: 'Slot ID',
  content: 'Content',
  simulation_id: 'Simulation ID',
  persona_count: 'Persona Count',
  report_data: 'Report Data',
  query: 'Query Params',
  body: 'Request Body',
  headers: 'Request Headers',
  received_at: 'Received At',
};

export const FIND_CONTACT_FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  contact_data: 'Contact Data',
  contact_id: 'Contact ID',
  created_at: 'Created At',
};

export interface FieldOption {
  source: string;
  sourceLabel: string;
  icon: string;
  field: string;
  label: string;
  variable: string;
}

/**
 * Recursively extract all leaf paths from a JSON object.
 * e.g. { body: { Message1: "hi", UserID: "abc" } } => ["body.Message1", "body.UserID"]
 */
function extractJsonPaths(obj: any, prefix: string = '', maxDepth: number = 5): string[] {
  if (maxDepth <= 0 || obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return [prefix];
  if (Array.isArray(obj)) return [prefix]; // treat arrays as leaf values

  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    const child = obj[key];
    if (typeof child === 'object' && child !== null && !Array.isArray(child)) {
      paths.push(...extractJsonPaths(child, newPrefix, maxDepth - 1));
    } else {
      paths.push(newPrefix);
    }
  }
  return paths;
}

/**
 * Build field options from a saved webhook mapping reference.
 * Extracts all paths from the raw_request JSON and creates variable references.
 */
export function getFieldsFromMappingReference(mappingRef: any, sourceLabel: string = 'Inbound Webhook'): FieldOption[] {
  if (!mappingRef || typeof mappingRef !== 'object') return [];

  const paths = extractJsonPaths(mappingRef);
  return paths.map(path => {
    // Preserve the last segment exactly as-is (original casing from webhook data)
    const lastSegment = path.split('.').pop() || path;
    return {
      source: 'trigger',
      sourceLabel,
      icon: 'trigger',
      field: path,
      label: lastSegment,
      variable: `{{trigger.${path}}}`,
    };
  });
}

export function getAvailableFields(
  nodes: { id: string; type: string; data: any }[],
  currentNodeId: string,
  webhookMappingReference?: any
): FieldOption[] {
  const fields: FieldOption[] = [];
  const currentNodeIndex = nodes.findIndex((node) => node.id === currentNodeId);
  const previousNodes = currentNodeIndex === -1
    ? nodes.filter((node) => node.id !== currentNodeId)
    : nodes.slice(0, currentNodeIndex);

  for (const node of previousNodes) {
    if (node.type === 'trigger') {
      const data = node.data;

      if (data.triggerType === 'inbound_webhook' && webhookMappingReference) {
        fields.push(...getFieldsFromMappingReference(webhookMappingReference, data.label || 'Inbound Webhook'));
      } else {
        const def = TRIGGER_DEFINITIONS.find((t) => t.type === data.triggerType);
        if (def) {
          for (const field of def.outputFields) {
            fields.push({
              source: 'trigger',
              sourceLabel: data.label || def.label,
              icon: 'trigger',
              field,
              label: TRIGGER_FIELD_LABELS[field] || humanizeField(field),
              variable: `{{trigger.${field}}}`,
            });
          }
        }
      }
    } else if (node.type === 'find') {
      const data = node.data;
      const findFields = ['id', 'contact_data', 'external_id', 'created_at'];
      for (const field of findFields) {
        fields.push({
          source: node.id,
          sourceLabel: data.label || 'Find Contact',
          icon: 'find',
          field,
          label: FIND_CONTACT_FIELD_LABELS[field] || humanizeField(field),
          variable: `{{${node.id}.${field}}}`,
        });
      }
    }
  }

  return fields;
}
