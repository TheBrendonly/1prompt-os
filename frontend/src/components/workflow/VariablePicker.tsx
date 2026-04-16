import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Zap, Search, Code, ChevronDown, ChevronRight } from '@/components/icons';
import { getAvailableFields } from '@/utils/workflowFieldUtils';
import type { Node } from '@xyflow/react';

interface VariablePickerProps {
  nodes: Node[];
  currentNodeId: string;
  onInsert: (variable: string) => void;
  webhookMappingReference?: any;
}

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;

const iconMap: Record<string, React.ReactNode> = {
  trigger: <Zap className="w-3.5 h-3.5" />,
  find: <Search className="w-3.5 h-3.5" />,
};

export default function VariablePicker({ nodes, currentNodeId, onInsert, webhookMappingReference }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const allFields = getAvailableFields(
    nodes.map(n => ({ id: n.id, type: n.type as string, data: n.data })),
    currentNodeId,
    webhookMappingReference
  );

  const groups = new Map<string, { sourceLabel: string; icon: string; fields: typeof allFields }>();
  for (const f of allFields) {
    if (!groups.has(f.source)) {
      groups.set(f.source, { sourceLabel: f.sourceLabel, icon: f.icon, fields: [] });
    }
    groups.get(f.source)!.fields.push(f);
  }

  const handleSelect = (variable: string) => {
    onInsert(variable);
    setExpandedSource(null);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setExpandedSource(null);
    }
  };

  if (allFields.length === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="!h-8 !w-8 groove-btn opacity-40 cursor-not-allowed"
        disabled
      >
        <Code className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="!h-8 !w-8 groove-btn"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="variable-picker-popover w-72 p-0 groove-border bg-sidebar" align="start" sideOffset={6}>
        <div
          className="px-3 py-2 text-foreground"
          style={{ ...fieldStyle, fontFamily: "'VT323', monospace", fontSize: '18px', borderBottom: '3px groove hsl(var(--border-groove))' }}
        >
          Display Variable From
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1.5">
          {Array.from(groups.entries()).map(([source, group]) => {
            const isExpanded = expandedSource === source;

            return (
              <div key={source} className="groove-border bg-sidebar overflow-hidden">
                <button
                  type="button"
                  className="variable-picker-source-button w-full text-left px-2.5 py-2 hover:bg-accent transition-colors flex items-center justify-between !normal-case"
                  style={{ textTransform: 'none' }}
                  onClick={() => setExpandedSource(isExpanded ? null : source)}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground shrink-0">{iconMap[group.icon] || <Zap className="w-3.5 h-3.5" />}</span>
                    <span className="variable-picker-source-label text-foreground !normal-case truncate" style={{ ...fieldStyle, textTransform: 'none' }}>
                      {group.sourceLabel}
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-1.5 space-y-0.5">
                    {group.fields.map((f) => (
                      <button
                        type="button"
                        key={f.variable}
                        className="variable-picker-field-button w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent transition-colors flex items-center justify-between group !normal-case"
                        style={{ textTransform: 'none' }}
                        onClick={() => handleSelect(f.variable)}
                      >
                        <span className="variable-picker-field-label text-foreground !normal-case" style={{ ...fieldStyle, textTransform: 'none' }}>
                          {f.label}
                        </span>
                        <span className="variable-picker-action-label text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" style={{ ...fieldStyle, fontSize: '10px', textTransform: 'none' }}>
                          Insert
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
