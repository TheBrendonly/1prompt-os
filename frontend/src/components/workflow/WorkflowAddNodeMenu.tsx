import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TRIGGER_DEFINITIONS } from '@/types/workflow';
import { Plus, Zap, Webhook, Filter, Search, Clock, UserPlus, UserCheck, UserX, FileText, Play, Globe, MousePointer } from '@/components/icons';

type NodeCategory = 'trigger' | 'action' | 'condition' | 'find' | 'delay' | 'create_contact' | 'update_contact';

interface AddNodeOption {
  category: NodeCategory;
  icon: string;
  label: string;
  description: string;
  defaultData: Record<string, any>;
}

const TRIGGER_ICON_MAP: Record<string, React.ReactNode> = {
  contact_created: <UserPlus className="w-3.5 h-3.5" />,
  contact_updated: <UserCheck className="w-3.5 h-3.5" />,
  contact_deleted: <UserX className="w-3.5 h-3.5" />,
  prompt_saved: <FileText className="w-3.5 h-3.5" />,
  simulation_started: <Play className="w-3.5 h-3.5" />,
  simulation_personas_generated: <Zap className="w-3.5 h-3.5" />,
  simulation_report_generated: <FileText className="w-3.5 h-3.5" />,
  inbound_webhook: <Globe className="w-3.5 h-3.5" />,
  manual: <MousePointer className="w-3.5 h-3.5" />,
};

const TRIGGER_OPTIONS: AddNodeOption[] = TRIGGER_DEFINITIONS.map(t => ({
  category: 'trigger',
  icon: t.type,
  label: t.label,
  description: t.description,
  defaultData: { label: t.label, triggerType: t.type, description: t.description },
}));

const ACTION_OPTIONS: AddNodeOption[] = [
  {
    category: 'action',
    icon: 'webhook',
    label: 'Webhook',
    description: 'Send HTTP request',
    defaultData: { label: 'Webhook', actionType: 'webhook', method: 'POST', url: '', headers: {}, body: '' },
  },
  {
    category: 'create_contact',
    icon: 'create_contact',
    label: 'Create Contact',
    description: 'Create a new contact',
    defaultData: { label: 'Create Contact', actionType: 'create_contact', ghl_contact_id: '', name: '', email: '', phone: '' },
  },
  {
    category: 'update_contact',
    icon: 'update_contact',
    label: 'Update Contact',
    description: 'Update an existing contact',
    defaultData: { label: 'Update Contact', actionType: 'update_contact', ghl_contact_id: '', name: '', email: '', phone: '' },
  },
];

const LOGIC_OPTIONS: AddNodeOption[] = [
  {
    category: 'condition',
    icon: 'filter',
    label: 'If / Else',
    description: 'Conditional branching',
    defaultData: { label: 'If / Else', actionType: 'condition', field: '', operator: 'equals', value: '' },
  },
];

const DATA_OPTIONS: AddNodeOption[] = [
  {
    category: 'find',
    icon: 'search',
    label: 'Find Contact',
    description: 'Lookup contact by ID',
    defaultData: { label: 'Find Contact', actionType: 'find_contact', contactIdMapping: '' },
  },
];

const DELAY_OPTIONS: AddNodeOption[] = [
  {
    category: 'delay',
    icon: 'clock',
    label: 'Delay',
    description: 'Wait before continuing',
    defaultData: { label: 'Delay', actionType: 'delay', delayMode: 'duration', delayValue: 60, delayUnit: 'seconds', waitUntil: '', timezone: 'America/New_York' },
  },
];

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;

interface WorkflowAddNodeMenuProps {
  showTriggers?: boolean;
  onAdd: (nodeType: NodeCategory, data: Record<string, any>) => void;
  branchLabel?: string;
  triggersOnly?: boolean;
}

export default function WorkflowAddNodeMenu({ showTriggers = false, onAdd, branchLabel, triggersOnly = false }: WorkflowAddNodeMenuProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: AddNodeOption) => {
    onAdd(option.category, option.defaultData);
    setOpen(false);
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    Triggers: <Zap className="w-3.5 h-3.5" />,
    Actions: <Webhook className="w-3.5 h-3.5" />,
    Logic: <Filter className="w-3.5 h-3.5" />,
    Data: <Search className="w-3.5 h-3.5" />,
    Timing: <Clock className="w-3.5 h-3.5" />,
  };

  const sections: { title: string; options: AddNodeOption[] }[] = [];
  if (triggersOnly) {
    sections.push({ title: 'Triggers', options: TRIGGER_OPTIONS });
  } else {
    if (showTriggers) sections.push({ title: 'Triggers', options: TRIGGER_OPTIONS });
    sections.push({ title: 'Actions', options: ACTION_OPTIONS });
    sections.push({ title: 'Logic', options: LOGIC_OPTIONS });
    sections.push({ title: 'Data', options: DATA_OPTIONS });
    sections.push({ title: 'Timing', options: DELAY_OPTIONS });
  }

  const menuTitle = triggersOnly ? 'Add Trigger' : 'Add Node';

  return (
    <div className="flex flex-col items-center gap-0">
      {branchLabel && (
        <span
          className="text-muted-foreground mb-1"
          style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}
        >
          {branchLabel}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            data-workflow-interactive
            className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center
                       hover:border-primary hover:bg-primary/10 transition-all group"
          >
            <Plus className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 groove-border bg-sidebar" align="center" sideOffset={8} onWheel={(e) => e.stopPropagation()}>
          <div
            className="px-3 py-2 text-foreground uppercase flex items-center gap-2"
            style={{ fontFamily: "'VT323', monospace", fontSize: '18px', borderBottom: '3px groove hsl(var(--border-groove))' }}
          >
            {triggersOnly && <Zap className="w-4 h-4" />}
            {!triggersOnly && <Plus className="w-4 h-4" />}
            <span>{menuTitle}</span>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5" onWheel={(e) => e.stopPropagation()}>
            {triggersOnly ? (
              TRIGGER_OPTIONS.map(option => (
                <button
                  key={option.label}
                  className="w-full text-left px-3 py-2.5 groove-border bg-sidebar hover:bg-accent transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  <div className="workflow-node-menu-option-label text-foreground" style={fieldStyle}>{option.label}</div>
                  <div className="workflow-node-menu-option-description text-muted-foreground" style={fieldStyle}>{option.description}</div>
                </button>
              ))
            ) : (
              sections.map(section => (
                <div key={section.title}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1 mt-3 first:mt-0">
                     <span className="text-muted-foreground">{sectionIcons[section.title]}</span>
                     <span className="text-muted-foreground uppercase" style={{ ...fieldStyle, letterSpacing: '0.5px' }}>
                       {section.title}
                     </span>
                   </div>
                  <div className="space-y-1.5">
                    {section.options.map(option => (
                      <button
                        key={option.label}
                        className="w-full text-left px-3 py-2.5 groove-border bg-sidebar hover:bg-accent transition-colors"
                        onClick={() => handleSelect(option)}
                      >
                        <div className="workflow-node-menu-option-label text-foreground" style={fieldStyle}>{option.label}</div>
                        <div className="workflow-node-menu-option-description text-muted-foreground" style={fieldStyle}>{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
