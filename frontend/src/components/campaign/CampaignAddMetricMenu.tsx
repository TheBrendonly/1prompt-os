import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from '@/components/icons';
import { defaultCampaignWidgets } from '@/lib/campaignWidgets';
import { cn } from '@/lib/utils';

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const LABEL_FONT = { fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' } as const;

const METRIC_DESCRIPTIONS: Record<string, string> = {
  'Total Enrolled': 'Total leads enrolled in this campaign',
  'Total Engaged': 'Leads that received at least one message',
  'Total Replied': 'Leads that sent at least one reply',
  'Reply Rate': 'Percentage of engaged leads that replied',
  'Currently Active': 'Leads currently being processed',
  'Finished (No Reply)': 'Leads that completed the sequence without replying',
  'SMS Engaged': 'Unique leads who received at least one SMS',
  'SMS Replies': 'Total SMS replies received',
  'SMS Reply Rate': 'Reply rate for SMS channel',
  'WhatsApp Engaged': 'Unique leads who received at least one WhatsApp message',
  'WhatsApp Replies': 'Total WhatsApp replies received',
  'WhatsApp Reply Rate': 'Reply rate for WhatsApp channel',
  'Phone Calls Made': 'Total outbound phone calls placed',
  'Phone Pickups': 'Calls that were answered',
  'Phone Pickup Rate': 'Percentage of calls answered',
  'Voicemails': 'Calls that went to voicemail',
  'Avg Call Duration': 'Average duration of answered calls',
  'Call Spend': 'Total cost of all calls in this campaign',
  'Appointments Booked': 'Total appointments booked from this campaign',
  'Booking Rate': 'Percentage of engaged leads that booked an appointment',
  'Bookings Over Time': 'Daily booking volume trend',
  
  'Avg First Engagement': 'Average time from enrollment to first outreach',
  'Avg Response Time': 'Average time for leads to reply after last message',
  'Replies by Step': 'Which engagement step generates the most replies',
  'Reply Distribution by Step': 'Percentage breakdown of replies per step',
  'Engagements Over Time': 'Daily engagement activity trend',
  'Replies Over Time': 'Daily reply activity trend',
  'Peak Response Hour': 'Hour of day with most replies',
  'Replies by Day of Week': 'Reply distribution across weekdays',
  'Channel Comparison': 'Leads engaged by channel',
  'Reply vs No Reply': 'Ratio of replied vs unreplied leads',
};

interface CampaignAddMetricMenuProps {
  activeWidgetTitles: string[];
  onAddWidget: (widget: typeof defaultCampaignWidgets[0]) => void;
}

export function CampaignAddMetricMenu({ activeWidgetTitles, onAddWidget }: CampaignAddMetricMenuProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const hiddenWidgets = defaultCampaignWidgets.filter(w => w.widget_type !== 'separator' && !activeWidgetTitles.includes(w.title));

  // Group by section
  const sections = new Map<string, typeof defaultCampaignWidgets>();
  for (const w of hiddenWidgets) {
    const section = w.config?.section || 'Other';
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(w);
  }

  const handleToggle = (title: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleAdd = () => {
    for (const title of selected) {
      const widget = defaultCampaignWidgets.find(w => w.title === title);
      if (widget) onAddWidget(widget);
    }
    setSelected(new Set());
    setOpen(false);
  };

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) setSelected(new Set());
  };

  return (
    <>
      <Button
        size="sm"
        className={cn('groove-btn', hiddenWidgets.length === 0 && 'opacity-50 cursor-not-allowed')}
        disabled={hiddenWidgets.length === 0}
        onClick={() => handleOpen(true)}
        style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}
      >
        <Plus className="h-4 w-4 mr-2" />
        ADD METRIC
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="flex flex-col !p-0 overflow-hidden" style={{ width: '544px', maxWidth: '90vw', height: '630px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '3px groove hsl(var(--border-groove))', paddingTop: '14px', paddingBottom: '14px' }}>
            <DialogTitle>ADD METRICS</DialogTitle>
            <DialogClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 !bg-muted !border-border hover:!bg-accent shrink-0" title="Close">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>

          <div className="px-6 py-5 space-y-1 flex-1 min-h-0 overflow-y-auto">
            <p style={FONT} className="text-muted-foreground mb-4">
              Select metrics to add to your dashboard.
            </p>

            {[...sections.entries()].map(([section, widgets], sIdx) => (
              <div key={section}>
                {sIdx > 0 && (
                  <div className="section-separator my-3">{section}</div>
                )}
                {sIdx === 0 && (
                  <div className="section-separator mb-3">{section}</div>
                )}
                <div className="space-y-2">
                  {widgets.map(widget => {
                    const isSelected = selected.has(widget.title);
                    return (
                      <button
                        key={widget.title}
                        onClick={() => handleToggle(widget.title)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 groove-border text-left transition-colors',
                          isSelected ? 'bg-primary/10' : 'bg-card hover:bg-muted/40'
                        )}
                      >
                        <Checkbox checked={isSelected} className="flex-shrink-0" tabIndex={-1} />
                        <div className="flex-1 min-w-0">
                          <div style={{ ...FONT, fontWeight: 500 }} className="text-foreground">
                            {widget.title}
                          </div>
                          <div style={FONT} className="text-muted-foreground mt-0.5">
                            {METRIC_DESCRIPTIONS[widget.title] || widget.widget_type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6 flex gap-2 shrink-0">
            <Button
              className="flex-1 groove-btn"
              style={LABEL_FONT}
              onClick={() => handleOpen(false)}
            >
              CANCEL
            </Button>
            <Button
              className={cn('flex-1 groove-btn-positive', selected.size === 0 && 'opacity-50')}
              style={LABEL_FONT}
              disabled={selected.size === 0}
              onClick={handleAdd}
            >
              ADD {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
