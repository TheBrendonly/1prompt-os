import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Mail, DollarSign, RotateCcw, Eye, Loader2, MoreHorizontal, MessageSquare, Link } from '@/components/icons';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

// Import traffic guide images
import cloudflareDomains from '@/assets/traffic-guide/cloudflare-domains.png';
import instantlyLogo from '@/assets/traffic-guide/instantly-logo.png';
import smartleadLogo from '@/assets/traffic-guide/smartlead-logo.png';
import warmyLogo from '@/assets/traffic-guide/warmy-logo.png';
import instantlyEmailAccounts from '@/assets/traffic-guide/instantly-email-accounts.png';
import apolloLeads from '@/assets/traffic-guide/apollo-leads.png';
import millionverifierResults from '@/assets/traffic-guide/millionverifier-results.png';
import clayEnrichment from '@/assets/traffic-guide/clay-enrichment.png';
import instantlyPersonalization from '@/assets/traffic-guide/instantly-personalization.png';

// Import paid ads guide images
import facebookPage from '@/assets/traffic-guide/facebook-page.png';
import facebookBusinessManager from '@/assets/traffic-guide/facebook-business-manager.png';
import facebookAdAccount from '@/assets/traffic-guide/facebook-ad-account.png';
import creativeStatic from '@/assets/traffic-guide/creative-static.png';
import creativeVideo from '@/assets/traffic-guide/creative-video.png';
import campaignObjectiveLeads from '@/assets/traffic-guide/campaign-objective-leads.png';
import placementsImage from '@/assets/traffic-guide/placements.png';
import facebookInstagramConnected from '@/assets/traffic-guide/facebook-instagram-connected.png';
import aiEnhancementsOff from '@/assets/traffic-guide/ai-enhancements-off.png';
import budgetSchedule from '@/assets/traffic-guide/budget-schedule.png';
import hookExample1 from '@/assets/traffic-guide/hook-example-1.png';
import hookExample2 from '@/assets/traffic-guide/hook-example-2.png';
import hookExample3 from '@/assets/traffic-guide/hook-example-3.png';

type TrafficChannel = 'cold-emails' | 'paid-ads' | null;
type WarmupTool = 'instantly' | 'smartlead' | 'warmy' | 'other' | null;
type SendingTool = 'instantly' | 'smartlead' | 'other' | null;
type LeadSource = 'apollo' | 'd7' | 'zoominfo' | 'manual' | 'other' | null;
type CreativeType = 'static' | 'video' | 'mix' | null;

interface TrafficWizardState {
  channel: TrafficChannel;
  domainsSetup: boolean | null;
  totalInboxes: number;
  googlePercent: number;
  microsoftPercent: number;
  customSmtpPercent: number;
  warmupTool: WarmupTool;
  warmupWeeks: number;
  sendingTool: SendingTool;
  emailsConnected: boolean | null;
  leadsScraped: boolean | null;
  totalLeads: number;
  leadSource: LeadSource;
  emailsVerified: boolean | null;
  leadsUploaded: boolean | null;
  usingPersonalization: boolean | null;
  personalizationDone: boolean | null;
  sendingLinksFirst: boolean | null;
  emailsPerInbox: number;
  landingPageSetup: boolean | null;
  domainConnected: boolean | null;
  facebookPageReady: boolean | null;
  businessManagerReady: boolean | null;
  adAccountReady: boolean | null;
  paidLandingPageSetup: boolean | null;
  paidDomainConnected: boolean | null;
  metaPixelSetup: boolean | null;
  creativeType: CreativeType;
  hasThreeCreatives: boolean | null;
  hasThreeHooks: boolean | null;
  videoDurationCorrect: boolean | null;
  campaignObjectiveLeads: boolean | null;
  placementsCorrect: boolean | null;
  accountsConnected: boolean | null;
  aiEnhancementsOff: boolean | null;
  budgetConfirmed: boolean | null;
}

interface TrafficWizardProps {
  clientId: string;
  onComplete: () => void;
  onReset?: () => void;
}

const INITIAL_STATE: TrafficWizardState = {
  channel: null,
  domainsSetup: null,
  totalInboxes: 0,
  googlePercent: 40,
  microsoftPercent: 20,
  customSmtpPercent: 40,
  warmupTool: null,
  warmupWeeks: 0,
  sendingTool: null,
  emailsConnected: null,
  leadsScraped: null,
  totalLeads: 0,
  leadSource: null,
  emailsVerified: null,
  leadsUploaded: null,
  usingPersonalization: null,
  personalizationDone: null,
  sendingLinksFirst: null,
  emailsPerInbox: 15,
  landingPageSetup: null,
  domainConnected: null,
  facebookPageReady: null,
  businessManagerReady: null,
  adAccountReady: null,
  paidLandingPageSetup: null,
  paidDomainConnected: null,
  metaPixelSetup: null,
  creativeType: null,
  hasThreeCreatives: null,
  hasThreeHooks: null,
  videoDurationCorrect: null,
  campaignObjectiveLeads: null,
  placementsCorrect: null,
  accountsConnected: null,
  aiEnhancementsOff: null,
  budgetConfirmed: null,
};

const getInboxDistributionStatus = (google: number, microsoft: number, customSmtp: number) => {
  const issues: { type: 'green' | 'yellow' | 'red'; message: string }[] = [];
  
  if (microsoft <= 20) {
    issues.push({ type: 'green', message: `Microsoft: ${microsoft}% (Optimal)` });
  } else if (microsoft <= 35) {
    issues.push({ type: 'yellow', message: `Microsoft: ${microsoft}% (Slightly high, aim for 20%)` });
  } else {
    issues.push({ type: 'red', message: `Microsoft: ${microsoft}% (Too high! Max 35%)` });
  }
  
  if (google <= 40) {
    issues.push({ type: 'green', message: `Google: ${google}% (Optimal)` });
  } else if (google <= 50) {
    issues.push({ type: 'yellow', message: `Google: ${google}% (Slightly high, aim for 40%)` });
  } else {
    issues.push({ type: 'red', message: `Google: ${google}% (Too high! Max 50%)` });
  }
  
  if (customSmtp <= 40) {
    issues.push({ type: 'green', message: `Custom SMTP: ${customSmtp}% (Optimal)` });
  } else if (customSmtp <= 50) {
    issues.push({ type: 'yellow', message: `Custom SMTP: ${customSmtp}% (Slightly high, aim for 40%)` });
  } else {
    issues.push({ type: 'red', message: `Custom SMTP: ${customSmtp}% (Too high! Max 50%)` });
  }
  
  return issues;
};

import { ZoomableImage } from '@/components/ui/zoomable-image';

const GuideImage = ({ src, alt }: { src: string; alt: string }) => (
  <ZoomableImage src={src} alt={alt} containerClassName="mb-4" />
);

export default function TrafficWizard({ clientId, onComplete, onReset }: TrafficWizardProps) {
  const [state, setState] = useState<TrafficWizardState>(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();
  
  // Load from Supabase + localStorage for step
  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_wizard_answers')
          .select('*')
          .eq('client_id', clientId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setState(data.answers as unknown as TrafficWizardState);
          setIsCompleted(data.is_completed);
          if (data.is_completed) {
            setShowSummary(true);
          }
        }
        
        // Load step from localStorage
        const savedStep = localStorage.getItem(`traffic_wizard_step_${clientId}`);
        if (savedStep) {
          const stepNum = parseInt(savedStep, 10);
          if (!isNaN(stepNum)) {
            setCurrentStep(stepNum);
          }
        }
      } catch (error) {
        console.error('Failed to load traffic wizard answers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnswers();
  }, [clientId]);
  
  // Save to Supabase (debounced)
  const saveToSupabase = useCallback(async (newState: TrafficWizardState, completed: boolean = false) => {
    setIsSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('traffic_wizard_answers')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();
      
      const payload = {
        client_id: clientId,
        answers: newState as unknown as Json,
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      };
      
      const { error } = existing
        ? await supabase.from('traffic_wizard_answers').update(payload).eq('client_id', clientId)
        : await supabase.from('traffic_wizard_answers').insert(payload);
      
      if (error) throw error;
      
      if (completed) {
        setIsCompleted(true);
        toast({
          title: "Traffic Setup Complete!",
          description: "Your answers have been saved.",
        });
        onComplete();
      }
    } catch (error) {
      console.error('Failed to save traffic wizard answers:', error);
      toast({
        title: "Error saving",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [clientId, toast, onComplete]);
  
  const updateState = <K extends keyof TrafficWizardState>(key: K, value: TrafficWizardState[K]) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      // Auto-save on each update
      saveToSupabase(newState);
      return newState;
    });
  };
  
  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    // Save step to localStorage
    localStorage.setItem(`traffic_wizard_step_${clientId}`, String(nextStep));
  };
  
  const handleBack = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    // Save step to localStorage
    localStorage.setItem(`traffic_wizard_step_${clientId}`, String(prevStep));
  };
  
  const handleReset = async () => {
    try {
      const { error } = await supabase
        .from('traffic_wizard_answers')
        .delete()
        .eq('client_id', clientId);
      
      if (error) throw error;
      
      // Clear step from localStorage
      localStorage.removeItem(`traffic_wizard_step_${clientId}`);
      
      setState(INITIAL_STATE);
      setCurrentStep(0);
      setIsCompleted(false);
      setShowSummary(false);
      
      // Notify parent that wizard was reset
      onReset?.();
      
      toast({
        title: "Reset Complete",
        description: "Your traffic wizard has been reset.",
      });
    } catch (error) {
      console.error('Failed to reset traffic wizard:', error);
      toast({
        title: "Error",
        description: "Failed to reset. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleComplete = () => {
    saveToSupabase(state, true);
    setShowSummary(true);
  };
  
  const calculateVolume = () => {
    const emailsPerDay = state.sendingLinksFirst ? 3 : 15;
    const dailyVolume = state.totalInboxes * emailsPerDay;
    const monthlyVolume = dailyVolume * 20;
    return { emailsPerDay, dailyVolume, monthlyVolume };
  };
  
  // Steps arrays - 'complete' is NOT a step for progress tracking
  const getColdEmailSteps = () => [
    'channel',
    'domains',
    'inboxes',
    'inbox-distribution',
    'warmup-tool',
    'warmup-duration',
    'sending-tool',
    'leads-scraped',
    'lead-count',
    'lead-source',
    'emails-verified',
    'leads-uploaded',
    'personalization',
    'personalization-done',
    'links-first',
    'volume-confirmation',
  ];
  
  const getPaidAdsSteps = () => [
    'channel',
    'facebook-page',
    'business-manager',
    'ad-account',
    'creative-type',
    'hooks',
    'video-duration',
    'campaign-objective',
    'placements',
    'accounts-connected',
    'ai-enhancements',
    'budget',
  ];
  
  const steps = state.channel === 'cold-emails' ? getColdEmailSteps() : 
                state.channel === 'paid-ads' ? getPaidAdsSteps() : 
                ['channel'];
  
  // Track if we're on the complete screen (after all steps)
  const isOnCompleteScreen = state.channel && currentStep >= steps.length;
  const currentStepId = isOnCompleteScreen ? 'complete' : (steps[currentStep] || 'channel');
  
  const OptionButton = ({ 
    selected, 
    onClick, 
    children, 
    icon: Icon,
    description,
    imageSrc,
    vertical = false
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    icon?: React.ElementType;
    description?: string;
    imageSrc?: string;
    vertical?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border-2 transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        selected 
          ? "border-primary bg-primary/10" 
          : "border-border bg-card",
        vertical ? "flex flex-col items-center justify-center gap-2 p-4" : "text-left p-6"
      )}
    >
      {vertical ? (
        <>
          {imageSrc && (
            <img src={imageSrc} alt="" className="w-40 h-40 object-contain" />
          )}
          {Icon && !imageSrc && (
            <Icon className="h-12 w-12 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{children}</span>
        </>
      ) : (
        <div className="flex gap-3 items-center">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
          ) : Icon ? (
            <div className={cn(
              "p-2 rounded-lg",
              selected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="flex-1">
            <span className="font-medium block">{children}</span>
            {description && (
              <span className="text-sm text-muted-foreground">{description}</span>
            )}
          </div>
          {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
        </div>
      )}
    </button>
  );
  
  // Confirmation button (matching Followups style)
  const ConfirmButton = ({ 
    value, 
    onChange,
    label = "I've Done This"
  }: { 
    value: boolean | null; 
    onChange: (val: boolean) => void;
    label?: string;
  }) => (
    <Button
      onClick={() => onChange(true)}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
  
  const StatusIndicator = ({ type, message }: { type: 'green' | 'yellow' | 'red'; message: string }) => (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg text-sm",
      type === 'green' && "bg-green-500/10 text-green-700 dark:text-green-400",
      type === 'yellow' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      type === 'red' && "bg-red-500/10 text-red-700 dark:text-red-400"
    )}>
      {type === 'green' && <CheckCircle2 className="h-4 w-4" />}
      {type === 'yellow' && <AlertTriangle className="h-4 w-4" />}
      {type === 'red' && <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  );
  
  const WarningBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm">
      <div className="flex gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        <div className="text-yellow-700 dark:text-yellow-300">{children}</div>
      </div>
    </div>
  );
  
  const ErrorBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm">
      <div className="flex gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div className="text-red-700 dark:text-red-300">{children}</div>
      </div>
    </div>
  );

  // Summary view for completed wizard
  const renderSummary = () => {
    const { emailsPerDay, dailyVolume, monthlyVolume } = calculateVolume();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-400">Traffic Setup Complete</h3>
            <p className="text-sm text-green-600 dark:text-green-500">All steps verified and saved</p>
          </div>
        </div>
        
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Your Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel:</span>
              <span className="font-medium">{state.channel === 'cold-emails' ? 'Cold Emails' : 'Paid Ads'}</span>
            </div>
            
            {state.channel === 'cold-emails' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Inboxes:</span>
                  <span className="font-medium">{state.totalInboxes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warmup Duration:</span>
                  <span className="font-medium">{state.warmupWeeks} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warmup Tool:</span>
                  <span className="font-medium capitalize">{state.warmupTool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sending Tool:</span>
                  <span className="font-medium capitalize">{state.sendingTool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Leads:</span>
                  <span className="font-medium">{state.totalLeads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Source:</span>
                  <span className="font-medium capitalize">{state.leadSource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Using Personalization:</span>
                  <span className="font-medium">{state.usingPersonalization ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Volume:</span>
                  <span className="font-medium">{dailyVolume.toLocaleString()} emails</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Volume:</span>
                  <span className="font-medium text-primary">{monthlyVolume.toLocaleString()} emails</span>
                </div>
              </>
            )}
            
            {state.channel === 'paid-ads' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facebook Page:</span>
                  <span className="font-medium">{state.facebookPageReady ? '✓ Ready' : '✗ Not Ready'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Manager:</span>
                  <span className="font-medium">{state.businessManagerReady ? '✓ Ready' : '✗ Not Ready'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ad Account:</span>
                  <span className="font-medium">{state.adAccountReady ? '✓ Ready' : '✗ Not Ready'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta Pixel:</span>
                  <span className="font-medium">{state.metaPixelSetup ? '✓ Installed' : '✗ Not Installed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creative Type:</span>
                  <span className="font-medium capitalize">{state.creativeType}</span>
                </div>
              </>
            )}
          </div>
        </Card>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowSummary(false)} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Edit Answers
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1 text-destructive hover:text-destructive">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    );
  };
  
  const renderStepContent = () => {
    switch (currentStepId) {
      case 'channel':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Which traffic channel are you using?</CardTitle>
              <CardDescription>
                Select your primary method for driving traffic to your webinar
              </CardDescription>
            </CardHeader>
            <div className="space-y-3">
              <OptionButton
                selected={state.channel === 'cold-emails'}
                onClick={() => {
                  updateState('channel', 'cold-emails');
                  handleNext();
                }}
                icon={Mail}
                description="Outbound email campaigns to prospects"
              >
                Cold Emails
              </OptionButton>
              <OptionButton
                selected={state.channel === 'paid-ads'}
                onClick={() => {
                  updateState('channel', 'paid-ads');
                  handleNext();
                }}
                icon={DollarSign}
                description="Facebook/Instagram paid advertising"
              >
                Paid Ads
              </OptionButton>
            </div>
          </div>
        );
      
      case 'domains':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you bought all your domains?</CardTitle>
              <CardDescription>
                Make sure you're using Cloudflare as your nameserver host for better deliverability
              </CardDescription>
            </CardHeader>
            <GuideImage src={cloudflareDomains} alt="Cloudflare Domain Management" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Important:</strong> It doesn't matter where you buy domains (Namecheap, Porkbun, etc.), but your nameservers should be on Cloudflare.</p>
              <p>ISP providers check this and domains on Cloudflare have better reputation when landing in Microsoft/Google inboxes.</p>
            </div>
            <ConfirmButton 
              value={state.domainsSetup} 
              onChange={(val) => {
                updateState('domainsSetup', val);
                handleNext();
              }}
              label="Domains are Ready"
            />
          </div>
        );
      
      case 'inboxes':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">How many total inboxes have you created?</CardTitle>
              <CardDescription>
                Enter the total number of email inboxes across all providers
              </CardDescription>
            </CardHeader>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Recommended distribution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>40% Google Workspace</li>
                <li>40% Custom SMTP</li>
                <li>20% Microsoft 365</li>
              </ul>
            </div>
            <Input
              type="number"
              min={0}
              value={state.totalInboxes || ''}
              onChange={(e) => updateState('totalInboxes', parseInt(e.target.value) || 0)}
              placeholder="Enter total number of inboxes"
              className="text-lg"
            />
            <Button 
              onClick={handleNext} 
              disabled={state.totalInboxes <= 0}
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'inbox-distribution':
        const total = state.googlePercent + state.microsoftPercent + state.customSmtpPercent;
        const distributionStatus = getInboxDistributionStatus(state.googlePercent, state.microsoftPercent, state.customSmtpPercent);
        
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">What's your inbox distribution?</CardTitle>
              <CardDescription>
                Adjust the sliders to match your current setup. Total must equal 100%.
              </CardDescription>
            </CardHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Google Workspace</span>
                  <span className="font-medium">{state.googlePercent}%</span>
                </div>
                <Slider
                  value={[state.googlePercent]}
                  onValueChange={([val]) => {
                    const remaining = 100 - val;
                    const msRatio = state.microsoftPercent / (state.microsoftPercent + state.customSmtpPercent) || 0.33;
                    updateState('googlePercent', val);
                    updateState('microsoftPercent', Math.round(remaining * msRatio));
                    updateState('customSmtpPercent', remaining - Math.round(remaining * msRatio));
                  }}
                  max={100}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Microsoft 365</span>
                  <span className="font-medium">{state.microsoftPercent}%</span>
                </div>
                <Slider
                  value={[state.microsoftPercent]}
                  onValueChange={([val]) => {
                    const remaining = 100 - state.googlePercent - val;
                    if (remaining >= 0) {
                      updateState('microsoftPercent', val);
                      updateState('customSmtpPercent', remaining);
                    }
                  }}
                  max={100 - state.googlePercent}
                  step={5}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Custom SMTP</span>
                  <span className="font-medium">{state.customSmtpPercent}%</span>
                </div>
                <Slider
                  value={[state.customSmtpPercent]}
                  onValueChange={([val]) => {
                    const remaining = 100 - state.googlePercent - val;
                    if (remaining >= 0) {
                      updateState('customSmtpPercent', val);
                      updateState('microsoftPercent', remaining);
                    }
                  }}
                  max={100 - state.googlePercent}
                  step={5}
                />
              </div>
            </div>
            
            {total !== 100 && (
              <ErrorBox>
                Total is {total}%. Must equal 100%.
              </ErrorBox>
            )}
            
            <div className="space-y-2">
              {distributionStatus.map((status, i) => (
                <StatusIndicator key={i} type={status.type} message={status.message} />
              ))}
            </div>
            
            <Button 
              onClick={handleNext} 
              disabled={total !== 100}
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'warmup-tool':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">What are you using for email warmup?</CardTitle>
              <CardDescription>
                Proper warmup is essential for deliverability
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-4 gap-3">
              <OptionButton
                selected={state.warmupTool === 'instantly'}
                onClick={() => updateState('warmupTool', 'instantly')}
                imageSrc={instantlyLogo}
                vertical
              >
                Instantly
              </OptionButton>
              <OptionButton
                selected={state.warmupTool === 'smartlead'}
                onClick={() => updateState('warmupTool', 'smartlead')}
                imageSrc={smartleadLogo}
                vertical
              >
                SmartLead
              </OptionButton>
              <OptionButton
                selected={state.warmupTool === 'warmy'}
                onClick={() => updateState('warmupTool', 'warmy')}
                imageSrc={warmyLogo}
                vertical
              >
                Warmy
              </OptionButton>
              <OptionButton
                selected={state.warmupTool === 'other'}
                onClick={() => updateState('warmupTool', 'other')}
                vertical
              >
                Other tool
              </OptionButton>
            </div>
            
            {(state.warmupTool === 'instantly' || state.warmupTool === 'smartlead') && (
              <WarningBox>
                Built-in warmup tools work but aren't optimal. The email pool is limited and messages are too generic. For best results, consider using a dedicated tool like Warmy.
              </WarningBox>
            )}
            
            <Button 
              onClick={handleNext} 
              disabled={!state.warmupTool}
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'warmup-duration':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">How many weeks have you been warming up?</CardTitle>
              <CardDescription>
                Warmup duration is critical for deliverability
              </CardDescription>
            </CardHeader>
            
            <Input
              type="number"
              min={0}
              value={state.warmupWeeks || ''}
              onChange={(e) => updateState('warmupWeeks', parseInt(e.target.value) || 0)}
              placeholder="Enter number of weeks"
              className="text-lg"
            />
            
            {state.warmupWeeks > 0 && state.warmupWeeks < 3 && (
              <ErrorBox>
                <strong>You must warm up for at least 3 weeks!</strong>
                <p className="mt-1">Sending emails before proper warmup will damage your deliverability and waste your infrastructure investment.</p>
              </ErrorBox>
            )}
            
            {state.warmupWeeks >= 3 && (
              <StatusIndicator type="green" message={`${state.warmupWeeks} weeks warmup - Good to go!`} />
            )}
            
            <Button 
              onClick={handleNext} 
              disabled={state.warmupWeeks < 3}
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'sending-tool':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Which sending tool are you using?</CardTitle>
              <CardDescription>
                Select the platform you'll use to send cold emails
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-3 gap-4">
              <OptionButton
                selected={state.sendingTool === 'instantly'}
                onClick={() => {
                  updateState('sendingTool', 'instantly');
                  handleNext();
                }}
                imageSrc={instantlyLogo}
                vertical
              >
                Instantly
              </OptionButton>
              <OptionButton
                selected={state.sendingTool === 'smartlead'}
                onClick={() => {
                  updateState('sendingTool', 'smartlead');
                  handleNext();
                }}
                imageSrc={smartleadLogo}
                vertical
              >
                SmartLead
              </OptionButton>
              <OptionButton
                selected={state.sendingTool === 'other'}
                onClick={() => {
                  updateState('sendingTool', 'other');
                  handleNext();
                }}
                icon={MoreHorizontal}
                vertical
              >
                Other
              </OptionButton>
            </div>
          </div>
        );
      
      case 'leads-scraped':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you scraped all the leads you're going to target?</CardTitle>
              <CardDescription>
                Your lead list should be ready before launching campaigns
              </CardDescription>
            </CardHeader>
            <GuideImage src={apolloLeads} alt="Apollo Lead Scraping" />
            <ConfirmButton 
              value={state.leadsScraped} 
              onChange={(val) => {
                updateState('leadsScraped', val);
                handleNext();
              }}
              label="Leads are Scraped"
            />
          </div>
        );
      
      case 'lead-count':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">How many leads do you currently have?</CardTitle>
              <CardDescription>
                Enter the total number of leads in your list
              </CardDescription>
            </CardHeader>
            <Input
              type="number"
              min={0}
              value={state.totalLeads || ''}
              onChange={(e) => updateState('totalLeads', parseInt(e.target.value) || 0)}
              placeholder="Enter total number of leads"
              className="text-lg"
            />
            <Button 
              onClick={handleNext} 
              disabled={state.totalLeads <= 0}
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      case 'lead-source':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Where did you scrape your leads from?</CardTitle>
              <CardDescription>
                Select your primary lead source
              </CardDescription>
            </CardHeader>
            <div className="space-y-3">
              <OptionButton
                selected={state.leadSource === 'apollo'}
                onClick={() => {
                  updateState('leadSource', 'apollo');
                  handleNext();
                }}
              >
                Apollo
              </OptionButton>
              <OptionButton
                selected={state.leadSource === 'd7'}
                onClick={() => {
                  updateState('leadSource', 'd7');
                  handleNext();
                }}
              >
                D7 Lead Finder
              </OptionButton>
              <OptionButton
                selected={state.leadSource === 'zoominfo'}
                onClick={() => {
                  updateState('leadSource', 'zoominfo');
                  handleNext();
                }}
              >
                ZoomInfo
              </OptionButton>
              <OptionButton
                selected={state.leadSource === 'manual'}
                onClick={() => {
                  updateState('leadSource', 'manual');
                  handleNext();
                }}
              >
                Manual scraping
              </OptionButton>
              <OptionButton
                selected={state.leadSource === 'other'}
                onClick={() => {
                  updateState('leadSource', 'other');
                  handleNext();
                }}
              >
                Other source
              </OptionButton>
            </div>
          </div>
        );
      
      case 'emails-verified':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you verified all emails?</CardTitle>
              <CardDescription>
                Using MillionVerifier or similar to decrease bounce rate
              </CardDescription>
            </CardHeader>
            <GuideImage src={millionverifierResults} alt="MillionVerifier Email Verification" />
            <ErrorBox>
              <strong>This step is critical!</strong>
              <p className="mt-1">If you start sending emails without verification, within one week you will lose all your infrastructure investment. All emails will be marked as spam and your domains will be burned.</p>
            </ErrorBox>
            
            <ConfirmButton 
              value={state.emailsVerified} 
              onChange={(val) => {
                updateState('emailsVerified', val);
                handleNext();
              }}
              label="Emails are Verified"
            />
          </div>
        );
      
      case 'leads-uploaded':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you uploaded the lead list to your system?</CardTitle>
              <CardDescription>
                {state.totalLeads.toLocaleString()} verified leads to {state.sendingTool === 'instantly' ? 'Instantly' : state.sendingTool === 'smartlead' ? 'SmartLead' : 'your sending tool'}
              </CardDescription>
            </CardHeader>
            <GuideImage src={instantlyEmailAccounts} alt="Instantly Lead Upload" />
            <ConfirmButton 
              value={state.leadsUploaded} 
              onChange={(val) => {
                updateState('leadsUploaded', val);
                handleNext();
              }}
              label="Leads are Uploaded"
            />
          </div>
        );
      
      case 'personalization':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Are you using personalization in your outreach?</CardTitle>
              <CardDescription>
                Personalized emails have significantly higher response rates
              </CardDescription>
            </CardHeader>
            <GuideImage src={clayEnrichment} alt="Clay Personalization Enrichment" />
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  updateState('usingPersonalization', true);
                  handleNext();
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Yes, Using Personalization
              </Button>
              <Button
                onClick={() => {
                  updateState('usingPersonalization', false);
                  updateState('personalizationDone', null);
                  setCurrentStep(prev => prev + 2);
                  localStorage.setItem(`traffic_wizard_step_${clientId}`, String(currentStep + 2));
                }}
                variant="outline"
                className="w-full"
              >
                No, Skipping
              </Button>
            </div>
          </div>
        );
      
      case 'personalization-done':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you personalized all the emails?</CardTitle>
              <CardDescription>
                Based on the personalization guidelines from the course
              </CardDescription>
            </CardHeader>
            <GuideImage src={instantlyPersonalization} alt="Instantly Email Personalization" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p>If you want emails landing in inbox, personalization is essential. This is the most important factor for deliverability and response rates.</p>
            </div>
            <ConfirmButton 
              value={state.personalizationDone} 
              onChange={(val) => {
                updateState('personalizationDone', val);
                handleNext();
              }}
              label="Personalization is Complete"
            />
          </div>
        );
      
      case 'links-first':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Are you sending links in the first email?</CardTitle>
              <CardDescription>
                This affects your sending volume per inbox
              </CardDescription>
            </CardHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <OptionButton
                selected={state.sendingLinksFirst === false}
                onClick={() => {
                  updateState('sendingLinksFirst', false);
                  updateState('emailsPerInbox', 15);
                  handleNext();
                }}
                icon={MessageSquare}
                vertical
              >
                No Links
              </OptionButton>
              <OptionButton
                selected={state.sendingLinksFirst === true}
                onClick={() => {
                  updateState('sendingLinksFirst', true);
                  updateState('emailsPerInbox', 3);
                  handleNext();
                }}
                icon={Link}
                vertical
              >
                With Links
              </OptionButton>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-3">
              <p><strong>No links (recommended):</strong> Better deliverability, 15 emails/inbox/day</p>
              <p><strong>With links:</strong> Higher conversion per response, 3 emails/inbox/day</p>
            </div>
          </div>
        );
      
      case 'volume-confirmation':
        const { emailsPerDay, dailyVolume, monthlyVolume } = calculateVolume();
        
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Here's your projected email volume</CardTitle>
              <CardDescription>
                Based on your {state.totalInboxes} inboxes and {state.sendingLinksFirst ? 'with' : 'without'} links strategy
              </CardDescription>
            </CardHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Emails per inbox/day</p>
                <p className="text-2xl font-bold">{emailsPerDay}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Daily volume</p>
                <p className="text-2xl font-bold">{dailyVolume.toLocaleString()}</p>
              </Card>
              <Card className="p-4 col-span-2">
                <p className="text-sm text-muted-foreground">Monthly volume (20 business days)</p>
                <p className="text-3xl font-bold text-primary">{monthlyVolume.toLocaleString()}</p>
              </Card>
            </div>
            
            <Button onClick={handleNext} className="w-full">
              Looks good, continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );
      
      // Paid Ads steps
      case 'facebook-page':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Do you have a Facebook Page ready?</CardTitle>
              <CardDescription>
                The page you'll run ads from, with no limitations
              </CardDescription>
            </CardHeader>
            <GuideImage src={facebookPage} alt="Facebook Page Example" />
            <ConfirmButton 
              value={state.facebookPageReady} 
              onChange={(val) => {
                updateState('facebookPageReady', val);
                handleNext();
              }}
              label="Facebook Page is Ready"
            />
          </div>
        );
      
      case 'business-manager':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Is your Facebook Business Manager set up?</CardTitle>
              <CardDescription>
                Must have no restrictions and be ready to use
              </CardDescription>
            </CardHeader>
            <GuideImage src={facebookBusinessManager} alt="Facebook Business Manager" />
            <ConfirmButton 
              value={state.businessManagerReady} 
              onChange={(val) => {
                updateState('businessManagerReady', val);
                handleNext();
              }}
              label="Business Manager is Ready"
            />
          </div>
        );
      
      case 'ad-account':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Is your Facebook Ad Account ready?</CardTitle>
              <CardDescription>
                No limitations, card connected, ready to spend
              </CardDescription>
            </CardHeader>
            <GuideImage src={facebookAdAccount} alt="Facebook Ad Account" />
            <ConfirmButton 
              value={state.adAccountReady} 
              onChange={(val) => {
                updateState('adAccountReady', val);
                handleNext();
              }}
              label="Ad Account is Ready"
            />
          </div>
        );
      
      case 'creative-type':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">What type of creatives are you using?</CardTitle>
              <CardDescription>
                Select your ad creative strategy
              </CardDescription>
            </CardHeader>
            
            {/* Creative images - use same GuideImage component as other steps */}
            <div className="grid grid-cols-2 gap-4">
              <GuideImage src={creativeStatic} alt="Static Creative Example" />
              <GuideImage src={creativeVideo} alt="Video Creative Example" />
            </div>
            
            {/* Buttons full width - two side by side, then full width */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  updateState('creativeType', 'static');
                  handleNext();
                }}
                className="w-full"
              >
                Static images only
              </Button>
              <Button
                onClick={() => {
                  updateState('creativeType', 'video');
                  handleNext();
                }}
                className="w-full"
              >
                Video creatives only
              </Button>
            </div>
            
            {/* Mix option full width below */}
            <Button
              onClick={() => {
                updateState('creativeType', 'mix');
                handleNext();
              }}
              className="w-full"
            >
              Mix of both
            </Button>
          </div>
        );
      
      case 'hooks':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Do you have at least 3 hooks ready?</CardTitle>
              <CardDescription>
                Each creative should test different hooks for best performance. Here are examples of hook variations:
              </CardDescription>
            </CardHeader>
            
            {/* Hook examples - use same GuideImage component as other steps */}
            <div className="grid grid-cols-3 gap-4">
              <GuideImage src={hookExample1} alt="Hook Example 1" />
              <GuideImage src={hookExample2} alt="Hook Example 2" />
              <GuideImage src={hookExample3} alt="Hook Example 3" />
            </div>
            
            <ConfirmButton 
              value={state.hasThreeHooks} 
              onChange={(val) => {
                updateState('hasThreeHooks', val);
                // Skip video duration step if only static creatives
                if (state.creativeType === 'static') {
                  setCurrentStep(prev => prev + 2);
                  localStorage.setItem(`traffic_wizard_step_${clientId}`, String(currentStep + 2));
                } else {
                  handleNext();
                }
              }}
              label="Hooks are Ready"
            />
          </div>
        );
      
      case 'video-duration':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Are your videos 30 seconds to 1 minute long?</CardTitle>
              <CardDescription>
                This is the optimal length for webinar ads
              </CardDescription>
            </CardHeader>
            <ConfirmButton 
              value={state.videoDurationCorrect} 
              onChange={(val) => {
                updateState('videoDurationCorrect', val);
                handleNext();
              }}
              label="Video Duration is Correct"
            />
          </div>
        );
      
      case 'campaign-objective':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Is your campaign objective set to "Leads"?</CardTitle>
              <CardDescription>
                This is essential for webinar signups
              </CardDescription>
            </CardHeader>
            <GuideImage src={campaignObjectiveLeads} alt="Campaign Objective - Leads" />
            <ConfirmButton 
              value={state.campaignObjectiveLeads} 
              onChange={(val) => {
                updateState('campaignObjectiveLeads', val);
                handleNext();
              }}
              label="Campaign Objective is Set"
            />
          </div>
        );
      
      case 'placements':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you set up placements correctly?</CardTitle>
              <CardDescription>
                Only use Facebook/Instagram Feeds, Reels, and Stories
              </CardDescription>
            </CardHeader>
            <GuideImage src={placementsImage} alt="Placements Setup" />
            <WarningBox>
              <strong>Remove these placements:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>In-stream ads</li>
                <li>Search results</li>
                <li>Apps and sites</li>
              </ul>
            </WarningBox>
            <ConfirmButton 
              value={state.placementsCorrect} 
              onChange={(val) => {
                updateState('placementsCorrect', val);
                handleNext();
              }}
              label="Placements are Configured"
            />
          </div>
        );
      
      case 'accounts-connected':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Are your Facebook Page and Instagram connected?</CardTitle>
              <CardDescription>
                Both should be connected to your Business Manager
              </CardDescription>
            </CardHeader>
            <GuideImage src={facebookInstagramConnected} alt="Facebook and Instagram Connected" />
            <ConfirmButton 
              value={state.accountsConnected} 
              onChange={(val) => {
                updateState('accountsConnected', val);
                handleNext();
              }}
              label="Accounts are Connected"
            />
          </div>
        );
      
      case 'ai-enhancements':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you turned OFF all AI enhancements?</CardTitle>
              <CardDescription>
                Facebook's AI features are designed to make you spend more
              </CardDescription>
            </CardHeader>
            <GuideImage src={aiEnhancementsOff} alt="AI Enhancements Off" />
            <WarningBox>
              Turn off all AI suggestions and enhancements for your ad campaigns. These features are designed to maximize Meta's revenue, not your results.
            </WarningBox>
            <ConfirmButton 
              value={state.aiEnhancementsOff} 
              onChange={(val) => {
                updateState('aiEnhancementsOff', val);
                handleNext();
              }}
              label="AI Enhancements are Off"
            />
          </div>
        );
      
      case 'budget':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you confirmed your ad budget?</CardTitle>
              <CardDescription>
                Make sure you have budget allocated and ready
              </CardDescription>
            </CardHeader>
            <GuideImage src={budgetSchedule} alt="Budget and Schedule" />
            <ConfirmButton 
              value={state.budgetConfirmed} 
              onChange={(val) => {
                updateState('budgetConfirmed', val);
                handleNext();
              }}
              label="Budget is Confirmed"
            />
          </div>
        );
      
      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                All Traffic Steps Complete!
              </h3>
              <p className="text-muted-foreground">
                Your {state.channel === 'cold-emails' ? 'cold email' : 'paid ads'} campaign is configured and ready to launch.
              </p>
            </div>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">What you've configured:</h4>
              <ul className="space-y-2 text-sm">
                {state.channel === 'cold-emails' ? (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Domains purchased and on Cloudflare</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{state.totalInboxes} inboxes created and distributed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Warmed up for {state.warmupWeeks}+ weeks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{state.totalLeads.toLocaleString()} leads scraped and verified</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Leads uploaded to {state.sendingTool}</span>
                    </li>
                    {state.usingPersonalization && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Emails personalized</span>
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Facebook Page ready</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Business Manager configured</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Ad Account set up with budget</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Creatives and hooks ready</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Campaign objective set to Leads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Placements optimized</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>AI enhancements disabled</span>
                    </li>
                  </>
                )}
              </ul>
            </Card>

            <Button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Complete Traffic Setup'}
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Show summary if completed
  if (showSummary && isCompleted) {
    return renderSummary();
  }
  
  return (
    <div className="space-y-4">
      {/* Progress indicator - segmented like Followups */}
      {state.channel && !isOnCompleteScreen && (
        <>
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  index < currentStep 
                    ? "bg-green-500" 
                    : index === currentStep 
                      ? "bg-primary" 
                      : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Step {currentStep + 1} of {steps.length}</span>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack} className="text-foreground border-border hover:bg-muted">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
        </>
      )}
      
      {/* Step content */}
      {renderStepContent()}
    </div>
  );
}
