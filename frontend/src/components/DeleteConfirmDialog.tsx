import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from '@/components/icons';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  confirmLabel,
  confirmIcon
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !p-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
            {description || `Are you sure you want to delete ${itemName ? `"${itemName}"` : 'this item'}? This action cannot be undone.`}
          </p>
          <div className="flex gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmIcon ?? <Trash2 className="w-4 h-4 mr-2" />}
              {confirmLabel ?? 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
