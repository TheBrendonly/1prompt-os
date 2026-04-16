import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { MetricColorPicker } from './MetricColorPicker';
import { CustomMetricColorPicker } from './CustomMetricColorPicker';
import { 
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar
} from '@/components/icons';

interface AnalyticsMetrics {
  totalBotMessages: number;
  newUserMessages: number;
  thankYouCount: number;
  questionsAsked: number;
  totalConversations: number;
  customMetrics?: Record<string, number>;
}

interface RealTimeDashboardProps {
  clientId: string;
  timeRange: string;
  analyticsData: AnalyticsMetrics | null;
  lastUpdated: Date | null;
  isAnalyzing: boolean;
}

export const OptimizedRealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  clientId,
  timeRange,
  analyticsData,
  lastUpdated,
  isAnalyzing
}) => {
  const [customMetrics, setCustomMetrics] = useState<Array<{
    id: string;
    name: string;
    color: string;
    is_active: boolean;
  }>>([]);
  const [colorPreferences, setColorPreferences] = useState<Record<string, string>>({});

  // Canonical mapping for default metric names across the app
  const METRIC_ALIASES: Record<string, string> = {
    'Bot Messages': 'Total Bot Messages',
    'Total Bot Messages': 'Total Bot Messages',
    'New Users': 'New User Messages',
    'New User Messages': 'New User Messages',
    'Thank You': 'Thank You Count',
    'Thank You Count': 'Thank You Count',
    'Questions': 'Questions Asked',
    'User Questions Asked': 'Questions Asked',
    'Questions Asked': 'Questions Asked',
    'Conversations': 'Total Conversations',
    'Total Conversations': 'Total Conversations',
  };
  const canonicalize = (name: string) => METRIC_ALIASES[name] || name;
  // Memoized metric cards to prevent unnecessary re-renders
  const metricCards = useMemo(() => {
    const getMetricColor = (metricName: string, defaultColor: string) => {
      const key = canonicalize(metricName);
      return colorPreferences[key] || defaultColor;
    };

    // Always show default metrics, even when no analytics data
    const defaultMetrics = [
      {
        title: 'Total Bot Messages',
        value: analyticsData?.totalBotMessages ?? null,
        icon: MessageSquare,
        description: 'Total messages sent',
        type: 'default' as const,
        color: getMetricColor('Total Bot Messages', '#3b82f6')
      },
      {
        title: 'New User Messages',
        value: analyticsData?.newUserMessages ?? null,
        icon: Users,
        description: 'First-time interactions',
        type: 'default' as const,
        color: getMetricColor('New User Messages', '#10b981')
      },
      {
        title: 'Thank You Count',
        value: analyticsData?.thankYouCount ?? null,
        icon: CheckCircle2,
        description: 'Gratitude expressions',
        type: 'default' as const,
        color: getMetricColor('Thank You Count', '#22c55e')
      },
      {
        title: 'Questions Asked',
        value: analyticsData?.questionsAsked ?? null,
        icon: AlertTriangle,
        description: 'User questions',
        type: 'default' as const,
        color: getMetricColor('Questions Asked', '#f59e0b')
      },
      {
        title: 'Total Conversations',
        value: analyticsData?.totalConversations ?? null,
        icon: TrendingUp,
        description: 'Total conversations',
        type: 'default' as const,
        color: getMetricColor('Total Conversations', '#06b6d4')
      }
    ];

    // Add custom metrics if analytics data exists and has custom metrics
    const customMetricCards = Object.entries(analyticsData?.customMetrics || {}).map(([name, value]) => {
      const customMetric = customMetrics.find(m => m.name === name);
      return {
        title: name,
        value: value,
        icon: Activity,
        description: 'Custom metric',
        type: 'custom' as const,
        color: customMetric?.color || '#8b5cf6'
      };
    });

    return [...defaultMetrics, ...customMetricCards];
  }, [analyticsData, customMetrics, colorPreferences]);

  // Load custom metrics and color preferences
  useEffect(() => {
    const loadCustomMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_metrics')
          .select('id, name, color, is_active')
          .eq('client_id', clientId)
          .eq('is_active', true);

        if (error) throw error;
        setCustomMetrics(data || []);
      } catch (error) {
        console.error('Error loading custom metrics:', error);
      }
    };

    const loadColorPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('metric_color_preferences')
          .select('metric_name, color')
          .eq('client_id', clientId);

        if (error) throw error;
        
        const preferences: Record<string, string> = {};
        data?.forEach(pref => {
          const key = canonicalize(pref.metric_name);
          preferences[key] = pref.color;
        });
        setColorPreferences(preferences);
      } catch (error) {
        console.error('Error loading color preferences:', error);
      }
    };

    loadCustomMetrics();
    loadColorPreferences();

    // Set up real-time subscription for custom metrics changes
    const metricsChannel = supabase
      .channel('custom-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_metrics',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Custom metrics changed:', payload);
          loadCustomMetrics(); // Reload metrics when they change
          
          // Notify parent component that custom metrics changed
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('customMetricsChanged', {
              detail: { clientId, payload }
            }));
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for color preferences changes
    const colorChannel = supabase
      .channel('metric-color-preferences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metric_color_preferences',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Metric color preferences changed:', payload);
          loadColorPreferences(); // Reload color preferences when they change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(colorChannel);
    };
  }, [clientId]);

  // Format numbers with proper localization
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat().format(num);
  }, []);

  // Format time display
  const formatTime = useCallback((date: Date | null): string => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }, []);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Data persists until manually refreshed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              <span>Last updated: {formatTime(lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Data saved permanently until next refresh</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Analytics Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Analytics Dashboard</h2>
          <Badge variant="outline">Last {timeRange} days</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((metric, index) => {
            const hexToHslLocal = (hex: string) => {
              try {
                let c = (hex || '').replace('#', '');
                if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
                if (c.length !== 6) return { h: 217, s: 91, l: 60 };
                const r = parseInt(c.substring(0, 2), 16) / 255;
                const g = parseInt(c.substring(2, 4), 16) / 255;
                const b = parseInt(c.substring(4, 6), 16) / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                let h = 0, s = 0, l = (max + min) / 2;
                if (max !== min) {
                  const d = max - min;
                  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                  switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                  }
                  h = h / 6;
                }
                return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
              } catch { return { h: 217, s: 91, l: 60 }; }
            };
            const hslA = (hex: string, a: number) => {
              const { h, s, l } = hexToHslLocal(hex);
              return `hsl(${h} ${s}% ${l}% / ${a})`;
            };
            return (
              <div
                key={`${metric.title}-${index}`}
                className="p-4 rounded-lg hover-scale relative"
                style={{
                  backgroundColor: hslA(metric.color, 0.08),
                  border: `1px solid ${hslA(metric.color, 0.4)}`,
                }}
              >
                {metric.type === 'custom' ? (
                  customMetrics.find((m) => m.name === metric.title) ? (
                    <CustomMetricColorPicker
                      metricId={customMetrics.find((m) => m.name === metric.title)!.id}
                      currentColor={metric.color}
                      onColorChange={(newColor) => {
                        setCustomMetrics(prev => prev.map(m => m.name === metric.title ? { ...m, color: newColor } : m));
                      }}
                    />
                  ) : null
                ) : (
                  <MetricColorPicker
                    clientId={clientId}
                    metricName={metric.title}
                    currentColor={metric.color}
                    onColorChange={(newColor) => {
                      setColorPreferences(prev => ({
                        ...prev,
                        [metric.title]: newColor
                      }));
                    }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: hslA(metric.color, 0.15) }}
                  >
                    <metric.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">{metric.title}</div>
                    <div className="text-2xl font-bold text-foreground">
                      {metric.value !== null ? formatNumber(metric.value) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Metrics Section */}
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Metrics</h3>
          {customMetrics.length > 0 ? (
            <Badge variant="outline">
              {Object.keys(analyticsData?.customMetrics || {}).length}/{customMetrics.length} with data
            </Badge>
          ) : (
            <Badge variant="secondary">No metrics created</Badge>
          )}
        </div>
        {customMetrics.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customMetrics.map((metric) => {
                const value = analyticsData?.customMetrics?.[metric.name];
                return (
              <div
                    key={metric.id}
                    className="p-4 rounded-lg hover-scale relative"
                    style={{
                      backgroundColor: `${metric.color}14`,
                      border: `1px solid ${metric.color}66`,
                    }}
                  >
                    <CustomMetricColorPicker
                      metricId={metric.id}
                      currentColor={metric.color}
                      onColorChange={(newColor) => {
                        setCustomMetrics(prev => prev.map(m => m.id === metric.id ? { ...m, color: newColor } : m));
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${metric.color}26` }}
                      >
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground font-medium">{metric.name}</div>
                        <div className="text-2xl font-bold text-foreground">
                          {value !== undefined ? formatNumber(value) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-border bg-card">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Custom Metrics Created</h4>
            <p className="text-sm text-muted-foreground">
              Create custom metrics to track specific patterns in your chat data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};