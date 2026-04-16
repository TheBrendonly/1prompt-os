import React from 'react';
import SetupGuideDialog from '@/components/SetupGuideDialog';
import { SETUP_PHASES } from '@/components/SetupGuideDialog';

// Phase IDs for Deploy AI Reps (deployment phases only)
export const DEPLOY_AI_REPS_PHASE_IDS: (keyof typeof SETUP_PHASES)[] = [
  'live-chat-setup',
  'whatsapp-setup',
  'sms-setup',
  'meta-instagram-setup',
  'inbound-voice-ai-testing',
  'demo-setup'
];

// Step counts for each Deploy AI Reps phase
export const DEPLOY_AI_REPS_PHASES: Record<string, number> = {
  'live-chat-setup': SETUP_PHASES['live-chat-setup'],
  'whatsapp-setup': SETUP_PHASES['whatsapp-setup'],
  'sms-setup': SETUP_PHASES['sms-setup'],
  'meta-instagram-setup': SETUP_PHASES['meta-instagram-setup'],
  'inbound-voice-ai-testing': SETUP_PHASES['inbound-voice-ai-testing'],
  'demo-setup': SETUP_PHASES['demo-setup']
};

// Helper function to check if a phase is complete
export const isPhaseComplete = (phaseId: string, completedSteps: string[]): boolean => {
  const stepCount = DEPLOY_AI_REPS_PHASES[phaseId];
  if (!stepCount) return false;
  for (let i = 0; i < stepCount; i++) {
    if (!completedSteps.includes(`${phaseId}-${i}`)) {
      return false;
    }
  }
  return true;
};

interface DeployAIRepsSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialPhase?: number;
  initialStep?: number;
  navigationKey?: number;
}

const DeployAIRepsSetupGuide: React.FC<DeployAIRepsSetupGuideProps> = ({ 
  open, 
  onOpenChange, 
  clientId, 
  initialPhase = 0, 
  initialStep = 0,
  navigationKey = 0
}) => {
  return (
    <SetupGuideDialog
      open={open}
      onOpenChange={onOpenChange}
      clientId={clientId}
      initialPhase={initialPhase}
      initialStep={initialStep}
      navigationKey={navigationKey}
      phaseFilter={DEPLOY_AI_REPS_PHASE_IDS}
      dialogTitle="Deploy AI Reps Setup Guide"
    />
  );
};

export default DeployAIRepsSetupGuide;
