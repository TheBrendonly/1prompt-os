import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Sparkles, MessageSquare, Database, Settings } from '@/components/icons';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { ANALYTICS_VIZ_DEMOS } from '@/components/AnalyticsVizDemos';

// ── Shared types & mock data ──

interface LayerData {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  configured: boolean;
  percentage: number;
  color: string;
  colorLight: string;
}

const MOCK_LAYERS: LayerData[] = [
  { id: 'identity', label: 'IDENTITY', icon: User, configured: true, percentage: 100, color: '#3b82f6', colorLight: 'rgba(59,130,246,0.15)' },
  { id: 'behavior', label: 'BEHAVIOR', icon: Sparkles, configured: true, percentage: 100, color: '#22c55e', colorLight: 'rgba(34,197,94,0.15)' },
  { id: 'communication', label: 'COMMUNICATION', icon: MessageSquare, configured: false, percentage: 50, color: '#f59e0b', colorLight: 'rgba(245,158,11,0.15)' },
  { id: 'knowledge', label: 'KNOWLEDGE', icon: Database, configured: false, percentage: 0, color: '#8b5cf6', colorLight: 'rgba(139,92,246,0.15)' },
  { id: 'custom', label: 'CUSTOM', icon: Settings, configured: false, percentage: 0, color: '#6b7280', colorLight: 'rgba(107,114,128,0.15)' },
];

// ── CONCEPT 1: Layer Stack (Current) ──

const LayerStackViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div style={{ perspective: '1000px', perspectiveOrigin: '50% 40%' }}>
      <div className="flex flex-col gap-2" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(12deg)' }}>
        {MOCK_LAYERS.map((layer) => {
          const isActive = active === layer.id;
          const depth = 8;
          return (
            <button key={layer.id} onClick={() => onSelect(layer.id)} className="relative w-full text-left transition-all duration-300" style={{ transformStyle: 'preserve-3d', transform: isActive ? 'translateZ(16px) scale(1.02)' : 'translateZ(0px)' }}>
              <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: `${depth}px`, transform: `translateY(${depth}px) skewX(-45deg)`, transformOrigin: 'top left', background: layer.configured ? layer.colorLight : 'hsl(var(--border) / 0.3)' }} />
              <div className="absolute top-0 right-0 pointer-events-none" style={{ width: `${depth}px`, height: '100%', transform: `translateX(${depth}px) skewY(-45deg)`, transformOrigin: 'top left', background: layer.configured ? layer.colorLight : 'hsl(var(--border) / 0.2)' }} />
              <div className="relative px-3 py-2.5 groove-border transition-all duration-300 bg-card" style={{ borderColor: isActive ? layer.color : layer.configured ? `${layer.color}99` : undefined, boxShadow: isActive ? `0 0 20px ${layer.color}66` : layer.configured ? `0 0 8px ${layer.color}33` : 'none' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 flex items-center justify-center" style={{ background: layer.configured ? layer.colorLight : 'hsl(var(--muted))', border: `1px solid ${layer.configured ? `${layer.color}4D` : 'hsl(var(--border))'}` }}>
                    <layer.icon className={cn("w-3.5 h-3.5", layer.configured ? "" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '1.5px', color: isActive ? layer.color : layer.configured ? layer.color : 'hsl(var(--foreground))' }}>{layer.label}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.5)' }}>{layer.configured ? '✓ SET' : `${layer.percentage}%`}</span>
                    </div>
                    <div className="mt-1 h-[2px] w-full overflow-hidden" style={{ background: 'hsl(var(--border) / 0.3)' }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${layer.percentage}%`, background: layer.color }} />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── CONCEPT 2: Concentric Rings ──

const ConcentricRingsViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const rings = MOCK_LAYERS.map((layer, i) => ({ ...layer, radius: 40 + i * 35 }));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="ring-glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[...rings].reverse().map((ring) => {
          const isActive = active === ring.id;
          const circumference = 2 * Math.PI * ring.radius;
          const dashLen = (ring.percentage / 100) * circumference;
          return (
            <g key={ring.id} onClick={() => onSelect(ring.id)} style={{ cursor: 'pointer' }}>
              <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke="hsl(var(--border) / 0.2)" strokeWidth={isActive ? 14 : 10} />
              <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={ring.color} strokeWidth={isActive ? 14 : 10} strokeDasharray={`${dashLen} ${circumference}`} strokeLinecap="round" opacity={ring.configured ? 0.8 : 0.4} filter={isActive ? 'url(#ring-glow)' : undefined} style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.5s ease' }} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="6" fill="hsl(var(--primary))" opacity="0.6" />
        {rings.map((ring) => {
          const isActive = active === ring.id;
          return (
            <text key={ring.id} x={cx} y={cy - ring.radius} textAnchor="middle" dominantBaseline="middle" fill={isActive ? ring.color : ring.configured ? ring.color : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '13px' : '11px', letterSpacing: '1px', transition: 'all 0.3s ease' }}>
              {ring.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {MOCK_LAYERS.map((layer) => (
          <button key={layer.id} onClick={() => onSelect(layer.id)} className={cn("flex items-center gap-1.5 px-2 py-1 transition-all", active === layer.id && "groove-border bg-card")}>
            <div className="w-2 h-2 rounded-full" style={{ background: layer.color, opacity: layer.configured ? 1 : 0.3 }} />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: active === layer.id ? layer.color : 'hsl(var(--muted-foreground))' }}>{layer.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── CONCEPT 3: DNA Helix ──

const DNAHelixViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const width = 200;
  const height = 420;
  const nodeSpacing = 75;
  const amplitude = 50;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs><filter id="dna-glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {MOCK_LAYERS.map((layer, i) => {
          const y = 40 + i * nodeSpacing;
          const nextY = 40 + (i + 1) * nodeSpacing;
          const xLeft = width / 2 - amplitude * Math.cos((i * Math.PI) / 2.5);
          const xRight = width / 2 + amplitude * Math.cos((i * Math.PI) / 2.5);
          if (i < MOCK_LAYERS.length - 1) {
            const nextXLeft = width / 2 - amplitude * Math.cos(((i + 1) * Math.PI) / 2.5);
            const nextXRight = width / 2 + amplitude * Math.cos(((i + 1) * Math.PI) / 2.5);
            return (
              <g key={`strand-${i}`}>
                <line x1={xLeft} y1={y} x2={nextXLeft} y2={nextY} stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.3" />
                <line x1={xRight} y1={y} x2={nextXRight} y2={nextY} stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.3" />
              </g>
            );
          }
          return null;
        })}
        {MOCK_LAYERS.map((layer, i) => {
          const y = 40 + i * nodeSpacing;
          const xLeft = width / 2 - amplitude * Math.cos((i * Math.PI) / 2.5);
          const xRight = width / 2 + amplitude * Math.cos((i * Math.PI) / 2.5);
          const isActive = active === layer.id;
          return (
            <g key={layer.id} onClick={() => onSelect(layer.id)} style={{ cursor: 'pointer' }}>
              <line x1={xLeft} y1={y} x2={xRight} y2={y} stroke={layer.configured ? layer.color : 'hsl(var(--border))'} strokeWidth={isActive ? 3 : 2} opacity={layer.configured ? 0.6 : 0.2} strokeDasharray={layer.configured ? 'none' : '4 4'} />
              <circle cx={xLeft} cy={y} r={isActive ? 10 : 7} fill={layer.configured ? layer.color : 'hsl(var(--muted))'} stroke={isActive ? layer.color : 'hsl(var(--border))'} strokeWidth={isActive ? 2 : 1} filter={isActive || layer.configured ? 'url(#dna-glow)' : undefined} opacity={layer.configured ? 1 : 0.5} style={{ transition: 'all 0.3s ease' }} />
              <circle cx={xRight} cy={y} r={isActive ? 10 : 7} fill={layer.configured ? layer.color : 'hsl(var(--muted))'} stroke={isActive ? layer.color : 'hsl(var(--border))'} strokeWidth={isActive ? 2 : 1} filter={isActive || layer.configured ? 'url(#dna-glow)' : undefined} opacity={layer.configured ? 1 : 0.5} style={{ transition: 'all 0.3s ease' }} />
              <text x={width / 2} y={y + (isActive ? 22 : 18)} textAnchor="middle" fill={isActive ? layer.color : layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '15px' : '12px', letterSpacing: '1.5px', transition: 'all 0.3s ease' }}>{layer.label}</text>
              {layer.configured && <text x={width / 2} y={y - 14} textAnchor="middle" fill={layer.color} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px' }}>✓ SET</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── CONCEPT 4: Circuit Board ──

const CircuitBoardViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const positions = [
    { x: cx, y: 45 }, { x: size - 50, y: cy - 30 }, { x: size - 50, y: cy + 50 },
    { x: 50, y: cy + 50 }, { x: 50, y: cy - 30 },
  ];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="circuit-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="none" /><circle cx="10" cy="10" r="0.5" fill="hsl(var(--border) / 0.15)" /></pattern>
        </defs>
        <rect width={size} height={size} fill="url(#circuit-grid)" />
        <rect x={cx - 35} y={cy - 25} width={70} height={50} rx={4} fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" filter="url(#circuit-glow)" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="hsl(var(--primary))" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', letterSpacing: '2px' }}>AGENT</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(var(--primary) / 0.6)" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', letterSpacing: '1px' }}>CORE</text>
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={`pin-${i}`}>
            <rect x={cx - 30 + i * 10} y={cy - 28} width={4} height={5} fill="hsl(var(--primary) / 0.4)" />
            <rect x={cx - 30 + i * 10} y={cy + 23} width={4} height={5} fill="hsl(var(--primary) / 0.4)" />
          </React.Fragment>
        ))}
        {MOCK_LAYERS.map((layer, i) => {
          const pos = positions[i];
          const isActive = active === layer.id;
          return (
            <g key={layer.id} onClick={() => onSelect(layer.id)} style={{ cursor: 'pointer' }}>
              <line x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke={layer.configured ? layer.color : 'hsl(var(--border))'} strokeWidth={isActive ? 3 : 1.5} opacity={layer.configured ? 0.7 : 0.2} strokeDasharray={layer.configured ? 'none' : '6 4'} filter={layer.configured ? 'url(#circuit-glow)' : undefined} style={{ transition: 'all 0.3s ease' }} />
              {layer.configured && (
                <circle r="2" fill={layer.color}><animateMotion dur="2s" repeatCount="indefinite" path={`M${cx},${cy} L${pos.x},${pos.y}`} /></circle>
              )}
              <rect x={pos.x - 32} y={pos.y - 16} width={64} height={32} rx={3} fill={layer.configured ? layer.colorLight : 'hsl(var(--card))'} stroke={isActive ? layer.color : layer.configured ? `${layer.color}80` : 'hsl(var(--border))'} strokeWidth={isActive ? 2 : 1} filter={isActive ? 'url(#circuit-glow)' : undefined} style={{ transition: 'all 0.3s ease' }} />
              <text x={pos.x} y={pos.y - 2} textAnchor="middle" dominantBaseline="middle" fill={isActive ? layer.color : layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: '11px', letterSpacing: '1px', transition: 'all 0.3s ease' }}>{layer.label}</text>
              <circle cx={pos.x + 24} cy={pos.y - 10} r="3" fill={layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.2)'} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── CONCEPT 5: Retro Terminal Stack ──

const RetroTerminalViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div className="flex flex-col gap-3">
      {MOCK_LAYERS.map((layer) => {
        const isActive = active === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className="relative w-full text-left transition-all duration-300"
          >
            {/* CRT monitor frame */}
            <div
              className="relative overflow-hidden"
              style={{
                border: `3px solid ${isActive ? layer.color : layer.configured ? `${layer.color}80` : '#333'}`,
                borderRadius: '6px 6px 2px 2px',
                background: '#0a0a0a',
                boxShadow: isActive
                  ? `0 0 20px ${layer.color}44, inset 0 0 30px ${layer.color}11`
                  : 'inset 0 0 20px rgba(0,0,0,0.5)',
              }}
            >
              {/* Scanlines overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                }}
              />
              {/* Screen content */}
              <div className="relative px-3 py-2.5 z-0">
                <div className="flex items-center gap-2">
                  <span style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: '14px',
                    color: isActive ? layer.color : layer.configured ? layer.color : '#444',
                    textShadow: layer.configured ? `0 0 8px ${layer.color}88` : 'none',
                  }}>
                    {isActive ? '> ' : '$ '}
                  </span>
                  <span style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: '16px',
                    color: isActive ? layer.color : layer.configured ? layer.color : '#555',
                    textShadow: layer.configured ? `0 0 6px ${layer.color}66` : 'none',
                    letterSpacing: '2px',
                  }}>
                    {layer.label}
                  </span>
                  <span className="ml-auto" style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '10px',
                    color: layer.configured ? layer.color : '#333',
                  }}>
                    {layer.configured ? '[LOADED]' : '[EMPTY]'}
                  </span>
                </div>
                {/* Progress bar as terminal loading */}
                <div className="mt-1.5 flex items-center gap-1">
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#444' }}>[</span>
                  <div className="flex-1 h-[3px] overflow-hidden" style={{ background: '#1a1a1a' }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${layer.percentage}%`,
                        background: layer.color,
                        boxShadow: `0 0 6px ${layer.color}`,
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#444' }}>]</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: layer.color, opacity: 0.7 }}>
                    {layer.percentage}%
                  </span>
                </div>
              </div>
              {/* CRT flicker effect for active */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none z-20" style={{
                  background: `linear-gradient(transparent 50%, ${layer.color}05 50%)`,
                  backgroundSize: '100% 4px',
                  animation: 'pulse 3s ease-in-out infinite',
                }} />
              )}
            </div>
            {/* Monitor base */}
            <div className="mx-auto" style={{
              width: '40%',
              height: '4px',
              background: isActive ? `${layer.color}40` : '#222',
              borderRadius: '0 0 3px 3px',
              transition: 'all 0.3s ease',
            }} />
          </button>
        );
      })}
    </div>
  );
};

// ── CONCEPT 6: Isometric Dungeon Map ──

const DungeonMapViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;

  // Room positions in a cross/dungeon layout
  const rooms = [
    { ...MOCK_LAYERS[0], x: cx, y: 55, w: 70, h: 50 },        // top - Identity
    { ...MOCK_LAYERS[1], x: size - 75, y: cy - 10, w: 70, h: 50 }, // right - Behavior
    { ...MOCK_LAYERS[2], x: cx, y: size - 75, w: 70, h: 50 },  // bottom - Communication
    { ...MOCK_LAYERS[3], x: 75, y: cy - 10, w: 70, h: 50 },    // left - Knowledge
    { ...MOCK_LAYERS[4], x: cx, y: cy, w: 60, h: 45 },         // center - Custom (treasure)
  ];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="dungeon-glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="dungeon-floor" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="12" height="12" fill="none" />
            <rect width="5" height="5" x="0.5" y="0.5" fill="hsl(var(--border) / 0.06)" rx="0.5" />
            <rect width="5" height="5" x="6.5" y="6.5" fill="hsl(var(--border) / 0.04)" rx="0.5" />
          </pattern>
        </defs>

        <rect width={size} height={size} fill="url(#dungeon-floor)" />

        {/* Corridors connecting rooms to center */}
        {rooms.slice(0, 4).map((room, i) => {
          const centerRoom = rooms[4];
          return (
            <line
              key={`corridor-${i}`}
              x1={room.x} y1={room.y + (i === 0 ? room.h / 2 : i === 2 ? -room.h / 2 : 0)}
              x2={centerRoom.x} y2={centerRoom.y}
              stroke={room.configured ? room.color : 'hsl(var(--border))'}
              strokeWidth={3}
              opacity={room.configured ? 0.4 : 0.1}
              strokeDasharray={room.configured ? 'none' : '8 6'}
            />
          );
        })}

        {/* Rooms */}
        {rooms.map((room) => {
          const isActive = active === room.id;
          const isTreasure = room.id === 'custom';
          return (
            <g key={room.id} onClick={() => onSelect(room.id)} style={{ cursor: 'pointer' }}>
              {/* Room shadow */}
              <rect
                x={room.x - room.w / 2 + 3}
                y={room.y - room.h / 2 + 3}
                width={room.w} height={room.h} rx={2}
                fill="rgba(0,0,0,0.3)"
              />
              {/* Room body */}
              <rect
                x={room.x - room.w / 2}
                y={room.y - room.h / 2}
                width={room.w} height={room.h} rx={2}
                fill={room.configured ? room.colorLight : 'hsl(var(--card))'}
                stroke={isActive ? room.color : room.configured ? `${room.color}80` : 'hsl(var(--border) / 0.4)'}
                strokeWidth={isActive ? 2.5 : 1.5}
                filter={isActive ? 'url(#dungeon-glow)' : undefined}
                style={{ transition: 'all 0.3s ease' }}
              />
              {/* Door indicators (small notches) */}
              {!isTreasure && (
                <>
                  <rect x={room.x - 4} y={room.y - room.h / 2 - 2} width={8} height={4} fill={room.configured ? room.color : '#333'} opacity={0.5} rx={1} />
                  <rect x={room.x - 4} y={room.y + room.h / 2 - 2} width={8} height={4} fill={room.configured ? room.color : '#333'} opacity={0.5} rx={1} />
                </>
              )}
              {/* Treasure icon for center */}
              {isTreasure && (
                <text x={room.x} y={room.y - 5} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '16px' }}>
                  {room.configured ? '💎' : '🔒'}
                </text>
              )}
              {/* Label */}
              <text
                x={room.x}
                y={isTreasure ? room.y + 12 : room.y - 3}
                textAnchor="middle" dominantBaseline="middle"
                fill={isActive ? room.color : room.configured ? room.color : 'hsl(var(--muted-foreground) / 0.5)'}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: isTreasure ? '10px' : '12px',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                }}
              >
                {room.label}
              </text>
              {/* Status */}
              {!isTreasure && (
                <text
                  x={room.x} y={room.y + 12}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={room.configured ? room.color : '#444'}
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px' }}
                >
                  {room.configured ? '◆ CLEARED' : '◇ LOCKED'}
                </text>
              )}
              {/* Pulsing orb for configured rooms */}
              {room.configured && (
                <circle cx={room.x + room.w / 2 - 8} cy={room.y - room.h / 2 + 8} r="3" fill={room.color} opacity={0.8}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* Map legend */}
        <text x={12} y={size - 12} fill="hsl(var(--muted-foreground) / 0.3)" style={{ fontFamily: "'VT323', monospace", fontSize: '12px' }}>
          MAP LVL 1 — AGENT DUNGEON
        </text>
      </svg>
    </div>
  );
};

// ── CONCEPT 7: Arcade Cabinet Select ──

const ArcadeCabinetViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div className="space-y-2">
      {/* Title marquee */}
      <div className="text-center py-2 relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0d1a 100%)',
        border: '2px solid #4a1a7a',
        borderRadius: '4px',
      }}>
        <span style={{
          fontFamily: "'VT323', monospace",
          fontSize: '20px',
          letterSpacing: '4px',
          background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          SELECT YOUR MODULE
        </span>
      </div>

      {/* Character slots */}
      <div className="grid grid-cols-3 gap-2">
        {MOCK_LAYERS.map((layer, i) => {
          const isActive = active === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              className={cn(
                "relative flex flex-col items-center p-2 transition-all duration-200",
                i === 4 && "col-start-2"
              )}
              style={{
                border: isActive ? `2px solid ${layer.color}` : '2px solid #222',
                background: isActive
                  ? `linear-gradient(180deg, ${layer.colorLight} 0%, #0a0a0a 100%)`
                  : '#0d0d0d',
                boxShadow: isActive ? `0 0 15px ${layer.color}44, inset 0 0 20px ${layer.color}11` : 'none',
              }}
            >
              {/* Character sprite area */}
              <div className="w-12 h-14 flex items-center justify-center mb-1 relative" style={{
                border: `1px solid ${layer.configured ? `${layer.color}66` : '#222'}`,
                background: '#050505',
              }}>
                {/* Pixel art character (using icon) */}
                <div style={{
                    color: layer.configured ? layer.color : '#333',
                    filter: layer.configured ? `drop-shadow(0 0 4px ${layer.color}88)` : 'none',
                  }}>
                  <layer.icon className="w-6 h-6" />
                </div>
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.2) 1px, rgba(0,0,0,0.2) 2px)',
                }} />
              </div>

              {/* Name */}
              <span style={{
                fontFamily: "'VT323', monospace",
                fontSize: '11px',
                letterSpacing: '1px',
                color: isActive ? layer.color : layer.configured ? layer.color : '#444',
                textShadow: isActive ? `0 0 6px ${layer.color}88` : 'none',
              }}>
                {layer.label}
              </span>

              {/* HP bar */}
              <div className="w-full mt-1 flex items-center gap-0.5">
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '8px', color: '#555' }}>HP</span>
                <div className="flex-1 h-[4px] overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                  <div className="h-full" style={{
                    width: `${layer.percentage}%`,
                    background: layer.percentage === 100 ? '#22c55e' : layer.percentage >= 50 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Ready indicator */}
              {layer.configured && (
                <span style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '9px',
                  color: '#22c55e',
                  textShadow: '0 0 4px #22c55e88',
                  marginTop: '2px',
                }}>
                  READY!
                </span>
              )}

              {/* Blinking selector for active */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2" style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '14px',
                  color: layer.color,
                  textShadow: `0 0 6px ${layer.color}`,
                }}>
                  <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>▼</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Insert coin */}
      <div className="text-center py-2" style={{
        border: '1px dashed #333',
        background: '#080808',
      }}>
        <span style={{
          fontFamily: "'VT323', monospace",
          fontSize: '14px',
          color: '#f59e0b',
          letterSpacing: '2px',
          textShadow: '0 0 8px #f59e0b44',
        }}>
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>INSERT COIN ▶ CONFIGURE</span>
        </span>
      </div>
    </div>
  );
};

// ── CONCEPT 8: Cassette Tape Deck ──

const CassetteDeckViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div className="space-y-3">
      {/* Deck header - VU meters */}
      <div className="flex items-center justify-between px-3 py-2" style={{
        background: '#0d0d0d',
        border: '2px solid #2a2a2a',
        borderRadius: '4px',
      }}>
        <div className="flex items-center gap-3">
          {/* Left VU meter */}
          <div className="flex items-end gap-[2px]">
            {[3, 5, 7, 9, 7, 4, 6, 8, 5, 3].map((h, i) => {
              const configuredCount = MOCK_LAYERS.filter(l => l.configured).length;
              const lit = i < configuredCount * 2;
              return (
                <div key={i} className="w-[3px] transition-all" style={{
                  height: `${h * 2}px`,
                  background: lit ? (i > 6 ? '#ef4444' : i > 4 ? '#f59e0b' : '#22c55e') : '#1a1a1a',
                  boxShadow: lit ? `0 0 3px ${i > 6 ? '#ef4444' : i > 4 ? '#f59e0b' : '#22c55e'}88` : 'none',
                }} />
              );
            })}
          </div>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#22c55e', textShadow: '0 0 4px #22c55e44' }}>
            AGENT DECK
          </span>
        </div>
        {/* LCD display */}
        <div className="px-2 py-0.5" style={{
          background: '#0a1a0a',
          border: '1px solid #1a3a1a',
          borderRadius: '2px',
        }}>
          <span style={{
            fontFamily: "'VT323', monospace",
            fontSize: '12px',
            color: '#4ade80',
            textShadow: '0 0 6px #4ade8066',
          }}>
            {active ? MOCK_LAYERS.find(l => l.id === active)?.label : 'NO TAPE'}
          </span>
        </div>
      </div>

      {/* Tape slots */}
      {MOCK_LAYERS.map((layer) => {
        const isActive = active === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className="w-full text-left transition-all duration-300"
          >
            <div
              className="relative overflow-hidden"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, #1a1a1a 0%, ${layer.colorLight} 50%, #1a1a1a 100%)`
                  : '#111',
                border: `2px solid ${isActive ? layer.color : layer.configured ? `${layer.color}40` : '#1a1a1a'}`,
                borderRadius: '4px',
                padding: '8px 10px',
                boxShadow: isActive ? `0 0 12px ${layer.color}33` : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Tape reels */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${layer.configured ? layer.color : '#333'}`,
                      background: '#0a0a0a',
                      animation: isActive ? 'spin 3s linear infinite' : 'none',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{
                      background: layer.configured ? layer.color : '#222',
                    }} />
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${layer.configured ? layer.color : '#333'}`,
                      background: '#0a0a0a',
                      animation: isActive ? 'spin 3s linear infinite' : 'none',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{
                      background: layer.configured ? layer.color : '#222',
                    }} />
                  </div>
                </div>

                {/* Tape label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '15px',
                      letterSpacing: '2px',
                      color: isActive ? layer.color : layer.configured ? layer.color : '#555',
                      textShadow: isActive ? `0 0 6px ${layer.color}66` : 'none',
                    }}>
                      {layer.label}
                    </span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      color: layer.configured ? '#4ade80' : '#444',
                    }}>
                      {layer.configured ? '▶ PLAYING' : '■ STOP'}
                    </span>
                  </div>
                  {/* Tape progress */}
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex-1 h-[3px] overflow-hidden" style={{ background: '#1a1a1a' }}>
                      <div className="h-full transition-all duration-700" style={{
                        width: `${layer.percentage}%`,
                        background: `linear-gradient(90deg, ${layer.color}, ${layer.color}88)`,
                        boxShadow: `0 0 4px ${layer.color}66`,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '8px',
                      color: '#444',
                    }}>
                      {layer.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-4 py-2" style={{
        background: '#0a0a0a',
        border: '2px solid #1a1a1a',
        borderRadius: '4px',
      }}>
        {['⏮', '⏪', '▶', '⏩', '⏭'].map((icon, i) => (
          <span key={i} style={{
            fontFamily: "'VT323', monospace",
            fontSize: '18px',
            color: i === 2 ? '#22c55e' : '#555',
            cursor: 'pointer',
            textShadow: i === 2 ? '0 0 6px #22c55e88' : 'none',
          }}>
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── CONCEPT 9: Floppy Disk Rack ──

const FloppyDiskViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div className="space-y-2">
      <div className="text-center py-1.5" style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '3px' }}>
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#888', letterSpacing: '2px' }}>
          💾 DISK RACK — {MOCK_LAYERS.filter(l => l.configured).length}/{MOCK_LAYERS.length} LOADED
        </span>
      </div>
      <div className="flex gap-1.5 justify-center">
        {MOCK_LAYERS.map((layer) => {
          const isActive = active === layer.id;
          return (
            <button key={layer.id} onClick={() => onSelect(layer.id)} className="relative transition-all duration-300" style={{ width: '68px', transform: isActive ? 'translateY(-8px)' : 'translateY(0)' }}>
              {/* Floppy disk body */}
              <div style={{
                width: '68px', height: '72px', background: layer.configured ? layer.colorLight : '#1a1a1a',
                border: `2px solid ${isActive ? layer.color : layer.configured ? `${layer.color}66` : '#333'}`,
                borderRadius: '3px 3px 0 0', position: 'relative', overflow: 'hidden',
                boxShadow: isActive ? `0 4px 20px ${layer.color}44` : 'none',
              }}>
                {/* Metal slider */}
                <div style={{ position: 'absolute', top: 0, left: '16px', right: '16px', height: '22px', background: '#2a2a2a', borderBottom: '1px solid #444', borderRadius: '0 0 2px 2px' }}>
                  <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '14px', background: '#111', border: '1px solid #555' }} />
                </div>
                {/* Label area */}
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', height: '28px', background: layer.configured ? `${layer.color}22` : '#111', border: `1px solid ${layer.configured ? `${layer.color}44` : '#222'}`, borderRadius: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '9px', color: isActive ? layer.color : layer.configured ? layer.color : '#444', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.1 }}>
                    {layer.label}
                  </span>
                </div>
                {/* Write protect tab */}
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '4px', height: '4px', background: layer.configured ? layer.color : '#333', borderRadius: '1px' }} />
              </div>
              {/* Status LED */}
              <div className="flex justify-center mt-1">
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isActive ? layer.color : layer.configured ? `${layer.color}88` : '#222', boxShadow: isActive ? `0 0 6px ${layer.color}` : 'none' }} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5" style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '2px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? MOCK_LAYERS.find(l => l.id === active)?.color : '#333', boxShadow: active ? `0 0 4px ${MOCK_LAYERS.find(l => l.id === active)?.color}` : 'none' }} />
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#666' }}>
          DRIVE A: {active ? `READING ${MOCK_LAYERS.find(l => l.id === active)?.label}...` : 'NO DISK'}
        </span>
      </div>
    </div>
  );
};

// ── CONCEPT 10: Pixel Potion Shelf ──

const PotionShelfViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const potionShapes = ['▲', '◆', '●', '▼', '■'];
  return (
    <div className="space-y-2">
      <div className="text-center py-1" style={{ borderBottom: '2px solid #2a1a0a' }}>
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#c4956a', letterSpacing: '2px' }}>
          ✦ POTION SHELF ✦
        </span>
      </div>
      {/* Shelf with potions */}
      <div className="relative" style={{ background: 'linear-gradient(180deg, #1a120a 0%, #0d0a06 100%)', border: '3px solid #3d2a14', borderRadius: '4px', padding: '12px 8px' }}>
        {/* Shelf slats */}
        {[0, 1].map(row => (
          <React.Fragment key={row}>
            {row > 0 && <div style={{ height: '3px', background: 'linear-gradient(90deg, #3d2a14, #5a3d1a, #3d2a14)', margin: '8px -8px', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />}
            <div className="flex justify-around py-2">
              {MOCK_LAYERS.slice(row * 3, row * 3 + (row === 0 ? 3 : 2)).map((layer, i) => {
                const isActive = active === layer.id;
                const shape = potionShapes[row * 3 + i];
                return (
                  <button key={layer.id} onClick={() => onSelect(layer.id)} className="flex flex-col items-center transition-all duration-300" style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}>
                    {/* Potion bottle */}
                    <div className="relative" style={{ width: '36px', height: '48px' }}>
                      {/* Cork/stopper */}
                      <div style={{ position: 'absolute', top: 0, left: '12px', width: '12px', height: '8px', background: '#8B6914', borderRadius: '2px 2px 0 0', border: '1px solid #6B4914' }} />
                      {/* Bottle neck */}
                      <div style={{ position: 'absolute', top: '7px', left: '10px', width: '16px', height: '10px', background: '#1a1a2a', border: `1px solid ${layer.configured ? `${layer.color}44` : '#333'}`, borderBottom: 'none' }} />
                      {/* Bottle body */}
                      <div style={{ position: 'absolute', top: '16px', left: '4px', width: '28px', height: '28px', background: layer.configured ? `${layer.color}33` : '#111', border: `2px solid ${isActive ? layer.color : layer.configured ? `${layer.color}66` : '#333'}`, borderRadius: '2px 2px 4px 4px', overflow: 'hidden', boxShadow: isActive ? `0 0 12px ${layer.color}44, inset 0 0 8px ${layer.color}22` : 'none' }}>
                        {/* Liquid fill */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${layer.percentage}%`, background: `linear-gradient(180deg, ${layer.color}88, ${layer.color})`, transition: 'height 0.5s ease' }} />
                        {/* Bubble */}
                        {layer.configured && (
                          <div style={{ position: 'absolute', bottom: '30%', left: '40%', width: '4px', height: '4px', borderRadius: '50%', background: `${layer.color}66` }}>
                            <animate attributeName="cy" values="70%;30%;70%" dur="2s" repeatCount="indefinite" />
                          </div>
                        )}
                        {/* Shape label */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: layer.configured ? '#fff' : '#444', fontSize: '12px', opacity: 0.7 }}>
                          {shape}
                        </div>
                      </div>
                    </div>
                    {/* Label tag */}
                    <div style={{ marginTop: '4px', padding: '1px 4px', background: '#1a120a', border: `1px solid ${layer.configured ? `${layer.color}44` : '#222'}`, borderRadius: '1px' }}>
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '9px', color: isActive ? layer.color : layer.configured ? layer.color : '#555', letterSpacing: '0.5px' }}>
                        {layer.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#5a3d1a' }}>
        BREW STATUS: {MOCK_LAYERS.filter(l => l.configured).length} POTIONS READY
      </div>
    </div>
  );
};

// ── CONCEPT 11: Pixel Radar / Sonar ──

const RadarViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 140;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="radar-glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Background grid */}
        <rect width={size} height={size} fill="#0a0f0a" rx="4" />
        {/* Concentric radar rings */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={maxR * r} fill="none" stroke="#1a3a1a" strokeWidth="1" />
        ))}
        {/* Cross hairs */}
        <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="#1a3a1a" strokeWidth="1" />
        <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="#1a3a1a" strokeWidth="1" />
        {/* Sweep line */}
        <line x1={cx} y1={cy} x2={cx + maxR} y2={cy} stroke="#22c55e" strokeWidth="1.5" opacity="0.6" style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 4s linear infinite' }}>
        </line>
        {/* Sweep gradient trail */}
        <path d={`M${cx},${cy} L${cx + maxR},${cy} A${maxR},${maxR} 0 0,0 ${cx + maxR * Math.cos(Math.PI / 6)},${cy - maxR * Math.sin(Math.PI / 6)} Z`} fill="url(#radar-sweep-grad)" opacity="0.3" style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 4s linear infinite' }} />
        <defs>
          <linearGradient id="radar-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Blips for each layer */}
        {MOCK_LAYERS.map((layer, i) => {
          const angle = (i / MOCK_LAYERS.length) * Math.PI * 2 - Math.PI / 2;
          const dist = layer.configured ? maxR * 0.4 : maxR * 0.75;
          const bx = cx + Math.cos(angle) * dist;
          const by = cy + Math.sin(angle) * dist;
          const isActive = active === layer.id;
          return (
            <g key={layer.id} onClick={() => onSelect(layer.id)} style={{ cursor: 'pointer' }}>
              {/* Blip ping */}
              {layer.configured && (
                <circle cx={bx} cy={by} r="12" fill="none" stroke={layer.color} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Blip dot */}
              <rect x={bx - (isActive ? 5 : 3)} y={by - (isActive ? 5 : 3)} width={isActive ? 10 : 6} height={isActive ? 10 : 6} fill={layer.configured ? layer.color : '#333'} filter={isActive ? 'url(#radar-glow)' : undefined} style={{ transition: 'all 0.3s ease' }} />
              {/* Label */}
              <text x={bx} y={by + (isActive ? 16 : 14)} textAnchor="middle" fill={isActive ? layer.color : layer.configured ? `${layer.color}aa` : '#2a4a2a'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '12px' : '10px', letterSpacing: '1px' }}>
                {layer.label}
              </text>
            </g>
          );
        })}
        {/* Center label */}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#22c55e" style={{ fontFamily: "'VT323', monospace", fontSize: '10px', letterSpacing: '2px' }}>SCAN</text>
        {/* Corner readout */}
        <text x={8} y={size - 8} fill="#1a5a1a" style={{ fontFamily: "'VT323', monospace", fontSize: '10px' }}>RADAR v2.1</text>
      </svg>
    </div>
  );
};

// ── CONCEPT 12: Game Boy Screen ──

const GameBoyViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div style={{ background: '#8b956d', border: '3px solid #6b7555', borderRadius: '8px', padding: '12px' }}>
      {/* Screen area */}
      <div style={{ background: '#2d3a0f', border: '3px inset #1a2408', borderRadius: '3px', padding: '8px', position: 'relative' }}>
        {/* Pixel grid overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)', pointerEvents: 'none', zIndex: 1 }} />
        {/* Screen content */}
        <div className="relative z-0 space-y-1.5">
          <div className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#8bac0f', letterSpacing: '2px' }}>
            ◄ AGENT CONFIG ►
          </div>
          <div style={{ height: '1px', background: '#3d5a0f' }} />
          {MOCK_LAYERS.map((layer) => {
            const isActive = active === layer.id;
            return (
              <button key={layer.id} onClick={() => onSelect(layer.id)} className="w-full text-left flex items-center gap-2 py-1 px-1.5 transition-all" style={{ background: isActive ? '#306230' : 'transparent', borderRadius: '1px' }}>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: isActive ? '#9bbc0f' : layer.configured ? '#8bac0f' : '#3d5a0f' }}>
                  {isActive ? '►' : ' '}
                </span>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: isActive ? '#9bbc0f' : layer.configured ? '#8bac0f' : '#3d5a0f', letterSpacing: '1px', flex: 1 }}>
                  {layer.label}
                </span>
                {/* Pixel bar */}
                <div className="flex gap-[1px]">
                  {[0, 1, 2, 3, 4].map(b => (
                    <div key={b} style={{ width: '4px', height: '6px', background: b < Math.ceil(layer.percentage / 20) ? (isActive ? '#9bbc0f' : '#6b8c0f') : '#2d3a0f', border: '1px solid #3d5a0f' }} />
                  ))}
                </div>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '10px', color: layer.configured ? '#6b8c0f' : '#2d3a0f' }}>
                  {layer.configured ? 'OK' : '--'}
                </span>
              </button>
            );
          })}
          <div style={{ height: '1px', background: '#3d5a0f', marginTop: '4px' }} />
          <div className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '10px', color: '#3d5a0f' }}>
            A:SELECT B:BACK START:SAVE
          </div>
        </div>
      </div>
      {/* Bottom label */}
      <div className="text-center mt-2" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#5a6344', letterSpacing: '1px' }}>
        AGENT·BOY
      </div>
    </div>
  );
};

// ── CONCEPT 13: Pixel Matrix / Hacker Rain ──

const MatrixViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div className="space-y-2">
      <div style={{ background: '#000', border: '2px solid #0f2a0f', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
        {/* Matrix rain background (static representation) */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          {Array.from({ length: 12 }).map((_, col) => (
            <div key={col} style={{ position: 'absolute', left: `${col * 8.33}%`, top: 0, bottom: 0, fontFamily: "'VT323', monospace", fontSize: '10px', color: '#22c55e', lineHeight: '12px', overflow: 'hidden', opacity: 0.4 + Math.random() * 0.3 }}>
              {'01001011010110100101'.split('').map((c, i) => (
                <div key={i}>{Math.random() > 0.5 ? '1' : '0'}</div>
              ))}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="relative z-10 p-3 space-y-2">
          {MOCK_LAYERS.map((layer) => {
            const isActive = active === layer.id;
            return (
              <button key={layer.id} onClick={() => onSelect(layer.id)} className="w-full text-left transition-all duration-200" style={{ padding: '6px 8px', background: isActive ? `${layer.color}15` : 'transparent', border: `1px solid ${isActive ? layer.color : 'transparent'}` }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: isActive ? layer.color : '#22c55e', opacity: isActive ? 1 : 0.6 }}>
                    [{layer.configured ? '████' : '░░░░'}]
                  </span>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: isActive ? layer.color : layer.configured ? '#22c55e' : '#0a3a0a', letterSpacing: '2px', textShadow: isActive ? `0 0 8px ${layer.color}88` : layer.configured ? '0 0 4px #22c55e44' : 'none' }}>
                    {layer.label}
                  </span>
                  <span className="ml-auto" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: layer.configured ? '#22c55e' : '#0a2a0a' }}>
                    {layer.percentage}%
                  </span>
                </div>
                {/* Decode progress */}
                <div className="mt-1 flex gap-[1px]">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{ width: '100%', height: '2px', background: i < (layer.percentage / 5) ? (isActive ? layer.color : '#22c55e') : '#0a1a0a', opacity: i < (layer.percentage / 5) ? 0.8 : 0.3 }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#0a4a0a' }}>
        DECRYPTING AGENT CORE... STAND BY
      </div>
    </div>
  );
};

// ── CONCEPT 14: Retro TV Channel Selector ──

const TVChannelViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div style={{ background: '#2a1f14', border: '4px solid #1a1208', borderRadius: '12px', padding: '12px', position: 'relative' }}>
      {/* Woodgrain texture hint */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)', borderRadius: '12px', pointerEvents: 'none' }} />
      {/* TV Screen */}
      <div className="relative" style={{ background: '#111', border: '3px solid #0a0a0a', borderRadius: '8px 8px 4px 4px', overflow: 'hidden' }}>
        {/* Screen curvature effect */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none', zIndex: 2 }} />
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', pointerEvents: 'none', zIndex: 1 }} />
        <div className="relative z-0 p-3 space-y-2">
          {MOCK_LAYERS.map((layer, i) => {
            const isActive = active === layer.id;
            return (
              <button key={layer.id} onClick={() => onSelect(layer.id)} className="w-full text-left flex items-center gap-2 transition-all py-1.5 px-2" style={{ background: isActive ? `${layer.color}20` : 'transparent' }}>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: isActive ? layer.color : '#555', textShadow: isActive ? `0 0 8px ${layer.color}66, 2px 0 0 #ff000033, -2px 0 0 #0000ff33` : '1px 0 0 #ff000022, -1px 0 0 #0000ff22', minWidth: '24px', textAlign: 'center' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: isActive ? layer.color : layer.configured ? '#ccc' : '#444', letterSpacing: '1.5px', textShadow: isActive ? `0 0 6px ${layer.color}44, 1px 0 0 #ff000022, -1px 0 0 #0000ff22` : 'none' }}>
                    {layer.label}
                  </span>
                </div>
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '10px', color: layer.configured ? '#22c55e' : '#333' }}>
                  {layer.configured ? '◉ SIGNAL' : '○ NO SIG'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Channel dial & controls */}
      <div className="flex items-center justify-between mt-3 px-2 relative z-10">
        {/* Channel knob */}
        <div className="flex items-center gap-2">
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #555, #222)', border: '2px solid #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '2px', height: '10px', background: '#aaa', transform: `rotate(${(MOCK_LAYERS.findIndex(l => l.id === active) + 1) * 60}deg)` }} />
          </div>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#8a7a5a' }}>CH</span>
        </div>
        {/* Power LED */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e88' }} />
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '10px', color: '#8a7a5a' }}>POWER</span>
        </div>
      </div>
    </div>
  );
};

// ── CONCEPT 15: Pixel Skill Tree ──

const SkillTreeViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 360;
  const cx = size / 2;
  // Tree layout: root at bottom, branches up
  const positions = [
    { x: cx, y: 40 },       // top - custom
    { x: cx - 80, y: 110 }, // upper-left - knowledge
    { x: cx + 80, y: 110 }, // upper-right - communication
    { x: cx - 50, y: 200 }, // lower-left - behavior
    { x: cx + 50, y: 200 }, // lower-right - identity (root)
  ];
  // Connections (tree edges) - child to parent
  const edges = [[3, 1], [4, 2], [1, 0], [2, 0], [3, 4]];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={260} viewBox={`0 0 ${size} 260`}>
        <defs>
          <filter id="skill-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Background constellation dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={Math.random() * size} cy={Math.random() * 260} r="0.5" fill="hsl(var(--border) / 0.15)" />
        ))}
        {/* Tree edges */}
        {edges.map(([from, to], i) => {
          const p1 = positions[from];
          const p2 = positions[to];
          const fromLayer = MOCK_LAYERS[from];
          const toLayer = MOCK_LAYERS[to];
          const connected = fromLayer.configured && toLayer.configured;
          return (
            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={connected ? '#4ade8066' : 'hsl(var(--border) / 0.15)'} strokeWidth={connected ? 2 : 1} strokeDasharray={connected ? 'none' : '4 4'} />
          );
        })}
        {/* Skill nodes */}
        {MOCK_LAYERS.map((layer, i) => {
          const pos = positions[i];
          const isActive = active === layer.id;
          const nodeSize = isActive ? 22 : 18;
          return (
            <g key={layer.id} onClick={() => onSelect(layer.id)} style={{ cursor: 'pointer' }}>
              {/* Outer ring */}
              <rect x={pos.x - nodeSize} y={pos.y - nodeSize} width={nodeSize * 2} height={nodeSize * 2} fill={layer.configured ? layer.colorLight : '#111'} stroke={isActive ? layer.color : layer.configured ? `${layer.color}88` : 'hsl(var(--border) / 0.3)'} strokeWidth={isActive ? 2.5 : 1.5} rx="3" filter={isActive ? 'url(#skill-glow)' : undefined} style={{ transition: 'all 0.3s ease' }} />
              {/* Inner diamond */}
              <rect x={pos.x - 5} y={pos.y - 5} width={10} height={10} fill={layer.configured ? layer.color : '#333'} transform={`rotate(45 ${pos.x} ${pos.y})`} opacity={layer.configured ? 0.8 : 0.3} />
              {/* Label */}
              <text x={pos.x} y={pos.y + nodeSize + 14} textAnchor="middle" fill={isActive ? layer.color : layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.4)'} style={{ fontFamily: "'VT323', monospace", fontSize: '11px', letterSpacing: '1px' }}>
                {layer.label}
              </text>
              {/* Level indicator */}
              <text x={pos.x} y={pos.y + nodeSize + 25} textAnchor="middle" fill={layer.configured ? `${layer.color}88` : '#333'} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px' }}>
                LV.{layer.configured ? '5' : '0'}
              </text>
            </g>
          );
        })}
        {/* XP bar */}
        <rect x={20} y={245} width={size - 40} height={6} fill="#111" stroke="#333" strokeWidth="1" rx="1" />
        <rect x={21} y={246} width={(size - 42) * (MOCK_LAYERS.filter(l => l.configured).length / MOCK_LAYERS.length)} height={4} fill="#f59e0b" rx="1" />
        <text x={cx} y={242} textAnchor="middle" fill="#f59e0b88" style={{ fontFamily: "'VT323', monospace", fontSize: '9px' }}>
          SKILL POINTS: {MOCK_LAYERS.filter(l => l.configured).length * 10}/{MOCK_LAYERS.length * 10}
        </text>
      </svg>
    </div>
  );
};

// ── CONCEPT 16: Pixel Spaceship Dashboard ──

const SpaceshipViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f2a 100%)', border: '2px solid #1a1a3a', borderRadius: '6px', overflow: 'hidden' }}>
      {/* Top status bar */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid #1a1a3a', background: '#08081a' }}>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e88' }} />
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#4a4a8a', letterSpacing: '1px' }}>USS AGENT</span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#3a3a6a' }}>SECTOR 7-G</span>
      </div>
      {/* Ship systems grid */}
      <div className="p-3 space-y-2">
        {MOCK_LAYERS.map((layer) => {
          const isActive = active === layer.id;
          return (
            <button key={layer.id} onClick={() => onSelect(layer.id)} className="w-full text-left transition-all duration-200" style={{ padding: '8px 10px', background: isActive ? `${layer.color}12` : '#0d0d1f', border: `1px solid ${isActive ? layer.color : layer.configured ? `${layer.color}33` : '#1a1a2a'}`, borderRadius: '2px', boxShadow: isActive ? `0 0 12px ${layer.color}22, inset 0 0 20px ${layer.color}08` : 'none' }}>
              <div className="flex items-center gap-3">
                {/* System status indicator */}
                <div style={{ width: '8px', height: '20px', background: '#0a0a1a', border: '1px solid #2a2a4a', borderRadius: '1px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${layer.percentage}%`, background: layer.configured ? layer.color : '#2a2a4a', transition: 'height 0.5s ease' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: isActive ? layer.color : layer.configured ? layer.color : '#3a3a6a', letterSpacing: '1.5px', textShadow: isActive ? `0 0 6px ${layer.color}44` : 'none' }}>
                      {layer.label}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: layer.configured ? '#22c55e' : '#2a2a4a' }}>
                      {layer.configured ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  {/* Power bar */}
                  <div className="mt-1 flex items-center gap-1">
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '9px', color: '#3a3a6a' }}>PWR</span>
                    <div className="flex gap-[1px] flex-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', background: i < (layer.percentage / 10) ? layer.color : '#1a1a2a', opacity: i < (layer.percentage / 10) ? (0.5 + i * 0.05) : 0.3, transition: 'all 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: `${layer.color}88` }}>{layer.percentage}%</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Bottom alert bar */}
      <div className="flex items-center justify-center gap-2 py-1.5" style={{ borderTop: '1px solid #1a1a3a', background: '#08081a' }}>
        <span style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#f59e0b', letterSpacing: '1px', animation: 'pulse 2s ease-in-out infinite' }}>
          ⚠ {MOCK_LAYERS.length - MOCK_LAYERS.filter(l => l.configured).length} SYSTEMS REQUIRE CONFIGURATION
        </span>
      </div>
    </div>
  );
};

// ── CONCEPT 17: Enhanced Layer Stack (Improved 3D) ──

const EnhancedLayerStackViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  return (
    <div style={{ perspective: '800px', perspectiveOrigin: '50% 35%' }}>
      <div className="flex flex-col gap-1" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(18deg) rotateY(-4deg)' }}>
        {MOCK_LAYERS.map((layer, idx) => {
          const isActive = active === layer.id;
          const depth = 12;
          const zOffset = (MOCK_LAYERS.length - idx) * 4;
          return (
            <button
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              className="relative w-full text-left transition-all duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isActive
                  ? `translateZ(${zOffset + 28}px) translateY(-4px) scale(1.03)`
                  : `translateZ(${zOffset}px) scale(1)`,
              }}
            >
              {/* Bottom 3D face */}
              <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
                height: `${depth}px`,
                transform: `translateY(${depth}px) skewX(-45deg)`,
                transformOrigin: 'top left',
                background: isActive ? `${layer.color}40` : layer.configured ? `${layer.color}20` : 'hsl(var(--border) / 0.15)',
                transition: 'all 0.5s ease',
              }} />
              {/* Right 3D face */}
              <div className="absolute top-0 right-0 pointer-events-none" style={{
                width: `${depth}px`,
                height: '100%',
                transform: `translateX(${depth}px) skewY(-45deg)`,
                transformOrigin: 'top left',
                background: isActive ? `${layer.color}30` : layer.configured ? `${layer.color}15` : 'hsl(var(--border) / 0.1)',
                transition: 'all 0.5s ease',
              }} />
              {/* Top highlight edge */}
              <div className="absolute inset-x-0 top-0 h-[1px] pointer-events-none" style={{
                background: isActive ? `${layer.color}` : 'transparent',
                boxShadow: isActive ? `0 0 8px ${layer.color}` : 'none',
                transition: 'all 0.5s ease',
              }} />
              {/* Main face */}
              <div className="relative px-3 py-3 groove-border transition-all duration-500 bg-card" style={{
                borderColor: isActive ? layer.color : layer.configured ? `${layer.color}80` : undefined,
                boxShadow: isActive
                  ? `0 0 24px ${layer.color}55, 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 ${layer.color}33`
                  : layer.configured
                    ? `0 0 10px ${layer.color}22, 0 2px 8px rgba(0,0,0,0.2)`
                    : '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                <div className="flex items-center gap-3">
                  {/* Status LED */}
                  <div className="w-2 h-2 shrink-0" style={{
                    background: layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.3)',
                    boxShadow: layer.configured ? `0 0 6px ${layer.color}` : 'none',
                  }} />
                  {/* Icon */}
                  <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{
                    background: isActive ? `${layer.color}25` : layer.configured ? `${layer.color}10` : 'hsl(var(--muted))',
                    border: `2px solid ${isActive ? layer.color : layer.configured ? `${layer.color}40` : 'hsl(var(--border))'}`,
                    boxShadow: isActive ? `inset 0 0 8px ${layer.color}20` : 'none',
                  }}>
                    <layer.icon className={cn("w-4 h-4", !isActive && !layer.configured && "text-muted-foreground")} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '17px', letterSpacing: '2px', color: isActive || layer.configured ? layer.color : 'hsl(var(--foreground))' }}>{layer.label}</span>
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.4)' }}>
                        {layer.configured ? '■ LOADED' : '□ EMPTY'}
                      </span>
                    </div>
                    {/* Segmented progress bar */}
                    <div className="mt-1.5 flex gap-[2px]">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex-1 h-[3px]" style={{
                          background: i < Math.round(layer.percentage / 10) ? layer.color : 'hsl(var(--border) / 0.3)',
                          opacity: i < Math.round(layer.percentage / 10) ? (isActive ? 1 : 0.7) : 1,
                          boxShadow: i < Math.round(layer.percentage / 10) && isActive ? `0 0 4px ${layer.color}` : 'none',
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── CONCEPT 18: Neural Network (Brain Cells) ──

const NEURON_POSITIONS = [
  { x: 180, y: 60 },   // identity - top center
  { x: 70, y: 140 },   // behavior - left
  { x: 300, y: 130 },  // communication - right
  { x: 120, y: 260 },  // knowledge - bottom-left
  { x: 260, y: 250 },  // custom - bottom-right
];

const SYNAPSE_CONNECTIONS = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 2], [3, 4], [0, 3], [0, 4],
];

const NeuralNetworkViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  const size = 370;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={320} viewBox="0 0 370 320">
        <defs>
          <filter id="neuron-glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="synapse-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Synapses (connections) */}
        {SYNAPSE_CONNECTIONS.map(([from, to], idx) => {
          const p1 = NEURON_POSITIONS[from];
          const p2 = NEURON_POSITIONS[to];
          const l1 = MOCK_LAYERS[from];
          const l2 = MOCK_LAYERS[to];
          const bothConfigured = l1.configured && l2.configured;
          const eitherActive = active === l1.id || active === l2.id;
          // Curved path via midpoint offset
          const mx = (p1.x + p2.x) / 2 + (idx % 2 === 0 ? 15 : -15);
          const my = (p1.y + p2.y) / 2 + (idx % 3 === 0 ? -10 : 10);
          return (
            <g key={idx}>
              <path
                d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
                fill="none"
                stroke={eitherActive ? (l1.configured || l2.configured ? '#3b82f6' : 'hsl(var(--border))') : bothConfigured ? '#3b82f666' : 'hsl(var(--border) / 0.2)'}
                strokeWidth={eitherActive ? 2 : 1}
                strokeDasharray={bothConfigured ? 'none' : '4 4'}
                filter={eitherActive ? 'url(#synapse-glow)' : undefined}
                style={{ transition: 'all 0.5s ease' }}
              />
              {/* Traveling pulse dot on active connections */}
              {bothConfigured && (
                <circle r="2" fill={eitherActive ? '#3b82f6' : '#3b82f644'}>
                  <animateMotion dur={`${2 + idx * 0.3}s`} repeatCount="indefinite" path={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* Neurons (cells) */}
        {MOCK_LAYERS.map((layer, idx) => {
          const pos = NEURON_POSITIONS[idx];
          const isActive = active === layer.id;
          const cellRadius = isActive ? 28 : 22;
          return (
            <g key={layer.id} onClick={() => onSelect(layer.id)} style={{ cursor: 'pointer' }}>
              {/* Outer membrane ring */}
              <circle cx={pos.x} cy={pos.y} r={cellRadius + 6} fill="none" stroke={layer.color} strokeWidth="1" opacity={isActive ? 0.6 : layer.configured ? 0.3 : 0.1} strokeDasharray={layer.configured ? 'none' : '3 3'} style={{ transition: 'all 0.5s ease' }} />
              {/* Dendrite stubs */}
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const len = isActive ? 14 : 8;
                const x2 = pos.x + Math.cos(rad) * (cellRadius + 6 + len);
                const y2 = pos.y + Math.sin(rad) * (cellRadius + 6 + len);
                const x1 = pos.x + Math.cos(rad) * (cellRadius + 6);
                const y1 = pos.y + Math.sin(rad) * (cellRadius + 6);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={layer.color} strokeWidth="1" opacity={layer.configured ? (isActive ? 0.8 : 0.4) : 0.1} style={{ transition: 'all 0.5s ease' }} />
                );
              })}
              {/* Cell body */}
              <circle cx={pos.x} cy={pos.y} r={cellRadius} fill={isActive ? `${layer.color}30` : layer.configured ? `${layer.color}15` : 'hsl(var(--card))'} stroke={layer.color} strokeWidth={isActive ? 2 : 1} opacity={layer.configured ? 1 : 0.5} filter={isActive ? 'url(#neuron-glow)' : undefined} style={{ transition: 'all 0.5s ease' }} />
              {/* Nucleus */}
              <circle cx={pos.x} cy={pos.y} r={isActive ? 8 : 5} fill={layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.3)'} opacity={isActive ? 0.9 : 0.6} style={{ transition: 'all 0.5s ease' }} />
              {/* Icon placeholder text */}
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill={layer.configured ? '#fff' : 'hsl(var(--muted-foreground))'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '10px' : '8px', pointerEvents: 'none' }}>
                {layer.configured ? '✓' : '?'}
              </text>
              {/* Label */}
              <text x={pos.x} y={pos.y + cellRadius + 18} textAnchor="middle" fill={isActive ? layer.color : layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '14px' : '12px', letterSpacing: '1px', transition: 'all 0.3s ease' }}>
                {layer.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── CONCEPT 19: Retro Pixel Brain ──

const RetroBrainViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  // Pixel brain regions mapped to layers
  const brainRegions = [
    { id: 'identity', label: 'FRONTAL', x: 90, y: 70, w: 80, h: 50, desc: 'IDENTITY' },
    { id: 'behavior', label: 'PARIETAL', x: 200, y: 55, w: 80, h: 50, desc: 'BEHAVIOR' },
    { id: 'communication', label: 'TEMPORAL', x: 60, y: 150, w: 90, h: 45, desc: 'COMMUNICATION' },
    { id: 'knowledge', label: 'OCCIPITAL', x: 230, y: 140, w: 80, h: 50, desc: 'KNOWLEDGE' },
    { id: 'custom', label: 'CEREBELLUM', x: 150, y: 210, w: 80, h: 45, desc: 'CUSTOM' },
  ];

  const size = 370;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={300} viewBox="0 0 370 300">
        <defs>
          <filter id="brain-glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Brain outline - pixelated */}
        <path
          d="M 185 30 L 250 35 L 300 55 L 330 90 L 340 130 L 335 170 L 320 200 L 290 220 L 260 235 L 230 250 L 185 260 L 140 250 L 110 235 L 80 220 L 50 200 L 35 170 L 30 130 L 40 90 L 70 55 L 120 35 Z"
          fill="none"
          stroke="hsl(var(--border) / 0.4)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        {/* Brain stem */}
        <path d="M 175 255 L 170 285 L 200 285 L 195 255" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="2" />
        {/* Central fissure */}
        <line x1="185" y1="35" x2="185" y2="200" stroke="hsl(var(--border) / 0.2)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Brain regions */}
        {brainRegions.map((region) => {
          const layer = MOCK_LAYERS.find(l => l.id === region.id)!;
          const isActive = active === region.id;
          return (
            <g key={region.id} onClick={() => onSelect(region.id)} style={{ cursor: 'pointer' }}>
              {/* Region block (pixelated rectangle) */}
              <rect
                x={region.x} y={region.y} width={region.w} height={region.h}
                fill={isActive ? `${layer.color}35` : layer.configured ? `${layer.color}18` : 'hsl(var(--card))'}
                stroke={isActive ? layer.color : layer.configured ? `${layer.color}60` : 'hsl(var(--border) / 0.3)'}
                strokeWidth={isActive ? 2 : 1}
                filter={isActive ? 'url(#brain-glow)' : undefined}
                style={{ transition: 'all 0.4s ease' }}
              />
              {/* Pixel grid inside region */}
              {Array.from({ length: Math.floor(region.w / 8) }).map((_, i) =>
                Array.from({ length: Math.floor(region.h / 8) }).map((_, j) => {
                  const filled = (i + j) % 3 === 0 && layer.configured;
                  return (
                    <rect
                      key={`${i}-${j}`}
                      x={region.x + i * 8 + 1} y={region.y + j * 8 + 1}
                      width="6" height="6"
                      fill={filled ? `${layer.color}${isActive ? '60' : '30'}` : 'transparent'}
                      style={{ transition: 'fill 0.3s ease' }}
                    />
                  );
                })
              )}
              {/* Region label */}
              <text x={region.x + region.w / 2} y={region.y + region.h / 2 - 5} textAnchor="middle" dominantBaseline="middle" fill={isActive ? layer.color : layer.configured ? `${layer.color}` : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: '11px', letterSpacing: '1px' }}>
                {region.label}
              </text>
              <text x={region.x + region.w / 2} y={region.y + region.h / 2 + 8} textAnchor="middle" fill={isActive ? layer.color : 'hsl(var(--muted-foreground) / 0.4)'} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px' }}>
                {layer.configured ? 'MAPPED' : 'UNMAPPED'}
              </text>
              {/* Status LED */}
              <circle cx={region.x + region.w - 6} cy={region.y + 6} r="3" fill={layer.configured ? layer.color : 'hsl(var(--muted-foreground) / 0.2)'} style={{ filter: layer.configured && isActive ? `drop-shadow(0 0 4px ${layer.color})` : 'none' }} />
            </g>
          );
        })}

        {/* Electric pulses between regions when configured */}
        {brainRegions.map((r1, i) =>
          brainRegions.slice(i + 1).map((r2, j) => {
            const l1 = MOCK_LAYERS.find(l => l.id === r1.id)!;
            const l2 = MOCK_LAYERS.find(l => l.id === r2.id)!;
            if (!l1.configured || !l2.configured) return null;
            const x1 = r1.x + r1.w / 2;
            const y1 = r1.y + r1.h / 2;
            const x2 = r2.x + r2.w / 2;
            const y2 = r2.y + r2.h / 2;
            return (
              <line key={`${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${l1.color}33`} strokeWidth="1" strokeDasharray="2 4">
                <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1.5s" repeatCount="indefinite" />
              </line>
            );
          })
        )}
      </svg>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {MOCK_LAYERS.map((layer) => (
          <button key={layer.id} onClick={() => onSelect(layer.id)} className={cn("flex items-center gap-1.5 px-2 py-1 transition-all", active === layer.id && "groove-border bg-card")}>
            <div className="w-2 h-2" style={{ background: layer.color }} />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: active === layer.id ? layer.color : 'hsl(var(--muted-foreground))' }}>{layer.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── CONCEPT 20: Synapse Web (Brain Web) ──

const SynapseWebViz: React.FC<{ active: string | null; onSelect: (id: string) => void }> = ({ active, onSelect }) => {
  // Central hub + radiating nodes per layer, with sub-nodes for each configKey
  const centerX = 185;
  const centerY = 160;
  const layerNodes = MOCK_LAYERS.map((layer, idx) => {
    const angle = (idx * 72 - 90) * (Math.PI / 180);
    const r = 100;
    return {
      ...layer,
      cx: centerX + Math.cos(angle) * r,
      cy: centerY + Math.sin(angle) * r,
      // Sub-nodes (simulated config keys)
      subs: Array.from({ length: 2 + (idx % 3) }).map((_, si) => {
        const subAngle = angle + ((si - 1) * 0.4);
        const subR = r + 40 + si * 12;
        return {
          x: centerX + Math.cos(subAngle) * subR,
          y: centerY + Math.sin(subAngle) * subR,
        };
      }),
    };
  });

  const size = 370;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={330} viewBox="0 0 370 330">
        <defs>
          <filter id="web-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="center-grad">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background web pattern */}
        <circle cx={centerX} cy={centerY} r="60" fill="url(#center-grad)" />
        <circle cx={centerX} cy={centerY} r="80" fill="none" stroke="hsl(var(--border) / 0.1)" strokeWidth="0.5" />
        <circle cx={centerX} cy={centerY} r="120" fill="none" stroke="hsl(var(--border) / 0.08)" strokeWidth="0.5" />

        {/* Connections from center to nodes */}
        {layerNodes.map((node) => {
          const isActive = active === node.id;
          return (
            <g key={`conn-${node.id}`}>
              <line x1={centerX} y1={centerY} x2={node.cx} y2={node.cy} stroke={isActive ? node.color : node.configured ? `${node.color}44` : 'hsl(var(--border) / 0.15)'} strokeWidth={isActive ? 2 : 1} style={{ transition: 'all 0.4s ease' }} />
              {/* Sub-node connections */}
              {node.subs.map((sub, si) => (
                <line key={si} x1={node.cx} y1={node.cy} x2={sub.x} y2={sub.y} stroke={isActive ? `${node.color}88` : node.configured ? `${node.color}22` : 'hsl(var(--border) / 0.1)'} strokeWidth="1" strokeDasharray={node.configured ? 'none' : '2 3'} style={{ transition: 'all 0.4s ease' }} />
              ))}
              {/* Pulse along connection */}
              {node.configured && (
                <circle r="2" fill={node.color} opacity={isActive ? 0.8 : 0.3}>
                  <animateMotion dur="2s" repeatCount="indefinite" path={`M ${centerX} ${centerY} L ${node.cx} ${node.cy}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* Cross-connections between adjacent nodes */}
        {layerNodes.map((node, idx) => {
          const next = layerNodes[(idx + 1) % layerNodes.length];
          const bothConfigured = node.configured && next.configured;
          return (
            <line key={`cross-${idx}`} x1={node.cx} y1={node.cy} x2={next.cx} y2={next.cy} stroke={bothConfigured ? `${node.color}30` : 'hsl(var(--border) / 0.08)'} strokeWidth="0.5" strokeDasharray="3 4" style={{ transition: 'all 0.4s ease' }} />
          );
        })}

        {/* Center hub */}
        <circle cx={centerX} cy={centerY} r="14" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x={centerX} y={centerY + 1} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--primary))" style={{ fontFamily: "'VT323', monospace", fontSize: '10px' }}>CORE</text>

        {/* Layer nodes */}
        {layerNodes.map((node) => {
          const isActive = active === node.id;
          return (
            <g key={node.id} onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
              {/* Main node */}
              <circle cx={node.cx} cy={node.cy} r={isActive ? 20 : 16} fill={isActive ? `${node.color}30` : node.configured ? `${node.color}15` : 'hsl(var(--card))'} stroke={node.color} strokeWidth={isActive ? 2.5 : 1.5} opacity={node.configured ? 1 : 0.5} filter={isActive ? 'url(#web-glow)' : undefined} style={{ transition: 'all 0.4s ease' }} />
              {/* Inner pulse */}
              {isActive && (
                <circle cx={node.cx} cy={node.cy} r="20" fill="none" stroke={node.color} strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" from="20" to="30" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Label */}
              <text x={node.cx} y={node.cy - 1} textAnchor="middle" dominantBaseline="middle" fill={isActive || node.configured ? '#fff' : 'hsl(var(--muted-foreground))'} style={{ fontFamily: "'VT323', monospace", fontSize: isActive ? '9px' : '8px', pointerEvents: 'none' }}>
                {node.label.slice(0, 4)}
              </text>
              {/* Status */}
              <text x={node.cx} y={node.cy + 8} textAnchor="middle" fill={node.configured ? node.color : 'hsl(var(--muted-foreground) / 0.4)'} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '6px', pointerEvents: 'none' }}>
                {node.configured ? '●' : '○'}
              </text>
              {/* Sub-nodes */}
              {node.subs.map((sub, si) => (
                <circle key={si} cx={sub.x} cy={sub.y} r={isActive ? 5 : 3} fill={node.configured ? `${node.color}${isActive ? '66' : '33'}` : 'hsl(var(--border) / 0.2)'} stroke={node.configured ? `${node.color}44` : 'none'} strokeWidth="0.5" style={{ transition: 'all 0.4s ease' }} />
              ))}
              {/* Full label below */}
              <text x={node.cx} y={node.cy + (isActive ? 30 : 26)} textAnchor="middle" fill={isActive ? node.color : 'hsl(var(--muted-foreground) / 0.5)'} style={{ fontFamily: "'VT323', monospace", fontSize: '11px', letterSpacing: '1px' }}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── CSS for spin animation ──
const spinKeyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// ── Demo Page ──

const TABS = [
  { id: 'stack', label: 'LAYER STACK' },
  { id: 'rings', label: 'RINGS' },
  { id: 'dna', label: 'DNA HELIX' },
  { id: 'circuit', label: 'CIRCUIT' },
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'dungeon', label: 'DUNGEON' },
  { id: 'arcade', label: 'ARCADE' },
  { id: 'cassette', label: 'CASSETTE' },
  { id: 'floppy', label: 'FLOPPY DISK' },
  { id: 'potion', label: 'POTION SHELF' },
  { id: 'radar', label: 'RADAR' },
  { id: 'gameboy', label: 'GAME BOY' },
  { id: 'matrix', label: 'MATRIX' },
  { id: 'tv', label: 'RETRO TV' },
  { id: 'skilltree', label: 'SKILL TREE' },
  { id: 'spaceship', label: 'SPACESHIP' },
  { id: 'stack2', label: 'STACK v2' },
  { id: 'neural', label: 'NEURAL NET' },
  { id: 'brain', label: 'PIXEL BRAIN' },
  { id: 'synapse', label: 'SYNAPSE WEB' },
];

const VisualizationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stack');
  const [activeLayer, setActiveLayer] = useState<string | null>('identity');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('crt');

  usePageHeader({
    title: 'Core Visualization Demo',
    breadcrumbs: [
      { label: 'Text Setter' },
      { label: 'Visualization Demo' },
    ],
  });

  const handleSelect = (id: string) => {
    setActiveLayer(activeLayer === id ? null : id);
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <style>{spinKeyframes}</style>
      <div className="container mx-auto max-w-7xl py-6">
        {/* Tab selector */}
        <div className="grid grid-cols-4 gap-0 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveLayer('identity'); }}
              className={cn(
                "py-2.5 px-3 groove-border transition-all text-center",
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
              style={{ fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '1.5px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div className="flex gap-6">
          {/* Left: Mock form area */}
          <div className="flex-1 min-w-0">
            <div className="groove-border bg-card p-6 space-y-4">
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '2px' }} className="text-foreground">
                {activeLayer ? MOCK_LAYERS.find(l => l.id === activeLayer)?.label || 'SELECT A LAYER' : 'SELECT A LAYER'}
              </span>
              <div className="border-t border-dashed border-border" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 rounded" style={{ background: 'hsl(var(--muted))', width: `${30 + i * 15}%` }} />
                    <div className="h-8 groove-border bg-muted/30" />
                  </div>
                ))}
                <div className="h-3 rounded" style={{ background: 'hsl(var(--muted))', width: '45%' }} />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 h-16 groove-border bg-muted/20 p-2">
                      <div className="h-2.5 rounded" style={{ background: 'hsl(var(--muted))', width: '60%' }} />
                      <div className="h-2 rounded mt-1.5" style={{ background: 'hsl(var(--muted) / 0.5)', width: '80%' }} />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
                ← Config fields for the selected layer appear here
              </p>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className="shrink-0" style={{ width: '400px' }}>
            <div className="groove-border bg-card p-5 sticky" style={{ top: 'calc(52px + 24px)' }}>
              <div className="text-center mb-4">
                <span className="text-primary" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', letterSpacing: '3px' }}>
                  AGENT CORE
                </span>
                <div className="text-muted-foreground mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>
                  2/5 modules configured
                </div>
              </div>

              {activeTab === 'stack' && <LayerStackViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'rings' && <ConcentricRingsViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'dna' && <DNAHelixViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'circuit' && <CircuitBoardViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'terminal' && <RetroTerminalViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'dungeon' && <DungeonMapViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'arcade' && <ArcadeCabinetViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'cassette' && <CassetteDeckViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'floppy' && <FloppyDiskViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'potion' && <PotionShelfViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'radar' && <RadarViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'gameboy' && <GameBoyViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'matrix' && <MatrixViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'tv' && <TVChannelViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'skilltree' && <SkillTreeViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'spaceship' && <SpaceshipViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'stack2' && <EnhancedLayerStackViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'neural' && <NeuralNetworkViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'brain' && <RetroBrainViz active={activeLayer} onSelect={handleSelect} />}
              {activeTab === 'synapse' && <SynapseWebViz active={activeLayer} onSelect={handleSelect} />}

              {/* Action buttons */}
              <div className="mt-5 space-y-2">
                <button
                  className="w-full h-9 flex items-center justify-center gap-2 groove-border bg-card transition-colors hover:bg-muted"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '0.5px' }}
                >
                  SEE FULL PROMPT
                </button>
                <button
                  className="w-full h-9 flex items-center justify-center gap-2 transition-colors"
                  style={{
                    fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '0.5px',
                    backgroundColor: '#2a6e3f', color: '#fff', border: '3px groove #1e5730',
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  CONVERSATION EXAMPLES
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* ─── ANALYTICS DASHBOARD DEMOS ─── */}
        <div className="mt-16 mb-8">
          <div className="border-t border-dashed border-border mb-8" />
          <div className="text-center mb-6">
            <span className="text-primary" style={{ fontFamily: "'VT323', monospace", fontSize: '26px', letterSpacing: '4px' }}>
              ANALYTICS DASHBOARD CONCEPTS
            </span>
            <div className="text-muted-foreground mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
              12 visualization styles for metrics, charts, and date ranges
            </div>
          </div>

          {/* Analytics tab selector */}
          <div className="grid grid-cols-4 gap-0 mb-8">
            {ANALYTICS_VIZ_DEMOS.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveAnalyticsTab(demo.id)}
                className={cn(
                  "py-2.5 px-3 groove-border transition-all text-center",
                  activeAnalyticsTab === demo.id
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
                style={{ fontFamily: "'VT323', monospace", fontSize: '16px', letterSpacing: '1.5px' }}
              >
                {demo.label}
              </button>
            ))}
          </div>

          {/* Active analytics demo */}
          <div className="groove-border bg-card p-6" style={{ maxWidth: '520px', margin: '0 auto' }}>
            {ANALYTICS_VIZ_DEMOS.map((demo) => {
              if (demo.id !== activeAnalyticsTab) return null;
              const Component = demo.component;
              return <Component key={demo.id} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationDemo;
