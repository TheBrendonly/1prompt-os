import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Plus, X, Settings, Pencil, Trash2, Save } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ICPProfile } from './ICPNodeGraph';

const BEHAVIOR_OPTIONS = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, cooperative, easy to work with' },
  { value: 'skeptical', label: 'Skeptical', description: 'Pushes back, asks for proof' },
  { value: 'inquisitive', label: 'Inquisitive', description: 'Asks many questions, wants all details' },
  { value: 'brief', label: 'Brief', description: 'Short answers, one-word replies' },
  { value: 'detailed', label: 'Detailed', description: 'Shares lots of context unprompted' },
  { value: 'distracted', label: 'Distracted', description: 'Goes off topic, comes back eventually' },
  { value: 'aggressive', label: 'Aggressive', description: 'Confrontational, demanding' },
  { value: 'impatient', label: 'Impatient', description: 'Wants quick answers, frustrated by delays' },
  { value: 'indecisive', label: 'Indecisive', description: "Can't make up their mind" },
  { value: 'price_sensitive', label: 'Price-Sensitive', description: 'Focused on cost, asks for discounts' },
];

const GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

function SelectCard({ label, description, selected, onClick }: {
  label: string; description?: string; selected: boolean; onClick: () => void;
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
          boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.15)',
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
      {description && (
        <p className="text-muted-foreground mt-1 field-text" style={{ paddingLeft: '28px' }}>
          {description}
        </p>
      )}
    </button>
  );
}

function SectionSeparator() {
  return <div className="border-t border-dashed border-border" />;
}

/** Setter-style field: white title, grey subtitle, then input */
function FieldBlock({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground field-text">{title}</Label>
      {subtitle && <p className="text-muted-foreground field-text">{subtitle}</p>}
      {children}
    </div>
  );
}

interface ICPEditorFormProps {
  icp: ICPProfile;
  onChange: (updated: ICPProfile) => void;
  index: number;
  bookingFunctionEnabled?: boolean;
  clientId?: string;
  agentSlotId?: string;
}

export function ICPEditorForm({ icp, onChange, index, bookingFunctionEnabled, clientId, agentSlotId }: ICPEditorFormProps) {
  const navigate = useNavigate();
  const update = (partial: Partial<ICPProfile>) => onChange({ ...icp, ...partial });

  const toggleBehavior = (value: string) => {
    const current = icp.behaviors;
    if (current.includes(value)) {
      update({ behaviors: current.filter(b => b !== value) });
    } else {
      update({ behaviors: [...current, value] });
    }
  };

  const [newScenario, setNewScenario] = React.useState('');
  const [editingScenarioIdx, setEditingScenarioIdx] = React.useState<number | null>(null);
  const [editingScenarioValue, setEditingScenarioValue] = React.useState('');

  const addScenario = () => {
    if (!newScenario.trim()) return;
    update({ scenario_items: [...icp.scenario_items, newScenario.trim()] });
    setNewScenario('');
  };

  const removeScenario = (idx: number) => {
    update({ scenario_items: icp.scenario_items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-5">
      {/* ICP Name */}
      <FieldBlock title="ICP Name" subtitle="A short label for this ideal customer profile.">
        <Input
          value={icp.name}
          onChange={e => update({ name: e.target.value.substring(0, 20) })}
          className="field-text"
          placeholder="e.g. Budget SMB Owner"
          maxLength={20}
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Description */}
      <FieldBlock title="Description" subtitle="Brief description of this customer type and their background.">
        <Textarea
          value={icp.description || ''}
          onChange={e => update({ description: e.target.value })}
          rows={6}
          className="field-text"
          placeholder="Brief description of this customer type..."
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Persona Count */}
      <FieldBlock title="Personas for This ICP" subtitle="How many unique personas to generate for this profile.">
        <Input
          type="number"
          min={0}
          max={10}
          value={icp.persona_count}
          onChange={e => update({ persona_count: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
          className="max-w-[200px] field-text"
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Min/Max Messages Per Persona */}
      <div className="grid grid-cols-2 gap-4">
        <FieldBlock title="Min Messages Per Persona" subtitle="Minimum number of messages each persona will send.">
          <Input
            type="number"
            min={0}
            max={30}
            value={icp.min_messages}
            onChange={e => update({ min_messages: parseInt(e.target.value) || 0 })}
            onBlur={() => update({ min_messages: Math.min(30, Math.max(0, icp.min_messages)) })}
            className="field-text"
          />
        </FieldBlock>
        <FieldBlock title="Max Messages Per Persona" subtitle="Maximum number of messages each persona will send.">
          <Input
            type="number"
            min={0}
            max={30}
            value={icp.max_messages}
            onChange={e => update({ max_messages: parseInt(e.target.value) || 0 })}
            onBlur={() => update({ max_messages: Math.min(30, Math.max(icp.min_messages, icp.max_messages)) })}
            className="field-text"
          />
        </FieldBlock>
      </div>

      <SectionSeparator />

      {/* Gender */}
      <FieldBlock title="Gender" subtitle="Gender distribution for generated personas.">
        <div className="grid grid-cols-3 gap-2 max-w-[400px]">
          {GENDER_OPTIONS.map(opt => (
            <SelectCard
              key={opt.value}
              label={opt.label}
              selected={icp.gender === opt.value}
              onClick={() => update({ gender: opt.value as ICPProfile['gender'] })}
            />
          ))}
        </div>
      </FieldBlock>

      <SectionSeparator />

      {/* Age Range */}
      <FieldBlock title="Age Range" subtitle="Age distribution for generated personas.">
        <div className="flex items-center gap-4 max-w-[400px]">
          <span className="text-foreground min-w-[32px] text-center field-text">{icp.age_min}</span>
          <Slider
            min={18}
            max={75}
            step={1}
            value={[icp.age_min, icp.age_max]}
            onValueChange={([min, max]) => update({ age_min: min, age_max: max })}
            className="flex-1"
          />
          <span className="text-foreground min-w-[32px] text-center field-text">{icp.age_max}</span>
        </div>
      </FieldBlock>

      <SectionSeparator />

      {/* Location */}
      <FieldBlock title="Location" subtitle="Geographic location or region for this ICP.">
        <Input
          value={icp.location}
          onChange={e => update({ location: e.target.value })}
          className="max-w-[500px] field-text"
          placeholder="e.g. United States, English-speaking countries"
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Behaviors */}
      <FieldBlock title="Behavior Mix" subtitle="Select the personality traits personas in this ICP should exhibit.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BEHAVIOR_OPTIONS.map(opt => (
            <SelectCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={icp.behaviors.includes(opt.value)}
              onClick={() => toggleBehavior(opt.value)}
            />
          ))}
        </div>
      </FieldBlock>

      <SectionSeparator />

      {/* First Message Sender */}
      <FieldBlock title="Who Sends the First Message?" subtitle="Select who initiates the conversation. This defines the persona's entry point.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SelectCard
            label="Inbound Lead"
            description="The lead messages us first (e.g. DM, chat widget)"
            selected={icp.first_message_sender === 'inbound'}
            onClick={() => update({ first_message_sender: 'inbound', form_fields: '', outreach_message: '' })}
          />
          <SelectCard
            label="Form Lead"
            description="Lead submitted a form (website, Meta, Typeform, etc.)"
            selected={icp.first_message_sender === 'engagement'}
            onClick={() => update({ first_message_sender: 'engagement', outreach_message: '' })}
          />
          <SelectCard
            label="Outreach Response"
            description="We sent outreach first, lead is responding"
            selected={icp.first_message_sender === 'outreach_response'}
            onClick={() => update({ first_message_sender: 'outreach_response', form_fields: '' })}
          />
          <SelectCard
            label="Custom"
            description="Define a custom entry scenario"
            selected={icp.first_message_sender === 'custom'}
            onClick={() => update({ first_message_sender: 'custom', form_fields: '', outreach_message: '' })}
          />
        </div>
      </FieldBlock>

      {/* Conditional: Form Fields (for engagement/form leads) */}
      {icp.first_message_sender === 'engagement' && (
        <>
          <SectionSeparator />
          <FieldBlock
            title="Form Fields"
            subtitle="What fields does the lead fill out on the form? e.g. First Name, Last Name, Email, Phone, Service Interest, Notes. This will be simulated as a form submission."
          >
            <Textarea
              value={icp.form_fields}
              onChange={e => update({ form_fields: e.target.value })}
              rows={4}
              className="field-text"
              placeholder="e.g. First Name, Last Name, Email, Phone Number, Service Interested In, Additional Notes"
            />
          </FieldBlock>
        </>
      )}

      {/* Conditional: Outreach Message (for outreach response leads) */}
      {icp.first_message_sender === 'outreach_response' && (
        <>
          <SectionSeparator />
          <FieldBlock
            title="Your Outreach Message"
            subtitle="What message did you send to the lead? The simulation will show this as your initial outreach, and the lead will respond to it."
          >
            <Textarea
              value={icp.outreach_message}
              onChange={e => update({ outreach_message: e.target.value })}
              rows={3}
              className="field-text"
              placeholder="e.g. Hi! Are you interested in our premium insurance services? We have a special offer this month..."
            />
          </FieldBlock>
        </>
      )}

      <SectionSeparator />

      {/* First Message Detail */}
      <FieldBlock title="Entry Scenario Details" subtitle="Explain specifically how this lead enters the conversation. This is critical for realistic persona behavior.">
        <Textarea
          value={icp.first_message_detail}
          onChange={e => update({ first_message_detail: e.target.value })}
          rows={3}
          className="field-text"
          placeholder={
            icp.first_message_sender === 'inbound' ? "e.g. Saw a Facebook ad about our teeth whitening offer and DM'd us asking about pricing..." :
            icp.first_message_sender === 'engagement' ? "e.g. Filled out a form on our landing page requesting a free consultation for dental implants..." :
            icp.first_message_sender === 'outreach_response' ? "e.g. We sent them an SMS about our limited-time 50% off cleaning deal, they replied asking for details..." :
            "e.g. Describe the specific scenario for how this lead enters the conversation..."
          }
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Lead Trigger */}
      <FieldBlock title="Lead Trigger" subtitle="How did this type of lead find your business?">
        <Textarea
          value={icp.lead_trigger}
          onChange={e => update({ lead_trigger: e.target.value })}
          rows={2}
          className="field-text"
          placeholder="e.g. Clicked a Facebook ad, referred by a friend..."
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Lead Knowledge */}
      <FieldBlock title="Lead Knowledge" subtitle="What do they already know before the conversation?">
        <Textarea
          value={icp.lead_knowledge}
          onChange={e => update({ lead_knowledge: e.target.value })}
          rows={2}
          className="field-text"
          placeholder="e.g. They saw pricing on the website, know we work with dentists..."
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Concerns */}
      <FieldBlock title="Main Concerns" subtitle="What are their primary worries or objections?">
        <Textarea
          value={icp.concerns}
          onChange={e => update({ concerns: e.target.value })}
          rows={2}
          className="field-text"
          placeholder="e.g. Worried about cost, unsure about ROI, had bad experiences before..."
        />
      </FieldBlock>

      <SectionSeparator />

      {/* Scenario Items */}
      <FieldBlock title="Scenarios to Test" subtitle="Specific objections or questions for this ICP type.">
        {icp.scenario_items.length > 0 && (
          <div className="flex flex-col gap-1">
            {icp.scenario_items.map((item, idx) => (
              editingScenarioIdx === idx ? (
                <div key={idx} className="border border-border p-2.5 space-y-2 bg-muted/30">
                  <Input
                    autoFocus
                    value={editingScenarioValue}
                    onChange={(e) => setEditingScenarioValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingScenarioValue.trim()) {
                        e.preventDefault();
                        const updated = [...icp.scenario_items];
                        updated[idx] = editingScenarioValue.trim();
                        update({ scenario_items: updated });
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
                        const updated = [...icp.scenario_items];
                        updated[idx] = editingScenarioValue.trim();
                        update({ scenario_items: updated });
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
                      onClick={() => removeScenario(idx)}
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
            value={newScenario}
            onChange={e => setNewScenario(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newScenario.trim()) {
                e.preventDefault();
                addScenario();
              }
            }}
            placeholder="e.g. Ask about pricing and say it's too expensive"
            className="h-8 flex-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-8 gap-1.5 font-medium groove-btn-positive"
            disabled={!newScenario.trim()}
            onClick={addScenario}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="ml-1.5">Submit</span>
          </Button>
        </div>
      </FieldBlock>

      <SectionSeparator />

      {/* Booking Testing */}
      <FieldBlock title="Test Booking" subtitle="Should some personas attempt to book an appointment?">
        <div className="grid grid-cols-2 gap-2">
          <SelectCard
            label="Yes"
            description="Some personas will try to book"
            selected={icp.test_booking}
            onClick={() => update({ test_booking: true, booking_count: icp.booking_count || Math.ceil(icp.persona_count / 2) })}
          />
          <SelectCard
            label="No"
            description="No booking testing"
            selected={!icp.test_booking}
            onClick={() => update({ test_booking: false, booking_count: 0, test_cancellation: false, test_reschedule: false, cancel_reschedule_count: 0 })}
          />
        </div>
        {icp.test_booking && bookingFunctionEnabled === false && clientId && agentSlotId && (
          <div className="mt-3 space-y-2">
            <p className="text-destructive field-text" style={{ fontSize: '12px' }}>
              The Booking Function is currently disabled for this setter.
            </p>
            <Button
              variant="default"
              size="sm"
              className="groove-btn gap-2"
              style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px', height: '40px', paddingLeft: '16px', paddingRight: '16px' }}
              onClick={() => {
                const isVoice = agentSlotId.startsWith('Voice-Setter-');
                const path = isVoice ? 'prompts/voice' : 'prompts/text';
                navigate(`/client/${clientId}/${path}?slot=${agentSlotId}&configure=booking_function`);
              }}
            >
              <Settings className="w-4 h-4" />
              Enable Booking Function
            </Button>
          </div>
        )}
      </FieldBlock>

      {icp.test_booking && bookingFunctionEnabled !== false && (
        <>
          <SectionSeparator />
          <FieldBlock title="How Many Should Book" subtitle="Number of personas that will attempt to book.">
            <Input
              type="number"
              min={1}
              max={icp.persona_count}
              value={icp.booking_count}
              onChange={e => update({ booking_count: Math.min(icp.persona_count, Math.max(1, parseInt(e.target.value) || 1)) })}
              className="max-w-[200px] field-text"
            />
          </FieldBlock>
        </>
      )}
    </div>
  );
}
