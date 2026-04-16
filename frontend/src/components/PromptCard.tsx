import React from 'react';
import { Button } from '@/components/ui/button';
import { StatusTag } from '@/components/StatusTag';
import { Calendar, MessageSquare, CheckCircle, XCircle, Edit, Trash2, Link, Settings, Bot, Wand2 } from '@/components/icons';
import { htmlToMarkdown, preserveMarkdownFormatting } from '@/utils/markdownConverter';

interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  webhook_url?: string | null;
  is_system?: boolean;
}

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onEditWebhook?: (prompt: Prompt) => void;
  onModifyWithAI?: (prompt: Prompt) => void;
  disabledActions?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onDelete, onEditWebhook, onModifyWithAI, disabledActions = false }) => {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  // Produce raw markdown preview (convert legacy HTML to markdown)
  const rawMarkdown = prompt.content.includes('<')
    ? htmlToMarkdown(prompt.content)
    : preserveMarkdownFormatting(prompt.content);
  const contentPreview = rawMarkdown.length > 160 
    ? rawMarkdown.substring(0, 160) + '...' 
    : rawMarkdown;

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm p-8 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Status Badge at the top */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <StatusTag
            variant={prompt.is_active ? 'positive' : 'neutral'}
            icon={prompt.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          >
            {prompt.is_active ? 'Deployed' : 'Not Deployed'}
          </StatusTag>
          {prompt.is_system && (
            <StatusTag variant="neutral" icon={<Bot className="w-3 h-3" />}>
              System
            </StatusTag>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-2">
            {prompt.name}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => onEdit(prompt)}
            disabled={disabledActions}
            className="flex items-center space-x-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
          
          {!prompt.is_system && (
            <Button
              size="sm"
              onClick={() => onDelete(prompt.id)}
              disabled={disabledActions}
              className="flex items-center space-x-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
          <MessageSquare className="w-4 h-4" />
          <span>{rawMarkdown.length} chars</span>
        </div>
        {prompt.created_at && (
          <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
            <Calendar className="w-4 h-4" />
            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-grow">
        <div className="bg-muted/50 p-3 rounded-md font-mono text-xs leading-relaxed overflow-hidden h-full">
          <pre className="whitespace-pre-wrap text-muted-foreground">
            {contentPreview}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;