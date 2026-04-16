import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import SavingOverlay from '@/components/SavingOverlay';
import { useParams, useNavigate } from 'react-router-dom';
import { useOpenRouterUsage } from '@/hooks/useOpenRouterUsage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Activity, Zap, Key, Info, RotateCcw } from '@/components/icons';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type LayoutItem,
  type Layout,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const formatCurrency = (val: number) => `$${val.toFixed(4)}`;
const formatTokens = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toString();
};

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;
const TABLE_CELL_STYLE: React.CSSProperties = { fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" };

const COLS = 4;
const ROW_HEIGHT = 26;
const GRID_MARGIN: [number, number] = [12, 12];

interface UsageWidget {
  id: string;
  title: string;
  widget_type: 'number_card' | 'chart' | 'table';
  sort_order: number;
}

const DEFAULT_WIDGETS: UsageWidget[] = [
  { id: 'total_credits', title: 'Total Credits', widget_type: 'number_card', sort_order: 0 },
  { id: 'total_used', title: 'Total Used', widget_type: 'number_card', sort_order: 1 },
  { id: 'remaining', title: 'Remaining', widget_type: 'number_card', sort_order: 2 },
  { id: 'usage_pct', title: 'Usage %', widget_type: 'number_card', sort_order: 3 },
  { id: 'today_spend', title: "Today's Spend", widget_type: 'number_card', sort_order: 4 },
  { id: 'week_spend', title: 'This Week', widget_type: 'number_card', sort_order: 5 },
  { id: 'month_spend', title: 'This Month', widget_type: 'number_card', sort_order: 6 },
  { id: 'alltime_spend', title: 'All-time Key Usage', widget_type: 'number_card', sort_order: 7 },
  { id: 'credit_bar', title: 'Credit Usage', widget_type: 'chart', sort_order: 8 },
  { id: 'daily_chart', title: 'Daily Spend (Last 30 Days)', widget_type: 'chart', sort_order: 12 },
  { id: 'model_table', title: 'Usage By Model (Last 30 Days)', widget_type: 'table', sort_order: 16 },
  { id: 'daily_table', title: 'Daily Activity (Last 30 Days)', widget_type: 'table', sort_order: 20 },
];

function getWidgetSize(w: UsageWidget): { w: number; h: number } {
  if (w.widget_type === 'number_card') return { w: 1, h: 4 };
  if (w.id === 'credit_bar') return { w: COLS, h: 3 };
  if (w.widget_type === 'chart') return { w: COLS, h: 10 };
  return { w: COLS, h: 14 };
}

function widgetsToLayout(widgets: UsageWidget[]): LayoutItem[] {
  return [...widgets]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((widget) => {
      const size = getWidgetSize(widget);
      return {
        i: widget.id,
        x: widget.sort_order % COLS,
        y: Math.floor(widget.sort_order / COLS),
        w: size.w,
        h: size.h,
        isResizable: false,
      };
    });
}

function layoutToSortOrders(layout: Layout): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of layout) {
    map.set(item.i, item.y * COLS + item.x);
  }
  return map;
}

const STORAGE_KEY_PREFIX = 'usage_widget_order_';

const UsageCredits = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { credits, keyUsage, modelUsage, dailyUsage, loading, error, activityError, hasKey, refresh, lastRefreshed } = useOpenRouterUsage(clientId);
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });
  const isDraggingRef = React.useRef(false);

  const [widgets, setWidgets] = useState<UsageWidget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + clientId);
      if (saved) {
        const orders: Record<string, number> = JSON.parse(saved);
        return DEFAULT_WIDGETS.map(w => ({
          ...w,
          sort_order: orders[w.id] ?? w.sort_order,
        }));
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + clientId);
      if (saved) {
        const orders: Record<string, number> = JSON.parse(saved);
        setWidgets(DEFAULT_WIDGETS.map(w => ({
          ...w,
          sort_order: orders[w.id] ?? w.sort_order,
        })));
      } else {
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, [clientId]);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resettingLayout, setResettingLayout] = useState(false);

  const handleResetLayout = useCallback(async () => {
    setResettingLayout(true);
    await new Promise(r => setTimeout(r, 300));
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(STORAGE_KEY_PREFIX + clientId);
    setResettingLayout(false);
  }, [clientId]);

  usePageHeader({
    title: 'OpenRouter Usage',
    actions: [
      {
        label: loading ? 'REFRESHING...' : 'REFRESH',
        icon: <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />,
        onClick: refresh,
        disabled: loading,
      },
      {
        label: 'DEFAULT LAYOUT',
        icon: <RotateCcw className="w-4 h-4" />,
        onClick: () => setResetConfirmOpen(true),
      },
    ],
  }, [loading, resetConfirmOpen]);

  const usagePercent = credits ? (credits.total_credits > 0 ? (credits.total_usage / credits.total_credits) * 100 : 0) : 0;

  const getStatValue = useCallback((widgetId: string): string => {
    switch (widgetId) {
      case 'total_credits': return credits ? formatCurrency(credits.total_credits) : '—';
      case 'total_used': return credits ? formatCurrency(credits.total_usage) : '—';
      case 'remaining': return credits ? formatCurrency(credits.remaining) : '—';
      case 'usage_pct': return credits ? `${usagePercent.toFixed(1)}%` : '—';
      case 'today_spend': return keyUsage ? formatCurrency(keyUsage.usage_daily) : '—';
      case 'week_spend': return keyUsage ? formatCurrency(keyUsage.usage_weekly) : '—';
      case 'month_spend': return keyUsage ? formatCurrency(keyUsage.usage_monthly) : '—';
      case 'alltime_spend': return keyUsage ? formatCurrency(keyUsage.usage) : '—';
      default: return '—';
    }
  }, [credits, keyUsage, usagePercent]);

  const layout = useMemo(() => widgetsToLayout(widgets), [widgets]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const sortOrders = layoutToSortOrders(newLayout);
      let hasChanged = false;

      const updatedWidgets = widgets.map((w) => {
        const newOrder = sortOrders.get(w.id);
        if (newOrder !== undefined && newOrder !== w.sort_order) {
          hasChanged = true;
          return { ...w, sort_order: newOrder };
        }
        return w;
      });

      if (hasChanged) {
        setWidgets(updatedWidgets);
        const orders: Record<string, number> = {};
        updatedWidgets.forEach(w => { orders[w.id] = w.sort_order; });
        localStorage.setItem(STORAGE_KEY_PREFIX + clientId, JSON.stringify(orders));
      }
    },
    [widgets, clientId]
  );

  // Filter widgets based on available data
  const visibleWidgets = useMemo(() => {
    return widgets.filter(w => {
      if (w.id === 'credit_bar') return credits && credits.total_credits > 0;
      if (w.id === 'daily_chart' || w.id === 'daily_table') return dailyUsage.length > 0;
      if (w.id === 'model_table') return modelUsage.length > 0;
      if (['today_spend', 'week_spend', 'month_spend', 'alltime_spend'].includes(w.id)) return !!keyUsage;
      return true;
    });
  }, [widgets, credits, keyUsage, dailyUsage, modelUsage]);

  const visibleLayout = useMemo(() => widgetsToLayout(visibleWidgets), [visibleWidgets]);

  if (hasKey === false) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <Key className="w-8 h-8 text-muted-foreground" />
            <h3 className="text-lg font-medium">OpenRouter API Key Not Configured</h3>
            <p className="text-muted-foreground text-center max-w-md">
              To view usage and credits, configure your OpenRouter API key in the Credentials page.
            </p>
            <Button variant="outline" onClick={() => navigate(`/client/${clientId}/credentials`)}>
              Go to Credentials
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderWidgetContent = (widget: UsageWidget) => {
    if (widget.widget_type === 'number_card') {
      const val = getStatValue(widget.id);
      const isLow = widget.id === 'remaining' && credits && credits.remaining < 1;
      return (
        <div className="stat-cell relative h-full flex flex-col" style={{ padding: '12px 16px' }}>
          <div style={{ ...FONT, textTransform: 'capitalize' }} className="font-medium text-muted-foreground mb-2">
            {widget.title}
          </div>
          <div className="border-t border-dashed border-border -mx-4 mb-0" />
          <div className="flex-1 flex items-center justify-center">
            <div
              style={{
                fontSize: '45px',
                fontFamily: "'VT323', monospace",
                lineHeight: 1,
                marginTop: '5px',
                color: isLow ? 'hsl(var(--destructive))' : undefined,
              }}
              className="font-light"
            >
              {val}
            </div>
          </div>
        </div>
      );
    }

    if (widget.id === 'credit_bar' && credits) {
      return (
        <div className="stat-cell relative h-full flex flex-col" style={{ padding: '12px 16px' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={FONT} className="font-medium text-muted-foreground">{widget.title}</span>
            <span style={FONT} className="text-muted-foreground">
              {formatCurrency(credits.total_usage)} of {formatCurrency(credits.total_credits)}
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="w-full h-2 bg-muted">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: usagePercent > 90 ? 'hsl(var(--destructive))' : usagePercent > 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (widget.id === 'daily_chart') {
      return (
        <div style={{ border: '3px groove hsl(var(--border-groove))' }} className="bg-card h-full flex flex-col">
          <div className="flex items-center gap-2 px-4" style={{ borderBottom: '3px groove hsl(var(--border-groove))', height: '52px', minHeight: '52px' }}>
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span style={FONT} className="font-medium text-foreground">{widget.title}</span>
          </div>
          <div className="p-4 flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => { try { return format(parseISO(d), 'MMM d'); } catch { return d; } }}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '3px groove hsl(var(--border-groove))',
                    borderRadius: 0,
                    ...FONT,
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Spend']}
                  labelFormatter={(label) => { try { return format(parseISO(label), 'MMM d, yyyy'); } catch { return label; } }}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (widget.id === 'model_table') {
      return (
        <div className="h-full flex flex-col overflow-auto">
          <div className="flex items-center gap-2 bg-card px-4" style={{ border: '3px groove hsl(var(--border-groove))', borderBottom: 'none', height: '52px', minHeight: '52px' }}>
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span style={FONT} className="font-medium text-foreground">{widget.title}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow style={{ height: '52px' }}>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-foreground">Model</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-right text-foreground">Requests</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-right text-foreground">Prompt Tokens</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-right text-foreground">Completion Tokens</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-right text-foreground">Reasoning Tokens</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, height: '52px' }} className="text-right text-foreground">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelUsage.map((m) => (
                <TableRow key={m.model} className="bg-card">
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="font-medium">{m.model}</TableCell>
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="text-right">{m.totalRequests.toLocaleString()}</TableCell>
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="text-right">{formatTokens(m.promptTokens)}</TableCell>
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="text-right">{formatTokens(m.completionTokens)}</TableCell>
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="text-right">{formatTokens(m.reasoningTokens)}</TableCell>
                  <TableCell style={TABLE_CELL_STYLE} className="text-right font-medium">{formatCurrency(m.totalCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (widget.id === 'daily_table') {
      return (
        <div className="h-full flex flex-col overflow-auto">
          <div className="flex items-center gap-2 bg-card px-4" style={{ border: '3px groove hsl(var(--border-groove))', borderBottom: 'none', height: '52px', minHeight: '52px' }}>
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span style={FONT} className="font-medium text-foreground">{widget.title}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow style={{ height: '52px' }}>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-foreground">Date</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, borderRight: '3px groove hsl(var(--border-groove))', height: '52px' }} className="text-right text-foreground">Requests</TableHead>
                <TableHead style={{ ...TABLE_CELL_STYLE, height: '52px' }} className="text-right text-foreground">Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...dailyUsage].reverse().map((d) => (
                <TableRow key={d.date} className="bg-card">
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }}>
                    {(() => { try { return format(parseISO(d.date), 'MMM d, yyyy'); } catch { return d.date; } })()}
                  </TableCell>
                  <TableCell style={{ ...TABLE_CELL_STYLE, borderRight: '1px solid hsl(var(--border-groove) / 0.3)' }} className="text-right">{d.requests.toLocaleString()}</TableCell>
                  <TableCell style={TABLE_CELL_STYLE} className="text-right font-medium">{formatCurrency(d.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      {error && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive">
          <span style={FONT} className="font-medium text-destructive">Error</span>
          <p className="mt-1" style={TABLE_CELL_STYLE}>{error}</p>
        </div>
      )}

      {activityError && (
        <div className="stat-cell flex items-start gap-2" style={{ margin: 0 }}>
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <span style={FONT} className="font-medium text-muted-foreground">Notice</span>
            <p className="mt-1 text-muted-foreground" style={TABLE_CELL_STYLE}>{activityError}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full min-w-0">
        {mounted && (
          <GridLayout
            width={width}
            layout={visibleLayout}
            gridConfig={{
              cols: COLS,
              rowHeight: ROW_HEIGHT,
              margin: GRID_MARGIN,
              containerPadding: [0, 0],
            }}
            dragConfig={{
              enabled: true,
              handle: '.grid-drag-handle',
              cancel: 'button, input, textarea, select, .recharts-wrapper',
            }}
            resizeConfig={{ enabled: false }}
            compactor={verticalCompactor}
            autoSize
            onDragStop={() => { isDraggingRef.current = true; }}
            onLayoutChange={handleLayoutChange}
            className="campaign-rgl-grid"
          >
            {visibleWidgets.map((widget) => (
              <div key={widget.id} className="grid-drag-handle cursor-grab active:cursor-grabbing">
                {renderWidgetContent(widget)}
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {loading && !credits && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          <span style={TABLE_CELL_STYLE}>Loading usage data from OpenRouter...</span>
        </div>
      )}

      {!loading && credits && !keyUsage && modelUsage.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No Activity Yet</h3>
            <p style={TABLE_CELL_STYLE} className="text-muted-foreground">
              No API usage recorded. Start using AI models to see activity here.
            </p>
          </CardContent>
        </Card>
      )}

      <SavingOverlay isVisible={resettingLayout} message="Resetting layout..." variant="fixed" />

      <DeleteConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset to Default Layout"
        description="Are you sure you want to reset the dashboard to its default layout? All customizations (reordering, renaming, deletions) will be lost."
        confirmLabel="Reset"
        confirmIcon={<RotateCcw className="w-4 h-4 mr-2" />}
        onConfirm={() => {
          setResetConfirmOpen(false);
          handleResetLayout();
        }}
      />
    </div>
  );
};

export default UsageCredits;
