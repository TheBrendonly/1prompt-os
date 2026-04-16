import React from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Maximize2, Minimize2 } from '@/components/icons';
import ReactMarkdown from 'react-markdown';
import { useCreatorMode } from '@/hooks/useCreatorMode';
const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 0,
  fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  color: 'hsl(var(--foreground))',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDateShort = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
};

export interface V2WidgetData {
  id: string;
  title: string;
  widget_type: string;
  width?: string;
  config: {
    prompt: string;
    color: string;
    chart_data?: any;
    last_processed?: string;
    model_used?: string;
    error?: string;
  };
}

interface V2WidgetRendererProps {
  widget: V2WidgetData;
  isProcessing?: boolean;
  onDelete: () => void;
  onToggleWidth?: () => void;
}

export function V2WidgetRenderer({ widget, isProcessing, onDelete, onToggleWidth }: V2WidgetRendererProps) {
  const { cb, cbHeavy } = useCreatorMode();
  const { config, widget_type, title } = widget;
  const chartData = config.chart_data;
  const color = config.color || '#3b82f6';

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>Processing...</span>
        </div>
      );
    }

    if (config.error && !chartData) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-destructive px-4 text-center">
          {config.error}
        </div>
      );
    }

    if (!chartData) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground px-4 text-center">
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>
            No data yet. Select a date range and click REFRESH.
          </span>
        </div>
      );
    }

    switch (widget_type) {
      case 'number_card': {
        const value = chartData.value ?? 0;
        const label = chartData.label || '';
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }} className="text-muted-foreground uppercase tracking-wider">
              {label}
            </div>
            <div style={{ fontSize: '48px', fontFamily: "'VT323', monospace", color }} className={`font-light leading-none ${cbHeavy}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
        );
      }

      case 'line': {
        const points = chartData.data_points || [];
        if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDateShort} formatter={(v: number) => [v.toLocaleString(), 'Value']} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--background))' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case 'bar_vertical': {
        const points = chartData.data_points || [];
        if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={points[0]?.date ? 'date' : 'name'} tickFormatter={points[0]?.date ? formatDateShort : undefined} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Value']} />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'bar_horizontal': {
        const points = chartData.data_points || [];
        if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Value']} />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'doughnut': {
        const segments = chartData.segments || [];
        if (segments.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data</div>;
        const total = segments.reduce((s: number, d: any) => s + (d.value || 0), 0);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={segments} cx="50%" cy="47%" innerRadius={50} outerRadius={80} dataKey="value" stroke="hsl(var(--border))" strokeWidth={1}>
                {segments.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? color : colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => {
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                  return [`${v.toLocaleString()} (${pct}%)`, 'Value'];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'text': {
        const content = chartData.content || '';
        return (
          <div className="h-full overflow-auto px-4 py-2 prose prose-sm prose-invert max-w-none" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
      }

      default:
        return <div className="text-sm text-muted-foreground">Unknown widget type: {widget_type}</div>;
    }
  };

  const heightClass = widget_type === 'number_card' ? 'h-[160px]' : widget_type === 'text' ? 'h-[360px]' : 'h-[340px]';
  const isFullWidth = widget.width === 'full';

  return (
    <div className="bg-card" style={{ border: '3px groove hsl(var(--border-groove))' }}>
      <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px dashed hsl(var(--border))' }}>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span
          style={{ fontSize: '13px', textTransform: 'capitalize', fontFamily: "'IBM Plex Mono', monospace" }}
          className="font-medium text-muted-foreground tracking-wide flex-1 truncate"
        >
          {title}
        </span>
        {onToggleWidth && (
          <Button
            size="icon"
            className="h-7 w-7 groove-btn bg-muted/50 text-foreground border-border hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); onToggleWidth(); }}
            title={isFullWidth ? 'Half width' : 'Full width'}
          >
            {isFullWidth ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          size="icon"
          className="h-7 w-7 groove-btn bg-muted/50 text-foreground border-border hover:bg-destructive/20 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete metric"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className={`${heightClass} flex items-center justify-center p-4`}>
        {renderContent()}
      </div>
      {config.last_processed && (
        <div className="px-4 pb-2 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>
          <span className="text-muted-foreground">Last: {new Date(config.last_processed).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
