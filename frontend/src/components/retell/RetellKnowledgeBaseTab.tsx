import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, RefreshCw, Loader2, BookOpen, Globe, FileText } from 'lucide-react';
import { useRetellApi, RetellKnowledgeBase } from '@/hooks/useRetellApi';

interface RetellKnowledgeBaseTabProps {
  clientId: string;
}

const RetellKnowledgeBaseTab: React.FC<RetellKnowledgeBaseTabProps> = ({ clientId }) => {
  const retell = useRetellApi(clientId);
  const [kbs, setKbs] = useState<RetellKnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [kbName, setKbName] = useState('');
  const [kbTexts, setKbTexts] = useState('');
  const [kbUrls, setKbUrls] = useState('');

  const fetchKbs = async () => {
    setLoading(true);
    try {
      const data = await retell.listKnowledgeBases();
      setKbs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKbs(); }, []); // eslint-disable-line

  const handleCreate = async () => {
    if (!kbName.trim()) { toast.error('Knowledge base name is required'); return; }

    setCreating(true);
    try {
      const kbData: Record<string, unknown> = {
        knowledge_base_name: kbName.trim(),
      };

      if (kbTexts.trim()) {
        kbData.knowledge_base_texts = [{ title: kbName.trim(), text: kbTexts.trim() }];
      }

      if (kbUrls.trim()) {
        kbData.knowledge_base_urls = kbUrls.split('\n').map(u => u.trim()).filter(Boolean);
      }

      await retell.createKnowledgeBase(kbData);
      toast.success('Knowledge base created');
      setShowCreateForm(false);
      setKbName('');
      setKbTexts('');
      setKbUrls('');
      await fetchKbs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create knowledge base');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (kbId: string) => {
    setDeletingId(kbId);
    try {
      await retell.deleteKnowledgeBase(kbId);
      toast.success('Knowledge base deleted');
      await fetchKbs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Knowledge Bases</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{kbs.length} knowledge base{kbs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchKbs}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New KB
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create Knowledge Base</CardTitle>
            <CardDescription className="text-xs">Add text content or URLs to create a KB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Name (max 40 chars)</Label>
              <Input
                value={kbName}
                onChange={e => setKbName(e.target.value.slice(0, 40))}
                placeholder="My Knowledge Base"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Text Content</Label>
              <Textarea
                value={kbTexts}
                onChange={e => setKbTexts(e.target.value)}
                className="text-sm min-h-[80px]"
                placeholder="Paste your knowledge base text here..."
              />
            </div>
            <div>
              <Label className="text-xs">URLs (one per line)</Label>
              <Textarea
                value={kbUrls}
                onChange={e => setKbUrls(e.target.value)}
                className="text-sm min-h-[60px]"
                placeholder="https://example.com&#10;https://docs.example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Create KB
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {kbs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No knowledge bases yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {kbs.map(kb => (
            <Card key={kb.knowledge_base_id}>
              <div className="flex items-center gap-3 p-3">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{kb.knowledge_base_name}</span>
                    <Badge
                      variant={kb.status === 'complete' ? 'default' : 'secondary'}
                      className="text-[10px] py-0 px-1.5"
                    >
                      {kb.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {kb.knowledge_base_id}
                    </p>
                    {kb.knowledge_base_sources && (
                      <span className="text-[11px] text-muted-foreground">
                        {kb.knowledge_base_sources.length} source{kb.knowledge_base_sources.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={deletingId === kb.knowledge_base_id}>
                      {deletingId === kb.knowledge_base_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Knowledge Base</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{kb.knowledge_base_name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(kb.knowledge_base_id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetellKnowledgeBaseTab;
