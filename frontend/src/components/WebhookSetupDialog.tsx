import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, AlertCircle } from '@/components/icons';

interface WebhookSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (webhooks: { addWebhook: string; deleteWebhook?: string }) => void;
  type: 'knowledge_base' | 'prompt';
  title: string;
  description?: string;
  currentWebhooks?: {
    addWebhook?: string;
    deleteWebhook?: string;
  };
}

export const WebhookSetupDialog: React.FC<WebhookSetupDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  type,
  title,
  description,
  currentWebhooks
}) => {
  const [addWebhook, setAddWebhook] = useState('');
  const [deleteWebhook, setDeleteWebhook] = useState('');
  const [errors, setErrors] = useState<{ add?: string; delete?: string }>({});

  // Update input values when dialog opens or currentWebhooks change
  React.useEffect(() => {
    if (open && currentWebhooks) {
      setAddWebhook(currentWebhooks.addWebhook || '');
      setDeleteWebhook(currentWebhooks.deleteWebhook || '');
    } else if (!open) {
      // Reset when dialog closes
      setAddWebhook('');
      setDeleteWebhook('');
      setErrors({});
    }
  }, [open, currentWebhooks]);

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    const newErrors: { add?: string; delete?: string } = {};

    if (!addWebhook.trim()) {
      newErrors.add = 'Webhook URL is required';
    } else if (!isValidUrl(addWebhook.trim())) {
      newErrors.add = 'Please enter a valid URL';
    }

    // Remove delete webhook requirement for knowledge base

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      addWebhook: addWebhook.trim()
    });
    
    // Don't reset here - let the parent handle closing and useEffect will reset
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset will happen in useEffect when open becomes false
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg !p-0">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            {description || 'Configure webhook URLs for notifications. These will be saved for this client and reused for future operations.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="add-webhook" className="text-sm font-medium text-foreground">
              {type === 'knowledge_base' ? 'Document Operations Webhook' : 'Prompt Webhook'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-webhook"
              type="url"
              placeholder="https://example.com/webhook"
              value={addWebhook}
              onChange={(e) => {
                setAddWebhook(e.target.value);
                setErrors(prev => ({ ...prev, add: undefined }));
              }}
              className={`modern-input ${errors.add ? 'border-destructive focus:ring-destructive/20' : ''}`}
            />
            {errors.add && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.add}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This webhook will be called when {type === 'knowledge_base' ? 'documents are created, updated, or deleted (with appropriate tags)' : 'prompts are created or updated'}.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1 modern-button-secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="flex-1 modern-button-primary"
          >
            Save Webhooks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};