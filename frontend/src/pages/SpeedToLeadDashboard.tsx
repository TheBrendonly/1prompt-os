import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getContacts, computeStats, type ApproachStats, type DemoChannel } from '@/data/speedToLeadData';
import { format, parseISO } from 'date-fns';

const STAT_NUM: React.CSSProperties = { fontFamily: "'VT323', monospace", fontSize: '40px', lineHeight: 1.1 };
const LABEL: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' as const };
const SMALL_NUM: React.CSSProperties = { fontFamily: "'VT323', monospace", fontSize: '28px', lineHeight: 1.1 };

const CHART_COLORS = {
  leads: '#3b82f6',
  replies: '#22c55e',
  appointments: '#f59e0b',
  sms: '#6366f1',
  imessage: '#06b6d4',
  whatsapp: '#22c55e',
};

function StatsPanel({ stats, approach }: { stats: ApproachStats; approach: 'legacy' | 'enhanced' }) {
  const [chartRange, setChartRange] = useState('90');

  const filteredDaily = useMemo(() => {
    const days = parseInt(chartRange);
    return stats.dailyMetrics.slice(-days);
  }, [stats.dailyMetrics, chartRange]);

  // Aggregate daily data into weekly buckets for cleaner charts
  const weeklyData = useMemo(() => {
    const weeks: { week: string; leads: number; replies: number; appointments: number }[] = [];
    for (let i = 0; i < filteredDaily.length; i += 7) {
      const chunk = filteredDaily.slice(i, i + 7);
      const weekLabel = format(parseISO(chunk[0].date), 'MMM d');
      weeks.push({
        week: weekLabel,
        leads: chunk.reduce((s, d) => s + d.leads, 0),
        replies: chunk.reduce((s, d) => s + d.replies, 0),
        appointments: chunk.reduce((s, d) => s + d.appointments, 0),
      });
    }
    return weeks;
  }, [filteredDaily]);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="stat-row">
        <div className="stat-cell">
          <p style={LABEL} className="text-muted-foreground mb-2">Total Leads</p>
          <p style={STAT_NUM} className="text-foreground">{stats.totalLeads.toLocaleString()}</p>
        </div>
        <div className="stat-cell">
          <p style={LABEL} className="text-muted-foreground mb-2">Reply Rate</p>
          <p style={STAT_NUM} className="text-foreground">{stats.overallReplyRate}%</p>
        </div>
        <div className="stat-cell">
          <p style={LABEL} className="text-muted-foreground mb-2">Speed to Lead</p>
          <p style={STAT_NUM} className="text-foreground">{stats.avgSpeedToLead}s</p>
        </div>
        <div className="stat-cell">
          <p style={LABEL} className="text-muted-foreground mb-2">Conversations</p>
          <p style={STAT_NUM} className="text-foreground">{stats.conversationsStarted}</p>
        </div>
        <div className="stat-cell">
          <p style={LABEL} className="text-muted-foreground mb-2">Appointments</p>
          <p style={STAT_NUM} className="text-foreground">{stats.appointmentsBooked}</p>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {stats.channelStats.map(ch => (
          <Card key={ch.channel}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[ch.channel] }} />
                {ch.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p style={LABEL} className="text-muted-foreground">Reply Rate</p>
                  <p style={SMALL_NUM} className="text-foreground">{ch.replyRate}%</p>
                </div>
                <div className="text-right">
                  <p style={LABEL} className="text-muted-foreground">Leads</p>
                  <p style={SMALL_NUM} className="text-foreground">{ch.totalLeads}</p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p style={LABEL} className="text-muted-foreground">Replies</p>
                  <p style={SMALL_NUM} className="text-foreground">{ch.replies}</p>
                </div>
                <div className="text-right">
                  <p style={LABEL} className="text-muted-foreground">Appointments</p>
                  <p style={SMALL_NUM} className="text-foreground">{ch.appointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Performance Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>Weekly Performance</CardTitle>
          <Select value={chartRange} onValueChange={setChartRange}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(226 28% 16%)', border: '1px solid hsl(224 20% 25%)', borderRadius: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend wrapperStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }} />
                <Bar dataKey="leads" fill={CHART_COLORS.leads} name="Leads" radius={[2, 2, 0, 0]} />
                <Bar dataKey="replies" fill={CHART_COLORS.replies} name="Replies" radius={[2, 2, 0, 0]} />
                <Bar dataKey="appointments" fill={CHART_COLORS.appointments} name="Appointments" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reply Rate by Channel Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>Reply Rate by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.channelStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis type="number" domain={[0, 50]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(226 28% 16%)', border: '1px solid hsl(224 20% 25%)', borderRadius: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(value: number) => [`${value}%`, 'Reply Rate']}
                />
                <Bar dataKey="replyRate" fill={approach === 'legacy' ? '#94a3b8' : '#22c55e'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SpeedToLeadDashboard() {
  const contacts = useMemo(() => getContacts(), []);
  const legacyStats = useMemo(() => computeStats(contacts, 'legacy'), [contacts]);
  const enhancedStats = useMemo(() => computeStats(contacts, 'enhanced'), [contacts]);
  const [tab, setTab] = useState('enhanced');

  const tabStyle = { height: '34px', fontFamily: "'VT323', monospace", fontSize: '16px' };

  // Compute improvement percentages
  const improvements = useMemo(() => {
    const channels: DemoChannel[] = ['sms', 'imessage', 'whatsapp'];
    return channels.map(ch => {
      const legacy = legacyStats.channelStats.find(c => c.channel === ch)!;
      const enhanced = enhancedStats.channelStats.find(c => c.channel === ch)!;
      const diff = legacy.replyRate > 0 ? Math.round(((enhanced.replyRate - legacy.replyRate) / legacy.replyRate) * 100) : 0;
      return { channel: ch, label: enhanced.label, legacy: legacy.replyRate, enhanced: enhanced.replyRate, improvement: diff };
    });
  }, [legacyStats, enhancedStats]);

  return (
    <div className="space-y-6 pb-6">
      {/* Improvement Banner */}
      <Card className="!bg-accent/30">
        <CardContent className="py-4">
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }} className="text-foreground mb-3">CHANNEL IMPROVEMENT (ENHANCED vs LEGACY)</p>
          <div className="grid grid-cols-3 gap-4">
            {improvements.map(imp => (
              <div key={imp.channel} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[imp.channel] }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-muted-foreground">{imp.label}</span>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '24px' }} className="text-green-400 ml-auto">+{imp.improvement}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approach Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full" style={{ height: '38px' }}>
          <TabsTrigger value="enhanced" className="flex-1 uppercase" style={tabStyle}>Enhanced Approach</TabsTrigger>
          <TabsTrigger value="legacy" className="flex-1 uppercase" style={tabStyle}>Legacy Approach</TabsTrigger>
        </TabsList>
        <TabsContent value="enhanced" className="mt-6">
          <StatsPanel stats={enhancedStats} approach="enhanced" />
        </TabsContent>
        <TabsContent value="legacy" className="mt-6">
          <StatsPanel stats={legacyStats} approach="legacy" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
