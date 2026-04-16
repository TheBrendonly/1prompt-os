import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pencil, Trash2, Save } from '@/components/icons';
import { cn } from '@/lib/utils';

// ── Types ──

export interface ExtendedConfig {
  trigger: string;
  leadKnowledge: string;
  scenarioItems: string[];
  ageMin: number;
  ageMax: number;
  gender: 'male' | 'female' | 'any';
  location: string;
  behaviors: string[];
  testBooking: boolean;
  testCancellation: boolean;
  testReschedule: boolean;
  bookingCount: number;
  cancelRescheduleCount: number;
}

export const DEFAULT_EXTENDED_CONFIG: ExtendedConfig = {
  trigger: '',
  leadKnowledge: '',
  scenarioItems: [],
  ageMin: 18,
  ageMax: 65,
  gender: 'any',
  location: '',
  behaviors: ['friendly', 'skeptical', 'inquisitive'],
  testBooking: false,
  testCancellation: false,
  testReschedule: false,
  bookingCount: 0,
  cancelRescheduleCount: 0,
};

export function parseExtendedConfig(testSpecifics: string | null): ExtendedConfig {
  if (!testSpecifics) return { ...DEFAULT_EXTENDED_CONFIG };
  try {
    const parsed = JSON.parse(testSpecifics);
    return {
      trigger: parsed.trigger || '',
      leadKnowledge: parsed.leadKnowledge || '',
      scenarioItems: Array.isArray(parsed.scenarioItems) ? parsed.scenarioItems : [],
      ageMin: parsed.ageMin ?? 18,
      ageMax: parsed.ageMax ?? 65,
      gender: parsed.gender || 'any',
      location: parsed.location || '',
      behaviors: Array.isArray(parsed.behaviors) ? parsed.behaviors : ['friendly', 'skeptical', 'inquisitive'],
      testBooking: parsed.testBooking ?? false,
      testCancellation: parsed.testCancellation ?? false,
      testReschedule: parsed.testReschedule ?? false,
      bookingCount: parsed.bookingCount ?? 0,
      cancelRescheduleCount: parsed.cancelRescheduleCount ?? 0,
    };
  } catch {
    return {
      ...DEFAULT_EXTENDED_CONFIG,
      scenarioItems: testSpecifics ? [testSpecifics] : [],
    };
  }
}

export function serializeExtendedConfig(config: ExtendedConfig): string {
  return JSON.stringify(config);
}

// ── Constants ──

const SETTER_OPTIONS = [
  { value: '1', label: 'Setter 1' },
  { value: '2', label: 'Setter 2' },
  { value: '3', label: 'Setter 3' },
  { value: '4', label: 'Setter 4' },
  { value: '5', label: 'Setter 5' },
  { value: '6', label: 'Setter 6' },
  { value: '7', label: 'Setter 7' },
  { value: '8', label: 'Setter 8' },
  { value: '9', label: 'Setter 9' },
  { value: '10', label: 'Setter 10' },
  { value: '11', label: 'Follow-up Setter' },
];

const BEHAVIOR_OPTIONS = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, cooperative, easy to work with' },
  { value: 'skeptical', label: 'Skeptical', description: 'Pushes back, asks for proof, doubts claims' },
  { value: 'inquisitive', label: 'Inquisitive', description: 'Asks many questions, wants all the details' },
  { value: 'brief', label: 'Brief', description: 'Short answers, one-word replies, tests pushiness' },
  { value: 'detailed', label: 'Detailed', description: 'Shares lots of context unprompted' },
  { value: 'distracted', label: 'Distracted', description: 'Goes off topic, comes back eventually' },
  { value: 'aggressive', label: 'Aggressive', description: 'Confrontational, demanding, tests composure' },
  { value: 'impatient', label: 'Impatient', description: 'Wants quick answers, frustrated by delays' },
  { value: 'indecisive', label: 'Indecisive', description: "Can't make up their mind, needs convincing" },
  { value: 'price_sensitive', label: 'Price-Sensitive', description: 'Focused on cost, asks for discounts' },
];

const GENDER_OPTIONS = [
  { value: 'any', label: 'Any', description: 'Mix of male and female personas' },
  { value: 'male', label: 'Male', description: 'Only male personas' },
  { value: 'female', label: 'Female', description: 'Only female personas' },
];

// ── Reusable select card ──

function SelectCard({ label, description, selected, onClick }: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-2.5 transition-colors duration-100 groove-border relative",
        selected ? "bg-card" : "bg-card hover:bg-muted/50"
      )}
    >
      {selected && (
        <div className="absolute inset-0 pointer-events-none" style={{
          border: '1px solid hsl(var(--primary))',
          boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.1)',
        }} />
      )}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-5 h-5 groove-border flex items-center justify-center flex-shrink-0",
          selected ? "bg-primary" : "bg-card"
        )}>
          {selected && <span className="text-primary-foreground field-text font-bold">✓</span>}
        </div>
        <span className={cn("field-text font-medium text-foreground", selected && "text-primary")}>
          {label}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 field-text" style={{ paddingLeft: '28px' }}>
        {description}
      </p>
    </button>
  );
}

function SectionSeparator() {
  return <div className="border-t border-dashed border-border" />;
}

// ── Props ──

interface SimulatorConfigFormProps {
  agentNumber: string;
  setAgentNumber: (v: string) => void;
  businessInfo: string;
  setBusinessInfo: (v: string) => void;
  config: ExtendedConfig;
  setConfig: (c: ExtendedConfig) => void;
  numConversations: number;
  setNumConversations: (n: number) => void;
  minMessages: number;
  setMinMessages: (n: number) => void;
  maxMessages: number;
  setMaxMessages: (n: number) => void;
  newScenarioItem: string;
  setNewScenarioItem: (v: string) => void;
  onAddScenarioItem: () => void;
  onRemoveScenarioItem: (idx: number) => void;
}

export const SimulatorConfigForm: React.FC<SimulatorConfigFormProps> = ({
  agentNumber, setAgentNumber,
  businessInfo, setBusinessInfo,
  config, setConfig,
  numConversations, setNumConversations,
  minMessages, setMinMessages,
  maxMessages, setMaxMessages,
  newScenarioItem, setNewScenarioItem,
  onAddScenarioItem, onRemoveScenarioItem,
}) => {
  const [editingScenarioIdx, setEditingScenarioIdx] = React.useState<number | null>(null);
  const [editingScenarioValue, setEditingScenarioValue] = React.useState('');

  const updateConfig = (partial: Partial<ExtendedConfig>) => {
    setConfig({ ...config, ...partial });
  };

  const toggleBehavior = (value: string) => {
    const current = config.behaviors;
    if (current.includes(value)) {
      updateConfig({ behaviors: current.filter(b => b !== value) });
    } else {
      updateConfig({ behaviors: [...current, value] });
    }
  };

  const effectiveBookingCount = Math.min(config.bookingCount, numConversations);
  const effectiveCancelRescheduleCount = Math.min(config.cancelRescheduleCount, effectiveBookingCount);

  return (
    <div className="space-y-6">
      {/* Which Setter */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Which Setter</Label>
        <p className="text-muted-foreground field-text">
          Select the text setter that will receive and respond to the simulated conversations.
        </p>
        <Select value={agentNumber} onValueChange={setAgentNumber}>
          <SelectTrigger className="w-full max-w-[300px] field-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SETTER_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value} className="field-text">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SectionSeparator />

      {/* Age Range */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Age Range</Label>
        <p className="text-muted-foreground field-text">
          Define the age range of the simulated prospects.
        </p>
        <div className="flex items-center gap-4 max-w-[400px]">
          <span className="text-foreground min-w-[32px] text-center field-text">{config.ageMin}</span>
          <Slider
            min={18}
            max={75}
            step={1}
            value={[config.ageMin, config.ageMax]}
            onValueChange={([min, max]) => updateConfig({ ageMin: min, ageMax: max })}
            className="flex-1"
          />
          <span className="text-foreground min-w-[32px] text-center field-text">{config.ageMax}</span>
        </div>
      </div>

      <SectionSeparator />

      {/* Gender */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Gender</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GENDER_OPTIONS.map(opt => (
            <SelectCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={config.gender === opt.value}
              onClick={() => updateConfig({ gender: opt.value as ExtendedConfig['gender'] })}
            />
          ))}
        </div>
      </div>

      <SectionSeparator />

      {/* Location */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Location</Label>
        <p className="text-muted-foreground field-text">
          Where are your typical customers located?
        </p>
        <Input
          placeholder="e.g., New York, USA or English-speaking countries"
          value={config.location}
          onChange={e => updateConfig({ location: e.target.value })}
          className="max-w-[500px] field-text"
        />
      </div>

      <SectionSeparator />

      {/* Behavior Mix */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Behavior Mix</Label>
        <p className="text-muted-foreground field-text">
          Select which personality types to include. Personas will be randomly assigned from your selection.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BEHAVIOR_OPTIONS.map(opt => (
            <SelectCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={config.behaviors.includes(opt.value)}
              onClick={() => toggleBehavior(opt.value)}
            />
          ))}
        </div>
      </div>

      <SectionSeparator />

      {/* Business Info */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Tell Us About Your Business</Label>
        <p className="text-muted-foreground field-text">
          Describe your business, products, services, pricing, target audience, and unique selling points.
        </p>
        <Textarea
          placeholder="We run a digital marketing agency specializing in Facebook ads for local dentists. Our main offer is a $2,997/mo retainer that includes ad management, landing pages, and appointment booking automation..."
          value={businessInfo}
          onChange={e => setBusinessInfo(e.target.value)}
          rows={4}
          className="field-text"
        />
      </div>

      <SectionSeparator />

      {/* Lead Trigger */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Lead Trigger</Label>
        <p className="text-muted-foreground field-text">
          What action did the lead take before your setter engages them?
        </p>
        <Textarea
          placeholder="The customer booked an appointment from a Facebook ad and filled out a form with their name and phone number..."
          value={config.trigger}
          onChange={e => updateConfig({ trigger: e.target.value })}
          rows={3}
          className="field-text"
        />
      </div>

      <SectionSeparator />

      {/* Lead Knowledge */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Lead Knowledge</Label>
        <p className="text-muted-foreground field-text">
          What does the lead already know about your business before the conversation starts?
        </p>
        <Textarea
          placeholder="They saw a Facebook ad promising '10 new patients/month guaranteed'. They know we work with dentists but don't know our pricing or process..."
          value={config.leadKnowledge}
          onChange={e => updateConfig({ leadKnowledge: e.target.value })}
          rows={3}
          className="field-text"
        />
      </div>

      <SectionSeparator />

      {/* Specific Scenarios */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Scenarios to Test</Label>
        <p className="text-muted-foreground field-text">
          Specific objections or questions for this ICP type.
        </p>

        {config.scenarioItems.length > 0 && (
          <div className="flex flex-col gap-1">
            {config.scenarioItems.map((item, idx) => (
              editingScenarioIdx === idx ? (
                <div key={idx} className="border border-border p-2.5 space-y-2 bg-muted/30">
                  <Input
                    autoFocus
                    value={editingScenarioValue}
                    onChange={(e) => setEditingScenarioValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingScenarioValue.trim()) {
                        e.preventDefault();
                        const updated = [...config.scenarioItems];
                        updated[idx] = editingScenarioValue.trim();
                        updateConfig({ scenarioItems: updated });
                        setEditingScenarioIdx(null);
                      } else if (e.key === 'Escape') {
                        setEditingScenarioIdx(null);
                      }
                    }}
                    className="h-8"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 flex-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} onClick={() => setEditingScenarioIdx(null)}>Cancel</Button>
                    <Button type="button" size="sm" className="h-7 flex-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} onClick={() => {
                      if (editingScenarioValue.trim()) {
                        const updated = [...config.scenarioItems];
                        updated[idx] = editingScenarioValue.trim();
                        updateConfig({ scenarioItems: updated });
                      }
                      setEditingScenarioIdx(null);
                    }} disabled={!editingScenarioValue.trim() || editingScenarioValue.trim() === item}>Save</Button>
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 groove-border bg-card px-3 flex items-center overflow-hidden" style={{ minHeight: '32px' }}>
                    <span className="text-foreground truncate" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                      {item}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditingScenarioIdx(idx); setEditingScenarioValue(item); }}
                      className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50 cursor-pointer"
                      title="Edit scenario"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveScenarioItem(idx)}
                      className="groove-btn groove-btn-destructive !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center cursor-pointer"
                      title="Delete scenario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            value={newScenarioItem}
            onChange={e => setNewScenarioItem(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newScenarioItem.trim()) {
                e.preventDefault();
                onAddScenarioItem();
              }
            }}
            placeholder="e.g., Ask about pricing and say it's too expensive"
            className="h-8 flex-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-8 gap-1.5 font-medium groove-btn-positive"
            disabled={!newScenarioItem.trim()}
            onClick={onAddScenarioItem}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="ml-1.5">Submit</span>
          </Button>
        </div>
      </div>

      <SectionSeparator />

      {/* Conversations */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Conversations</Label>
        <p className="text-muted-foreground field-text">
          How many conversations do you want to simulate? (max 20)
        </p>
        <Input
          type="number"
          min={1}
          max={20}
          value={numConversations}
          onChange={e => {
            const val = Math.min(20, Math.max(1, parseInt(e.target.value) || 1));
            setNumConversations(val);
          }}
          className="max-w-[200px] field-text"
        />
      </div>

      <SectionSeparator />

      {/* Min Messages */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Min Messages Per Persona</Label>
        <p className="text-muted-foreground field-text">
          Minimum number of messages each persona will send (2-30).
        </p>
        <Input
          type="number"
          min={2}
          max={30}
          value={minMessages}
          onChange={e => setMinMessages(parseInt(e.target.value) || 0)}
          onBlur={() => setMinMessages(Math.min(30, Math.max(2, minMessages)))}
          className="max-w-[200px] field-text"
        />
      </div>

      <SectionSeparator />

      {/* Max Messages */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Max Messages Per Persona</Label>
        <p className="text-muted-foreground field-text">
          Maximum number of messages each persona will send (3-30). Does not include booking messages.
        </p>
        <Input
          type="number"
          min={2}
          max={30}
          value={maxMessages}
          onChange={e => setMaxMessages(parseInt(e.target.value) || 0)}
          onBlur={() => setMaxMessages(Math.min(30, Math.max(2, maxMessages)))}
          className="max-w-[200px] field-text"
        />
      </div>

      <SectionSeparator />

      {/* Test Booking */}
      <div className="space-y-2.5">
        <Label className="text-foreground field-text">Test Booking</Label>
        <p className="text-muted-foreground field-text">
          Should some personas attempt to book an appointment? Booking interactions are capped at 5 extra messages and don't count toward the persona's message limit.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[500px]">
          <SelectCard
            label="Yes"
            description="Some personas will try to book an appointment"
            selected={config.testBooking}
            onClick={() => updateConfig({ testBooking: true, bookingCount: config.bookingCount || Math.ceil(numConversations / 2) })}
          />
          <SelectCard
            label="No"
            description="No booking testing in this simulation"
            selected={!config.testBooking}
            onClick={() => updateConfig({ testBooking: false, bookingCount: 0, testCancellation: false, testReschedule: false, cancelRescheduleCount: 0 })}
          />
        </div>
      </div>

      {config.testBooking && (
        <>
          <SectionSeparator />

          <div className="space-y-2.5">
            <Label className="text-foreground field-text">How Many Personas Book?</Label>
            <p className="text-muted-foreground field-text">
              Out of {numConversations} total personas, how many should attempt to book an appointment?
            </p>
            <div className="flex items-center gap-4 max-w-[400px]">
              <span className="text-foreground min-w-[24px] text-center field-text">0</span>
              <Slider
                min={0}
                max={numConversations}
                step={1}
                value={[effectiveBookingCount]}
                onValueChange={([val]) => updateConfig({ bookingCount: val, cancelRescheduleCount: Math.min(config.cancelRescheduleCount, val) })}
                className="flex-1"
              />
              <span className="text-foreground min-w-[24px] text-center field-text">{numConversations}</span>
            </div>
            <p className="text-primary font-medium field-text">
              {effectiveBookingCount} out of {numConversations} will book
            </p>
          </div>

          <SectionSeparator />

          <div className="space-y-2.5">
            <Label className="text-foreground field-text">Test Cancellation & Reschedule</Label>
            <p className="text-muted-foreground field-text">
              After booking, should some personas request a cancellation or reschedule? They will first complete a booking, then change their mind.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[500px]">
              <SelectCard
                label="Yes"
                description="Some personas will cancel or reschedule after booking"
                selected={config.testCancellation || config.testReschedule}
                onClick={() => updateConfig({
                  testCancellation: true,
                  testReschedule: true,
                  cancelRescheduleCount: config.cancelRescheduleCount || Math.ceil(effectiveBookingCount / 3),
                })}
              />
              <SelectCard
                label="No"
                description="Personas will only book, no cancellation or reschedule"
                selected={!config.testCancellation && !config.testReschedule}
                onClick={() => updateConfig({ testCancellation: false, testReschedule: false, cancelRescheduleCount: 0 })}
              />
            </div>
          </div>

          {(config.testCancellation || config.testReschedule) && effectiveBookingCount > 0 && (
            <>
              <SectionSeparator />

              <div className="space-y-2.5">
                <Label className="text-foreground field-text">How Many Cancel or Reschedule?</Label>
                <p className="text-muted-foreground field-text">
                  Out of {effectiveBookingCount} booking personas, how many should cancel or reschedule after booking?
                </p>
                <div className="flex items-center gap-4 max-w-[400px]">
                  <span className="text-foreground min-w-[24px] text-center field-text">0</span>
                  <Slider
                    min={0}
                    max={effectiveBookingCount}
                    step={1}
                    value={[effectiveCancelRescheduleCount]}
                    onValueChange={([val]) => updateConfig({ cancelRescheduleCount: val })}
                    className="flex-1"
                  />
                  <span className="text-foreground min-w-[24px] text-center field-text">{effectiveBookingCount}</span>
                </div>
                <p className="text-primary font-medium field-text">
                  {effectiveCancelRescheduleCount} out of {effectiveBookingCount} will cancel or reschedule
                </p>
                <p className="text-muted-foreground field-text" style={{ fontSize: '12px' }}>
                  Remaining {effectiveBookingCount - effectiveCancelRescheduleCount} will only book. {numConversations - effectiveBookingCount} won't attempt booking at all.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
