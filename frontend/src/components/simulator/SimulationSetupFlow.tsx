import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Sparkles, Plus, Trash2, ChevronRight, AlertTriangle, Maximize2, Check } from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { type ICPProfile } from './ICPNodeGraph';
import { ICPEditorForm } from './ICPEditorForm';
import { ICPArcadeSelector } from './ICPArcadeSelector';
import { cn } from '@/lib/utils';

interface SetterSlotOption {
  value: string;
  label: string;
  type: 'text' | 'voice';
}

export const DEFAULT_ICP: ICPProfile = {
  name: '',
  description: '',
  persona_count: 0,
  min_messages: 0,
  max_messages: 0,
  age_min: 18,
  age_max: 65,
  gender: 'any',
  location: '',
  behaviors: [],
  first_message_sender: 'inbound',
  first_message_detail: '',
  form_fields: '',
  outreach_message: '',
  lead_trigger: '',
  lead_knowledge: '',
  concerns: '',
  scenario_items: [],
  test_booking: false,
  test_cancellation: false,
  test_reschedule: false,
  booking_count: 0,
  cancel_reschedule_count: 0,
  sort_order: 0,
};

type SetupStep = 'input' | 'configure';

interface SimulationSetupFlowProps {
  clientId: string;
  simulationName: string;
  setSimulationName: (v: string) => void;
  agentNumber: string;
  setAgentNumber: (v: string) => void;
  businessInfo: string;
  setBusinessInfo: (v: string) => void;
  freeInput: string;
  setFreeInput: (v: string) => void;
  icpProfiles: ICPProfile[];
  setIcpProfiles: (profiles: ICPProfile[]) => void;
  minMessages: number;
  setMinMessages: (n: number) => void;
  maxMessages: number;
  setMaxMessages: (n: number) => void;
  onGeneratePersonas: () => void;
  onConfigGenerated?: (profiles: ICPProfile[], config: any) => void;
  onManualConfigInitialized?: (profiles: ICPProfile[]) => void | Promise<void>;
  onStatusChange?: (status: string) => void;
  generatingPersonas: boolean;
  isGeneratingConfig: boolean;
  setIsGeneratingConfig: (v: boolean) => void;
}

export function SimulationSetupFlow({
  clientId,
  simulationName, setSimulationName,
  agentNumber, setAgentNumber,
  businessInfo, setBusinessInfo,
  freeInput, setFreeInput,
  icpProfiles, setIcpProfiles,
  minMessages, setMinMessages,
  maxMessages, setMaxMessages,
  onGeneratePersonas,
  onConfigGenerated,
  onManualConfigInitialized,
  onStatusChange,
  generatingPersonas,
  isGeneratingConfig, setIsGeneratingConfig,
}: SimulationSetupFlowProps) {
  const [setupStep, setSetupStep] = useState<SetupStep>(icpProfiles.length > 0 || isGeneratingConfig ? 'configure' : 'input');
  const [selectedIcpIndex, setSelectedIcpIndex] = useState<number | null>(icpProfiles.length > 0 ? 0 : null);
  const [setterDropdownOpen, setSetterDropdownOpen] = useState(false);
  const [activeSetters, setActiveSetters] = useState<SetterSlotOption[]>([]);
  const [bookingFunctionEnabled, setBookingFunctionEnabled] = useState<boolean | undefined>(undefined);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const onConfigGeneratedRef = useRef(onConfigGenerated);
  onConfigGeneratedRef.current = onConfigGenerated;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  // Fetch booking function status for selected setter
  useEffect(() => {
    if (!clientId || !agentNumber) { setBookingFunctionEnabled(undefined); return; }
    const isVoice = agentNumber.startsWith('voice-');
    const slotId = isVoice ? `Voice-Setter-${agentNumber.replace('voice-', '')}` : `Setter-${agentNumber}`;
    (async () => {
      const { data } = await supabase
        .from('agent_settings')
        .select('booking_function_enabled')
        .eq('client_id', clientId)
        .eq('slot_id', slotId)
        .single();
      setBookingFunctionEnabled(data?.booking_function_enabled ?? false);
    })();
  }, [clientId, agentNumber]);

  // Fetch active setters
  useEffect(() => {
    if (!clientId) return;
    (async () => {
      // Fetch active prompts and agent_settings in parallel
      const [promptsRes, settingsRes] = await Promise.all([
        supabase
          .from('prompts')
          .select('slot_id, is_active')
          .eq('client_id', clientId)
          .eq('is_active', true),
        supabase
          .from('agent_settings')
          .select('slot_id, name')
          .eq('client_id', clientId),
      ]);
      const activePrompts = promptsRes.data || [];
      const settings = settingsRes.data || [];
      const settingsMap = Object.fromEntries(settings.map(s => [s.slot_id, s.name]));

      const options: SetterSlotOption[] = [];
      for (const p of activePrompts) {
        const sid = p.slot_id;
        if (!sid) continue;
        // Only text setters for simulator (voice not supported yet)
        if (sid.startsWith('Setter-') && sid !== 'Setter-followup') {
          const num = sid.replace('Setter-', '');
          const description = settingsMap[sid];
          const displayName = description && description.trim() ? `Setter-${num} — ${description.trim()}` : `Setter-${num}`;
          options.push({ value: num, label: displayName, type: 'text' });
        }
      }
      options.sort((a, b) => {
        const numA = parseInt(a.value);
        const numB = parseInt(b.value);
        return numA - numB;
      });
      setActiveSetters(options);
    })();
  }, [clientId]);

  useEffect(() => {
    if (isGeneratingConfig) {
      setSetupStep('configure');
      return;
    }

    if (icpProfiles.length > 0) {
      setSetupStep('configure');
      setSelectedIcpIndex(prev => (prev !== null && prev < icpProfiles.length ? prev : 0));
      return;
    }

    setSetupStep('input');
    setSelectedIcpIndex(null);
  }, [icpProfiles.length, isGeneratingConfig]);

  // Generate configuration with AI
  const handleGenerateConfig = useCallback(async () => {
    if (!simulationName.trim()) {
      toast.error('Please enter a simulation name before generating.');
      return;
    }
    if (!freeInput.trim()) {
      toast.error('Please describe what you want to test before generating.');
      return;
    }
    setIsGeneratingConfig(true);
    onStatusChangeRef.current?.('processing');
    try {
      const { data: jobData, error } = await supabase.functions.invoke('generate-simulation-config', {
        body: { clientId, agentNumber: parseInt(agentNumber), freeInput },
      });

      if (error) throw error;
      if (jobData?.error) throw new Error(jobData.error);

      const jobId = jobData?.job_id;
      if (!jobId) throw new Error('No job_id returned');

      // Poll for result via Realtime + continuous polling fallback
      const jobResult = await new Promise<any>((resolve, reject) => {
        let resolved = false;
        const finish = (fn: () => void) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutId);
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
          fn();
        };

        const timeoutId = setTimeout(() => {
          finish(() => reject(new Error('AI generation timed out after 5 minutes. Please try again.')));
        }, 300000);

        const channel = supabase
          .channel(`ai-job-${jobId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'ai_generation_jobs',
            filter: `id=eq.${jobId}`,
          }, (payload) => {
            const row = payload.new as any;
            if (row.status === 'completed') finish(() => resolve(row.result));
            else if (row.status === 'failed') finish(() => reject(new Error(row.error_message || 'AI generation failed')));
          })
          .subscribe();

        // Continuous polling fallback every 3s
        const pollInterval = setInterval(async () => {
          if (resolved) return;
          try {
            const { data: pollRow } = await (supabase as any).from('ai_generation_jobs').select('status, result, error_message').eq('id', jobId).single();
            if (pollRow?.status === 'completed') finish(() => resolve(pollRow.result));
            else if (pollRow?.status === 'failed') finish(() => reject(new Error(pollRow.error_message || 'Failed')));
          } catch {}
        }, 3000);
      });

      const config = jobResult;
      if (!config?.icps || config.icps.length === 0) {
        throw new Error('AI did not generate any ICP profiles');
      }

      // Map AI output to ICPProfile format
      const profiles: ICPProfile[] = config.icps.map((icp: any, i: number) => ({
        ...DEFAULT_ICP,
        name: (icp.name || `ICP ${i + 1}`).substring(0, 20),
        description: icp.description || '',
        persona_count: icp.persona_count || 3,
        age_min: icp.age_min || 18,
        age_max: icp.age_max || 65,
        gender: icp.gender || 'any',
        location: icp.location || '',
        behaviors: icp.behaviors || ['friendly', 'skeptical'],
        first_message_sender: icp.first_message_sender || 'inbound',
        first_message_detail: icp.first_message_detail || '',
        lead_trigger: icp.lead_trigger || '',
        lead_knowledge: icp.lead_knowledge || '',
        concerns: icp.concerns || '',
        scenario_items: icp.scenario_items || [],
        test_booking: icp.test_booking || false,
        booking_count: icp.booking_count || 0,
        sort_order: i,
      }));

      setIcpProfiles(profiles);
      // Never overwrite user-defined simulation name with AI suggestion
      if (config.business_info) setBusinessInfo(config.business_info);
      if (config.min_messages) setMinMessages(config.min_messages);
      if (config.max_messages) setMaxMessages(config.max_messages);

      setSelectedIcpIndex(0);
      setSetupStep('configure');
      toast.success(`${profiles.length} ICP profiles generated!`);

      // Immediately persist the simulation to DB
      onConfigGeneratedRef.current?.(profiles, config);
    } catch (err: any) {
      console.error('Generate config error:', err);
      toast.error(err.message || 'Failed to generate configuration', { duration: Infinity });
      onStatusChangeRef.current?.('draft');
    } finally {
      setIsGeneratingConfig(false);
    }
  }, [clientId, agentNumber, freeInput, simulationName, setIcpProfiles, setSimulationName, setBusinessInfo, setMinMessages, setMaxMessages, setIsGeneratingConfig]);

  // Skip AI and go to manual configuration
  const handleSkipToManual = async () => {
    const profiles = icpProfiles.length > 0 ? icpProfiles : [{ ...DEFAULT_ICP }];

    if (icpProfiles.length === 0) {
      setIcpProfiles(profiles);
    }

    setSelectedIcpIndex(0);
    setSetupStep('configure');
    onStatusChange?.('configuration_ready');

    try {
      await onManualConfigInitialized?.(profiles);
    } catch (err) {
      console.error('Failed to initialize manual simulation config:', err);
      toast.error('Failed to save manual configuration');
    }
  };

  // Update a specific ICP profile
  const updateIcpProfile = (index: number, updated: ICPProfile) => {
    const newProfiles = [...icpProfiles];
    newProfiles[index] = updated;
    setIcpProfiles(newProfiles);
  };

  // Add a new ICP
  const addIcpProfile = () => {
    const newProfile = { ...DEFAULT_ICP, sort_order: icpProfiles.length };
    setIcpProfiles([...icpProfiles, newProfile]);
    setSelectedIcpIndex(icpProfiles.length);
  };

  // Remove an ICP
  const removeIcpProfile = (index: number) => {
    const newProfiles = icpProfiles.filter((_, i) => i !== index);
    setIcpProfiles(newProfiles);
    if (selectedIcpIndex !== null) {
      if (selectedIcpIndex >= newProfiles.length) {
        setSelectedIcpIndex(newProfiles.length > 0 ? newProfiles.length - 1 : null);
      } else if (selectedIcpIndex === index) {
        setSelectedIcpIndex(newProfiles.length > 0 ? 0 : null);
      }
    }
  };

  // ── Step 1: Basic Input ──
  if (setupStep === 'input') {
    return (
      <div className="space-y-6">
        {/* Simulation Name */}
        <div className="space-y-2.5">
          <Label className="field-text text-foreground">Simulation Name</Label>
          <p className="text-muted-foreground field-text">
            A short label so you can recognize this simulation later.
          </p>
          <Input
            value={simulationName}
            onChange={e => setSimulationName(e.target.value)}
            className="field-text"
            placeholder="e.g. Q1 Pricing Test, Cold Lead Nurture..."
          />
        </div>

        <div className="border-t border-dashed border-border" />

        {/* Which Setter */}
        <div className="space-y-2.5">
          <Label className="text-foreground field-text">Which Setter</Label>
          <p className="text-muted-foreground field-text">
            Select the active text setter that will receive and respond to the simulated conversations.
          </p>
          <Popover open={setterDropdownOpen} onOpenChange={setSetterDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                className="relative flex h-8 w-full items-center groove-border bg-card px-3 pr-10 py-1 text-left"
                style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}
              >
                <span className="truncate text-foreground flex-1">
                  {agentNumber
                    ? (activeSetters.find(s => s.value === agentNumber)?.label || `Setter ${agentNumber}`)
                    : <span className="text-muted-foreground">Select a setter...</span>}
                </span>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="currentColor" style={{ imageRendering: 'pixelated' as const }}>
                    <rect x="7" y="9" width="2" height="2" />
                    <rect x="9" y="11" width="2" height="2" />
                    <rect x="11" y="13" width="2" height="2" />
                    <rect x="13" y="11" width="2" height="2" />
                    <rect x="15" y="9" width="2" height="2" />
                  </svg>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0 groove-border bg-sidebar"
              align="start"
              sideOffset={4}
            >
              <div className="p-1">
                {activeSetters.length === 0 ? (
                  <div className="px-3 py-4 text-center text-muted-foreground" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    No active setters found. Please activate a setter first.
                  </div>
                ) : (
                  <>
                    <div className="pt-1.5 pb-1.5 border-b border-border/50 mb-1 px-3 -mx-1 w-[calc(100%+0.5rem)]">
                      <span className="text-muted-foreground uppercase" style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 'normal' }}>Text Setters</span>
                    </div>
                    {activeSetters.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => { setAgentNumber(s.value); setSetterDropdownOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors",
                          agentNumber === s.value
                            ? "bg-accent/50 text-foreground"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                        style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 'normal' }}
                      >
                        <span className="w-4 shrink-0 flex items-center justify-center">
                          {agentNumber === s.value ? <Check className="w-3.5 h-3.5 text-foreground" /> : ''}
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="border-t border-dashed border-border" />

        {/* AI Simulation Generator Block */}
        <div className="groove-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }} className="text-foreground">
              AI Simulation Generator
            </span>
          </div>
          <p className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.6' }}>
            Describe what you want to test below — what types of ICPs should be generated, how they should behave, what objections or scenarios to simulate, and any specific traits or conditions you want to explore.
          </p>

          <div className="relative">
            <Textarea
              value={freeInput}
              onChange={e => setFreeInput(e.target.value)}
              className="min-h-[160px]"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
              placeholder="e.g. I want to test how well my setter handles price objections from different types of customers. Some leads come from Facebook ads and know our pricing, others are referrals who know nothing about us..."
            />
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={() => setNotesExpanded(true)}
              className="absolute bottom-2 right-2 h-8 w-8"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleGenerateConfig}
            disabled={isGeneratingConfig}
            className="h-10 gap-2 w-full groove-btn-blue"
            style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' }}
          >
            {isGeneratingConfig ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating... Please Wait
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Simulation Configuration
              </>
            )}
          </Button>
        </div>

        {/* Expanded Notes Dialog (input step) */}
        <Dialog open={notesExpanded} onOpenChange={setNotesExpanded}>
          <DialogContent
            className="flex flex-col"
            style={{ width: '90vw', maxWidth: '64rem', height: '90vh', maxHeight: '90vh' }}
          >
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
                AI SIMULATION GENERATOR NOTES
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 px-6 pt-6">
              <Textarea
                value={freeInput}
                onChange={e => setFreeInput(e.target.value)}
                placeholder="Describe what types of ICPs to generate, how they should behave, what objections or scenarios to simulate..."
                className="h-full w-full leading-relaxed !resize-none"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', height: '100%' }}
              />
            </div>
            <div className="px-6 pb-6" style={{ paddingTop: '8px' }}>
              <Button
                onClick={() => { setNotesExpanded(false); handleGenerateConfig(); }}
                disabled={isGeneratingConfig}
                className="h-10 gap-2 w-full groove-btn-blue"
                style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' }}
              >
                {isGeneratingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating... Please Wait
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Simulation Configuration
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Step 2: Configure ICPs ──
  return (
    <div className="space-y-6">
      {/* Simulation Name (editable) */}
      <div className="space-y-2.5">
        <Label className="field-text text-foreground">Simulation Name</Label>
        <p className="text-muted-foreground field-text">
          A short label so you can recognize this simulation later.
        </p>
        <Input
          value={simulationName}
          onChange={e => setSimulationName(e.target.value)}
          className="field-text"
          placeholder="e.g. Q1 Pricing Test"
        />
      </div>

      <div className="border-t border-dashed border-border" />

      {/* Which Setter */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Which Setter</Label>
        <p className="text-muted-foreground field-text">
          Select the active text setter that will receive and respond to the simulated conversations.
        </p>
        <Popover open={setterDropdownOpen} onOpenChange={setSetterDropdownOpen}>
          <PopoverTrigger asChild>
            <button
              className="relative flex h-8 w-full items-center groove-border bg-card px-3 pr-10 py-1 text-left"
              style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}
            >
              <span className="truncate text-foreground flex-1">
                {agentNumber
                  ? (activeSetters.find(s => s.value === agentNumber)?.label || `Setter ${agentNumber}`)
                  : <span className="text-muted-foreground">Select a setter...</span>}
              </span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="currentColor" style={{ imageRendering: 'pixelated' as const }}>
                  <rect x="7" y="9" width="2" height="2" />
                  <rect x="9" y="11" width="2" height="2" />
                  <rect x="11" y="13" width="2" height="2" />
                  <rect x="13" y="11" width="2" height="2" />
                  <rect x="15" y="9" width="2" height="2" />
                </svg>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 groove-border bg-sidebar"
            align="start"
            sideOffset={4}
          >
            <div className="p-1">
              {activeSetters.length === 0 ? (
                <div className="px-3 py-4 text-center text-muted-foreground" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  No active setters found. Please activate a setter first.
                </div>
              ) : (
                <>
                  <div className="pt-1.5 pb-1.5 border-b border-border/50 mb-1 px-3 -mx-1 w-[calc(100%+0.5rem)]">
                    <span className="text-muted-foreground uppercase" style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 'normal' }}>Text Setters</span>
                  </div>
                  {activeSetters.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setAgentNumber(s.value); setSetterDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors",
                        agentNumber === s.value
                          ? "bg-accent/50 text-foreground"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                      style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 'normal' }}
                    >
                      <span className="w-4 shrink-0 text-foreground" style={{ fontSize: '13px' }}>
                        {agentNumber === s.value ? '✓' : ''}
                      </span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="border-t border-dashed border-border" />

      {/* AI Simulation Generator Block — persistent regeneration */}
      <div className="groove-border bg-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }} className="text-foreground">
            AI Simulation Generator
          </span>
        </div>
        <p className="text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.6' }}>
          Update your testing goals below — what types of ICPs should be generated, how they should behave, what objections or scenarios to simulate. Regenerating will replace the current configuration.
        </p>

        <div className="relative">
          <Textarea
            value={freeInput}
            onChange={e => setFreeInput(e.target.value)}
            className="min-h-[160px]"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
            placeholder="e.g. I want to test how well my setter handles price objections from different types of customers..."
          />
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setNotesExpanded(true)}
            className="absolute bottom-2 right-2 h-8 w-8"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={() => {
            if (icpProfiles.length > 0) {
              setShowRegenerateConfirm(true);
            } else {
              handleGenerateConfig();
            }
          }}
          disabled={isGeneratingConfig}
          className="h-10 gap-2 w-full groove-btn-blue"
          style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' }}
        >
          {isGeneratingConfig ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating... Please Wait
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Regenerate Simulation Configuration
            </>
          )}
        </Button>
      </div>

      <div className="border-t border-dashed border-border" />

      {/* Node Graph Visualization */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="field-text text-foreground" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px', textTransform: 'capitalize' }}>
            ICP Profiles
          </Label>
          <div className="flex items-center gap-2">
            <Button
              onClick={addIcpProfile}
              className="groove-btn field-text !h-8"
              disabled={icpProfiles.length >= 8}
            >
              <Plus className="h-3 w-3 mr-1" />ADD ICP
            </Button>
            {selectedIcpIndex !== null && icpProfiles.length > 1 && (
              <Button
                onClick={() => removeIcpProfile(selectedIcpIndex)}
                className="groove-btn groove-btn-destructive field-text !h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />REMOVE
              </Button>
            )}
          </div>
        </div>

        <ICPArcadeSelector
          icps={icpProfiles}
          selectedIndex={selectedIcpIndex}
          onSelect={setSelectedIcpIndex}
        />
      </div>

      <div className="border-t border-dashed border-border" />

      {/* Selected ICP Editor */}
      {selectedIcpIndex !== null && icpProfiles[selectedIcpIndex] && (
        <>
          <ICPEditorForm
            icp={icpProfiles[selectedIcpIndex]}
            onChange={(updated) => updateIcpProfile(selectedIcpIndex, updated)}
            index={selectedIcpIndex}
            bookingFunctionEnabled={bookingFunctionEnabled}
            clientId={clientId}
            agentSlotId={agentNumber ? (agentNumber.startsWith('voice-') ? `Voice-Setter-${agentNumber.replace('voice-', '')}` : `Setter-${agentNumber}`) : undefined}
          />
        </>
      )}

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <DialogContent className="max-w-md !p-0">
          <DialogHeader>
            <DialogTitle>Regenerate Simulation?</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
              This will replace all existing ICP profiles and configuration data with a new AI-generated setup. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => setShowRegenerateConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setShowRegenerateConfirm(false);
                  handleGenerateConfig();
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Notes Dialog */}
      <Dialog open={notesExpanded} onOpenChange={setNotesExpanded}>
        <DialogContent
          className="flex flex-col"
          style={{
            width: '90vw',
            maxWidth: '64rem',
            height: '90vh',
            maxHeight: '90vh',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
              AI SIMULATION GENERATOR NOTES
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 pt-6">
            <Textarea
              value={freeInput}
              onChange={e => setFreeInput(e.target.value)}
              placeholder="e.g. I want to test how well my setter handles price objections from different types of customers..."
              className="h-full w-full leading-relaxed !resize-none"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', height: '100%' }}
            />
          </div>
          <div className="px-6 pb-6" style={{ paddingTop: '8px' }}>
            <Button
              onClick={() => {
                setNotesExpanded(false);
                if (icpProfiles.length > 0) {
                  setShowRegenerateConfirm(true);
                } else {
                  handleGenerateConfig();
                }
              }}
              disabled={isGeneratingConfig}
              className="h-10 gap-2 w-full groove-btn-blue"
              style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' }}
            >
              {isGeneratingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating... Please Wait
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {icpProfiles.length > 0 ? 'Regenerate Simulation Configuration' : 'Generate Simulation Configuration'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
