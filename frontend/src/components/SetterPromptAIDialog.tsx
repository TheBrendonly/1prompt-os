import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGenerationGuard } from '@/hooks/useGenerationGuard';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, CheckCircle, X, Loader2, Sparkles, RefreshCw } from '@/components/icons';
import SavingOverlay from '@/components/SavingOverlay';
import { computeLineDiff } from '@/components/prompt-editor/diffUtils';
import type { DiffLine } from '@/components/prompt-editor/diffUtils';
import { usePromptConfigurations } from '@/hooks/usePromptConfigurations';
import {
  ALL_SUBSECTIONS,
  IDENTITY_SUBSECTIONS,
  COMPANY_LEAD_CONTEXT_SUBSECTIONS,
  COMPANY_INFO_SUBSECTIONS,
  TONE_STYLE_SUBSECTIONS,
  STRATEGY_SUBSECTIONS,
  GUARDRAILS_SUBSECTIONS,
  LAYER_SEPARATOR,
  MINI_PROMPT_SEPARATOR,
  buildMiniPromptParts,
} from '@/data/setterConfigParameters';
import type { SetterParam } from '@/data/setterConfigParameters';
import { cn } from '@/lib/utils';

// ── Shared helpers (same as SimulationReportDialog) ──

const PARAM_LABEL_MAP: Record<string, string> = {};
const PARAM_DEF_MAP: Record<string, SetterParam> = {};
try {
  for (const sub of ALL_SUBSECTIONS) {
    for (const param of sub.params) {
      PARAM_LABEL_MAP[param.key] = param.label;
      PARAM_DEF_MAP[param.key] = param;
      if (!param.key.startsWith('param_')) {
        PARAM_LABEL_MAP[`param_${param.key}`] = param.label;
        PARAM_DEF_MAP[`param_${param.key}`] = param;
      }
    }
  }
} catch { /* graceful fallback */ }

function buildParameterCatalog(): Array<{
  key: string;
  label: string;
  type: string;
  options?: Array<{ value: string; label: string; defaultPrompt: string }>;
}> {
  const catalog: ReturnType<typeof buildParameterCatalog> = [];
  for (const sub of ALL_SUBSECTIONS) {
    for (const param of sub.params) {
      const entry: (typeof catalog)[0] = {
        key: param.key.startsWith('param_') ? param.key : `param_${param.key}`,
        label: param.label,
        type: param.type,
      };
      if (param.type === 'select' && param.options) {
        entry.options = param.options.map(opt => ({
          value: opt.value,
          label: opt.label,
          defaultPrompt: opt.defaultPrompt || '',
        }));
      }
      catalog.push(entry);
    }
  }
  return catalog;
}

function extractPromptFromValue(text: string): string {
  if (!text || !text.startsWith('{')) return text;
  try {
    const parsed = JSON.parse(text);
    if (parsed.customPrompt) return parsed.customPrompt;
    if (parsed.optionPrompts && parsed.value) return parsed.optionPrompts[parsed.value] || text;
    if (parsed.optionPrompts) {
      const firstKey = Object.keys(parsed.optionPrompts)[0];
      if (firstKey) return parsed.optionPrompts[firstKey];
    }
  } catch { /* not JSON */ }
  return text;
}

function normalizePromptVersionContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

function getParamDef(configKey: string): SetterParam | undefined {
  const rawKey = configKey.startsWith('param_') ? configKey.replace('param_', '') : configKey;
  return PARAM_DEF_MAP[rawKey] || PARAM_DEF_MAP[configKey];
}

function normalizeComparable(value: string): string {
  return value.toLowerCase().replace(/[`"'*_#()[\]{}]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function getTokenOverlapScore(source: string, target: string): number {
  const sourceTokens = new Set(normalizeComparable(source).split(' ').filter(t => t.length > 2));
  const targetTokens = new Set(normalizeComparable(target).split(' ').filter(t => t.length > 2));
  let score = 0;
  sourceTokens.forEach(token => { if (targetTokens.has(token)) score += 1; });
  return score;
}

function getOptionLabel(configKey: string, optionValue: string): string {
  const paramDef = getParamDef(configKey);
  if (!paramDef?.options) return optionValue;
  const opt = paramDef.options.find(o => o.value === optionValue);
  return opt?.label || optionValue;
}

function getParamDescription(configKey: string): string {
  return getParamDef(configKey)?.description || '';
}

function getParamOptions(configKey: string): Array<{ value: string; label: string; description?: string }> {
  const paramDef = getParamDef(configKey);
  if (!paramDef?.options) return [];
  return paramDef.options.map(o => ({ value: o.value, label: o.label, description: o.description }));
}

function parseParamState(customContent?: string): Record<string, any> | null {
  if (!customContent) return null;
  try {
    const parsed = JSON.parse(customContent);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

function matchOptionValue(paramDef: SetterParam | undefined, candidate?: string): string | undefined {
  if (!paramDef?.options?.length || !candidate) return undefined;
  const exact = paramDef.options.find(o => o.value === candidate);
  if (exact) return exact.value;
  const nc = normalizeComparable(candidate);
  if (!nc) return undefined;
  const nm = paramDef.options.find(o => normalizeComparable(o.value) === nc || normalizeComparable(o.label) === nc);
  if (nm) return nm.value;
  let best: string | undefined, bestScore = 0;
  for (const o of paramDef.options) {
    const s = Math.max(getTokenOverlapScore(candidate, o.value), getTokenOverlapScore(candidate, o.label));
    if (s > bestScore) { bestScore = s; best = o.value; }
  }
  return bestScore > 0 ? best : undefined;
}

function matchOptionFromPrompt(paramDef: SetterParam | undefined, prompt?: string, storedOptionPrompts?: Record<string, string>): string | undefined {
  if (!paramDef?.options?.length || !prompt) return undefined;
  const np = normalizePromptVersionContent(extractPromptFromValue(prompt)).toLowerCase();
  if (!np) return undefined;
  const fpl = np.split('\n').map(l => l.trim()).find(Boolean) || '';
  let best: string | undefined, bestScore = 0;
  for (const o of paramDef.options) {
    const texts = [o.value, o.label, o.defaultPrompt, storedOptionPrompts?.[o.value]].filter(Boolean).map(t => normalizePromptVersionContent(extractPromptFromValue(String(t))).toLowerCase());
    const fcl = texts.map(t => t.split('\n').map(l => l.trim()).find(Boolean) || '').find(Boolean);
    if (texts.some(t => t === np || t === fpl) || fcl === fpl) return o.value;
    const s = Math.max(...texts.map(t => Math.max(getTokenOverlapScore(np, t), getTokenOverlapScore(fpl, t))), 0);
    if (s > bestScore) { bestScore = s; best = o.value; }
  }
  return bestScore > 0 ? best : undefined;
}

interface ParameterSuggestion {
  config_key: string;
  parameter_label: string;
  reason: string;
  severity: 'critical' | 'important' | 'minor';
  original_prompt: string;
  suggested_prompt: string;
  current_option?: string;
  suggested_option?: string;
  status: 'pending' | 'approved' | 'declined' | 'applied';
}

interface SetterReport {
  summary: string;
  suggestions: ParameterSuggestion[];
}

function normalizeSuggestionSelection(
  suggestion: ParameterSuggestion,
  promptConfigs: Record<string, { selected_option: string; custom_content: string }>
): ParameterSuggestion {
  const paramDef = getParamDef(suggestion.config_key);
  if (!paramDef?.options?.length) return suggestion;
  const config = promptConfigs[suggestion.config_key] || promptConfigs[suggestion.config_key.replace(/^param_/, '')];
  const parsedState = parseParamState(config?.custom_content);
  const storedOptionPrompts = parsedState?.optionPrompts && typeof parsedState.optionPrompts === 'object' ? parsedState.optionPrompts as Record<string, string> : undefined;
  const liveSelectedOption = matchOptionValue(paramDef, parsedState?.value) || matchOptionValue(paramDef, config?.selected_option) || matchOptionFromPrompt(paramDef, parsedState?.customPrompt, storedOptionPrompts) || matchOptionFromPrompt(paramDef, suggestion.original_prompt, storedOptionPrompts);
  const currentOption = matchOptionValue(paramDef, suggestion.current_option) || liveSelectedOption || matchOptionFromPrompt(paramDef, suggestion.original_prompt, storedOptionPrompts);
  const suggestedOption = matchOptionValue(paramDef, suggestion.suggested_option) || matchOptionFromPrompt(paramDef, suggestion.suggested_prompt, storedOptionPrompts) || currentOption;
  return { ...suggestion, current_option: currentOption, suggested_option: suggestedOption };
}

// ── UI Components ──

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.7' };

const GENERATING_MESSAGES = [
  "Analyzing all parameters...",
  "Comparing against your feedback...",
  "Evaluating parameter options...",
  "Identifying parameters to change...",
  "Generating targeted suggestions...",
  "Building optimization report...",
  "Crafting parameter rewrites...",
];

function ExpandedDiffBlock({ original, suggested }: { original: string; suggested: string }) {
  const cleanOriginal = extractPromptFromValue(original);
  const cleanSuggested = extractPromptFromValue(suggested);
  const lines = React.useMemo(() => computeLineDiff(cleanOriginal, cleanSuggested), [cleanOriginal, cleanSuggested]);
  return (
    <div className="groove-border bg-card max-h-[300px] overflow-y-auto p-3">
      {lines.map((line: DiffLine, i: number) => {
        if (line.type === 'unchanged') return <pre key={i} className="whitespace-pre-wrap text-foreground/70 m-0" style={FONT}>{line.text}</pre>;
        if (line.type === 'removed') return <pre key={i} className="whitespace-pre-wrap m-0" style={{ ...FONT, backgroundColor: 'hsl(var(--destructive) / 0.12)', color: 'hsl(var(--destructive))', textDecoration: 'line-through', padding: '1px 4px', borderRadius: '2px' }}>{line.text}</pre>;
        return <pre key={i} className="whitespace-pre-wrap m-0" style={{ ...FONT, backgroundColor: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 45%)', padding: '1px 4px', borderRadius: '2px' }}>{line.text}</pre>;
      })}
    </div>
  );
}

function SummaryContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+|\. (?=[A-Z])/).filter(Boolean);
  if (paragraphs.length <= 1) return <p className="field-text text-foreground leading-relaxed">{text}</p>;
  return (
    <ul className="space-y-2 list-disc list-inside">
      {paragraphs.map((p, i) => <li key={i} className="field-text text-foreground leading-relaxed">{p.replace(/^\s*[-•]\s*/, '').trim()}</li>)}
    </ul>
  );
}

function OptionCard({ option, borderColor, annotation }: { option: { value: string; label: string; description?: string }; borderColor: 'green' | 'red' | 'none'; annotation?: string }) {
  const GREEN = 'hsl(142 71% 45%)';
  const RED = 'hsl(0 70% 55%)';
  const borderStyle = borderColor === 'green' ? { border: `1px solid ${GREEN}`, boxShadow: `inset 0 0 0 1px ${GREEN}33, 0 0 0 1px ${GREEN}1a` } : borderColor === 'red' ? { border: `1px solid ${RED}`, boxShadow: `inset 0 0 0 1px ${RED}33, 0 0 0 1px ${RED}1a` } : undefined;
  const checkBgStyle = borderColor === 'green' ? { backgroundColor: GREEN } : borderColor === 'red' ? { backgroundColor: RED } : undefined;
  const textColor = borderColor === 'green' ? GREEN : borderColor === 'red' ? RED : undefined;
  const checkColor = borderColor !== 'none';
  return (
    <div className="relative">
      <div className="text-left p-3 groove-border bg-card relative">
        {borderStyle && <div className="absolute inset-0 pointer-events-none" style={borderStyle} />}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 groove-border flex items-center justify-center flex-shrink-0 mt-[1px] bg-card" style={checkColor ? { backgroundColor: '#fff' } : undefined}>
            {checkColor && <svg viewBox="0 0 16 15" fill="#000" shapeRendering="crispEdges" className="w-3 h-3"><rect x="1" y="5" width="3" height="3"/><rect x="3" y="7" width="3" height="3"/><rect x="5" y="9" width="3" height="3"/><rect x="7" y="7" width="3" height="3"/><rect x="9" y="5" width="3" height="3"/><rect x="11" y="3" width="3" height="3"/></svg>}
          </div>
          <div className="min-w-0">
            <div className="text-foreground" style={{ ...FONT, color: textColor }}>{option.label}</div>
            {option.description && <p className="text-muted-foreground mt-1" style={FONT}>{option.description}</p>}
          </div>
        </div>
      </div>
      {annotation && <p className="field-text text-xs mt-1 ml-1" style={{ color: textColor || 'hsl(var(--muted-foreground))' }}>{annotation}</p>}
    </div>
  );
}

// ── Main Component ──

interface SetterPromptAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  slotId: string;
  onApplied?: () => void;
  onGeneratingChange?: (generating: boolean) => void;
}

export function SetterPromptAIDialog({ open, onOpenChange, clientId, slotId, onApplied, onGeneratingChange }: SetterPromptAIDialogProps) {
  const [report, setReport] = useState<SetterReport | null>(null);
  const [generating, setGenerating] = useState(false);
  useGenerationGuard(generating);
  const [saving, setSaving] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFeedbackStep, setShowFeedbackStep] = useState(false);
  const [mainDialogReady, setMainDialogReady] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const feedbackToMainHandoffRef = useRef(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { configs: promptConfigs, refetch: refetchConfigs } = usePromptConfigurations(clientId, slotId);
  const resumedJobRef = useRef(false);
  // Preloaded report cache — fetched on mount, used to instantly decide dialog mode on open
  const preloadedReportRef = useRef<{ checked: boolean; report: SetterReport | null }>({ checked: false, report: null });

  // Notify parent of generating state changes
  useEffect(() => {
    onGeneratingChange?.(generating);
  }, [generating, onGeneratingChange]);

  useEffect(() => {
    if (!generating) { setMsgIdx(0); return; }
    const interval = setInterval(() => setMsgIdx(prev => (prev + 1) % GENERATING_MESSAGES.length), 3000);
    return () => clearInterval(interval);
  }, [generating]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ── Check for active jobs on mount / when clientId+slotId change ──
  useEffect(() => {
    if (!clientId || !slotId) return;
    let cancelled = false;

    const checkActiveJob = async () => {
      try {
        const { data } = await (supabase as any)
          .from('ai_generation_jobs')
          .select('id, status, created_at, input_payload')
          .eq('client_id', clientId)
          .eq('job_type', 'analyze-setter-prompt')
          .in('status', ['pending', 'running'])
          .order('created_at', { ascending: false })
          .limit(5);

        if (cancelled || !data?.length) return;

        // Find job matching this slot
        const matchingJob = data.find((job: any) => {
          const payload = job.input_payload;
          return payload?.slotId === slotId;
        });

        if (!matchingJob) return;

        const createdAt = new Date(matchingJob.created_at).getTime();
        const MAX_AGE = 600000; // 10 min
        if (Date.now() - createdAt > MAX_AGE) return;

        // Active job found — notify parent immediately
        resumedJobRef.current = true;
        setGenerating(true);

        // If dialog is open, show the main dialog with loading
        if (open) {
          setShowFeedbackStep(false);
          setMainDialogReady(true);
        }

        // Resume polling
        const startTime = createdAt;
        const MAX_POLL = 600000;

        const pollResult = await new Promise<any>((resolve, reject) => {
          const poll = async () => {
            if (cancelled) { if (pollingRef.current) clearInterval(pollingRef.current); return; }
            if (Date.now() - startTime > MAX_POLL) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              reject(new Error('AI generation timed out.'));
              return;
            }
            try {
              const { data: pollRow } = await (supabase as any).from('ai_generation_jobs').select('status, result, error_message').eq('id', matchingJob.id).single();
              if (pollRow?.status === 'completed') {
                if (pollingRef.current) clearInterval(pollingRef.current);
                pollingRef.current = null;
                resolve(pollRow.result);
              } else if (pollRow?.status === 'failed') {
                if (pollingRef.current) clearInterval(pollingRef.current);
                pollingRef.current = null;
                reject(new Error(pollRow.error_message || 'AI generation failed'));
              }
            } catch (err) { console.error('Polling error:', err); }
          };
          poll();
          pollingRef.current = setInterval(poll, 3000);
        });

        if (cancelled) return;

        const r = pollResult as { summary: string; suggestions: Array<Omit<ParameterSuggestion, 'status'>> };
        const newReport: SetterReport = {
          summary: r.summary,
          suggestions: r.suggestions.map(s => normalizeSuggestionSelection({ ...s, status: 'pending' as const }, promptConfigs)),
        };
        setReport(newReport);
        setHasUnsavedChanges(true);
        await saveReportToDb(newReport);
        setMainDialogReady(true);
      } catch (err: any) {
        console.error('Resume setter AI job error:', err);
        if (!cancelled) {
          toast.error(err.message || 'Failed to resume AI analysis');
        }
      } finally {
        if (!cancelled) {
          resumedJobRef.current = false;
          setGenerating(false);
        }
      }
    };

    checkActiveJob();
    return () => { cancelled = true; };
  }, [clientId, slotId]);

  // ── Preload report check on mount (before dialog opens) ──
  useEffect(() => {
    if (!clientId || !slotId) return;
    let cancelled = false;
    const preload = async () => {
      try {
        const { data } = await (supabase as any)
          .from('setter_ai_reports')
          .select('report_data')
          .eq('client_id', clientId)
          .eq('slot_id', slotId)
          .maybeSingle();
        if (cancelled) return;
        if (data?.report_data) {
          preloadedReportRef.current = { checked: true, report: data.report_data as SetterReport };
        } else {
          preloadedReportRef.current = { checked: true, report: null };
        }
      } catch {
        if (!cancelled) preloadedReportRef.current = { checked: true, report: null };
      }
    };
    preloadedReportRef.current = { checked: false, report: null };
    preload();
    return () => { cancelled = true; };
  }, [clientId, slotId]);

  // ── Save / Load report to DB (mirrors SimulationReportDialog) ──

  const saveReportToDb = useCallback(async (reportToSave: SetterReport) => {
    try {
      await (supabase as any)
        .from('setter_ai_reports')
        .upsert({
          client_id: clientId,
          slot_id: slotId,
          report_data: reportToSave,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'client_id,slot_id' });
      preloadedReportRef.current = { checked: true, report: reportToSave };
      setHasUnsavedChanges(false);
      setLoadedFromDb(true);
    } catch (err) {
      console.error('Error saving setter AI report:', err);
    }
  }, [clientId, slotId]);

  const clearSavedReport = useCallback(async () => {
    preloadedReportRef.current = { checked: true, report: null };
    setLoadedFromDb(false);

    try {
      await (supabase as any)
        .from('setter_ai_reports')
        .delete()
        .eq('client_id', clientId)
        .eq('slot_id', slotId);
    } catch (err) {
      console.error('Error clearing setter AI report:', err);
    }
  }, [clientId, slotId]);

  const loadSavedReport = useCallback(async () => {
    setInitialLoading(true);
    try {
      // 1) Try loading from setter_ai_reports
      const { data, error } = await (supabase as any)
        .from('setter_ai_reports')
        .select('report_data')
        .eq('client_id', clientId)
        .eq('slot_id', slotId)
        .maybeSingle();
      if (error) throw error;
      if (data?.report_data) {
        const saved = data.report_data as SetterReport;
        setReport({
          ...saved,
          suggestions: (saved.suggestions || []).map((s) => normalizeSuggestionSelection(s, promptConfigs)),
        });
        setLoadedFromDb(true);
        setHasUnsavedChanges(false);
        setMainDialogReady(true);
        return;
      }

      // 2) Fallback: check ai_generation_jobs for a completed job for this slot
      const { data: jobRows } = await (supabase as any)
        .from('ai_generation_jobs')
        .select('result, input_payload')
        .eq('client_id', clientId)
        .eq('job_type', 'analyze-setter-prompt')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobRows?.length) {
        const matchingJob = jobRows.find((j: any) => j.input_payload?.slotId === slotId);
        if (matchingJob?.result) {
          const r = matchingJob.result as { summary: string; suggestions: Array<Omit<ParameterSuggestion, 'status'>> };
          const recoveredReport: SetterReport = {
            summary: r.summary,
            suggestions: (r.suggestions || []).map(s => normalizeSuggestionSelection({ ...s, status: 'pending' as const }, promptConfigs)),
          };
          setReport(recoveredReport);
          setLoadedFromDb(false);
          setHasUnsavedChanges(true);
          setMainDialogReady(true);
          // Persist for future loads
          await saveReportToDb(recoveredReport);
          return;
        }
      }

      // 3) No previous results at all — show feedback step
      setShowFeedbackStep(true);
    } catch (err) {
      console.error('Error loading saved setter AI report:', err);
      setShowFeedbackStep(true);
    } finally {
      setInitialLoading(false);
    }
  }, [clientId, slotId, promptConfigs, saveReportToDb]);

  // On open, load saved report from DB or show feedback step
  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    if (!open) {
      initialLoadDoneRef.current = false;
      setMainDialogReady(false);
      return;
    }
    // If a job is currently generating (active or resumed), go straight to loading view
    if (generating) {
      setMainDialogReady(true);
      setInitialLoading(false);
      initialLoadDoneRef.current = true;
      return;
    }
    if (report) {
      setMainDialogReady(true);
      setInitialLoading(false);
      initialLoadDoneRef.current = true;
      return;
    }
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    // If preload already completed, use cached result for instant open
    if (preloadedReportRef.current.checked) {
      const cached = preloadedReportRef.current.report;
      if (cached) {
        setReport({
          ...cached,
          suggestions: (cached.suggestions || []).map((s) => normalizeSuggestionSelection(s, promptConfigs)),
        });
        setLoadedFromDb(true);
        setHasUnsavedChanges(false);
        setMainDialogReady(true);
      } else {
        // No saved report — show feedback step immediately
        setShowFeedbackStep(true);
      }
      return;
    }

    // Preload not ready yet — fall back to full load
    loadSavedReport();
  }, [open, clientId, slotId, loadSavedReport, generating, promptConfigs]);

  const generateReport = useCallback(async (feedback: string) => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback about what you want to change.');
      return;
    }

    feedbackToMainHandoffRef.current = true;
    setShowFeedbackStep(false);
    setMainDialogReady(true);
    setGenerating(true);
    setReport(null);
    setLoadedFromDb(false);

    try {
      const parameterCatalog = buildParameterCatalog();
      const { data: jobData, error } = await supabase.functions.invoke('analyze-setter-prompt', {
        body: { client_id: clientId, setter_slot_id: slotId, user_feedback: feedback, parameterCatalog },
      });
      if (error) throw error;
      if (jobData?.error) throw new Error(jobData.error);

      const jobId = jobData?.job_id;
      if (!jobId) throw new Error('No job_id returned');

      await clearSavedReport();

      // Poll every 3 seconds
      const startTime = Date.now();
      const MAX_POLL = 300000; // 5 minutes

      const pollResult = await new Promise<any>((resolve, reject) => {
        const poll = async () => {
          if (Date.now() - startTime > MAX_POLL) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            reject(new Error('AI generation timed out after 5 minutes. Please try again.'));
            return;
          }
          try {
            const { data: pollRow } = await (supabase as any).from('ai_generation_jobs').select('status, result, error_message').eq('id', jobId).single();
            if (pollRow?.status === 'completed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              resolve(pollRow.result);
            } else if (pollRow?.status === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              reject(new Error(pollRow.error_message || 'AI generation failed'));
            }
          } catch (err) { console.error('Polling error:', err); }
        };

        // Immediate first poll after 2s
        setTimeout(poll, 2000);
        pollingRef.current = setInterval(poll, 3000);
      });

      const r = pollResult as { summary: string; suggestions: Array<Omit<ParameterSuggestion, 'status'>> };
      const newReport: SetterReport = {
        summary: r.summary,
        suggestions: r.suggestions.map(s => normalizeSuggestionSelection({ ...s, status: 'pending' as const }, promptConfigs)),
      };
      setReport(newReport);
      setHasUnsavedChanges(true);
      await saveReportToDb(newReport);
    } catch (err: any) {
      console.error('Analyze setter prompt error:', err);
      toast.error(err.message || 'Failed to analyze setter prompt');
    } finally {
      feedbackToMainHandoffRef.current = false;
      setGenerating(false);
    }
  }, [clearSavedReport, clientId, slotId, promptConfigs]);

  const handleApprove = (index: number) => {
    setReport(prev => {
      if (!prev) return prev;
      const updated = { ...prev, suggestions: [...prev.suggestions] };
      updated.suggestions[index] = { ...updated.suggestions[index], status: 'approved' };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleDecline = (index: number) => {
    setReport(prev => {
      if (!prev) return prev;
      const updated = { ...prev, suggestions: [...prev.suggestions] };
      updated.suggestions[index] = { ...updated.suggestions[index], status: 'declined' };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const approvedCount = report?.suggestions.filter(s => s.status === 'approved').length || 0;
  const pendingCount = report?.suggestions.filter(s => s.status === 'pending').length || 0;
  const appliedCount = report?.suggestions.filter(s => s.status === 'applied').length || 0;

  // ── handleSaveApproved — same logic as SimulationReportDialog ──
  const handleSaveApproved = async () => {
    if (!report || approvedCount === 0) return;
    setSaving(true);
    try {
      const approved = report.suggestions.filter(s => s.status === 'approved');
      for (const suggestion of approved) {
        const isOptionChange = suggestion.suggested_option && suggestion.current_option && suggestion.suggested_option !== suggestion.current_option;
        const { data: existing } = await (supabase as any)
          .from('prompt_configurations')
          .select('id, selected_option, custom_content')
          .eq('client_id', clientId)
          .eq('slot_id', slotId)
          .eq('config_key', suggestion.config_key)
          .maybeSingle();

        const isParamSuggestion = suggestion.config_key.startsWith('param_');
        const rawParamKey = suggestion.config_key.startsWith('param_') ? suggestion.config_key.replace('param_', '') : suggestion.config_key;
        const paramDefForSave = PARAM_DEF_MAP[rawParamKey] || PARAM_DEF_MAP[suggestion.config_key];
        const isSelectParam = paramDefForSave?.type === 'select';
        let suggestionPayload: string;
        let suggestionSelectedOption: string;

        if (isParamSuggestion && existing?.custom_content) {
          try {
            const existingState = JSON.parse(existing.custom_content);
            if (isOptionChange) {
              existingState.value = suggestion.suggested_option;
              existingState.customPrompt = suggestion.suggested_prompt;
              if (!existingState.optionPrompts) existingState.optionPrompts = {};
              existingState.optionPrompts[suggestion.suggested_option!] = suggestion.suggested_prompt;
              suggestionSelectedOption = suggestion.suggested_option!;
            } else {
              if (isSelectParam) {
                const activeOption = suggestion.suggested_option || suggestion.current_option || existingState.value || 'enabled';
                existingState.value = activeOption;
                if (!existingState.optionPrompts) existingState.optionPrompts = {};
                existingState.optionPrompts[String(activeOption)] = suggestion.suggested_prompt;
                suggestionSelectedOption = String(activeOption || existing.selected_option || 'enabled');
              } else {
                suggestionSelectedOption = existing.selected_option || existingState.value || 'enabled';
              }
              existingState.customPrompt = suggestion.suggested_prompt;
              existingState.enabled = true;
            }
            suggestionPayload = JSON.stringify(existingState);
          } catch {
            const targetOption = isSelectParam ? (suggestion.suggested_option || suggestion.current_option || 'enabled') : 'enabled';
            suggestionPayload = JSON.stringify({ enabled: true, value: isSelectParam ? targetOption : '', customPrompt: suggestion.suggested_prompt, optionPrompts: isSelectParam ? { [targetOption]: suggestion.suggested_prompt } : {} });
            suggestionSelectedOption = targetOption;
          }
        } else if (isParamSuggestion) {
          const targetOption = isSelectParam ? (suggestion.suggested_option || suggestion.current_option || 'enabled') : 'enabled';
          suggestionPayload = JSON.stringify({ enabled: true, value: isSelectParam ? targetOption : '', customPrompt: suggestion.suggested_prompt, optionPrompts: isSelectParam ? { [targetOption]: suggestion.suggested_prompt } : {} });
          suggestionSelectedOption = targetOption;
        } else {
          suggestionPayload = suggestion.suggested_prompt;
          suggestionSelectedOption = existing?.selected_option || 'custom';
        }

        if (existing?.id) {
          await (supabase as any).from('prompt_configurations').update({ selected_option: suggestionSelectedOption, custom_content: suggestionPayload, updated_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await (supabase as any).from('prompt_configurations').insert({ client_id: clientId, slot_id: slotId, config_key: suggestion.config_key, selected_option: suggestionSelectedOption, custom_content: suggestionPayload });
        }

        // Create version entry
        const paramKey = rawParamKey;
        const targetOption = suggestion.suggested_option || suggestion.current_option || 'enabled';
        const optSuffix = isSelectParam ? `__opt__${targetOption}` : '';
        const versionSlotId = `${slotId}__param__${paramKey}${optSuffix}`;
        const normalizedPromptContent = normalizePromptVersionContent(suggestion.suggested_prompt);

        let previousPromptForVersion = suggestion.original_prompt || '';
        if (isOptionChange && targetOption) {
          let existingTargetPrompt = '';
          if (existing?.custom_content) {
            try {
              const parsedExisting = JSON.parse(existing.custom_content);
              if (parsedExisting.optionPrompts?.[targetOption]) existingTargetPrompt = parsedExisting.optionPrompts[targetOption];
            } catch { /* ignore */ }
          }
          if (!existingTargetPrompt) {
            const pDef = getParamDef(suggestion.config_key);
            const optDef = pDef?.options?.find(o => o.value === targetOption);
            if (optDef?.defaultPrompt) existingTargetPrompt = optDef.defaultPrompt;
          }
          if (existingTargetPrompt) previousPromptForVersion = existingTargetPrompt;
        }
        const normalizedPreviousPromptContent = normalizePromptVersionContent(previousPromptForVersion);

        if (normalizedPromptContent) {
          const { data: latestVersions, error: latestVersionError } = await (supabase as any)
            .from('prompt_versions')
            .select('id, version_number, prompt_content, original_prompt_content')
            .eq('client_id', clientId)
            .eq('slot_id', versionSlotId)
            .order('version_number', { ascending: false })
            .limit(1);
          if (latestVersionError) throw latestVersionError;
          const latestVersion = latestVersions?.[0];
          const lastSavedPrompt = normalizePromptVersionContent(latestVersion?.prompt_content || '');

          if (lastSavedPrompt === normalizedPromptContent) {
            const latestOriginalPrompt = normalizePromptVersionContent(latestVersion?.original_prompt_content || '');
            if (latestVersion && latestVersion.version_number === 1 && !latestOriginalPrompt && normalizedPreviousPromptContent && normalizedPreviousPromptContent !== normalizedPromptContent) {
              await (supabase as any).from('prompt_versions').update({ prompt_content: normalizedPreviousPromptContent, original_prompt_content: null, label: 'V1' }).eq('id', latestVersion.id);
              await (supabase as any).from('prompt_versions').insert({ client_id: clientId, slot_id: versionSlotId, version_number: 2, prompt_content: normalizedPromptContent, original_prompt_content: normalizedPreviousPromptContent, label: 'V2' });
            }
          } else if (!latestVersion) {
            let nextVersionNumber = 1;
            if (normalizedPreviousPromptContent && normalizedPreviousPromptContent !== normalizedPromptContent) {
              await (supabase as any).from('prompt_versions').insert({ client_id: clientId, slot_id: versionSlotId, version_number: 1, prompt_content: normalizedPreviousPromptContent, label: 'V1' });
              nextVersionNumber = 2;
            }
            await (supabase as any).from('prompt_versions').insert({ client_id: clientId, slot_id: versionSlotId, version_number: nextVersionNumber, prompt_content: normalizedPromptContent, original_prompt_content: nextVersionNumber > 1 ? normalizedPreviousPromptContent : null, label: `V${nextVersionNumber}` });
          } else {
            const nextVersionNumber = (latestVersion.version_number || 0) + 1;
            await (supabase as any).from('prompt_versions').insert({ client_id: clientId, slot_id: versionSlotId, version_number: nextVersionNumber, prompt_content: normalizedPromptContent, original_prompt_content: latestVersion.prompt_content, label: `V${nextVersionNumber}` });
          }
        }
      }

      await refetchConfigs();

      // Build and save full prompt
      const { data: freshConfigs } = await (supabase as any).from('prompt_configurations').select('*').eq('client_id', clientId).eq('slot_id', slotId);
      const configMap: Record<string, { selectedOption: string; customContent: string }> = {};
      for (const row of (freshConfigs || [])) {
        configMap[row.config_key] = { selectedOption: row.selected_option || '', customContent: row.custom_content || '' };
      }

      // Update prompts table
      const { data: existingPrompt } = await (supabase as any).from('prompts').select('id').eq('client_id', clientId).eq('slot_id', slotId).maybeSingle();
      if (existingPrompt?.id) {
        await (supabase as any).from('prompts').update({ updated_at: new Date().toISOString() }).eq('id', existingPrompt.id);
      }

      try { localStorage.setItem(`setter_needs_deploy_${clientId}_${slotId}`, 'true'); } catch {}

      const updatedReport: SetterReport = {
        ...report,
        suggestions: report.suggestions.map(s => s.status === 'approved' ? { ...s, status: 'applied' as const } : s),
      };
      setReport(updatedReport);
      setHasUnsavedChanges(false);
      await saveReportToDb(updatedReport);
      toast.success(`${approved.length} parameter${approved.length > 1 ? 's' : ''} updated successfully.`);
      onApplied?.();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const attemptClose = () => {
    if (generating || (hasUnsavedChanges && pendingCount > 0)) {
      setShowCloseWarning(true);
      return;
    }
    doClose();
  };

  const doClose = () => {
    setShowCloseWarning(false);
    setHasUnsavedChanges(false);
    setShowFeedbackStep(false);
    setMainDialogReady(false);
    if (!generating && pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    onOpenChange(false);
  };

  return (
    <>
      {/* Results Dialog */}
      <Dialog open={open && (mainDialogReady || initialLoading)} onOpenChange={(openState) => { if (!openState) attemptClose(); }}>
        <DialogContent className="flex flex-col !p-0" style={{ width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh' }}>
          <div className="flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '3px groove hsl(var(--border-groove))', paddingTop: '14px', paddingBottom: '14px' }}>
            <div className="flex flex-col space-y-1.5 text-left">
              <DialogTitle>MODIFY SETTER PROMPT</DialogTitle>
              <p className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                AI-generated parameter changes based on your feedback
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {report && !generating && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="groove-btn groove-btn-blue !h-8 field-text"
                  onClick={() => {
                    setMainDialogReady(false);
                    setShowFeedbackStep(true);
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                </Button>
              )}
              <DialogClose asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 !bg-muted !border-border hover:!bg-accent shrink-0" title="Close">
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative flex flex-col">
            <SavingOverlay isVisible={saving} message="Applying changes..." />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-4 min-h-full flex flex-col">
                {initialLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {generating && !initialLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2.5 h-2.5 bg-foreground" style={{ animation: 'saving-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <p className="text-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        {GENERATING_MESSAGES[msgIdx]}
                      </p>
                      <style>{`@keyframes saving-bounce { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }`}</style>
                    </div>
                  </div>
                )}

                {!generating && !initialLoading && !report && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <p className="field-text text-muted-foreground">Failed to generate suggestions.</p>
                    <Button onClick={() => { setMainDialogReady(false); setShowFeedbackStep(true); }} className="groove-btn">Try Again</Button>
                  </div>
                )}

                {report && !generating && (
                  <div className="space-y-6">
                    <div className="groove-border bg-card p-4">
                      <h3 className="field-text text-muted-foreground mb-3" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>SUMMARY</h3>
                      <SummaryContent text={report.summary} />
                    </div>

                    {report.suggestions.length > 0 && (
                      <p className="field-text text-muted-foreground">
                        {report.suggestions.length} suggestion{report.suggestions.length > 1 ? 's' : ''} •{' '}
                        {appliedCount > 0 && <>{appliedCount} applied • </>}
                        {approvedCount} approved • {pendingCount} pending
                      </p>
                    )}

                    {report.suggestions.map((suggestion, i) => {
                      const isOptionChange = suggestion.suggested_option && suggestion.current_option && suggestion.suggested_option !== suggestion.current_option;
                      const paramLabel = PARAM_LABEL_MAP[suggestion.config_key] || PARAM_LABEL_MAP[suggestion.config_key.replace('param_', '')] || suggestion.parameter_label;
                      const paramDescription = getParamDescription(suggestion.config_key);
                      const options = getParamOptions(suggestion.config_key);

                      return (
                        <div key={i} className={cn('groove-border bg-card transition-opacity', suggestion.status === 'declined' && 'opacity-50', suggestion.status === 'applied' && 'opacity-70')}>
                          <div className="px-4 py-3">
                            <div className="text-foreground" style={FONT}>{paramLabel}</div>
                            {paramDescription && <p className="text-muted-foreground mt-[2px]" style={FONT}>{paramDescription}</p>}
                          </div>

                          {options.length > 0 && (
                            <div className="px-4 pb-3">
                              <div className={cn('grid gap-2', options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
                                {options.map(opt => {
                                  let borderColor: 'green' | 'red' | 'none' = 'none';
                                  let annotation: string | undefined;
                                  if (isOptionChange) {
                                    if (opt.value === suggestion.suggested_option) { borderColor = 'green'; annotation = '↑ New selection'; }
                                    else if (opt.value === suggestion.current_option) { borderColor = 'red'; annotation = '↓ Previous selection'; }
                                  } else {
                                    const currentOpt = suggestion.suggested_option || suggestion.current_option;
                                    if (currentOpt && opt.value === currentOpt) { borderColor = 'green'; annotation = 'Keep current selection — just update the prompt'; }
                                    else if (!currentOpt && options.indexOf(opt) === 0) { borderColor = 'green'; annotation = 'Keep current selection — just update the prompt'; }
                                  }
                                  return <OptionCard key={opt.value} option={opt} borderColor={borderColor} annotation={annotation} />;
                                })}
                              </div>
                            </div>
                          )}

                          <div className="mx-4 border-t border-dashed border-border" />
                          <div className="px-4 py-3">
                            <p className="field-text text-foreground/80 leading-relaxed">{suggestion.reason}</p>
                          </div>

                          <div className="px-4 pb-3">
                            <ExpandedDiffBlock original={suggestion.original_prompt} suggested={suggestion.suggested_prompt} />
                          </div>

                          <div className="px-4 pb-4 flex items-center gap-2">
                            {suggestion.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleApprove(i)} className="groove-btn groove-btn-positive !h-7 field-text"><Check className="w-3 h-3 mr-1" /> Approve</Button>
                                <Button size="sm" onClick={() => handleDecline(i)} className="groove-btn groove-btn-destructive !h-7 field-text"><X className="w-3 h-3 mr-1" /> Decline</Button>
                              </>
                            )}
                            {suggestion.status === 'approved' && <span className="field-text flex items-center gap-1" style={{ color: 'hsl(142 71% 45%)' }}><Check className="w-3 h-3" /> APPROVED</span>}
                            {suggestion.status === 'declined' && <span className="field-text flex items-center gap-1 text-muted-foreground"><X className="w-3 h-3" /> DECLINED</span>}
                            {suggestion.status === 'applied' && <span className="field-text flex items-center gap-1" style={{ color: 'hsl(200 80% 55%)' }}><Check className="w-3 h-3" /> APPLIED</span>}
                          </div>
                        </div>
                      );
                    })}

                    {report.suggestions.length === 0 && (
                       <div className="groove-border bg-card p-8 flex flex-col items-center justify-center text-center">
                        <CheckCircle className="w-12 h-12 mb-4" style={{ color: 'hsl(var(--primary))' }} />
                        <h3 style={{ fontFamily: "'VT323', monospace", fontSize: '28px', letterSpacing: '1.5px' }} className="text-foreground uppercase">No Modifications Needed</h3>
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} className="text-muted-foreground mt-1">Your setter is already configured correctly for your request.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {report && !generating && approvedCount > 0 && (
            <div className="px-6 py-4 flex-shrink-0 flex items-center justify-end gap-3" style={{ borderTop: '3px groove hsl(var(--border-groove))' }}>
              <p className="field-text text-muted-foreground mr-auto">{approvedCount} change{approvedCount > 1 ? 's' : ''} will be applied</p>
              <Button onClick={handleSaveApproved} disabled={saving} className="groove-btn groove-btn-positive">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Sparkles className="w-4 h-4 mr-2" />Apply {approvedCount} Change{approvedCount > 1 ? 's' : ''}</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={open && showFeedbackStep} onOpenChange={(o) => {
        if (!o) {
          setShowFeedbackStep(false);
          if (feedbackToMainHandoffRef.current || generating) { setMainDialogReady(true); return; }
          setUserFeedback('');
          if (report) { setMainDialogReady(true); } else { onOpenChange(false); }
        }
      }}>
        <DialogContent className="flex flex-col !p-0" style={{ width: '560px', maxWidth: '90vw', maxHeight: '80vh' }}>
          <div className="flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '3px groove hsl(var(--border-groove))', paddingTop: '14px', paddingBottom: '14px' }}>
            <div className="flex flex-col space-y-1.5 text-left">
              <DialogTitle>MODIFY SETTER PROMPT WITH AI</DialogTitle>
              <p className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                Tell the AI what you want to change
              </p>
            </div>
            <DialogClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 !bg-muted !border-border hover:!bg-accent shrink-0" title="Close">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>

          <div className="px-6 py-5">
            <p className="field-text text-muted-foreground mb-4">
              What do you want to change about your setter's behavior? The AI will analyze all 70+ parameters and suggest specific changes.
            </p>
            <textarea
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
              placeholder="e.g. Make it more aggressive on objections, remove all emojis, focus more on agency owners, shorten responses..."
              className="block w-full min-h-[200px] p-3 bg-card groove-border text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', marginBottom: 0 }}
            />
            <div style={{ marginTop: '8px' }}>
              <Button
                onClick={() => generateReport(userFeedback)}
                disabled={!userFeedback.trim()}
                className="groove-btn groove-btn-blue field-text w-full"
              >
                <Sparkles className="w-3 h-3 mr-1.5" /> Analyze & Generate Suggestions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showCloseWarning}
        onOpenChange={setShowCloseWarning}
        description={generating
          ? 'AI is currently analyzing your setter prompt. If you close this window, it will keep running in the background and you can reopen it later to review the new suggestions.'
          : 'You have pending suggestions that haven\'t been reviewed. If you exit now, your progress will be lost.'}
        onDiscard={doClose}
      />
    </>
  );
}
