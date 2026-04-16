import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tags, Link, ArrowRight } from '@/components/icons';

interface MetadataFormProps {
  onNext: (metadata: { tags: string; webhookUrl: string }) => void;
  initialData?: { tags: string; webhookUrl: string };
}

export const MetadataForm: React.FC<MetadataFormProps> = ({ onNext, initialData }) => {
  const [tags, setTags] = useState(initialData?.tags || '');
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ tags, webhookUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tags" className="flex items-center gap-2">
          <Tags className="w-4 h-4" />
          Tags
        </Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., tutorial, guide, FAQ"
          className="border-border bg-background"
        />
        <p className="text-sm text-muted-foreground">
          Add tags to categorize your document (comma-separated).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookUrl" className="text-sm font-medium">
          Webhook URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="webhookUrl"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-webhook-endpoint.com/documents"
          required
          className="border-border bg-background"
        />
        <p className="text-sm text-muted-foreground">
          Enter the URL where you want to receive document notifications. This will be called when documents are created, updated, or deleted.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Continue to Editor
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};