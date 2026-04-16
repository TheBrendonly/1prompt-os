import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from '@/components/icons';

interface ExpandableTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  /** When true, textarea content is treated as JSON and won't be quoted */
  isJson?: boolean;
}

export const ExpandableTextDialog: React.FC<ExpandableTextDialogProps> = ({
  open,
  onOpenChange,
  title,
  value,
  onChange,
}) => {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl !p-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div style={{ padding: '24px', paddingBottom: '8px' }}>
          <Textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full leading-relaxed groove-border bg-card"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '13px',
              minHeight: '400px',
              height: '400px',
            }}
          />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}
          >
            CANCEL
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => {
              onChange(local);
              onOpenChange(false);
            }}
            style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}
          >
            <Save className="w-4 h-4 mr-1.5" />
            SAVE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
