import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { User, Sparkles, MessageSquare, Database, Cpu, Rocket, Building2, Target, Shield, Lock, Maximize2 } from '@/components/icons';
import { TONE_STYLE_SUBSECTIONS, STRATEGY_SUBSECTIONS, GUARDRAILS_SUBSECTIONS, IDENTITY_SUBSECTIONS, COMPANY_SUBSECTIONS } from '@/data/setterConfigParameters';
import type { SubsectionDef } from '@/data/setterConfigParameters';
import type { ParamState } from '@/components/SetterParameterField';

// ── Status Colors ──
const STATUS_COLORS = {
  complete: { text: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.2)', border: 'hsl(142 71% 45% / 0.4)', glow: 'rgba(34, 197, 94, 0.3)', side: 'rgba(34, 197, 94, 0.15)' },
  partial:  { text: 'hsl(38 92% 50%)',  bg: 'hsl(38 92% 50% / 0.2)',  border: 'hsl(38 92% 50% / 0.4)',  glow: 'rgba(245, 158, 11, 0.3)', side: 'rgba(245, 158, 11, 0.15)' },
  empty:    { text: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.2)', border: 'hsl(0 84% 60% / 0.4)', glow: 'rgba(239, 68, 68, 0.3)', side: 'rgba(239, 68, 68, 0.15)' },
  danger:   { text: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.2)', border: 'hsl(0 84% 60% / 0.4)', glow: 'rgba(239, 68, 68, 0.3)', side: 'rgba(239, 68, 68, 0.15)' },
  active:   { text: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.15)', border: 'hsl(var(--primary) / 0.5)', glow: 'hsl(var(--primary) / 0.25)', side: 'hsl(var(--primary) / 0.12)' },
} as const;

function getStatusColors(status: { isComplete: boolean; configured: number; isDanger?: boolean }) {
  if (status.isComplete) return STATUS_COLORS.complete;
  if (status.isDanger) return STATUS_COLORS.danger;
  if (status.configured > 0) return STATUS_COLORS.partial;
  return STATUS_COLORS.empty;
}

// ── Layer Definitions (8 Layers) ──

export type CoreLayerId = 'settings' | 'identity' | 'company' | 'tone_style' | 'strategy' | 'guardrails' | 'deploy';

interface CoreLayer {
  id: CoreLayerId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  configKeys: string[];
}

export const CORE_LAYERS: CoreLayer[] = [
  { id: 'settings', label: 'SETTINGS', icon: Cpu, configKeys: ['_setter_name', '_ai_model', '_response_delay', '_followup_delays', '_followup_instructions', '_cancellation_conditions', '_file_processing', '_human_transfer'] },
  { id: 'identity', label: 'IDENTITY', icon: User, configKeys: ['agent_name', '_subsection_identity'] },
  { id: 'company', label: 'COMPANY', icon: Building2, configKeys: ['_subsection_company'] },
  { id: 'tone_style', label: 'PERSONALITY & STYLE', icon: Sparkles, configKeys: ['agent_goal', '_subsection_tone_style'] },
  { id: 'strategy', label: 'STRATEGY', icon: Target, configKeys: ['_subsection_strategy'] },
  { id: 'guardrails', label: 'GUARDRAILS', icon: Shield, configKeys: ['_subsection_guardrails'] },
  { id: 'deploy', label: 'DEPLOY', icon: Rocket, configKeys: ['custom_prompt', '_deploy_examples'] },
];

// ── Completion Status Helper ──

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

export function getLayerStatus(
  layer: CoreLayer,
  configs: Record<string, { selectedOption: string; customContent: string } | null>,
  paramStates?: Record<string, ParamState>,
  subsectionOverrides?: Record<string, SubsectionDef[]>,
  settingsKeysOverride?: string[],
): { configured: number; total: number; isComplete: boolean; percentage: number; isDanger?: boolean } {
  // Subsection-based layers (identity, company, tone_style, strategy, guardrails)
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
    
    // For identity/company, also count old config keys
    let configured = 0;
    let total = 0;
    
    // Count non-subsection config keys
    const nonSubKeys = layer.configKeys.filter(k => !k.startsWith('_subsection'));
    for (const key of nonSubKeys) {
      total++;
      const cfg = configs[key];
      if (key === 'agent_name') {
        // Text input — value lives in selectedOption
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
    
    return { configured, total, isComplete: total > 0 && configured >= total, percentage: total > 0 ? Math.round((configured / total) * 100) : 0 };
  }

  // Deploy layer
  if (layer.id === 'deploy') {
    // In voice mode (subsectionOverrides present), only count _deploy_examples, not custom_prompt
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
    return { configured, total, isComplete: configured >= total, percentage: Math.round((configured / total) * 100), isDanger };
  }

  // Standard layers (custom, settings) — use override keys for voice settings
  const effectiveKeys = (layer.id === 'settings' && settingsKeysOverride) ? settingsKeysOverride : layer.configKeys;
  let configured = 0;
  const total = effectiveKeys.length;
  for (const key of effectiveKeys) {
    const cfg = configs[key];
    if (key.startsWith('_') || key === 'agent_name') {
      // Settings synthetic keys & text inputs — value lives in selectedOption
      if (cfg?.selectedOption?.trim()) configured++;
    } else {
      // Custom prompt fields — only content matters
      if (cfg?.customContent?.trim()) configured++;
    }
  }
  return { configured, total, isComplete: total > 0 && configured >= total, percentage: total > 0 ? Math.round((configured / total) * 100) : 0 };
}

// ── Segmented Progress Bar ──

const SegmentedProgressBar: React.FC<{ configured: number; total: number; colors: { text: string; bg: string; border: string; glow: string; side: string } }> = ({ configured, total, colors }) => {
  const displayTotal = Math.min(total, 20); // Cap segments for display
  const displayConfigured = total > 0 ? Math.round((configured / total) * displayTotal) : 0;
  return (
    <div className="mt-1 flex gap-[2px] w-full">
      {Array.from({ length: displayTotal }).map((_, i) => (
        <div
          key={i}
          className="h-[3px] flex-1 transition-all duration-500"
          style={{ background: i < displayConfigured ? colors.text : 'hsl(var(--border) / 0.3)' }}
        />
      ))}
    </div>
  );
};

// ── Subsection Progress Panel (replaces radar) ──

const SubsectionProgressPanel: React.FC<{
  isVisible: boolean;
  activeLayerId: CoreLayerId | null;
  paramStates: Record<string, ParamState>;
  activeSubsection?: string | null;
  onSubsectionClick?: (subsectionKey: string) => void;
  subsectionOverrides?: Record<string, SubsectionDef[]>;
  configs?: Record<string, { selectedOption: string; customContent: string } | null>;
  hideSettingsSubsections?: boolean;
}> = ({ isVisible, activeLayerId, paramStates, activeSubsection, onSubsectionClick, subsectionOverrides, configs, hideSettingsSubsections }) => {
  // Settings no longer has subsection nav — removed General/Booking titles

  const defaultMap: Record<string, SubsectionDef[]> = {
    tone_style: TONE_STYLE_SUBSECTIONS,
    strategy: STRATEGY_SUBSECTIONS,
    guardrails: GUARDRAILS_SUBSECTIONS,
  };
  const resolvedMap = subsectionOverrides || defaultMap;

  // Settings layer uses hardcoded subsection stats from configs
  if (activeLayerId === 'settings' && !hideSettingsSubsections) {
    // General: _setter_name, _ai_model, _response_delay
    // Follow-Up: _followup_delays, _followup_instructions, _cancellation_conditions
    // Features: _file_processing, _human_transfer
    const settingsSubsections = [
      {
        key: 'settings_general', label: 'General',
        keys: ['_setter_name', '_ai_model', '_response_delay'],
      },
      {
        key: 'settings_followup', label: 'Follow-Up',
        keys: ['_followup_delays', '_followup_instructions', '_cancellation_conditions'],
      },
      {
        key: 'settings_features', label: 'Features',
        keys: ['_file_processing', '_human_transfer'],
      },
    ];

    const settingsStats = settingsSubsections.map(sub => {
      const total = sub.keys.length;
      let configured = 0;
      for (const k of sub.keys) {
        const cfg = configs?.[k];
        if (cfg?.selectedOption?.trim()) configured++;
      }
      return { key: sub.key, label: sub.label, configured, total };
    });

    return (
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
          maxHeight: isVisible ? '200px' : '0px',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div
          className="relative groove-border"
          style={{
            background: 'hsl(var(--card))',
            overflow: 'hidden',
            margin: '0 6px 6px 0',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.015) 2px, hsl(var(--primary) / 0.015) 4px)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div className="relative space-y-2.5" style={{ zIndex: 3 }}>
            {settingsStats.map((stat, i) => {
              const isComplete = stat.configured >= stat.total;
              const hasProgress = stat.configured > 0;
              const isActiveSubsection = activeSubsection === stat.key;
              const statusColor = isComplete ? 'hsl(142 71% 45%)' : hasProgress ? 'hsl(38 92% 50%)' : 'hsl(var(--muted-foreground))';
              return (
                <div
                  key={i}
                  onClick={() => onSubsectionClick?.(stat.key)}
                  style={{
                    padding: '4px 4px 4px 10px',
                    margin: '0 -4px',
                    cursor: onSubsectionClick ? 'pointer' : 'default',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease',
                    background: isActiveSubsection ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    boxShadow: isActiveSubsection ? 'inset 3px 0 0 hsl(var(--primary))' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.5px', color: statusColor, fontWeight: isActiveSubsection ? 600 : 400 }}>
                      {stat.label.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: statusColor }}>
                      {stat.configured}/{stat.total}
                    </span>
                  </div>
                  <div className="flex gap-[2px] w-full">
                    {Array.from({ length: stat.total }).map((_, j) => (
                      <div
                        key={j}
                        className="h-[4px] flex-1 transition-all duration-500"
                        style={{
                          background: j < stat.configured
                            ? (isComplete ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)')
                            : isActiveSubsection ? 'hsl(var(--foreground) / 0.15)' : 'hsl(var(--border) / 0.3)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const subsections = (activeLayerId && resolvedMap[activeLayerId]) ? resolvedMap[activeLayerId] : [];
  if (subsections.length === 0) return null;

  const stats = subsections.map((sub, idx) => {
    const visible = getVisibleParams(sub.params, paramStates);
    let configured = visible.filter(p => isParamConfigured(p, paramStates[p.key])).length;
    let total = visible.length;

    // For tone_style layer, count agent_goal under first subsection (Persona & Behavior)
    if (activeLayerId === 'tone_style' && idx === 0 && configs) {
      total++;
      const goalCfg = configs['agent_goal'];
      if (goalCfg?.customContent?.trim() || goalCfg?.selectedOption?.trim()) configured++;
    }

    return { key: sub.key, label: sub.label, configured, total };
  });

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
        maxHeight: isVisible ? '200px' : '0px',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className="relative groove-border"
        style={{
          background: 'hsl(var(--card))',
          overflow: 'hidden',
          margin: '0 6px 6px 0',
          padding: '10px 12px',
        }}
      >
        {/* Scanlines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.015) 2px, hsl(var(--primary) / 0.015) 4px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <div className="relative space-y-2.5" style={{ zIndex: 3 }}>
          {stats.map((stat, i) => {
            const pct = stat.total > 0 ? Math.round((stat.configured / stat.total) * 100) : 0;
            const isComplete = stat.configured >= stat.total;
            const hasProgress = stat.configured > 0;
            const isActiveSubsection = activeSubsection === stat.key;
            const statusColor = isComplete ? 'hsl(142 71% 45%)' : hasProgress ? 'hsl(38 92% 50%)' : 'hsl(var(--muted-foreground))';
            return (
                <div
                key={i}
                onClick={() => onSubsectionClick?.(stat.key)}
                style={{
                  padding: '4px 4px 4px 10px',
                  margin: '0 -4px',
                  cursor: onSubsectionClick ? 'pointer' : 'default',
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                  background: isActiveSubsection ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  boxShadow: isActiveSubsection ? 'inset 3px 0 0 hsl(var(--primary))' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      color: statusColor,
                      fontWeight: isActiveSubsection ? 600 : 400,
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {stat.label.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '10px',
                      color: statusColor,
                    }}
                  >
                    {stat.configured}/{stat.total}
                  </span>
                </div>
                {/* Bar */}
                <div className="flex gap-[2px] w-full">
                  {stat.total <= 15 ? (
                    Array.from({ length: stat.total }).map((_, j) => (
                      <div
                        key={j}
                        className="h-[4px] flex-1 transition-all duration-500"
                        style={{
                          background: j < stat.configured
                            ? (isComplete ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)')
                            : isActiveSubsection ? 'hsl(var(--foreground) / 0.15)' : 'hsl(var(--border) / 0.3)',
                        }}
                      />
                    ))
                  ) : (
                    <div className="h-[4px] w-full relative" style={{ background: isActiveSubsection ? 'hsl(var(--foreground) / 0.15)' : 'hsl(var(--border) / 0.3)' }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isComplete ? 'hsl(142 71% 45%)' : 'hsl(38 92% 50%)',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Component ──

interface AgentCoreVisualizationProps {
  configs: Record<string, { selectedOption: string; customContent: string } | null>;
  activeLayer: CoreLayerId | null;
  onLayerClick: (layerId: CoreLayerId) => void;
  onSubsectionClick?: (subsectionKey: string) => void;
  onExpandPrompt?: () => void;
  disabled?: boolean;
  paramStates?: Record<string, ParamState>;
  activeSubsection?: string | null;
  lockedLayers?: Set<CoreLayerId>;
  /** Override subsection definitions for voice mode */
  subsectionOverrides?: Record<string, SubsectionDef[]>;
  /** Override the "SETTER CORE" title */
  coreTitle?: string;
  /** Hide the General/Follow-Up/Features subsection labels for Settings */
  hideSettingsSubsections?: boolean;
  /** Override settings config keys for voice mode */
  settingsKeysOverride?: string[];
}

export const AgentCoreVisualization: React.FC<AgentCoreVisualizationProps> = ({
  configs,
  activeLayer,
  onLayerClick,
  onSubsectionClick,
  onExpandPrompt,
  disabled = false,
  paramStates = {},
  activeSubsection = null,
  lockedLayers,
  subsectionOverrides,
  coreTitle = 'SETTER CORE',
  hideSettingsSubsections = false,
  settingsKeysOverride,
}) => {
  const layerStatuses = useMemo(() => {
    const statuses: Record<CoreLayerId, ReturnType<typeof getLayerStatus>> = {} as any;
    for (const layer of CORE_LAYERS) {
      statuses[layer.id] = getLayerStatus(layer, configs, paramStates, subsectionOverrides, settingsKeysOverride);
    }
    return statuses;
  }, [configs, paramStates, subsectionOverrides, settingsKeysOverride]);

  const overallConfigured = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const s of Object.values(layerStatuses)) {
      total += s.total;
      done += s.configured;
    }
    return { total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [layerStatuses]);

  const allComplete = overallConfigured.done === overallConfigured.total && overallConfigured.total > 0;
  const isSubsectionLayerActive = activeLayer === 'settings' || activeLayer === 'tone_style' || activeLayer === 'strategy' || activeLayer === 'guardrails';

  return (
    <div className="relative flex flex-col" style={{ paddingBottom: '0px', paddingTop: '0px' }}>
      {/* Expand prompt button — positioned in the title row */}

      {/* Title */}
      <div className="relative flex items-center justify-center" style={{ paddingTop: '23px', paddingBottom: '23px', lineHeight: 0.8 }}>
        <span
          className="inline-block transition-colors duration-500 uppercase tracking-wider text-foreground"
          style={{ fontFamily: "'VT323', monospace", fontSize: '28px', lineHeight: 0.8, margin: 0, padding: 0 }}
        >
          {coreTitle}
        </span>
        {onExpandPrompt && (
          <button
            type="button"
            onClick={onExpandPrompt}
            className="absolute z-50 h-7 w-7 flex items-center justify-center groove-border bg-card hover:bg-accent transition-colors"
            style={{ right: '6px' }}
            aria-label="View full setter prompt"
          >
            <Maximize2 className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}
      </div>

      {/* Arcade Layer Select */}
      <div className="w-full flex flex-col gap-1">
        {CORE_LAYERS.map((layer) => {
          const isLocked = lockedLayers?.has(layer.id) ?? false;
          const status = layerStatuses[layer.id];
          const isActive = activeLayer === layer.id;
          const Icon = layer.icon;
          const statusColors = isLocked ? STATUS_COLORS.empty : getStatusColors(status);
          const contentColors = statusColors;

          return (
            <React.Fragment key={layer.id}>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => !disabled && onLayerClick(layer.id)}
                  disabled={disabled}
                  aria-label={`Open ${layer.label}`}
                  className={cn(
                    "relative w-full text-left transition-all duration-200",
                    !isActive && "groove-border",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                  )}
                  style={{
                    padding: '10px 12px',
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                    background: isLocked
                      ? 'hsl(var(--muted) / 0.3)'
                      : isActive
                        ? `linear-gradient(90deg, ${statusColors.bg} 0%, hsl(var(--card)) 100%)`
                        : 'hsl(var(--card))',
                    ...(isActive ? {
                      border: `1.5px solid ${statusColors.text}`,
                      boxShadow: `0 0 12px ${statusColors.glow}, 0 0 4px ${statusColors.glow}, inset 0 0 16px ${statusColors.bg}`,
                    } : {
                      boxShadow: 'none',
                    }),
                    opacity: isLocked ? 0.5 : 1,
                    zIndex: isActive ? 10 : 1,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Arrow + Icon */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Inline arrow pointer */}
                      <span
                        className={isActive ? 'animate-pulse' : ''}
                        style={{
                          fontFamily: "'VT323', monospace",
                          fontSize: '12px',
                          color: isActive ? statusColors.text : 'transparent',
                          textShadow: isActive ? `0 0 6px ${statusColors.glow}` : 'none',
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
                          background: isLocked ? 'hsl(var(--muted) / 0.4)' : isActive ? 'hsl(var(--background) / 0.8)' : contentColors.bg,
                          border: `1px solid ${isLocked ? 'hsl(var(--border) / 0.5)' : contentColors.border}`,
                        }}
                      >
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <div style={{
                            color: isActive ? statusColors.text : 'hsl(var(--foreground))',
                            filter: isActive ? `drop-shadow(0 0 4px ${statusColors.glow})` : 'none',
                          }}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Label + progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="transition-colors duration-300"
                          style={{
                            fontFamily: "'VT323', monospace",
                            fontSize: '18px',
                            letterSpacing: '1.5px',
                            color: isLocked
                              ? 'hsl(var(--muted-foreground))'
                              : contentColors.text,
                          }}
                        >
                          {layer.label}
                        </span>

                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '11px',
                            color: isLocked ? 'hsl(var(--muted-foreground))' : contentColors.text,
                          }}
                        >
                          {isLocked ? 'Locked' : status.isComplete ? '✓ Set' : `${status.configured}/${status.total}`}
                        </span>
                      </div>

                      {!isLocked && (
                        <SegmentedProgressBar configured={status.configured} total={status.total} colors={contentColors} />
                      )}
                    </div>
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

              {/* Subsection Progress Panel */}
              {(layer.id === 'settings' || layer.id === 'tone_style' || layer.id === 'strategy' || layer.id === 'guardrails') && (
                <SubsectionProgressPanel
                  isVisible={isActive && isSubsectionLayerActive}
                  activeLayerId={isActive ? layer.id : null}
                  paramStates={paramStates}
                  activeSubsection={isActive ? activeSubsection : null}
                  onSubsectionClick={onSubsectionClick}
                  subsectionOverrides={subsectionOverrides}
                  configs={configs}
                  hideSettingsSubsections={hideSettingsSubsections}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
};
