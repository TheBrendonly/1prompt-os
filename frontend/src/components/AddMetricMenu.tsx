import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, MessageSquare, Activity, Users, ThumbsUp, HelpCircle, Sparkles } from '@/components/icons';

export interface DefaultMetricDefinition {
  key: string;
  name: string;
  icon: typeof MessageSquare;
  defaultColor: string;
}

export const DEFAULT_METRICS: DefaultMetricDefinition[] = [
  { key: 'Total Conversations', name: 'Total Conversations', icon: MessageSquare, defaultColor: '#3b82f6' },
  { key: 'Bot Messages', name: 'Bot Messages', icon: Activity, defaultColor: '#10b981' },
  { key: 'New Users', name: 'New Users', icon: Users, defaultColor: '#8b5cf6' },
  { key: 'Thank You Count', name: 'Thank You Count', icon: ThumbsUp, defaultColor: '#f97316' },
  { key: 'User Questions Asked', name: 'User Questions Asked', icon: HelpCircle, defaultColor: '#6366f1' },
];

interface AddMetricMenuProps {
  hiddenDefaultMetrics: string[];
  onAddDefaultMetric: (metricKey: string) => void;
  onAddCustomMetric: () => void;
}

export function AddMetricMenu({ 
  hiddenDefaultMetrics, 
  onAddDefaultMetric,
  onAddCustomMetric 
}: AddMetricMenuProps) {
  const [open, setOpen] = useState(false);

  const availableDefaults = DEFAULT_METRICS.filter(m => hiddenDefaultMetrics.includes(m.key));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Metric
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-popover z-50" align="end">
        <div className="space-y-3">
          {availableDefaults.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Default Metrics</h4>
              <div className="space-y-1">
                {availableDefaults.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <button
                      key={metric.key}
                      onClick={() => {
                        onAddDefaultMetric(metric.key);
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                    >
                      <div 
                        className="p-1.5 rounded-md" 
                        style={{ backgroundColor: `${metric.defaultColor}26` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: metric.defaultColor }} />
                      </div>
                      <span className="text-sm font-medium">{metric.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableDefaults.length > 0 && (
            <div className="border-t pt-3" />
          )}

          <div>
            <h4 className="font-medium text-sm mb-2 text-muted-foreground">Custom Metrics</h4>
            <button
              onClick={() => {
                onAddCustomMetric();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Create Custom Metric</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
