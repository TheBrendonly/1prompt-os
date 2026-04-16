import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusTag } from '@/components/StatusTag';
import { Link, Edit, Settings, Globe } from '@/components/icons';
import { WebhookSetupDialog } from './WebhookSetupDialog';

interface ClientWebhookSettingsProps {
  type: 'knowledge_base' | 'prompt';
  webhooks: {
    knowledge_base_add_webhook_url: string | null;
    knowledge_base_delete_webhook_url: string | null;
    prompt_webhook_url: string | null;
  };
  onUpdateWebhooks: (updates: any) => Promise<boolean>;
  className?: string;
}

export const ClientWebhookSettings: React.FC<ClientWebhookSettingsProps> = ({
  type,
  webhooks,
  onUpdateWebhooks,
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWebhookUpdate = async (newWebhooks: { addWebhook: string; deleteWebhook?: string }) => {
    let updates: any = {};
    
    if (type === 'knowledge_base') {
      updates = {
        knowledge_base_add_webhook_url: newWebhooks.addWebhook
      };
    } else {
      updates = {
        prompt_webhook_url: newWebhooks.addWebhook
      };
    }

    const success = await onUpdateWebhooks(updates);
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const getWebhookConfig = () => {
    if (type === 'knowledge_base') {
      return {
        add: webhooks.knowledge_base_add_webhook_url
      };
    } else {
      return {
        add: webhooks.prompt_webhook_url
      };
    }
  };

  const config = getWebhookConfig();
  const hasWebhooks = config.add;

  return (
    <>
      <Card className={`material-surface ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">
                  {type === 'knowledge_base' ? 'Knowledge Base Webhooks' : 'Prompt Webhooks'}
                </CardTitle>
                <CardDescription>
                  {type === 'knowledge_base' 
                    ? 'Webhook URLs for document operations'
                    : 'Webhook URL for prompt operations'
                  }
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              {hasWebhooks ? (
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
        <CardContent className="space-y-3">
          {hasWebhooks ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {type === 'knowledge_base' ? 'Operations Webhook:' : 'Webhook:'}
                </span>
                <StatusTag variant="positive" icon={<Link className="w-3 h-3" />}>
                  Configured
                </StatusTag>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded truncate">
                {config.add}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                <Link className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {type === 'knowledge_base' 
                  ? 'Configure webhook to receive notifications when documents are created, updated, or deleted.'
                  : 'Configure webhook to receive notifications when prompts are created or updated.'
                }
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                size="sm"
                className="modern-button-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Set Up Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookSetupDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleWebhookUpdate}
        type={type}
        title={`${hasWebhooks ? 'Update' : 'Configure'} ${type === 'knowledge_base' ? 'Knowledge Base' : 'Prompt'} Webhooks`}
        description={
          type === 'knowledge_base'
            ? 'Set up webhook URL to receive notifications when documents are created, updated, or deleted.'
            : 'Set up webhook URL to receive notifications when prompts are created or updated.'
        }
      />
    </>
  );
};