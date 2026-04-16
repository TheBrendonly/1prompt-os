import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from '@/components/icons';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  is_published: boolean;
  webhook_url?: string;
  created_at?: string;
}

interface KnowledgeBaseCardProps {
  article: KnowledgeArticle;
  onEdit: (article: KnowledgeArticle) => void;
  onDelete: (articleId: string) => void;
  disabledActions?: boolean;
}

const KnowledgeBaseCard: React.FC<KnowledgeBaseCardProps> = ({ article, onEdit, onDelete, disabledActions = false }) => {
  // Strip HTML tags and get clean text preview
  const cleanContent = article.content.replace(/<[^>]*>/g, '').trim();
  const contentPreview = cleanContent.length > 150 
    ? cleanContent.substring(0, 150) + '...' 
    : cleanContent;

  return (
    <Card className="material-surface">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge 
                className={article.is_published 
                  ? "bg-[hsl(142_71%_45%)] text-foreground border border-foreground" 
                  : "bg-transparent text-foreground border border-foreground"}
              >
                {article.is_published ? 'Published' : 'Draft'}
              </Badge>
              {article.tags && article.tags.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {article.tags[0]}
                  {article.tags.length > 1 && ` +${article.tags.length - 1}`}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-bold">{article.title}</CardTitle>
          </div>
          <Button
            onClick={() => onEdit(article)}
            disabled={disabledActions}
            variant="outline"
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {contentPreview || 'No content available.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBaseCard;
