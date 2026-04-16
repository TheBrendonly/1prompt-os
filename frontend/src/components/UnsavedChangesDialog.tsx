import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  description?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onOpenChange,
  onDiscard,
  description = 'You have unsaved changes. Do you want to discard them or continue editing?',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !p-0">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
            UNSAVED CHANGES
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
            {description}
          </p>
          <div className="flex gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDiscard();
                onOpenChange(false);
              }}
            >
              Discard & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
