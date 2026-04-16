import React, { useState } from 'react';
import { useClientWebhooks } from '@/hooks/useClientWebhooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Globe, Settings, Edit, Link } from '@/components/icons';
import { WebhookUrlDialog } from './WebhookUrlDialog';

interface AnalyticsWebhookConfigProps {
  clientId: string;
  title: string;
  description: string;
  webhookField: 'analytics_webhook_url' | 'ai_chat_webhook_url';
  className?: string;
}

export const AnalyticsWebhookConfig: React.FC<AnalyticsWebhookConfigProps> = ({ 
  clientId, 
  title,
  description,
  webhookField,
  className = "" 
}) => {
  const { webhooks, loading, updateWebhooks } = useClientWebhooks(clientId);
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWebhookUpdate = async (newWebhookUrl: string) => {
    const success = await updateWebhooks({
      [webhookField]: newWebhookUrl
    });
    
    if (success) {
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Webhook URL saved successfully"
      });
    }
    return success;
  };

  if (loading) {
    return (
      <Card className={`material-surface ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const hasWebhook = !!webhooks[webhookField];

  return (
    <>
      <Card className={`material-surface ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              {hasWebhook ? (
                <>
                  <Edit className="w-4 h-4" />
                  Edit
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Configure
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasWebhook ? (
            <>
              <div className="flex items-center justify-between py-1">
                <span className="text-base font-medium text-foreground">Webhook URL:</span>
                <Badge className="bg-success/20 text-foreground border border-foreground hover:bg-success/20 px-3 py-1">
                  <Link className="w-4 h-4 mr-1" />
                  Configured
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded truncate">
                {webhooks[webhookField]}
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Link className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-base text-muted-foreground mb-4">
                Configure webhook to receive notifications when analytics data is refreshed or custom metrics are created.
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                size="default"
                className="modern-button-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Set Up Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookUrlDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleWebhookUpdate}
        title={`${hasWebhook ? 'Update' : 'Configure'} ${title}`}
        description="Set up webhook URL to receive notifications when analytics data is refreshed (auto or manual) or custom metrics are created."
      />
    </>
  );
};