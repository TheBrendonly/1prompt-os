import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, RotateCcw, Eye, Loader2 } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import landing step images
import landingStep1 from '@/assets/landing-step-1-main-page.png';
import landingStep2 from '@/assets/landing-step-2-form-setup.png';
import landingStep3 from '@/assets/landing-step-3-confirmation.png';
import landingStep4 from '@/assets/landing-step-4-zoom-button.png';
import landingStep5 from '@/assets/landing-step-5-meta-pixel.png';
import landingStep6 from '@/assets/landing-step-6-domain-favicon.png';
import landingStep7 from '@/assets/landing-step-7-images-optimized.png';

// GuideImage component - matches TrafficWizard styling
const GuideImage = ({ src, alt }: { src: string; alt: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(container);
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={containerRef} className="rounded-lg overflow-hidden border border-border/50 mb-4 relative bg-muted/30">
      {!isLoaded && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center min-h-[80px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isVisible && (
        <img 
          src={src} 
          alt={alt} 
          className={cn(
            "w-full h-auto max-h-[400px] object-contain transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

interface LandingWizardState {
  mainPageSetup: boolean | null;
  formCorrect: boolean | null;
  confirmationPage: boolean | null;
  zoomButton: boolean | null;
  metaPixel: boolean | null;
  domainFavicon: boolean | null;
  imagesOptimized: boolean | null;
}

interface LandingWizardProps {
  clientId: string;
  onComplete: () => void;
  onReset?: () => void;
}

const INITIAL_STATE: LandingWizardState = {
  mainPageSetup: null,
  formCorrect: null,
  confirmationPage: null,
  zoomButton: null,
  metaPixel: null,
  domainFavicon: null,
  imagesOptimized: null,
};

export default function LandingWizard({ clientId, onComplete, onReset }: LandingWizardProps) {
  const [state, setState] = useState<LandingWizardState>(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  const steps = [
    { id: 'main-page' },
    { id: 'form-setup' },
    { id: 'confirmation-page' },
    { id: 'zoom-button' },
    { id: 'meta-pixel' },
    { id: 'domain-favicon' },
    { id: 'images-optimized' },
  ];

  const isOnCompleteScreen = currentStep >= steps.length;
  const currentStepId = isOnCompleteScreen ? 'complete' : (steps[currentStep]?.id || 'main-page');

  // Load from localStorage
  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const saved = localStorage.getItem(`landing_wizard_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState(parsed.answers || INITIAL_STATE);
          setIsCompleted(parsed.isCompleted || false);
          // Restore current step
          if (typeof parsed.currentStep === 'number') {
            setCurrentStep(parsed.currentStep);
          }
          if (parsed.isCompleted) {
            setShowSummary(true);
          }
        }
      } catch (error) {
        console.error('Failed to load landing wizard answers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnswers();
  }, [clientId]);

  // Save to localStorage
  const saveToStorage = useCallback((newState: LandingWizardState, completed: boolean = false, step?: number) => {
    setIsSaving(true);
    try {
      // Read existing data to preserve step if not explicitly provided
      const existing = localStorage.getItem(`landing_wizard_${clientId}`);
      let existingStep = 0;
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          existingStep = parsed.currentStep ?? 0;
        } catch {}
      }
      
      const stepToSave = step !== undefined ? step : existingStep;
      localStorage.setItem(`landing_wizard_${clientId}`, JSON.stringify({
        answers: newState,
        isCompleted: completed,
        currentStep: stepToSave,
        completedAt: completed ? new Date().toISOString() : null,
      }));

      if (completed) {
        setIsCompleted(true);
        toast({
          title: "Landing Setup Complete!",
          description: "Your landing page checklist has been saved.",
        });
        onComplete();
      }
    } catch (error) {
      console.error('Failed to save landing wizard answers:', error);
      toast({
        title: "Error saving",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [clientId, toast, onComplete]);

  const updateState = <K extends keyof LandingWizardState>(key: K, value: LandingWizardState[K]) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      // Don't pass step - let it preserve existing step from localStorage
      saveToStorage(newState);
      return newState;
    });
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    // Explicitly save the new step
    saveToStorage(state, false, nextStep);
  };

  const handleBack = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    // Explicitly save the new step
    saveToStorage(state, false, prevStep);
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(`landing_wizard_${clientId}`);
      setState(INITIAL_STATE);
      setCurrentStep(0);
      setIsCompleted(false);
      setShowSummary(false);
      onReset?.();
      toast({
        title: "Reset Complete",
        description: "Your landing wizard has been reset.",
      });
    } catch (error) {
      console.error('Failed to reset landing wizard:', error);
      toast({
        title: "Error",
        description: "Failed to reset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    saveToStorage(state, true);
    setShowSummary(true);
  };

  // I've Done This / Confirmation button (matching Followups style)
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

  // Summary view for completed wizard
  const renderSummary = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-400">Landing Setup Complete</h3>
            <p className="text-sm text-green-600 dark:text-green-500">All steps verified and saved</p>
          </div>
        </div>

        <Card className="p-4">
          <h4 className="font-semibold mb-3">Your Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Main Landing Page:</span>
              <span className="font-medium">{state.mainPageSetup ? '✓ Ready' : '✗ Not Ready'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lead Signup Form:</span>
              <span className="font-medium">{state.formCorrect ? '✓ Configured' : '✗ Not Configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmation Page:</span>
              <span className="font-medium">{state.confirmationPage ? '✓ Ready' : '✗ Not Ready'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zoom Registration Button:</span>
              <span className="font-medium">{state.zoomButton ? '✓ Linked' : '✗ Not Linked'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meta Pixel:</span>
              <span className="font-medium">{state.metaPixel ? '✓ Installed' : '✗ Not Installed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain & Favicon:</span>
              <span className="font-medium">{state.domainFavicon ? '✓ Configured' : '✗ Not Configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Images Optimized:</span>
              <span className="font-medium">{state.imagesOptimized ? '✓ Optimized' : '✗ Not Optimized'}</span>
            </div>
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
      case 'main-page':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you setup the main landing page?</CardTitle>
              <CardDescription>
                First make sure you've setup the main landing page where all the leads will come into
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep1} alt="Main landing page setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Your landing page should have:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Clear, benefit-driven headline</li>
                <li>Compelling subheadline explaining what leads will learn</li>
                <li>3-5 bullet points highlighting specific outcomes</li>
                <li>Date, time, and timezone clearly displayed</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.mainPageSetup} 
              onChange={(val) => {
                updateState('mainPageSetup', val);
                handleNext();
              }}
              label="Main Page is Ready"
            />
          </div>
        );

      case 'form-setup':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Is the signup form configured correctly?</CardTitle>
              <CardDescription>
                Make sure you setup the correct form for leads to fill out to signup
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep2} alt="Form setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Required form fields:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>First Name *</li>
                <li>Last Name *</li>
                <li>Phone Number *</li>
                <li>Email *</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.formCorrect} 
              onChange={(val) => {
                updateState('formCorrect', val);
                handleNext();
              }}
              label="Form is Configured"
            />
          </div>
        );

      case 'confirmation-page':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Is the confirmation page setup and ready?</CardTitle>
              <CardDescription>
                Make sure the confirmation page is setup and ready to show after form submission
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep3} alt="Confirmation page setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Your confirmation page should include:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Thank you message</li>
                <li>Next steps instructions</li>
                <li>Webinar details reminder</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.confirmationPage} 
              onChange={(val) => {
                updateState('confirmationPage', val);
                handleNext();
              }}
              label="Confirmation Page is Ready"
            />
          </div>
        );

      case 'zoom-button':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Does the Complete Registration button go to Zoom?</CardTitle>
              <CardDescription>
                Make sure the Complete Registration button goes to the Zoom webinar signup link for people to confirm and add to calendar
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep4} alt="Zoom button setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Important:</strong> The button should link to your Zoom webinar registration page so attendees can:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Complete their Zoom registration</li>
                <li>Add the event to their calendar</li>
                <li>Get reminder emails from Zoom</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.zoomButton} 
              onChange={(val) => {
                updateState('zoomButton', val);
                handleNext();
              }}
              label="Zoom Button is Linked"
            />
          </div>
        );

      case 'meta-pixel':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you setup the Meta Pixel tracking code?</CardTitle>
              <CardDescription>
                Make sure you setup the Meta tracking code (Pixel) if you're running paid ads
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep5} alt="Meta Pixel setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>The Meta Pixel should be:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Added to the head tracking code section</li>
                <li>Firing on page load</li>
                <li>Tracking form submissions as conversions</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.metaPixel} 
              onChange={(val) => {
                updateState('metaPixel', val);
                handleNext();
              }}
              label="Meta Pixel is Installed"
            />
          </div>
        );

      case 'domain-favicon':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you setup the domain and favicon?</CardTitle>
              <CardDescription>
                Don't forget to setup the domain for your landing page and the favicon
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep6} alt="Domain and favicon setup" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Checklist:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Custom domain connected (e.g., yoursite.com)</li>
                <li>SSL certificate active (https://)</li>
                <li>Favicon uploaded and visible in browser tab</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.domainFavicon} 
              onChange={(val) => {
                updateState('domainFavicon', val);
                handleNext();
              }}
              label="Domain & Favicon are Set"
            />
          </div>
        );

      case 'images-optimized':
        return (
          <div className="space-y-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Have you enabled "Optimize Image Load" for all images?</CardTitle>
              <CardDescription>
                After confirming the form is right, go over all images and make sure "Optimize Image Load" is ON to make your website load faster
              </CardDescription>
            </CardHeader>
            <GuideImage src={landingStep7} alt="Image optimization settings" />
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>For each image on your landing page:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Click on the image element</li>
                <li>Find "Optimize Image Load" toggle in settings</li>
                <li>Make sure it's turned ON</li>
              </ul>
            </div>
            <ConfirmButton 
              value={state.imagesOptimized} 
              onChange={(val) => {
                updateState('imagesOptimized', val);
                handleNext();
              }}
              label="Images are Optimized"
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
                All Landing Page Steps Complete!
              </h3>
              <p className="text-muted-foreground">
                Your landing page is configured and ready to capture leads.
              </p>
            </div>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">What you've configured:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Main landing page is set up</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Lead signup form is configured</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Confirmation page is ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Zoom registration button is linked</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Meta Pixel tracking is installed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Domain and favicon are configured</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Images are optimized for fast loading</span>
                </li>
              </ul>
            </Card>

            <Button
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Complete Landing Page Setup'}
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

  const showBackButton = currentStep > 0 && !isOnCompleteScreen;

  return (
    <div className="space-y-4">
      {/* Progress indicator - segmented, hidden on complete screen */}
      {!isOnCompleteScreen && (
        <>
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
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
            <span>Step {Math.min(currentStep + 1, steps.length)} of {steps.length}</span>
            {showBackButton && (
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
