import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Copy, Trash2, Eye, EyeOff, ArrowLeft } from '@/components/icons';
import { usePageHeader } from '@/contexts/PageHeaderContext';

interface DemoPage {
  id: string;
  client_id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
}

export default function DemoPages() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  usePageHeader({
    title: 'Demo Pages',
    actions: [{
      label: 'CREATE NEW',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => navigate(`/client/${clientId}/demo-pages/new`),
    }],
  });
  const [demoPages, setDemoPages] = useState<DemoPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchDemoPages();
    }
  }, [clientId]);

  const fetchDemoPages = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_pages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemoPages((data || []) as unknown as DemoPage[]);
    } catch (error: any) {
      console.error('Error fetching demo pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch demo pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('demo_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Demo page deleted successfully',
      });

      fetchDemoPages();
    } catch (error: any) {
      console.error('Error deleting demo page:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete demo page',
        variant: 'destructive',
      });
    }
  };

  const togglePublish = async (page: DemoPage) => {
    try {
      const { error } = await supabase
        .from('demo_pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Demo page ${!page.is_published ? 'published' : 'unpublished'} successfully`,
      });

      fetchDemoPages();
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      toast({
        title: 'Error',
        description: 'Failed to update demo page',
        variant: 'destructive',
      });
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/demo/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Success',
      description: 'Link copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="container mx-auto max-w-7xl py-6">

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : demoPages.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Demo Pages</CardTitle>
              <CardDescription>
                Create your first demo page to showcase your AI solutions
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6">
            {demoPages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{page.title || 'Untitled Demo Page'}</CardTitle>
                      <CardDescription>
                        Created {new Date(page.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={page.is_published ? "bg-success/20 text-foreground border border-foreground" : "bg-transparent text-foreground border border-foreground"}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {page.is_published && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm flex-1">
                        {window.location.origin}/demo/{page.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(page.slug)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => navigate(`/client/${clientId}/demo-pages/${page.id}`)}
                    >
                      Edit Page
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => togglePublish(page)}
                    >
                      {page.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Publish
                        </>
                      )}
                    </Button>
                    {page.is_published && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(`/demo/${page.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Live
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
