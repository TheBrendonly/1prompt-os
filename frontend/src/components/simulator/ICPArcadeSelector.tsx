import React from 'react';
import { cn } from '@/lib/utils';
import { User, Target, Sparkles, Shield, Zap } from '@/components/icons';
import type { ICPProfile } from './ICPNodeGraph';

const ICP_ICONS = [User, Target, Sparkles, Shield, Zap];

const ICP_COLORS_BASE = [
  { glow: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)' },
  { glow: 'rgba(34,197,94,0.3)',  bg: 'rgba(34,197,94,0.2)',  border: 'rgba(34,197,94,0.4)' },
  { glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' },
  { glow: 'rgba(168,85,247,0.3)', bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.4)' },
  { glow: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.2)',  border: 'rgba(239,68,68,0.4)' },
];

const STATUS_COLORS = {
  complete: { text: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.2)', border: 'hsl(142 71% 45% / 0.4)', glow: 'rgba(34, 197, 94, 0.3)' },
  partial:  { text: 'hsl(38 92% 50%)',  bg: 'hsl(38 92% 50% / 0.2)',  border: 'hsl(38 92% 50% / 0.4)',  glow: 'rgba(245, 158, 11, 0.3)' },
  empty:    { text: 'hsl(0 84% 60%)',   bg: 'hsl(0 84% 60% / 0.2)',   border: 'hsl(0 84% 60% / 0.4)',   glow: 'rgba(239, 68, 68, 0.3)' },
};

export function getICPCompletion(icp: ICPProfile) {
  const fields = [
    !!icp.name,
    !!icp.description,
    icp.persona_count >= 1,
    icp.behaviors.length > 0,
    !!icp.first_message_detail,
    !!icp.lead_trigger,
    !!icp.lead_knowledge,
    !!icp.concerns,
    !!icp.location,
  ];
  const configured = fields.filter(Boolean).length;
  return { configured, total: fields.length };
}

function getStatusColors(configured: number, total: number) {
  if (configured >= total) return STATUS_COLORS.complete;
  if (configured > 0) return STATUS_COLORS.partial;
  return STATUS_COLORS.empty;
}

interface ICPArcadeSelectorProps {
  icps: ICPProfile[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function ICPArcadeSelector({ icps, selectedIndex, onSelect }: ICPArcadeSelectorProps) {
  return (
    <div className="grid w-full gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative' }}>
      {icps.map((icp, i) => {
        const isActive = selectedIndex === i;
        const baseColor = ICP_COLORS_BASE[i % ICP_COLORS_BASE.length];
        const Icon = ICP_ICONS[i % ICP_ICONS.length];
        const { configured, total } = getICPCompletion(icp);
        const status = getStatusColors(configured, total);
        const displayTotal = Math.min(total, 20);
        const displayConfigured = total > 0 ? Math.round((configured / total) * displayTotal) : 0;

        return (
          <div key={i} className="relative" style={{ minHeight: '120px' }}>
            <button
              onClick={() => onSelect(i)}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-200",
                !isActive && "groove-border",
              )}
              style={{
                padding: '8px 8px 10px',
                background: isActive
                  ? `linear-gradient(180deg, ${status.bg} 0%, hsl(var(--card)) 100%)`
                  : 'hsl(var(--card))',
                ...(isActive ? {
                  border: `1.5px solid ${status.text}`,
                  boxShadow: `0 0 12px ${status.glow}, 0 0 4px ${status.glow}, inset 0 0 16px ${status.bg}`,
                  transform: 'scale(1.03)',
                  zIndex: 10,
                } : {
                  boxShadow: 'none',
                  transform: 'scale(1)',
                  zIndex: 1,
                }),
              }}
            >
              {/* Pulsing arrow */}
              <span
                className={cn(isActive && 'animate-pulse')}
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '12px',
                  color: isActive ? status.text : 'transparent',
                  textShadow: isActive ? `0 0 6px ${status.glow}` : 'none',
                  lineHeight: 1,
                  height: '12px',
                  marginBottom: '6px',
                }}
              >
                ▼
              </span>

              {/* Icon */}
              <div
                className="w-7 h-7 flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  background: isActive ? 'hsl(var(--background) / 0.8)' : status.bg,
                  border: `1px solid ${status.border}`,
                }}
              >
                <div style={{
                  color: isActive ? status.text : 'hsl(var(--foreground))',
                  filter: isActive ? `drop-shadow(0 0 4px ${status.glow})` : 'none',
                }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Name */}
              <span
                className="truncate w-full mt-1.5"
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '18px',
                  letterSpacing: '1.5px',
                  lineHeight: 1.1,
                  color: status.text,
                }}
              >
                {(icp.name || `ICP ${i + 1}`).substring(0, 20).toUpperCase()}
              </span>

              {/* Persona count */}
              <span
                className="mt-0.5"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  color: status.text,
                }}
              >
                {icp.persona_count} personas
              </span>

              {/* Segmented progress bar */}
              <div className="flex gap-[2px] w-full mt-1.5">
                {Array.from({ length: displayTotal }).map((_, j) => (
                  <div
                    key={j}
                    className="h-[3px] flex-1 transition-all duration-500"
                    style={{
                      background: j < displayConfigured ? status.text : 'hsl(var(--border) / 0.3)',
                    }}
                  />
                ))}
              </div>

              {/* Scanlines overlay */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.04) 1px, rgba(0,0,0,0.04) 2px)',
                  }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
