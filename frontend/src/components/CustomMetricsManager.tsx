import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getMetricIcon } from '@/utils/metricIcons';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, BarChart3 } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CustomMetricDialog } from './CustomMetricDialog';
interface CustomMetric {
  id: string;
  name: string;
  prompt: string;
  color: string;
  is_active: boolean;
  created_at: string;
}
interface CustomMetricsManagerProps {
  clientId: string;
  analyticsType: 'text' | 'voice';
  hiddenDefaultMetrics?: string[];
  onRestoreDefault?: (metricName: string) => void;
}
export function CustomMetricsManager({
  clientId,
  analyticsType,
  hiddenDefaultMetrics = [],
  onRestoreDefault
}: CustomMetricsManagerProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null);
  useEffect(() => {
    loadMetrics();
  }, [clientId]);
  useEffect(() => {
    const handler = (event: any) => {
      const { metricId, color } = event.detail || {};
      if (!metricId || !color) return;
      setMetrics((prev) => prev.map((m) => m.id === metricId ? { ...m, color } : m));
    };
    window.addEventListener('customMetricColorChanged', handler as EventListener);
    return () => window.removeEventListener('customMetricColorChanged', handler as EventListener);
  }, []);
  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_metrics')
        .select('*')
        .eq('client_id', clientId)
        .eq('analytics_type', analyticsType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading custom metrics:', error);
      toast({ title: "Error", description: "Failed to load custom metrics.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = () => {
    setEditingMetric(null);
    setDialogOpen(true);
  };
  const handleEdit = (metric: CustomMetric) => {
    setEditingMetric(metric);
    setDialogOpen(true);
  };
  const handleSave = async (metricData: { name: string; prompt: string; color: string }) => {
    try {
      if (editingMetric) {
        const { error } = await supabase
          .from('custom_metrics')
          .update({
            name: metricData.name,
            prompt: metricData.prompt,
            color: metricData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMetric.id);
        if (error) throw error;
        toast({ title: "Success", description: "Custom metric updated successfully." });
      } else {
        const { data: existingMetrics, error: checkError } = await supabase
          .from('custom_metrics')
          .select('name, widget_type')
          .eq('client_id', clientId)
          .eq('analytics_type', analyticsType)
          .eq('name', metricData.name)
          .eq('widget_type', (metricData as any).widget_type || 'number_card')
          .eq('is_active', true);
        if (checkError) throw checkError;
        if (existingMetrics && existingMetrics.length > 0) {
          toast({ title: "Error", description: "A metric with this name and format already exists. Try a different visualization type.", variant: "destructive" });
          return;
        }
        const { error } = await supabase
          .from('custom_metrics')
          .insert([{
            client_id: clientId,
            analytics_type: analyticsType,
            name: metricData.name,
            description: '',
            prompt: metricData.prompt,
            color: metricData.color
          }]);
        if (error) throw error;
        toast({ title: "Success", description: "Custom metric created successfully." });
      }
      await loadMetrics();
      setDialogOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invalidateAnalyticsCache'));
        window.dispatchEvent(new CustomEvent('customMetricsChanged'));
      }
    } catch (error) {
      console.error('Error saving custom metric:', error);
      toast({ title: "Error", description: "Failed to save custom metric.", variant: "destructive" });
    }
  };
  const handleDelete = async (metricId: string) => {
    try {
      const { error } = await supabase
        .from('custom_metrics')
        .update({ is_active: false })
        .eq('id', metricId);
      if (error) throw error;
      await loadMetrics();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invalidateAnalyticsCache'));
        window.dispatchEvent(new CustomEvent('customMetricsChanged'));
      }
      toast({ title: "Success", description: "Custom metric deleted successfully." });
    } catch (error) {
      console.error('Error deleting custom metric:', error);
      toast({ title: "Error", description: "Failed to delete custom metric.", variant: "destructive" });
    }
  };
  return <>
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '12px' }} className="font-medium text-muted-foreground uppercase tracking-wide">
            {metrics.length > 0 ? `${metrics.length} CUSTOM METRICS` : 'CUSTOM METRICS'}
          </span>
          <Button onClick={handleCreate} size="sm" disabled={loading} className="!h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            CREATE METRIC
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Loading custom metrics...</p>
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground" style={{ fontSize: '13px' }}>No Custom Metrics</p>
            <p className="mt-1 text-xs">
              Create custom metrics to track specific patterns
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric) => {
              const MetricIcon = getMetricIcon(metric.id);
              return (
                <div key={metric.id} className="bg-background p-4 border border-border relative" style={{ borderLeftWidth: '3px', borderLeftColor: metric.color }}>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(metric)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Custom Metric</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{metric.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(metric.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: `${metric.color}1a` }}>
                      <MetricIcon className="w-5 h-5" style={{ color: metric.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px' }} className="font-medium text-foreground">{metric.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={metric.prompt}>
                        "{metric.prompt}"
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    {hiddenDefaultMetrics && hiddenDefaultMetrics.length > 0 && onRestoreDefault && (
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontSize: '12px' }} className="font-medium text-muted-foreground uppercase tracking-wide">HIDDEN:</span>
        {hiddenDefaultMetrics.map((name) => (
          <Button key={name} variant="outline" size="sm" className="!h-7 text-xs" onClick={() => onRestoreDefault(name)}>
            + {name}
          </Button>
        ))}
      </div>
    )}
    <CustomMetricDialog open={dialogOpen} onOpenChange={setDialogOpen} metric={editingMetric} onSave={handleSave} onDelete={editingMetric ? () => handleDelete(editingMetric.id) : undefined} />
  </>;
}
