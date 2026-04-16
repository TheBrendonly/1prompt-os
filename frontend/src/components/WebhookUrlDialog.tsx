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

interface WebhookUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (url: string) => void;
  title: string;
  description?: string;
}

export const WebhookUrlDialog: React.FC<WebhookUrlDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('Webhook URL is required');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError('Please enter a valid URL');
      return;
    }

    onConfirm(url.trim());
    setUrl('');
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setUrl('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md !p-0">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            {description || 'Enter the webhook URL to receive notifications about this action.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="webhook-url" className="text-sm font-medium text-foreground">
              Webhook URL
            </Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://example.com/webhook"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              className={`modern-input ${error ? 'border-destructive focus:ring-destructive/20' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
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
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};