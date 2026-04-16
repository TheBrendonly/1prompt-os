import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Save, RotateCcw, Sparkles, Maximize2, Lock } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { SetterParam } from '@/data/setterConfigParameters';

export interface ParamState {
  enabled: boolean;
  value?: string | number;
  customPrompt?: string;
  /** Per-option AI-personalized prompts for select params, keyed by option value */
  optionPrompts?: Record<string, string>;
}

interface SetterParameterFieldProps {
  param: SetterParam;
  state: ParamState;
  onChange: (state: ParamState) => void;
  disabled?: boolean;
  onOpenAI?: (paramKey: string) => void;
  onSave?: (paramKey: string) => void;
  onReturnToDefault?: (paramKey: string) => void;
  isDirty?: boolean;
}

function getResolvedPrompt(template: string, value?: string | number): string {
  if (value === undefined || value === '') return template;
  return template.replace(/\{value\}/g, String(value));
}

function getDefaultPrompt(param: SetterParam, state: ParamState): string {
  if (param.type === 'select' && param.options) {
    const selected = param.options.find((o) => o.value === String(state.value));
    return (selected || param.options[0])?.defaultPrompt || '';
  }

  if (state.enabled && param.promptWhenEnabled) {
    return getResolvedPrompt(param.promptWhenEnabled, state.value);
  }

  if (!state.enabled && param.promptWhenDisabled) {
    return param.promptWhenDisabled;
  }

  if (param.promptWhenEnabled) {
    return getResolvedPrompt(param.promptWhenEnabled, state.value ?? param.defaultValue);
  }

  return '';
}

function getEffectivePrompt(param: SetterParam, state: ParamState): string {
  // For select params, always use the active option prompt first so each option stays isolated
  if (param.type === 'select' && state.optionPrompts && state.value) {
    const optPrompt = state.optionPrompts[String(state.value)];
    if (optPrompt) return getResolvedPrompt(optPrompt, state.value);
  }
  // customPrompt remains the authoritative current prompt for non-select params
  // and legacy select states that don't yet have optionPrompts
  if (state.customPrompt != null && state.customPrompt.trim() !== '') {
    return getResolvedPrompt(state.customPrompt, state.value);
  }
  const prompt = getDefaultPrompt(param, state);
  return getResolvedPrompt(prompt, state.value);
}

const fieldLabelStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500, lineHeight: '1.4' } as const;
const fieldDescriptionStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 400, lineHeight: '1.4' } as const;
const promptTextareaStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', minHeight: '200px', height: '200px' };

export const SetterParameterField: React.FC<SetterParameterFieldProps> = ({
  param,
  state,
  onChange,
  disabled = false,
  onOpenAI,
  onSave,
  onReturnToDefault,
  isDirty = false,
}) => {
  const [promptExpanded, setPromptExpanded] = useState(false);

  // Field is "AI-locked" when a customPrompt exists or optionPrompts exist (set by AI modification)
  const isAILocked = !!state.customPrompt || (param.type === 'select' && !!state.optionPrompts && Object.keys(state.optionPrompts).length > 0);
  const handleToggle = (checked: boolean) => {
    onChange({ ...state, enabled: checked });
  };

  const handleValueChange = (value: string | number) => {
    onChange({ ...state, value });
  };

  const renderInlineHeader = () => (
    <div className="flex-1 min-w-0 pr-3">
      <div className="text-foreground" style={fieldLabelStyle}>
        {param.label}
      </div>
      {param.description && (
        <p className="text-muted-foreground mt-[2px]" style={fieldDescriptionStyle}>
          {param.description}
        </p>
      )}
    </div>
  );

  let control: React.ReactNode = null;

  if (param.type === 'toggle') {
    control = (
      <div className="space-y-2.5 py-1">
        <div className="flex items-center justify-between min-h-12 px-3 groove-border bg-card">
          {renderInlineHeader()}
          <Switch
            checked={state.enabled}
            onCheckedChange={handleToggle}
            disabled={disabled}
            className="!h-[18px] !w-[33px] !p-[2px] focus-visible:!ring-0 focus-visible:!ring-offset-0 data-[state=checked]:!bg-success data-[state=unchecked]:!bg-destructive"
            thumbClassName="!h-[12px] !w-[12px] !shadow-none data-[state=checked]:!translate-x-[15px] data-[state=unchecked]:!translate-x-0 data-[state=checked]:!bg-foreground data-[state=unchecked]:!bg-primary-foreground"
          />
        </div>
      </div>
    );
  }

  if (param.type === 'toggle_text') {
    control = (
      <div className="space-y-2.5 py-1">
        <div className="flex items-center justify-between min-h-12 px-3 groove-border bg-card">
          {renderInlineHeader()}
          <Switch
            checked={state.enabled}
            onCheckedChange={handleToggle}
            disabled={disabled}
            className="!h-[18px] !w-[33px] !p-[2px] focus-visible:!ring-0 focus-visible:!ring-offset-0 data-[state=checked]:!bg-success data-[state=unchecked]:!bg-destructive"
            thumbClassName="!h-[12px] !w-[12px] !shadow-none data-[state=checked]:!translate-x-[15px] data-[state=unchecked]:!translate-x-0 data-[state=checked]:!bg-foreground data-[state=unchecked]:!bg-primary-foreground"
          />
        </div>
        {state.enabled && (
          <Input
            value={String(state.value || '')}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={`Enter ${param.label.toLowerCase()}...`}
            className="h-8"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  if (param.type === 'number') {
    control = (
      <div className="space-y-2.5 py-1">
        <div className="flex items-center justify-between p-3 groove-border bg-card">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-foreground" style={fieldLabelStyle}>
              {param.label}
            </div>
            {param.description && (
              <p className="text-muted-foreground mt-[2px]" style={fieldDescriptionStyle}>
                {param.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="number"
              min={param.min}
              max={param.max}
              value={state.value !== undefined ? Number(state.value) : (param.defaultValue || 0)}
              onChange={(e) => handleValueChange(parseInt(e.target.value) || 0)}
              className="h-7 w-16 text-left px-2"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
              disabled={disabled}
            />
            {param.suffix && <span className="text-muted-foreground" style={fieldDescriptionStyle}>{param.suffix}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (param.type === 'select' && param.options) {
    control = (
      <div className="space-y-2.5 py-1">
        <div>
          <Label className="text-foreground" style={fieldLabelStyle}>{param.label}</Label>
          {param.description && (
            <p className="text-muted-foreground mt-1" style={fieldDescriptionStyle}>
              {param.description}
            </p>
          )}
        </div>
        <div className={cn(
          'grid gap-2',
          param.options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : param.options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
        )}>
          {param.options.map((opt) => {
            const isSelected = String(state.value) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (!disabled) {
                    const newVal = isSelected ? '' : opt.value;
                    const optPrompt = state.optionPrompts?.[opt.value];
                    onChange({
                      enabled: !!newVal,
                      value: newVal,
                      optionPrompts: state.optionPrompts,
                      customPrompt: newVal ? (optPrompt || undefined) : undefined,
                    });
                  }
                }}
                disabled={disabled}
                className={cn(
                  'text-left p-3 transition-colors duration-100 groove-border relative bg-card',
                  !isSelected && 'hover:bg-muted/50',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: '1px solid hsl(var(--primary))',
                      boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.1)',
                    }}
                  />
                )}
                <div className="flex items-start gap-2">
                  <div className={cn('w-5 h-5 groove-border flex items-center justify-center flex-shrink-0 mt-[1px]', isSelected ? 'bg-card' : 'bg-card')} style={isSelected ? { backgroundColor: '#fff' } : undefined}>
                    {isSelected && <svg viewBox="0 0 16 15" fill="#000" shapeRendering="crispEdges" className="w-3 h-3"><rect x="1" y="5" width="3" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="5" y="9" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="9" y="5" width="3" height="3"/><rect x="11" y="3" width="3" height="3"/></svg>}
                  </div>
                  <div className="min-w-0">
                    <div className={cn('text-foreground', isSelected && 'text-primary')} style={fieldLabelStyle}>
                      {opt.label}
                    </div>
                    <p className="text-muted-foreground mt-1" style={fieldDescriptionStyle}>
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (param.type === 'text') {
    control = (
      <div className="space-y-2.5 py-1">
        <div>
          <Label className="text-foreground" style={fieldLabelStyle}>{param.label}</Label>
          {param.description && (
            <p className="text-muted-foreground mt-1" style={fieldDescriptionStyle}>
              {param.description}
            </p>
          )}
        </div>
        {isAILocked ? (
          <div className="flex items-center gap-2 px-3 py-2 groove-border bg-muted/50">
            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground" style={fieldDescriptionStyle}>
Modified with AI. Click <strong>MODIFY WITH AI</strong> to continue editing.
            </span>
          </div>
        ) : (
          <Input
            value={String(state.value || '')}
            onChange={(e) => onChange({ enabled: !!e.target.value.trim(), value: e.target.value })}
            placeholder={`Enter ${param.label.toLowerCase()}...`}
            className="h-8"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  if (param.type === 'textarea') {
    control = (
      <div className="space-y-2.5 py-1">
        <div>
          <Label className="text-foreground" style={fieldLabelStyle}>{param.label}</Label>
          {param.description && (
            <p className="text-muted-foreground mt-1" style={fieldDescriptionStyle}>
              {param.description}
            </p>
          )}
        </div>
        {isAILocked ? (
          <div className="flex items-center gap-2 px-3 py-2 groove-border bg-muted/50">
            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground" style={fieldDescriptionStyle}>
Modified with AI. Click <strong>MODIFY WITH AI</strong> to continue editing.
            </span>
          </div>
        ) : (
          <Textarea
            value={String(state.value || '')}
            onChange={(e) => onChange({ enabled: !!e.target.value.trim(), value: e.target.value })}
            placeholder={`Enter ${param.label.toLowerCase()}...`}
            className="w-full leading-relaxed"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', minHeight: '150px' }}
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  if (!control) return null;

  const defaultPrompt = getDefaultPrompt(param, state);
  const promptText = getEffectivePrompt(param, state);
  const hasPrompt = !param.hidePrompt && (!!promptText.trim() || !!defaultPrompt.trim());

  return (
    <div className="space-y-2 py-1">
      {control}

      {hasPrompt && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="h-8 font-medium"
            disabled={disabled}
          >
            {promptExpanded ? <ChevronUp className="w-4 h-4 mr-1.5" /> : <ChevronDown className="w-4 h-4 mr-1.5" />}
            {promptExpanded ? 'Hide' : 'View'} Prompt
          </Button>

          {promptExpanded && (
            <>
              <div className="relative">
                <Textarea
                  value={promptText}
                  onChange={(e) => {
                    if (!disabled) {
                      if (param.type === 'select' && state.value) {
                        // For select params, always update per-option prompt to keep options isolated
                        const updatedOptionPrompts = { ...(state.optionPrompts || {}), [String(state.value)]: e.target.value };
                        onChange({ ...state, optionPrompts: updatedOptionPrompts, customPrompt: e.target.value });
                      } else {
                        onChange({ ...state, customPrompt: e.target.value });
                      }
                    }
                  }}
                  className="w-full leading-relaxed"
                  style={promptTextareaStyle}
                  disabled={disabled}
                />
                {onOpenAI && (
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    onClick={() => onOpenAI(param.key)}
                    className="absolute bottom-2 right-2 h-8 w-8"
                    disabled={disabled}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {onOpenAI && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onOpenAI(param.key)}
                    disabled={disabled || !promptText.trim()}
                    className="h-8 gap-1.5 font-medium groove-btn-blue"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Modify with AI
                  </Button>
                )}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (!disabled) {
                      // Use callback if provided (handles versioning), otherwise just reset
                      if (onReturnToDefault) {
                        onReturnToDefault(param.key);
                      } else {
                        onChange({
                          enabled: param.defaultEnabled || false,
                          value: param.defaultValue ?? '',
                          customPrompt: undefined,
                          optionPrompts: undefined,
                        });
                      }
                    }
                  }}
                  className="h-8 gap-1.5 font-medium"
                  disabled={disabled || !defaultPrompt.trim()}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Return to Default
                </Button>
                {onSave && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onSave(param.key)}
                    className="h-8 gap-1.5 font-medium groove-btn-pulse"
                    disabled={disabled || !isDirty}
                  >
                    <Save className="w-4 h-4" />
                    Save Mini Prompt
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};