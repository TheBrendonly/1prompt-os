import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, X, BarChart3, TrendingUp, Target, CalendarCheck, Users, Send, PieChart, Activity, Zap, Star, Award, CircleDot } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { DashboardWidgetData, WidgetConfig } from './DashboardWidgetRenderer';

interface MetricOption {
  id: string;
  name: string;
  color: string;
}

interface CreateWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget?: DashboardWidgetData | null;
  availableMetrics: MetricOption[];
  onSave: (data: {
    title: string;
    widget_type: string;
    width: string;
    config: WidgetConfig;
  }) => Promise<void>;
  onDelete?: () => Promise<void> | void;
}

const WIDGET_TYPES = [
  { value: 'number_card', label: 'Number Card' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'bar_vertical', label: 'Bar Chart (Vertical)' },
  { value: 'bar_horizontal', label: 'Bar Chart (Horizontal)' },
];

const WIDTH_OPTIONS = [
  { value: 'full', label: 'Full Width (100%)' },
  { value: 'half', label: 'Half Width (50%)' },
];

const ICON_OPTIONS = [
  { value: 'bar-chart-3', label: 'Bar Chart', Icon: BarChart3 },
  { value: 'trending-up', label: 'Trending', Icon: TrendingUp },
  { value: 'target', label: 'Target', Icon: Target },
  { value: 'calendar-check', label: 'Calendar', Icon: CalendarCheck },
  { value: 'users', label: 'Users', Icon: Users },
  { value: 'send', label: 'Send', Icon: Send },
  { value: 'pie-chart', label: 'Pie Chart', Icon: PieChart },
  { value: 'activity', label: 'Activity', Icon: Activity },
  { value: 'zap', label: 'Zap', Icon: Zap },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'circle-dot', label: 'Circle', Icon: CircleDot },
];

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const AXIS_OPTIONS = [
  { value: 'dates', label: 'Dates (Timeline)' },
  { value: 'metrics', label: 'Metric Names' },
];

const Y_AXIS_OPTIONS = [
  { value: 'values', label: 'Total Count / Values' },
  { value: 'percentage', label: 'Percentage (%)' },
];

// Visual axis preview component
function AxisPreview({ xAxis, yAxis, chartType }: { xAxis: string; yAxis: string; chartType: string }) {
  const isChart = ['line', 'bar_vertical', 'bar_horizontal', 'doughnut'].includes(chartType);
  if (!isChart || chartType === 'number_card') return null;

  return (
    <div className="border border-border bg-muted/20 p-4">
      <div className="flex gap-2">
        {/* Y Axis label */}
        <div className="flex items-center justify-center w-6">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap -rotate-90">
            {yAxis === 'values' ? 'COUNT' : '%'}
          </span>
        </div>
        {/* Chart area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 border-l border-b border-muted-foreground/30 min-h-[80px] relative flex items-end gap-1 px-2 pb-1">
            {chartType === 'line' && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  points="5,50 20,35 40,40 55,20 70,25 90,10"
                />
              </svg>
            )}
            {(chartType === 'bar_vertical') && (
              <>
                <div className="w-1/5 bg-primary/60" style={{ height: '40%' }} />
                <div className="w-1/5 bg-primary/80" style={{ height: '65%' }} />
                <div className="w-1/5 bg-primary" style={{ height: '85%' }} />
                <div className="w-1/5 bg-primary/70" style={{ height: '50%' }} />
                <div className="w-1/5 bg-primary/50" style={{ height: '30%' }} />
              </>
            )}
            {chartType === 'doughnut' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-muted-foreground/30 border-r-accent" />
              </div>
            )}
            {chartType === 'bar_horizontal' && (
              <div className="absolute inset-0 flex flex-col justify-center gap-1 px-2">
                <div className="h-3 bg-primary/80" style={{ width: '80%' }} />
                <div className="h-3 bg-primary/60" style={{ width: '55%' }} />
                <div className="h-3 bg-primary" style={{ width: '90%' }} />
              </div>
            )}
          </div>
          {/* X Axis label */}
          <div className="text-center pt-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {xAxis === 'dates' ? 'DATE RANGE' : 'METRICS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateWidgetDialog({
  open,
  onOpenChange,
  widget,
  availableMetrics,
  onSave,
  onDelete,
}: CreateWidgetDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [widgetType, setWidgetType] = useState('doughnut');
  const [icon, setIcon] = useState('bar-chart-3');
  const [width, setWidth] = useState('half');
  const [widgetTimeRange, setWidgetTimeRange] = useState('inherit');
  const [selectedMetrics, setSelectedMetrics] = useState<{ id: string; name: string; color: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [xAxis, setXAxis] = useState('dates');
  const [yAxis, setYAxis] = useState('values');

  const isEditing = !!widget;

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setWidgetType(widget.widget_type);
      setWidth(widget.width);
      setIcon(widget.config.icon || 'bar-chart-3');
      setWidgetTimeRange((widget.config as any).time_range || 'inherit');
      setXAxis((widget.config as any).x_axis || 'dates');
      setYAxis((widget.config as any).y_axis || 'values');
      const metrics = (widget.config.metric_names || []).map((name, i) => ({
        id: widget.config.metric_ids?.[i] || '',
        name,
        color: widget.config.colors?.[i] || '#3b82f6',
      }));
      setSelectedMetrics(metrics.length > 0 ? metrics : []);
    } else {
      setTitle('');
      setWidgetType('doughnut');
      setWidth('half');
      setIcon('bar-chart-3');
      setWidgetTimeRange('inherit');
      setXAxis('dates');
      setYAxis('values');
      setSelectedMetrics([]);
    }
  }, [widget, open]);

  const addMetric = (metricId: string) => {
    const metric = availableMetrics.find(m => m.id === metricId);
    if (!metric) return;
    if (selectedMetrics.find(m => m.id === metricId)) return;
    setSelectedMetrics(prev => [...prev, { id: metric.id, name: metric.name, color: metric.color }]);
  };

  const removeMetric = (index: number) => {
    setSelectedMetrics(prev => prev.filter((_, i) => i !== index));
  };

  const updateMetricColor = (index: number, color: string) => {
    setSelectedMetrics(prev => prev.map((m, i) => i === index ? { ...m, color } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: "Validation Error", description: "Title is required.", variant: "destructive" });
      return;
    }

    if (selectedMetrics.length === 0) {
      toast({ title: "Validation Error", description: "Select at least one metric.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        widget_type: widgetType,
        width,
        config: {
          metric_ids: selectedMetrics.map(m => m.id),
          metric_names: selectedMetrics.map(m => m.name),
          colors: selectedMetrics.map(m => m.color),
          icon,
          time_range: widgetTimeRange,
          x_axis: xAxis,
          y_axis: yAxis,
        },
      });
    } catch (error) {
      console.error('Error saving widget:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} widget.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const unselectedMetrics = availableMetrics.filter(
    m => !selectedMetrics.find(s => s.id === m.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !p-0">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Widget' : 'Create Widget'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="widget-title" className="field-text">Title</Label>
                <Input
                  id="widget-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Response Breakdown"
                  maxLength={80}
                  required
                  className="!h-8 field-text"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label className="field-text">Icon</Label>
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIcon(opt.value)}
                      className={`p-2 border transition-colors ${
                        icon === opt.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                      title={opt.label}
                    >
                      <opt.Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Type */}
              <div className="space-y-2">
                <Label className="field-text">Chart Type</Label>
                <Select value={widgetType} onValueChange={setWidgetType}>
                  <SelectTrigger className="!h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDGET_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Width */}
              <div className="space-y-2">
                <Label className="field-text">Width</Label>
                <Select value={width} onValueChange={setWidth}>
                  <SelectTrigger className="!h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDTH_OPTIONS.map(w => (
                      <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Axis Configuration - only for charts */}
              {widgetType !== 'number_card' && (
                <div className="space-y-3">
                  <Label className="field-text">Axis Configuration</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">X Axis (Horizontal)</span>
                      <Select value={xAxis} onValueChange={setXAxis}>
                        <SelectTrigger className="!h-8">
                          <SelectValue placeholder="Choose X axis" />
                        </SelectTrigger>
                        <SelectContent>
                          {AXIS_OPTIONS.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Y Axis (Vertical)</span>
                      <Select value={yAxis} onValueChange={setYAxis}>
                        <SelectTrigger className="!h-8">
                          <SelectValue placeholder="Choose Y axis" />
                        </SelectTrigger>
                        <SelectContent>
                          {Y_AXIS_OPTIONS.map(a => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <AxisPreview xAxis={xAxis} yAxis={yAxis} chartType={widgetType} />
                </div>
              )}

              {/* Time Range */}
              <div className="space-y-2">
                <Label className="field-text">Time Range</Label>
                <Select value={widgetTimeRange} onValueChange={setWidgetTimeRange}>
                  <SelectTrigger className="!h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Same as Dashboard</SelectItem>
                    <SelectItem value="1">Last 1 day</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Metrics */}
              <div className="space-y-2">
                <Label className="field-text">Metrics</Label>
                <div className="space-y-2">
                  {selectedMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-md bg-muted/30">
                      <Input
                        type="color"
                        value={metric.color}
                        onChange={(e) => updateMetricColor(index, e.target.value)}
                        className="w-8 h-8 cursor-pointer p-0.5 border-0"
                      />
                      <span className="flex-1 text-sm truncate">{metric.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeMetric(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {unselectedMetrics.length > 0 && (
                    <Select onValueChange={addMetric} value="">
                      <SelectTrigger className="!h-8">
                        <SelectValue placeholder="+ Add a metric..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unselectedMetrics.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedMetrics.length === 0 && unselectedMetrics.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No metrics available. Create metrics first to use in widgets.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 groove-btn field-text"
                  size="sm"
                >
                  {saving ? 'SAVING...' : (isEditing ? 'UPDATE' : 'CREATE')}
                </Button>
                {isEditing && onDelete ? (
                  <Button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    size="sm"
                    className="flex-1 groove-btn field-text !bg-destructive !text-destructive-foreground hover:!bg-[#7a2f2b] !border-[#752e2a] hover:!border-[#5a2320]"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    DELETE
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    size="sm"
                    className="flex-1 groove-btn field-text"
                  >
                    CANCEL
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Widget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{widget?.title}" from your dashboard? You can recreate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteConfirm(false); onDelete?.(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
