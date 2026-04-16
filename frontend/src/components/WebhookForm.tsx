import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Webhook } from '@/components/icons';

interface WebhookFormProps {
  onNext: (webhookData: { webhookUrl: string }) => void;
  initialData?: { webhookUrl: string };
}

export const WebhookForm: React.FC<WebhookFormProps> = ({ onNext, initialData }) => {
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ webhookUrl });
  };

  const isValidUrl = (urlString: string) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="webhookUrl" className="text-sm font-medium">
            Webhook URL *
          </Label>
          <Input
            id="webhookUrl"
            type="url"
            placeholder="https://your-webhook-endpoint.com/prompts"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="h-12 border-input"
            required
          />
          <p className="text-sm text-muted-foreground">
            Enter the URL where you want to receive prompt notifications. This will be called when prompts are created, updated, or deleted.
          </p>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!webhookUrl.trim() || !isValidUrl(webhookUrl)}
          >
            Continue to Editor
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  );
};