import React from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDateShort = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
};

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface CampaignChartRendererProps {
  widgetType: string;
  chartData: any;
  color: string;
}

export function CampaignChartRenderer({ widgetType, chartData, color }: CampaignChartRendererProps) {
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>
        No data yet
      </div>
    );
  }

  switch (widgetType) {
    case 'line': {
      const points = Array.isArray(chartData) ? chartData : chartData.data_points || [];
      if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
      return (
        <div style={{ width: '100%', height: '100%', paddingTop: 24, paddingBottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 0, right: 0, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={40} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDateShort} formatter={(v: number) => [v.toLocaleString(), 'Count']} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--background))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'bar_vertical': {
      const points = Array.isArray(chartData) ? chartData : chartData.data_points || [];
      if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
      return (
        <div style={{ width: '100%', height: '100%', paddingTop: 24, paddingBottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 0, right: 0, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={40} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Count']} />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'bar_horizontal': {
      const points = Array.isArray(chartData) ? chartData : chartData.data_points || [];
      if (points.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data points</div>;
      return (
        <div style={{ width: 'calc(100% + 15px)', height: '100%', paddingTop: 24, paddingBottom: 0, marginLeft: -15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Count']} />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case 'doughnut': {
      const segments = Array.isArray(chartData) ? chartData : chartData.segments || [];
      if (segments.length === 0) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data</div>;
      const total = segments.reduce((s: number, d: any) => s + (d.value || 0), 0);
      return (
        <div className="flex items-center gap-4 h-full w-full px-2" style={{ paddingTop: 24, paddingBottom: 0 }}>
          <ResponsiveContainer width="60%" height="100%">
            <PieChart>
              <Pie data={segments} cx="50%" cy="50%" innerRadius={54} outerRadius={88} dataKey="value" stroke="hsl(var(--border))" strokeWidth={1}>
                {segments.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? color : DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v: number) => {
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                  return [`${v.toLocaleString()} (${pct}%)`, ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5">
            {segments.map((seg: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: i === 0 ? color : DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="text-muted-foreground truncate" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>
                  {seg.name}: {seg.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return <div className="text-sm text-muted-foreground">Unknown: {widgetType}</div>;
  }
}
