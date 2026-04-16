import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Pencil, BarChart3, TrendingUp, Target, CalendarCheck, Users, Send,
  PieChart as PxPieChart, Activity, Zap, Star, Award, CircleDot
} from '@/components/icons';

// Static icon map: kebab-case name → pixel icon component
const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>> = {
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  'target': Target,
  'calendar-check': CalendarCheck,
  'users': Users,
  'send': Send,
  'pie-chart': PxPieChart,
  'activity': Activity,
  'zap': Zap,
  'star': Star,
  'award': Award,
  'circle-dot': CircleDot,
};

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
}

const DynamicIcon = ({ name, size = 16, className }: DynamicIconProps) => {
  const Icon = ICON_MAP[name] || BarChart3;
  return <Icon className={className} size={size} />;
};

export interface WidgetConfig {
  metric_ids: string[];
  metric_names: string[];
  colors: string[];
  icon?: string;
  time_range?: string;
  x_axis?: string;
  y_axis?: string;
}

export interface DashboardWidgetData {
  id: string;
  client_id: string | null;
  analytics_type: string;
  widget_type: string;
  title: string;
  width: string;
  config: WidgetConfig;
  sort_order: number;
  is_active: boolean;
}

interface DashboardWidgetRendererProps {
  widget: DashboardWidgetData;
  resolveValue: (name: string) => string | number | null | undefined;
  resolveTimeSeriesData?: (name: string) => Array<{ date: string; count: number }> | null;
  onEdit: () => void;
  isDragging?: boolean;
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 0,
  fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  color: 'hsl(var(--foreground))',
};

const formatNum = (n: number) => n.toLocaleString();

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateShort = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
};

export function DashboardWidgetRenderer({
  widget,
  resolveValue,
  resolveTimeSeriesData,
  onEdit,
  isDragging = false,
}: DashboardWidgetRendererProps) {
  const { config, widget_type, title } = widget;

  // For charts with x_axis=dates, merge all metrics into one dataset
  const multiSeriesData = useMemo(() => {
    const useDates = config.x_axis === 'dates';
    const isTimeSeriesChart = widget_type === 'line' || widget_type === 'bar_vertical' || widget_type === 'bar_horizontal';
    if (!isTimeSeriesChart || !useDates || !resolveTimeSeriesData) return null;

    const names = config.metric_names || [];
    if (names.length === 0) return null;

    // Collect per-metric series
    const seriesMap = new Map<string, Map<string, number>>(); // metricName -> (date -> count)
    const allDates = new Set<string>();
    let hasAny = false;

    for (const name of names) {
      const data = resolveTimeSeriesData(name);
      if (data && data.length > 0) {
        hasAny = true;
        const dateMap = new Map<string, number>();
        for (const d of data) {
          dateMap.set(d.date, d.count);
          allDates.add(d.date);
        }
        seriesMap.set(name, dateMap);
      }
    }

    if (!hasAny) return null;

    // Build merged rows sorted by date
    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map(date => {
      const row: Record<string, any> = { date };
      for (const name of names) {
        row[name] = seriesMap.get(name)?.get(date) ?? 0;
      }
      return row;
    });
  }, [widget_type, resolveTimeSeriesData, config.metric_names, config.x_axis]);
  
  // Build chart data from resolved metric values (for non-time-series charts)
  const chartData = (config.metric_names || []).map((name, i) => {
    const raw = resolveValue(name);
    const value = raw !== null && raw !== undefined ? Number(raw) : 0;
    return {
      name,
      value: isNaN(value) ? 0 : value,
      color: config.colors?.[i] || '#3b82f6',
    };
  });

  const renderChart = () => {
    if (chartData.length === 0 && !multiSeriesData) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No metrics configured
        </div>
      );
    }

    switch (widget_type) {
      case 'number_card': {
        // Simple number display
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            {chartData.map((entry, i) => (
              <div key={i} className="text-center">
                <div style={{ fontSize: '13px' }} className="text-muted-foreground uppercase tracking-wide mb-1">
                  {entry.name}
                </div>
                <div style={{ fontSize: '40px', fontFamily: "'VT323', monospace", color: entry.color }} className="font-light">
                  {formatNum(entry.value)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'doughnut': {
        // Calculate percentages for legend
        const total = chartData.reduce((sum, d) => sum + d.value, 0);
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="47%"
                innerRadius={75}
                outerRadius={110}
                dataKey="value"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => {
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                  return [`${formatNum(v)} (${pct}%)`, 'Value'];
                }}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', paddingTop: 0, marginTop: -8, color: 'hsl(var(--foreground))' }}
                formatter={(value: string) => {
                  const item = chartData.find(d => d.name === value);
                  if (item && total > 0) {
                    return `${value} (${((item.value / total) * 100).toFixed(0)}%)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'line': {
        const metricNames = config.metric_names || [];
        if (multiSeriesData && multiSeriesData.length > 0) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={formatDateShort}
                  formatter={(v: number, name: string) => [formatNum(v), name]}
                />
                {metricNames.length > 1 && (
                  <Legend
                    iconType="square"
                    wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }}
                  />
                )}
                {metricNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={config.colors?.[i] || '#3b82f6'}
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--background))' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }

        // Fallback: use metric values as data points
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartData[0]?.color || '#3b82f6'}
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--background))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case 'bar_vertical': {
        const metricNames = config.metric_names || [];
        if (multiSeriesData && multiSeriesData.length > 0) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDateShort} formatter={(v: number, name: string) => [formatNum(v), name]} />
                {metricNames.length > 1 && (
                  <Legend iconType="square" wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }} />
                )}
                {metricNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={config.colors?.[i] || '#3b82f6'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNum(v), 'Value']} />
              <Bar dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'bar_horizontal': {
        const metricNames = config.metric_names || [];
        if (multiSeriesData && multiSeriesData.length > 0) {
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiSeriesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  width={50}
                />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDateShort} formatter={(v: number, name: string) => [formatNum(v), name]} />
                {metricNames.length > 1 && (
                  <Legend iconType="square" wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'hsl(var(--foreground))' }} />
                )}
                {metricNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={config.colors?.[i] || '#3b82f6'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                width={60}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNum(v), 'Value']} />
              <Bar dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      default:
        return <div className="text-sm text-muted-foreground">Unknown widget type</div>;
    }
  };

  return (
    <div
      className={`bg-card ${isDragging ? 'shadow-lg ring-2 ring-primary/30 opacity-90' : ''}`}
      style={{ border: '3px groove hsl(var(--border-groove))' }}
    >
      <div className="p-4 flex items-center gap-2 relative group" style={{ borderBottom: '1px dashed hsl(var(--border))' }}>
        <DynamicIcon name={config.icon || 'bar-chart-3'} className="w-4 h-4 text-muted-foreground" />
        <span
          style={{ fontSize: '13px', textTransform: 'capitalize' }}
          className="font-medium text-muted-foreground tracking-wide flex-1"
        >
          {title}
        </span>
        <Button
          size="icon"
          className="ml-auto h-8 w-8 groove-btn bg-muted/50 text-foreground border-border hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit widget"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <div className={`${widget_type === 'number_card' ? 'h-[160px]' : 'h-[260px]'} flex items-center justify-center ${widget_type === 'doughnut' ? 'px-4 pt-4 pb-4' : 'p-4'}`}>
        {renderChart()}
      </div>
    </div>
  );
}
