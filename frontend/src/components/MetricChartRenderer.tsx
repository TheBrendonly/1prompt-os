import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${MONTH_NAMES[monthIdx]} ${parseInt(parts[2], 10)}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 0,
  fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  color: '#ffffff',
};
const tooltipItemStyle = { color: '#ffffff' };
const tooltipLabelStyle = { color: '#94a3b8' };

// Bright, high-contrast colors for chart elements on dark backgrounds
const CHART_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export interface WebhookChartData {
  data_points?: Array<{ date?: string; name?: string; value: number }>;
  segments?: Array<{ name: string; value: number }>;
  content?: string;
  value?: number | string;
  label?: string;
}

interface MetricChartRendererProps {
  widgetType: string;
  data: Array<{ date: string; count: number }>;
  color: string;
  value?: string | number | null | undefined;
  webhookChartData?: WebhookChartData | null;
}

export function MetricChartRenderer({ widgetType, data, color, value, webhookChartData }: MetricChartRendererProps) {
  const chartHeight = 200;

  // Convert webhook data_points to chart-compatible format
  const resolvedData = useMemo(() => {
    if (webhookChartData?.data_points && webhookChartData.data_points.length > 0) {
      return webhookChartData.data_points.map(dp => ({
        date: dp.date || dp.name || '',
        count: dp.value,
      }));
    }
    return data;
  }, [webhookChartData, data]);

  // Ensure color is bright and visible — fallback to palette blue if color is too dark or empty
  const safeColor = useMemo(() => {
    if (!color || color === '#000000' || color === '#000' || color === 'black') return CHART_PALETTE[0];
    return color;
  }, [color]);
  const resolvedSegments = useMemo(() => {
    if (webhookChartData?.segments && webhookChartData.segments.length > 0) {
      return webhookChartData.segments;
    }
    return null;
  }, [webhookChartData]);

  // Horizontal bar data
  const horizontalData = useMemo(() => {
    if (webhookChartData?.data_points && webhookChartData.data_points.length > 0) {
      const named = webhookChartData.data_points.filter(dp => dp.name);
      if (named.length > 0) {
        return named.map(dp => ({ name: dp.name!, count: dp.value })).sort((a, b) => b.count - a.count).slice(0, 8);
      }
    }
    return [...resolvedData].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [webhookChartData, resolvedData]);

  const axisTickStyle = { fontSize: 10, fill: '#94a3b8' }; // slate-400 — bright on dark bg
  const gridStroke = 'rgba(148, 163, 184, 0.15)'; // subtle but visible grid

  if (widgetType === 'line') {
    if (resolvedData.length === 0) return <div className="flex items-center justify-center text-muted-foreground" style={{ height: chartHeight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>No data points</div>;
    return (
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={resolvedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={axisTickStyle} interval="preserveStartEnd" />
            <YAxis tick={axisTickStyle} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} labelFormatter={formatDateLabel} />
            <Line type="monotone" dataKey="count" stroke={safeColor} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: safeColor, stroke: '#fff', strokeWidth: 1 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widgetType === 'bar_vertical') {
    if (resolvedData.length === 0) return <div className="flex items-center justify-center text-muted-foreground" style={{ height: chartHeight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>No data points</div>;
    return (
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={resolvedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={axisTickStyle} interval="preserveStartEnd" />
            <YAxis tick={axisTickStyle} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} labelFormatter={formatDateLabel} />
            <Bar dataKey="count" fill={safeColor} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widgetType === 'bar_horizontal') {
    if (horizontalData.length === 0) return <div className="flex items-center justify-center text-muted-foreground" style={{ height: chartHeight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>No data points</div>;
    const hasNameKey = horizontalData[0] && 'name' in horizontalData[0];
    return (
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={horizontalData} layout="vertical" margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis type="number" tick={axisTickStyle} allowDecimals={false} />
            <YAxis type="category" dataKey={hasNameKey ? 'name' : 'date'} tickFormatter={hasNameKey ? undefined : formatDateLabel} tick={axisTickStyle} width={50} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
            <Bar dataKey="count" fill={safeColor} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widgetType === 'doughnut') {
    if (resolvedSegments && resolvedSegments.length > 0) {
      const total = resolvedSegments.reduce((sum, s) => sum + s.value, 0);
      return (
        <div className="flex items-center gap-4">
          <div style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resolvedSegments} innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                  {resolvedSegments.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => {
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                  return [`${v.toLocaleString()} (${pct}%)`, 'Value'];
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontFamily: "'VT323', monospace", lineHeight: 1 }}>{total}</div>
            <div className="text-muted-foreground" style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>{resolvedSegments.length} segments</div>
          </div>
        </div>
      );
    }
    // Fallback: old behavior
    const total = resolvedData.reduce((sum, d) => sum + d.count, 0);
    const numericValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseInt(value, 10) : 0);
    const matchCount = isNaN(numericValue) ? total : numericValue;
    const remaining = Math.max(0, total - matchCount);
    const pieData = [{ name: 'Match', value: matchCount }, { name: 'Other', value: remaining }];
    const PIE_COLORS = [safeColor, 'hsl(var(--muted))'];
    return (
      <div className="flex items-center gap-4">
          <div style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div style={{ fontSize: '32px', fontFamily: "'VT323', monospace", lineHeight: 1 }}>{matchCount}</div>
          <div className="text-muted-foreground" style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>of {total} total</div>
        </div>
      </div>
    );
  }

  if (widgetType === 'text') {
    const textContent = webhookChartData?.content;
    return (
      <div className="text-sm text-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
        {textContent ? (
          <div className="overflow-auto max-h-[140px] text-muted-foreground leading-relaxed">{textContent}</div>
        ) : (
          <>
            <div style={{ fontSize: '28px', fontFamily: "'VT323', monospace", lineHeight: 1, marginBottom: '8px' }}>
              {value !== undefined && value !== null ? String(value) : 'N/A'}
            </div>
            <div className="text-muted-foreground">{resolvedData.length} data points tracked</div>
          </>
        )}
      </div>
    );
  }

  // Fallback: number display
  return (
    <div style={{ fontSize: '40px', fontFamily: "'VT323', monospace", lineHeight: 1 }} className="font-light">
      {value !== undefined && value !== null ? String(value) : 'N/A'}
    </div>
  );
}