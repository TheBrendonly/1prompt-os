import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ── Mock analytics data ──

const MOCK_METRICS = [
  { name: 'Total Conversations', value: 1284, color: '#3b82f6', change: '+12%' },
  { name: 'New Users', value: 347, color: '#22c55e', change: '+8%' },
  { name: 'Bot Messages', value: 4821, color: '#f59e0b', change: '+15%' },
  { name: 'User Questions', value: 2103, color: '#8b5cf6', change: '+5%' },
  { name: 'Thank You Count', value: 89, color: '#ef4444', change: '-3%' },
  { name: 'Bookings', value: 156, color: '#06b6d4', change: '+22%' },
];

const MOCK_DATES = ['Mar 1', 'Mar 2', 'Mar 3', 'Mar 4', 'Mar 5', 'Mar 6', 'Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11', 'Mar 12', 'Mar 13', 'Mar 14'];
const MOCK_SERIES: Record<string, number[]> = {
  'Total Conversations': [42, 38, 55, 67, 89, 72, 95, 88, 102, 78, 110, 125, 98, 115],
  'New Users': [12, 8, 15, 22, 28, 18, 32, 25, 35, 20, 38, 42, 30, 22],
  'Bot Messages': [150, 132, 198, 245, 312, 256, 340, 298, 365, 278, 390, 420, 350, 287],
  'Bookings': [5, 3, 8, 12, 15, 10, 18, 14, 20, 11, 22, 25, 16, 7],
};

const DATE_RANGES = ['7d', '14d', '30d', 'Custom'];

// ── Shared mini components ──

const MiniDatePicker: React.FC<{ selected: string; onSelect: (d: string) => void }> = ({ selected, onSelect }) => (
  <div className="flex gap-0">
    {DATE_RANGES.map(d => (
      <button
        key={d}
        onClick={() => onSelect(d)}
        className={cn(
          'px-2 py-1 text-center transition-all',
          selected === d ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-muted'
        )}
        style={{ fontFamily: "'VT323', monospace", fontSize: '13px', letterSpacing: '1px', border: '1px groove hsl(var(--border))' }}
      >
        {d.toUpperCase()}
      </button>
    ))}
  </div>
);

const RetroLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('text-muted-foreground', className)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
    {children}
  </span>
);

// ── CONCEPT 1: CRT Monitor Dashboard ──
// Metrics displayed as phosphor-green readouts on a CRT-style monitor

const CRTDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const [selectedMetric, setSelectedMetric] = useState(0);
  const m = MOCK_METRICS[selectedMetric];
  const series = MOCK_SERIES[m.name] || MOCK_SERIES['Total Conversations'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#22c55e', letterSpacing: '2px' }}>CRT MONITOR</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      {/* CRT Screen */}
      <div className="relative overflow-hidden" style={{ background: '#0a0f0a', border: '4px ridge #333', borderRadius: '8px', padding: '20px' }}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 3px)', zIndex: 2 }} />
        {/* Screen curvature vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)', zIndex: 3 }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#22c55e80' }}>SYSTEM STATUS: ONLINE</span>
          </div>

          {/* Metric readouts */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {MOCK_METRICS.slice(0, 6).map((met, i) => (
              <button
                key={met.name}
                onClick={() => setSelectedMetric(i)}
                className="text-left p-2 transition-all"
                style={{
                  border: `1px solid ${i === selectedMetric ? '#22c55e' : '#22c55e33'}`,
                  background: i === selectedMetric ? '#22c55e11' : 'transparent',
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#22c55e80', textTransform: 'uppercase' }}>
                  {met.name}
                </div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: '28px', color: '#22c55e', textShadow: '0 0 8px #22c55e66' }}>
                  {met.value.toLocaleString()}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: met.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>
                  {met.change}
                </div>
              </button>
            ))}
          </div>

          {/* ASCII chart */}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#22c55e', lineHeight: '12px' }}>
            <div style={{ color: '#22c55e80', marginBottom: '4px' }}>▸ {m.name.toUpperCase()} — 14 DAY TREND</div>
            <div className="flex items-end gap-[2px]" style={{ height: '60px' }}>
              {series.map((v, i) => {
                const max = Math.max(...series);
                const h = (v / max) * 56;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div style={{ width: '100%', height: `${h}px`, background: '#22c55e', opacity: i === series.length - 1 ? 1 : 0.6, boxShadow: i === series.length - 1 ? '0 0 8px #22c55e66' : 'none' }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1" style={{ color: '#22c55e44', fontSize: '8px' }}>
              <span>MAR 1</span><span>MAR 14</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 2: Oscilloscope ──
// Waveform-style line chart with retro oscilloscope styling

const OscilloscopeDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const [activeMetrics, setActiveMetrics] = useState<Set<number>>(new Set([0, 2]));
  const toggleMetric = (i: number) => {
    const next = new Set(activeMetrics);
    if (next.has(i)) next.delete(i); else next.add(i);
    setActiveMetrics(next);
  };

  const gridSize = 20;
  const w = 360;
  const h = 140;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#06b6d4', letterSpacing: '2px' }}>OSCILLOSCOPE</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      {/* Scope screen */}
      <div style={{ background: '#050d14', border: '3px groove #1e3a4a', padding: '16px' }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
          {/* Grid */}
          {Array.from({ length: Math.floor(w / gridSize) + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={h} stroke="#0e2a3a" strokeWidth="0.5" />
          ))}
          {Array.from({ length: Math.floor(h / gridSize) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * gridSize} x2={w} y2={i * gridSize} stroke="#0e2a3a" strokeWidth="0.5" />
          ))}
          {/* Center crosshair */}
          <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#0e2a3a" strokeWidth="1" />
          <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#0e2a3a" strokeWidth="1" />

          {/* Waveforms */}
          {Array.from(activeMetrics).map(mi => {
            const met = MOCK_METRICS[mi];
            const series = MOCK_SERIES[met.name] || MOCK_SERIES['Total Conversations'];
            const max = Math.max(...series) * 1.1;
            const points = series.map((v, i) => {
              const x = (i / (series.length - 1)) * w;
              const y = h - (v / max) * h;
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={mi}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={met.color}
                  strokeWidth="2"
                  style={{ filter: `drop-shadow(0 0 4px ${met.color})` }}
                />
                {/* Glow duplicate */}
                <polyline points={points} fill="none" stroke={met.color} strokeWidth="4" opacity="0.15" />
              </g>
            );
          })}
        </svg>

        {/* Channel selectors */}
        <div className="flex gap-2 mt-3">
          {MOCK_METRICS.slice(0, 4).map((met, i) => (
            <button
              key={i}
              onClick={() => toggleMetric(i)}
              className="flex-1 py-1 text-center transition-all"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: activeMetrics.has(i) ? met.color : '#ffffff33',
                border: `1px solid ${activeMetrics.has(i) ? met.color : '#ffffff1a'}`,
                background: activeMetrics.has(i) ? `${met.color}11` : 'transparent',
                textShadow: activeMetrics.has(i) ? `0 0 6px ${met.color}66` : 'none',
              }}
            >
              CH{i + 1}: {met.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Readout values */}
      <div className="grid grid-cols-3 gap-2">
        {MOCK_METRICS.slice(0, 6).map((met) => (
          <div key={met.name} className="p-2" style={{ background: '#050d14', border: '1px solid #1e3a4a' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#06b6d480', textTransform: 'uppercase' }}>{met.name}</div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '24px', color: met.color, textShadow: `0 0 6px ${met.color}44` }}>{met.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── CONCEPT 3: Punch Card ──
// IBM punch card inspired metric display

const PunchCardDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const series = MOCK_SERIES['Total Conversations'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#f59e0b', letterSpacing: '2px' }}>PUNCH CARD</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      {/* Punch card */}
      <div style={{ background: '#fef3c7', border: '2px solid #92400e', padding: '16px', position: 'relative' }}>
        {/* Corner notch */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', background: 'linear-gradient(135deg, transparent 50%, #0a0a0a 50%)' }} />

        {/* Header row */}
        <div className="flex items-center justify-between mb-3" style={{ borderBottom: '2px solid #92400e', paddingBottom: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>ANALYTICS REPORT CARD</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#92400e99' }}>MAR 1 — MAR 14, 2026</span>
        </div>

        {/* Metric rows as punch holes */}
        <div className="space-y-2">
          {MOCK_METRICS.map((met) => (
            <div key={met.name} className="flex items-center gap-3">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#92400e', width: '110px', flexShrink: 0, textTransform: 'uppercase' }}>
                {met.name}
              </span>
              {/* Punched holes representing value magnitude */}
              <div className="flex gap-1 flex-1">
                {Array.from({ length: 20 }).map((_, i) => {
                  const filled = i < Math.round((met.value / Math.max(...MOCK_METRICS.map(m => m.value))) * 20);
                  return (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        height: '10px',
                        background: filled ? '#92400e' : '#92400e22',
                        borderRadius: '1px',
                      }}
                    />
                  );
                })}
              </div>
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#92400e', width: '60px', textAlign: 'right' }}>
                {met.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom row: daily data as tiny punch grid */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px dashed #92400e66' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#92400e88', marginBottom: '6px' }}>DAILY ACTIVITY PUNCH PATTERN</div>
          <div className="flex gap-[2px]">
            {series.map((v, i) => {
              const max = Math.max(...series);
              const intensity = v / max;
              return (
                <div key={i} className="flex-1 flex flex-col gap-[2px]">
                  {Array.from({ length: 5 }).map((_, r) => (
                    <div
                      key={r}
                      style={{
                        height: '6px',
                        background: r / 5 < intensity ? '#92400e' : '#92400e15',
                        borderRadius: '50%',
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 4: VU Meter ──
// Audio VU meter style with needle gauges for each metric

const VUMeterDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#ef4444', letterSpacing: '2px' }}>VU METER</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#1a1a1a', border: '3px groove #444', padding: '16px' }}>
        <div className="grid grid-cols-3 gap-3">
          {MOCK_METRICS.map((met) => {
            const pct = met.value / Math.max(...MOCK_METRICS.map(m => m.value));
            const angle = -45 + pct * 90; // -45 to +45 degrees

            return (
              <div key={met.name} className="text-center">
                {/* VU meter face */}
                <div className="relative mx-auto" style={{ width: '100px', height: '60px', overflow: 'hidden' }}>
                  <svg width="100" height="60" viewBox="0 0 100 60">
                    {/* Meter arc */}
                    <path d="M 10 55 A 45 45 0 0 1 90 55" fill="none" stroke="#333" strokeWidth="2" />
                    {/* Colored zone */}
                    <path d="M 10 55 A 45 45 0 0 1 90 55" fill="none" stroke={met.color} strokeWidth="2" opacity="0.3" />
                    {/* Scale marks */}
                    {Array.from({ length: 11 }).map((_, i) => {
                      const a = (-90 + i * 18) * (Math.PI / 180);
                      const x1 = 50 + Math.cos(a) * 38;
                      const y1 = 55 + Math.sin(a) * 38;
                      const x2 = 50 + Math.cos(a) * 42;
                      const y2 = 55 + Math.sin(a) * 42;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="1" />;
                    })}
                    {/* Needle */}
                    <line
                      x1="50"
                      y1="55"
                      x2={50 + Math.cos((angle - 90) * (Math.PI / 180)) * 36}
                      y2={55 + Math.sin((angle - 90) * (Math.PI / 180)) * 36}
                      stroke={met.color}
                      strokeWidth="1.5"
                      style={{ filter: `drop-shadow(0 0 3px ${met.color})` }}
                    />
                    {/* Center dot */}
                    <circle cx="50" cy="55" r="3" fill={met.color} />
                  </svg>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#888', textTransform: 'uppercase', marginTop: '4px' }}>{met.name}</div>
                <div style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: met.color }}>{met.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 5: Dot Matrix Printer ──
// Metrics displayed as dot-matrix printed receipt

const DotMatrixDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '2px' }}>DOT MATRIX</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#fafaf5', border: '1px solid #ddd', padding: '20px', fontFamily: "'IBM Plex Mono', monospace", color: '#1a1a1a' }}>
        {/* Perforated edge */}
        <div className="flex gap-[6px] mb-4" style={{ marginTop: '-12px' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e5e5dc' }} />
          ))}
        </div>

        <div style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center', letterSpacing: '4px', textTransform: 'uppercase' }}>
          ═══ ANALYTICS REPORT ═══
        </div>
        <div style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginTop: '4px' }}>
          GENERATED: MAR 14, 2026 11:25 PM
        </div>

        <div style={{ borderTop: '1px dashed #999', margin: '12px 0' }} />

        {MOCK_METRICS.map((met) => (
          <div key={met.name} className="flex justify-between py-1" style={{ fontSize: '11px' }}>
            <span style={{ textTransform: 'uppercase' }}>{met.name}</span>
            <span style={{ letterSpacing: '2px' }}>{'.' .repeat(Math.max(1, 30 - met.name.length))}</span>
            <span style={{ fontWeight: 700, minWidth: '50px', textAlign: 'right' }}>{met.value.toLocaleString()}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #999', margin: '12px 0' }} />

        {/* Mini bar chart in ASCII */}
        <div style={{ fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '2px' }}>DAILY TREND</div>
        {(MOCK_SERIES['Total Conversations']).map((v, i) => {
          const max = Math.max(...MOCK_SERIES['Total Conversations']);
          const bars = Math.round((v / max) * 30);
          return (
            <div key={i} className="flex items-center gap-2" style={{ fontSize: '9px', lineHeight: '12px' }}>
              <span style={{ width: '36px', color: '#888' }}>{MOCK_DATES[i]}</span>
              <span style={{ color: '#1a1a1a' }}>{'█'.repeat(bars)}{'░'.repeat(30 - bars)}</span>
              <span style={{ color: '#666', minWidth: '24px', textAlign: 'right' }}>{v}</span>
            </div>
          );
        })}

        {/* Perforated edge bottom */}
        <div className="flex gap-[6px] mt-4" style={{ marginBottom: '-12px' }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e5e5dc' }} />
          ))}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 6: Mission Control ──
// NASA-style mission control with data panels

const MissionControlDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#3b82f6', letterSpacing: '2px' }}>MISSION CONTROL</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#0a0e1a', border: '2px solid #1e3a5a', padding: '16px' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid #1e3a5a' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#3b82f680', textTransform: 'uppercase', letterSpacing: '2px' }}>SYSTEMS NOMINAL</span>
          </div>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#3b82f640' }}>T+{String(Math.floor(tick / 60)).padStart(2, '0')}:{String(tick % 60).padStart(2, '0')}</span>
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-2 gap-2">
          {MOCK_METRICS.slice(0, 4).map((met) => (
            <div key={met.name} style={{ border: `1px solid ${met.color}33`, background: `${met.color}08`, padding: '10px' }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: `${met.color}99`, textTransform: 'uppercase' }}>
                  {met.name}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: met.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>
                  {met.change}
                </span>
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '32px', color: met.color, lineHeight: 1, textShadow: `0 0 10px ${met.color}33` }}>
                {met.value.toLocaleString()}
              </div>
              {/* Mini sparkline */}
              <div className="flex items-end gap-[1px] mt-2" style={{ height: '20px' }}>
                {(MOCK_SERIES[met.name] || MOCK_SERIES['Total Conversations']).map((v, i, arr) => {
                  const max = Math.max(...arr);
                  return <div key={i} className="flex-1" style={{ height: `${(v / max) * 100}%`, background: met.color, opacity: 0.5 }} />;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom metrics strip */}
        <div className="flex gap-2 mt-2">
          {MOCK_METRICS.slice(4).map((met) => (
            <div key={met.name} className="flex-1 text-center py-2" style={{ border: '1px solid #1e3a5a', background: '#0f1525' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: '#ffffff44', textTransform: 'uppercase' }}>{met.name}</div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: met.color }}>{met.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 7: Nixie Tube ──
// Warm glowing nixie tube number display

const NixieTubeDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');

  const NixieDigit: React.FC<{ char: string; color: string }> = ({ char, color }) => (
    <span
      style={{
        fontFamily: "'VT323', monospace",
        fontSize: '36px',
        color,
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}66, 0 0 30px ${color}33`,
        display: 'inline-block',
        width: '22px',
        textAlign: 'center',
      }}
    >
      {char}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#f97316', letterSpacing: '2px' }}>NIXIE TUBE</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#1a1008', border: '3px groove #3d2b0a', padding: '20px' }}>
        <div className="space-y-4">
          {MOCK_METRICS.map((met) => {
            const digits = met.value.toLocaleString().split('');
            return (
              <div key={met.name} className="flex items-center justify-between" style={{ borderBottom: '1px solid #3d2b0a44' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#f9731666', textTransform: 'uppercase', width: '120px', letterSpacing: '1px' }}>
                  {met.name}
                </span>
                <div className="flex gap-[2px] py-2">
                  {digits.map((ch, i) => (
                    <NixieDigit key={i} char={ch} color="#f97316" />
                  ))}
                </div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: met.change.startsWith('+') ? '#22c55e' : '#ef4444', width: '40px', textAlign: 'right' }}>
                  {met.change}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 8: Flight Instruments ──
// Aircraft cockpit gauges

const FlightInstrumentsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#22c55e', letterSpacing: '2px' }}>FLIGHT DECK</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#111', border: '3px groove #333', padding: '16px' }}>
        <div className="grid grid-cols-3 gap-3">
          {MOCK_METRICS.map((met) => {
            const pct = met.value / Math.max(...MOCK_METRICS.map(m => m.value));
            return (
              <div key={met.name} className="flex flex-col items-center">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  {/* Outer ring */}
                  <circle cx="45" cy="45" r="40" fill="none" stroke="#2a2a2a" strokeWidth="3" />
                  {/* Progress arc */}
                  <circle
                    cx="45" cy="45" r="40"
                    fill="none"
                    stroke={met.color}
                    strokeWidth="3"
                    strokeDasharray={`${pct * 251.3} 251.3`}
                    transform="rotate(-90 45 45)"
                    style={{ filter: `drop-shadow(0 0 4px ${met.color}66)` }}
                  />
                  {/* Inner face */}
                  <circle cx="45" cy="45" r="30" fill="#0a0a0a" stroke="#222" strokeWidth="1" />
                  {/* Value */}
                  <text x="45" y="42" textAnchor="middle" dominantBaseline="middle" fill={met.color} style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                    {met.value > 999 ? `${(met.value / 1000).toFixed(1)}k` : met.value}
                  </text>
                  {/* Label */}
                  <text x="45" y="56" textAnchor="middle" fill="#666" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '6px', textTransform: 'uppercase' }}>
                    {met.name.split(' ').slice(0, 2).join(' ')}
                  </text>
                  {/* Tick marks */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i * 30 - 90) * (Math.PI / 180);
                    return (
                      <line key={i} x1={45 + Math.cos(a) * 35} y1={45 + Math.sin(a) * 35} x2={45 + Math.cos(a) * 38} y2={45 + Math.sin(a) * 38} stroke="#444" strokeWidth="1" />
                    );
                  })}
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 9: Tape Reel ──
// Magnetic tape data storage with reel-to-reel visuals

const TapeReelDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const series = MOCK_SERIES['Total Conversations'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#8b5cf6', letterSpacing: '2px' }}>TAPE REEL</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#12101c', border: '3px groove #2d2640', padding: '16px' }}>
        {/* Reel visualization */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#3d3555" strokeWidth="2" />
            <circle cx="40" cy="40" r="25" fill="none" stroke="#3d3555" strokeWidth="8" />
            <circle cx="40" cy="40" r="8" fill="#2d2640" stroke="#8b5cf6" strokeWidth="1.5" />
            {[0, 120, 240].map(deg => (
              <line key={deg} x1="40" y1="40" x2={40 + Math.cos(deg * Math.PI / 180) * 24} y2={40 + Math.sin(deg * Math.PI / 180) * 24} stroke="#3d3555" strokeWidth="2" />
            ))}
          </svg>

          {/* Tape path */}
          <div className="flex-1" style={{ height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #8b5cf633)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: '#8b5cf666', whiteSpace: 'nowrap' }}>
              ◄ DATA STREAM ►
            </div>
          </div>

          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#3d3555" strokeWidth="2" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="#3d3555" strokeWidth="3" />
            <circle cx="40" cy="40" r="8" fill="#2d2640" stroke="#8b5cf6" strokeWidth="1.5" />
            {[0, 120, 240].map(deg => (
              <line key={deg} x1="40" y1="40" x2={40 + Math.cos(deg * Math.PI / 180) * 14} y2={40 + Math.sin(deg * Math.PI / 180) * 14} stroke="#3d3555" strokeWidth="2" />
            ))}
          </svg>
        </div>

        {/* Data readout strip */}
        <div className="space-y-1">
          {MOCK_METRICS.map((met) => (
            <div key={met.name} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid #2d264022' }}>
              <div className="w-2 h-2" style={{ background: met.color }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#8b5cf688', textTransform: 'uppercase', flex: 1 }}>{met.name}</span>
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: met.color }}>{met.value.toLocaleString()}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: met.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>{met.change}</span>
            </div>
          ))}
        </div>

        {/* Tape data visualization */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2d2640' }}>
          <div className="flex items-end gap-[1px]" style={{ height: '40px' }}>
            {series.map((v, i) => {
              const max = Math.max(...series);
              return <div key={i} className="flex-1" style={{ height: `${(v / max) * 100}%`, background: `linear-gradient(to top, #8b5cf6, #8b5cf633)` }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 10: Radar Screen ──
// Radar sweep with metric blips

const RadarDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const [sweepAngle, setSweepAngle] = useState(0);
  useEffect(() => { const t = setInterval(() => setSweepAngle(a => (a + 2) % 360), 50); return () => clearInterval(t); }, []);

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#22c55e', letterSpacing: '2px' }}>RADAR</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#040a04', border: '3px groove #1a3a1a', padding: '16px' }}>
        <div className="flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Concentric circles */}
            {[30, 60, 90, 120].map(r => (
              <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1a3a1a" strokeWidth="0.5" />
            ))}
            {/* Cross lines */}
            <line x1={cx} y1="10" x2={cx} y2={size - 10} stroke="#1a3a1a" strokeWidth="0.5" />
            <line x1="10" y1={cy} x2={size - 10} y2={cy} stroke="#1a3a1a" strokeWidth="0.5" />

            {/* Sweep */}
            <defs>
              <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d={`M ${cx} ${cy} L ${cx + Math.cos((sweepAngle - 90) * Math.PI / 180) * 120} ${cy + Math.sin((sweepAngle - 90) * Math.PI / 180) * 120} A 120 120 0 0 0 ${cx + Math.cos((sweepAngle - 120) * Math.PI / 180) * 120} ${cy + Math.sin((sweepAngle - 120) * Math.PI / 180) * 120} Z`}
              fill="url(#sweep-grad)"
            />
            {/* Sweep line */}
            <line
              x1={cx} y1={cy}
              x2={cx + Math.cos((sweepAngle - 90) * Math.PI / 180) * 120}
              y2={cy + Math.sin((sweepAngle - 90) * Math.PI / 180) * 120}
              stroke="#22c55e" strokeWidth="1" opacity="0.6"
            />

            {/* Metric blips */}
            {MOCK_METRICS.map((met, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const dist = 30 + (met.value / Math.max(...MOCK_METRICS.map(m => m.value))) * 80;
              const bx = cx + Math.cos(angle) * dist;
              const by = cy + Math.sin(angle) * dist;
              const angleDeg = i * 60;
              const diff = ((sweepAngle - angleDeg + 360) % 360);
              const brightness = diff < 30 ? 1 : Math.max(0.3, 1 - diff / 360);

              return (
                <g key={met.name}>
                  <circle cx={bx} cy={by} r="4" fill={met.color} opacity={brightness} style={{ filter: `drop-shadow(0 0 4px ${met.color})` }} />
                  <text x={bx} y={by - 8} textAnchor="middle" fill={met.color} opacity={brightness} style={{ fontFamily: "'VT323', monospace", fontSize: '10px' }}>
                    {met.value > 999 ? `${(met.value / 1000).toFixed(1)}k` : met.value}
                  </text>
                </g>
              );
            })}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="3" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {MOCK_METRICS.map(met => (
            <div key={met.name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: met.color }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: '#22c55e80', textTransform: 'uppercase' }}>{met.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 11: LED Matrix ──
// Large LED dot-matrix number display

const LEDMatrixDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const [selectedMetric, setSelectedMetric] = useState(0);
  const met = MOCK_METRICS[selectedMetric];

  // Simple 3x5 digit patterns for LED display
  const DIGIT_PATTERNS: Record<string, number[][]> = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
    ',': [[0,0,0],[0,0,0],[0,0,0],[0,1,0],[0,1,0]],
  };

  const digits = met.value.toLocaleString().split('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#ef4444', letterSpacing: '2px' }}>LED MATRIX</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#1a0a0a', border: '3px groove #3d1a1a', padding: '16px' }}>
        {/* LED display */}
        <div className="flex justify-center gap-[6px] mb-4 py-3" style={{ background: '#0f0505', border: '2px inset #2a0f0f' }}>
          {digits.map((d, di) => {
            const pattern = DIGIT_PATTERNS[d];
            if (!pattern) return <div key={di} style={{ width: '8px' }} />;
            return (
              <div key={di} className="flex flex-col gap-[2px]">
                {pattern.map((row, ri) => (
                  <div key={ri} className="flex gap-[2px]">
                    {row.map((on, ci) => (
                      <div
                        key={ci}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: on ? met.color : `${met.color}15`,
                          boxShadow: on ? `0 0 4px ${met.color}88` : 'none',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Metric selector buttons */}
        <div className="grid grid-cols-3 gap-1">
          {MOCK_METRICS.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMetric(i)}
              className="py-2 text-center transition-all"
              style={{
                background: i === selectedMetric ? `${m.color}22` : '#0f0505',
                border: `1px solid ${i === selectedMetric ? m.color : '#2a0f0f'}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '9px',
                color: i === selectedMetric ? m.color : '#ffffff44',
                textTransform: 'uppercase',
              }}
            >
              {m.name}
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: i === selectedMetric ? m.color : '#ffffff22' }}>
                {m.value.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── CONCEPT 12: Blueprint ──
// Engineering blueprint style with technical drawings

const BlueprintDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('14d');
  const series = MOCK_SERIES['Total Conversations'];
  const maxVal = Math.max(...series);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#60a5fa', letterSpacing: '2px' }}>BLUEPRINT</span>
        <MiniDatePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      <div style={{ background: '#0a1628', border: '2px solid #1e3a5a', padding: '20px', position: 'relative' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#1e3a5a22 1px, transparent 1px), linear-gradient(90deg, #1e3a5a22 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* Title block */}
          <div className="flex justify-between items-start mb-4 pb-3" style={{ borderBottom: '1px solid #1e3a5a' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '3px' }}>
                ANALYTICS SCHEMATIC
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#60a5fa66', marginTop: '2px' }}>
                REV. 3.14 — SHEET 1 OF 1
              </div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#60a5fa44', textAlign: 'right' }}>
              DATE: MAR 14, 2026<br />SCALE: 1:1<br />DRAWN: AUTO
            </div>
          </div>

          {/* Metric specifications */}
          <div className="space-y-2">
            {MOCK_METRICS.map((met, i) => {
              const pct = met.value / maxVal;
              return (
                <div key={met.name} className="flex items-center gap-3">
                  {/* Dimension label */}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#60a5fa88', width: '100px', textTransform: 'uppercase' }}>
                    {met.name}
                  </span>
                  {/* Dimension line */}
                  <div className="flex-1 relative" style={{ height: '16px' }}>
                    {/* Bar */}
                    <div style={{ position: 'absolute', top: '6px', left: 0, width: `${pct * 100}%`, height: '4px', background: '#60a5fa33', borderRight: '1px solid #60a5fa' }} />
                    {/* Dimension arrows */}
                    <div style={{ position: 'absolute', top: '0', left: 0, width: '1px', height: '16px', background: '#60a5fa66' }} />
                    <div style={{ position: 'absolute', top: '0', left: `${pct * 100}%`, width: '1px', height: '16px', background: '#60a5fa' }} />
                    {/* Dimension text */}
                    <span style={{
                      position: 'absolute',
                      top: '-1px',
                      left: `${pct * 50}%`,
                      fontFamily: "'VT323', monospace",
                      fontSize: '14px',
                      color: '#60a5fa',
                      transform: 'translateX(-50%)',
                    }}>
                      {met.value.toLocaleString()}
                    </span>
                  </div>
                  {/* Change */}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: met.change.startsWith('+') ? '#22c55e' : '#ef4444', width: '35px', textAlign: 'right' }}>
                    {met.change}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart section */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1e3a5a' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#60a5fa66', marginBottom: '8px', letterSpacing: '2px' }}>
              DETAIL A — DAILY DISTRIBUTION
            </div>
            <svg width="100%" viewBox="0 0 360 80" className="block">
              {/* Grid */}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1="0" y1={i * 20} x2="360" y2={i * 20} stroke="#1e3a5a44" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
              {/* Line chart */}
              <polyline
                points={series.map((v, i) => `${(i / (series.length - 1)) * 356 + 2},${76 - (v / maxVal) * 72}`).join(' ')}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.5"
              />
              {/* Data points */}
              {series.map((v, i) => (
                <g key={i}>
                  <circle cx={(i / (series.length - 1)) * 356 + 2} cy={76 - (v / maxVal) * 72} r="2" fill="#60a5fa" />
                  {/* Dimension ticks */}
                  <line x1={(i / (series.length - 1)) * 356 + 2} y1={74} x2={(i / (series.length - 1)) * 356 + 2} y2={78} stroke="#60a5fa44" strokeWidth="0.5" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};


// ── Export all demos ──

export interface AnalyticsVizDemo {
  id: string;
  label: string;
  component: React.FC;
}

export const ANALYTICS_VIZ_DEMOS: AnalyticsVizDemo[] = [
  { id: 'crt', label: 'CRT MONITOR', component: CRTDashboard },
  { id: 'oscilloscope', label: 'OSCILLOSCOPE', component: OscilloscopeDashboard },
  { id: 'punchcard', label: 'PUNCH CARD', component: PunchCardDashboard },
  { id: 'vu-meter', label: 'VU METER', component: VUMeterDashboard },
  { id: 'dot-matrix', label: 'DOT MATRIX', component: DotMatrixDashboard },
  { id: 'mission-ctrl', label: 'MISSION CTRL', component: MissionControlDashboard },
  { id: 'nixie', label: 'NIXIE TUBE', component: NixieTubeDashboard },
  { id: 'flight', label: 'FLIGHT DECK', component: FlightInstrumentsDashboard },
  { id: 'tape-reel', label: 'TAPE REEL', component: TapeReelDashboard },
  { id: 'radar', label: 'RADAR', component: RadarDashboard },
  { id: 'led-matrix', label: 'LED MATRIX', component: LEDMatrixDashboard },
  { id: 'blueprint', label: 'BLUEPRINT', component: BlueprintDashboard },
];
