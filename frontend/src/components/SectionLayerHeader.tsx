import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CORE_LAYERS, type CoreLayerId } from '@/components/AgentCoreVisualization';
import type { ParamState } from '@/components/SetterParameterField';
import { TONE_STYLE_SUBSECTIONS, STRATEGY_SUBSECTIONS, GUARDRAILS_SUBSECTIONS, IDENTITY_SUBSECTIONS, COMPANY_SUBSECTIONS } from '@/data/setterConfigParameters';
import type { SubsectionDef } from '@/data/setterConfigParameters';

const STATUS_COLORS = {
  complete: { text: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.2)', border: 'hsl(142 71% 45% / 0.4)', glow: 'rgba(34, 197, 94, 0.3)' },
  partial:  { text: 'hsl(38 92% 50%)',  bg: 'hsl(38 92% 50% / 0.2)',  border: 'hsl(38 92% 50% / 0.4)',  glow: 'rgba(245, 158, 11, 0.3)' },
  danger:   { text: 'hsl(0 84% 60%)',   bg: 'hsl(0 84% 60% / 0.2)',   border: 'hsl(0 84% 60% / 0.4)',   glow: 'rgba(239, 68, 68, 0.3)' },
  empty:    { text: 'hsl(0 84% 60%)',   bg: 'hsl(0 84% 60% / 0.2)',   border: 'hsl(0 84% 60% / 0.4)',   glow: 'rgba(239, 68, 68, 0.3)' },
};

function getColors(status: { isComplete: boolean; configured: number; isDanger?: boolean }) {
  if (status.isComplete) return STATUS_COLORS.complete;
  if (status.isDanger) return STATUS_COLORS.danger;
  if (status.configured > 0) return STATUS_COLORS.partial;
  return STATUS_COLORS.empty;
}

// Helper: filter out conditional child params whose parent condition isn't met
function getVisibleParams(params: typeof TONE_STYLE_SUBSECTIONS[0]['params'], paramStates?: Record<string, ParamState>) {
  return params.filter(p => {
    if (p.showWhenParent) {
      const parentState = paramStates?.[p.showWhenParent];
      if (!parentState || String(parentState.value) !== p.showWhenParentValue) return false;
    }
    return true;
  });
}

function isParamConfigured(param: typeof TONE_STYLE_SUBSECTIONS[0]['params'][0], s: ParamState | undefined): boolean {
  if (!s) return false;
  if (param.type === 'toggle' || param.type === 'toggle_text') return s.enabled;
  if (param.type === 'select') return !!s.value;
  if (param.type === 'number') return s.value !== undefined && s.value !== '';
  // For text/textarea params, also count as configured if customPrompt has content (AI-modified)
  return !!s.value || !!s.customPrompt?.trim();
}

function getLayerStatus(
  layerId: CoreLayerId,
  configs: Record<string, { selectedOption: string; customContent: string } | null>,
  paramStates?: Record<string, ParamState>,
  subsectionOverrides?: Record<string, SubsectionDef[]>,
  settingsKeysOverride?: string[],
) {
  const layer = CORE_LAYERS.find(l => l.id === layerId);
  if (!layer) return { configured: 0, total: 0, isComplete: false };

  // Subsection-based layers
  const defaultSubsectionMap: Record<string, SubsectionDef[]> = {
    identity: IDENTITY_SUBSECTIONS,
    company: COMPANY_SUBSECTIONS,
    tone_style: TONE_STYLE_SUBSECTIONS,
    strategy: STRATEGY_SUBSECTIONS,
    guardrails: GUARDRAILS_SUBSECTIONS,
  };
  const subsectionMap = subsectionOverrides || defaultSubsectionMap;

  if (subsectionMap[layer.id]) {
    const subsections = subsectionMap[layer.id];
    let configured = 0;
    let total = 0;

    // Count non-subsection config keys
    const nonSubKeys = layer.configKeys.filter(k => !k.startsWith('_subsection'));
    for (const key of nonSubKeys) {
      total++;
      const cfg = configs[key];
      if (key === 'agent_name') {
        if (cfg?.selectedOption?.trim()) configured++;
      } else if (key === 'agent_goal') {
        // Multi-select: selectedOption holds comma-separated values
        if (cfg?.selectedOption?.trim()) configured++;
      } else {
        // Custom prompt fields — selectedOption 'custom' is just a marker, only content matters
        if (cfg?.customContent?.trim()) configured++;
      }
    }

    // Count param states — only visible (non-hidden conditional) params
    if (paramStates) {
      for (const sub of subsections) {
        const visible = getVisibleParams(sub.params, paramStates);
        for (const param of visible) {
          total++;
          if (isParamConfigured(param, paramStates[param.key])) configured++;
        }
      }
    }

    return { configured, total, isComplete: total > 0 && configured >= total };
  }

  if (layer.id === 'deploy') {
    const isVoiceMode = !!subsectionOverrides;
    const deployKeys = isVoiceMode ? layer.configKeys.filter(k => k !== 'custom_prompt') : layer.configKeys;
    let configured = 0;
    const total = deployKeys.length;
    for (const key of deployKeys) {
      const cfg = configs[key];
      if (key.startsWith('_deploy')) {
        if (cfg?.selectedOption === 'approved') configured++;
      } else {
        // custom_prompt — content matters
        if (cfg?.customContent?.trim()) configured++;
      }
    }
    const isDanger = configured === 0;
    return { configured, total, isComplete: configured >= total, isDanger };
  }

  // Settings layer — use override keys if provided (voice mode has different settings)
  const effectiveKeys = (layer.id === 'settings' && settingsKeysOverride) ? settingsKeysOverride : layer.configKeys;
  let configured = 0;
  const total = effectiveKeys.length;
  for (const key of effectiveKeys) {
    const cfg = configs[key];
    if (cfg) {
      if (key.startsWith('_') || key === 'agent_name') {
        // Settings synthetic keys & text inputs — value lives in selectedOption
        if (cfg.selectedOption?.trim()) configured++;
      } else {
        // Custom prompt fields — only content matters
        if (cfg.customContent?.trim()) configured++;
      }
    }
  }
  return { configured, total, isComplete: total > 0 && configured >= total };
}

interface SectionLayerHeaderProps {
  layerId: CoreLayerId;
  configs: Record<string, { selectedOption: string; customContent: string } | null>;
  isActive?: boolean;
  paramStates?: Record<string, ParamState>;
  subsectionOverrides?: Record<string, SubsectionDef[]>;
  settingsKeysOverride?: string[];
}

export const SectionLayerHeader: React.FC<SectionLayerHeaderProps> = ({ layerId, configs, isActive = false, paramStates, subsectionOverrides, settingsKeysOverride }) => {
  const layer = CORE_LAYERS.find(l => l.id === layerId);
  const status = useMemo(() => getLayerStatus(layerId, configs, paramStates, subsectionOverrides, settingsKeysOverride), [layerId, configs, paramStates, subsectionOverrides, settingsKeysOverride]);
  const colors = getColors(status);

  if (!layer) return null;
  const Icon = layer.icon;

  return (
    <div
      className="relative mb-6 transition-all duration-200"
      style={{
        transform: isActive ? 'scale(1.03)' : 'scale(1)',
        zIndex: isActive ? 10 : 1,
      }}
    >
      <div
        className={cn(
          "relative px-3 py-2.5 transition-all duration-200",
          !isActive && "groove-border",
        )}
        style={{
          padding: '10px 12px',
          background: isActive
            ? `linear-gradient(90deg, ${colors.bg} 0%, hsl(var(--card)) 100%)`
            : 'hsl(var(--card))',
          ...(isActive ? {
            border: `1.5px solid ${colors.text}`,
            boxShadow: `0 0 12px ${colors.glow}, 0 0 4px ${colors.glow}, inset 0 0 16px ${colors.bg}`,
          } : {
            boxShadow: 'none',
          }),
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Arrow + Icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={isActive ? 'animate-pulse' : ''}
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: '12px',
                color: isActive ? colors.text : 'transparent',
                textShadow: isActive ? `0 0 6px ${colors.glow}` : 'none',
                transition: 'color 0.2s ease',
                width: '10px',
                display: 'inline-block',
              }}
            >
              {isActive ? '▶' : ''}
            </span>
            <div
              className="w-7 h-7 flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                background: isActive ? 'hsl(var(--background) / 0.8)' : colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{
                color: isActive ? colors.text : 'hsl(var(--foreground))',
                filter: isActive ? `drop-shadow(0 0 4px ${colors.glow})` : 'none',
              }}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Label + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className="transition-colors duration-200"
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '18px',
                  letterSpacing: '1.5px',
                  color: status.isComplete || status.configured > 0 ? colors.text : 'hsl(var(--muted-foreground))',
                }}
              >
                {layer.label}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  color: colors.text,
                }}
              >
                {status.isComplete ? '✓ Set' : `${status.configured}/${status.total}`}
              </span>
            </div>

            {/* Segmented progress bar */}
            <div className="mt-1 flex gap-[2px] w-full">
              {Array.from({ length: Math.min(status.total, 20) }).map((_, i) => {
                const displayConfigured = status.total > 20
                  ? Math.round((status.configured / status.total) * 20)
                  : status.configured;
                return (
                  <div
                    key={i}
                    className="h-[3px] flex-1 transition-all duration-500"
                    style={{
                      background: i < displayConfigured ? colors.text : 'hsl(var(--border) / 0.3)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};