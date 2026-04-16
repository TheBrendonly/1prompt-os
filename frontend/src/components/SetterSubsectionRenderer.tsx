import React from 'react';
import { SetterParameterField, type ParamState } from '@/components/SetterParameterField';
import type { SubsectionDef } from '@/data/setterConfigParameters';

interface SubsectionRendererProps {
  subsections: SubsectionDef[];
  paramStates: Record<string, ParamState>;
  onParamChange: (paramKey: string, state: ParamState) => void;
  expandedSubsections: Set<string>;
  onToggleSubsection: (key: string) => void;
  disabled?: boolean;
  onOpenAI?: (paramKey: string) => void;
  onSave?: (paramKey: string) => void;
  onReturnToDefault?: (paramKey: string) => void;
  isParamSaving?: (paramKey: string) => boolean;
  isParamDirty?: (paramKey: string) => boolean;
}

export const SetterSubsectionRenderer: React.FC<SubsectionRendererProps> = ({
  subsections,
  paramStates,
  onParamChange,
  disabled = false,
  onOpenAI,
  onSave,
  onReturnToDefault,
  isParamSaving,
  isParamDirty,
}) => {
  // Flatten all params across subsections, keeping subsection data-attributes on first param
  const allParams: Array<{ param: typeof subsections[0]['params'][0]; subsectionKey: string; isFirstInSubsection: boolean }> = [];
  for (const subsection of subsections) {
    subsection.params.forEach((param, idx) => {
      allParams.push({ param, subsectionKey: subsection.key, isFirstInSubsection: idx === 0 });
    });
  }

  // Group params: top-level params with their visible children inline
  type ParamGroup = { parent: typeof allParams[0]; children: typeof allParams };
  const groups: ParamGroup[] = [];
  const childKeys = new Set(allParams.filter(i => i.param.showWhenParent).map(i => i.param.key));

  for (const item of allParams) {
    // Skip children — they'll be rendered inline with their parent
    if (childKeys.has(item.param.key)) continue;
    const children = allParams.filter(
      (c) => c.param.showWhenParent === item.param.key
        && paramStates[c.param.showWhenParent!]
        && String(paramStates[c.param.showWhenParent!].value) === c.param.showWhenParentValue
    );
    groups.push({ parent: item, children });
  }

  return (
    <div className="flex flex-col" style={{ gap: '24px' }}>
      {groups.map((group, idx) => (
        <React.Fragment key={group.parent.param.key}>
          {idx > 0 && <div className="border-t border-dashed border-border" />}
          <div
            {...(group.parent.isFirstInSubsection ? { 'data-subsection-key': group.parent.subsectionKey } : {})}
          >
            <SetterParameterField
              param={group.parent.param}
              state={paramStates[group.parent.param.key] || { enabled: group.parent.param.defaultEnabled || false, value: group.parent.param.defaultValue }}
              onChange={(newState) => onParamChange(group.parent.param.key, newState)}
              disabled={disabled || (isParamSaving?.(group.parent.param.key) ?? false)}
              onOpenAI={onOpenAI}
              onSave={onSave}
              onReturnToDefault={onReturnToDefault}
              isDirty={isParamDirty?.(group.parent.param.key) ?? false}
            />
            {/* Inline child params — no separator, rendered right after parent */}
            {group.children.map((child) => (
              <div key={child.param.key} className="mt-4">
                <SetterParameterField
                  param={child.param}
                  state={paramStates[child.param.key] || { enabled: child.param.defaultEnabled || false, value: child.param.defaultValue }}
                  onChange={(newState) => onParamChange(child.param.key, newState)}
                  disabled={disabled || (isParamSaving?.(child.param.key) ?? false)}
                  onOpenAI={onOpenAI}
                  onSave={onSave}
                  onReturnToDefault={onReturnToDefault}
                  isDirty={isParamDirty?.(child.param.key) ?? false}
                />
              </div>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export function getSubsectionCompletion(
  subsections: SubsectionDef[],
  paramStates: Record<string, ParamState>,
): { configured: number; total: number; subsectionStats: Array<{ label: string; configured: number; total: number }> } {
  let totalConfigured = 0;
  let totalParams = 0;
  const subsectionStats = subsections.map((sub) => {
    // Filter out conditional params whose parent isn't active
    const visibleParams = sub.params.filter((p) => {
      if (p.showWhenParent) {
        const parentState = paramStates[p.showWhenParent];
        if (!parentState || String(parentState.value) !== p.showWhenParentValue) return false;
      }
      return true;
    });
    const configured = visibleParams.filter((p) => {
      const s = paramStates[p.key];
      if (!s) return false;
      if (p.type === 'toggle' || p.type === 'toggle_text') return s.enabled;
      if (p.type === 'select') return !!s.value;
      if (p.type === 'number') return s.value !== undefined && s.value !== '';
      return !!s.value || !!s.customPrompt?.trim();
    }).length;
    totalConfigured += configured;
    totalParams += visibleParams.length;
    return { label: sub.label, configured, total: visibleParams.length };
  });
  return { configured: totalConfigured, total: totalParams, subsectionStats };
}
