import { Zap, Webhook, Filter, Search, UserPlus, UserCheck } from '@/components/icons';
import { TRIGGER_DEFINITIONS } from '@/types/workflow';

interface WorkflowNodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string, data: any) => void;
}

export default function WorkflowNodePalette({ onDragStart }: WorkflowNodePaletteProps) {
  return (
    <div className="w-[260px] h-full bg-card groove-border overflow-y-auto flex flex-col">
      {/* Header */}
      <div
        className="px-4 py-2 border-b border-border shrink-0"
        style={{ borderBottom: '3px groove hsl(var(--border-groove))' }}
      >
        <h3
          className="text-foreground uppercase"
          style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}
        >
          Node Palette
        </h3>
      </div>

      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* Triggers */}
        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground uppercase mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Zap className="w-4 h-4" /> Triggers
          </div>
          <div className="space-y-1.5">
            {TRIGGER_DEFINITIONS.map((trigger) => (
              <div
                key={trigger.type}
                className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
                draggable
                onDragStart={(e) =>
                  onDragStart(e, 'trigger', {
                    label: trigger.label,
                    triggerType: trigger.type,
                    description: trigger.description,
                  })
                }
              >
                <div
                  className="text-foreground"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
                >
                  {trigger.label}
                </div>
                <div
                  className="text-muted-foreground"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
                >
                  {trigger.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground uppercase mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Webhook className="w-4 h-4" /> Actions
          </div>
          <div className="space-y-1.5">
            <div
              className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
              draggable
              onDragStart={(e) =>
                onDragStart(e, 'action', {
                  label: 'Webhook',
                  actionType: 'webhook',
                  method: 'POST',
                  url: '',
                  headers: {},
                  body: '',
                })
              }
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-foreground">
                Webhook
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="text-muted-foreground">
                Send HTTP request
              </div>
            </div>
            <div
              className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
              draggable
              onDragStart={(e) =>
                onDragStart(e, 'create_contact', {
                  label: 'Create Contact',
                  actionType: 'create_contact',
                  ghl_contact_id: '',
                  name: '',
                  email: '',
                  phone: '',
                })
              }
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-foreground">
                Create Contact
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="text-muted-foreground">
                Create a new contact
              </div>
            </div>
            <div
              className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
              draggable
              onDragStart={(e) =>
                onDragStart(e, 'update_contact', {
                  label: 'Update Contact',
                  actionType: 'update_contact',
                  ghl_contact_id: '',
                  name: '',
                  email: '',
                  phone: '',
                })
              }
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-foreground">
                Update Contact
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="text-muted-foreground">
                Update an existing contact
              </div>
            </div>
          </div>
        </div>

        {/* Logic */}
        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground uppercase mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Filter className="w-4 h-4" /> Logic
          </div>
          <div className="space-y-1.5">
            <div
              className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
              draggable
              onDragStart={(e) =>
                onDragStart(e, 'condition', {
                  label: 'If / Else',
                  actionType: 'condition',
                  field: '',
                  operator: 'equals',
                  value: '',
                })
              }
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-foreground">
                If / Else
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="text-muted-foreground">
                Conditional branching
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground uppercase mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Search className="w-4 h-4" /> Data
          </div>
          <div className="space-y-1.5">
            <div
              className="groove-border px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
              draggable
              onDragStart={(e) =>
                onDragStart(e, 'find', {
                  label: 'Find Contact',
                  actionType: 'find_contact',
                  contactIdMapping: '',
                })
              }
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-foreground">
                Find Contact
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} className="text-muted-foreground">
                Lookup contact by ID
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
