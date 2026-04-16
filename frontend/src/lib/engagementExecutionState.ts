export type EngageChannelType = 'sms' | 'whatsapp' | 'phone_call';

export type EngagementWorkflowNodeType =
  | 'trigger'
  | 'delay'
  | 'send_sms'
  | 'send_whatsapp'
  | 'phone_call'
  | 'wait_for_reply'
  | 'drip'
  | 'engage';

export interface EngagementExecutionResolverNode {
  id: string;
  type: EngagementWorkflowNodeType;
  delay_seconds?: number;
  message?: string;
  instructions?: string;
  timeout_seconds?: number;
  batch_size?: number;
  interval_seconds?: number;
  channels?: Array<{
    type: EngageChannelType;
    enabled: boolean;
    message?: string;
    instructions?: string;
    delay_seconds?: number;
    whatsapp_type?: 'template' | 'text';
    template_name?: string;
  }>;
}

export interface EngagementExecutionResolverState {
  status: string;
  current_node_index: number | null;
  stage_description: string | null;
  waiting_for_reply_until: string | null;
  stop_reason?: string | null;
}

export type FlatWorkflowStep = {
  id: string;
  type: EngagementWorkflowNodeType | 'engage_delay';
  parentEngageId?: string;
  channelType?: EngageChannelType;
  delay_seconds?: number;
  message?: string;
  instructions?: string;
  timeout_seconds?: number;
  whatsapp_type?: 'template' | 'text';
  template_name?: string;
  batch_size?: number;
  interval_seconds?: number;
  originalNodeIndex: number;
};

type FlatIndexRange = { start: number; end: number };

const ACTIVE_STATUSES = new Set(['running', 'pending']);
const STOPPED_STATUSES = new Set(['stopped', 'cancelled', 'replied']);

export function isActiveExecution(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function isCompletedExecution(status: string): boolean {
  return status === 'completed';
}

export function isFailedExecution(status: string): boolean {
  return status === 'failed';
}

export function isStoppedExecution(execution: Pick<EngagementExecutionResolverState, 'status' | 'stop_reason'>): boolean {
  return (
    STOPPED_STATUSES.has(execution.status)
    || (!!execution.stop_reason && execution.status !== 'completed' && execution.status !== 'failed')
  );
}

export function expandNodesToFlat(wfNodes: EngagementExecutionResolverNode[]): FlatWorkflowStep[] {
  const flat: FlatWorkflowStep[] = [];

  wfNodes.forEach((node, nodeIndex) => {
    if (node.type === 'engage') {
      const enabledChannels = (node.channels || []).filter((channel) => channel.enabled);

      enabledChannels.forEach((channel, channelIndex) => {
        if (channelIndex > 0 && channel.delay_seconds && channel.delay_seconds > 0) {
          flat.push({
            id: `${node.id}-delay-${channelIndex}`,
            type: 'engage_delay',
            parentEngageId: node.id,
            channelType: channel.type,
            delay_seconds: channel.delay_seconds,
            originalNodeIndex: nodeIndex,
          });
        }

        flat.push({
          id: `${node.id}-ch-${channelIndex}`,
          type: channel.type === 'sms' ? 'send_sms' : channel.type === 'whatsapp' ? 'send_whatsapp' : 'phone_call',
          parentEngageId: node.id,
          channelType: channel.type,
          message: channel.message,
          instructions: channel.instructions,
          whatsapp_type: channel.whatsapp_type,
          template_name: channel.template_name,
          originalNodeIndex: nodeIndex,
        });
      });

      return;
    }

    flat.push({
      id: node.id,
      type: node.type,
      delay_seconds: node.delay_seconds,
      message: node.message,
      instructions: node.instructions,
      timeout_seconds: node.timeout_seconds,
      batch_size: node.batch_size,
      interval_seconds: node.interval_seconds,
      originalNodeIndex: nodeIndex,
    });
  });

  return flat;
}

export function buildFlatToOriginalMap(flatSteps: FlatWorkflowStep[]): number[] {
  return flatSteps.map((step) => step.originalNodeIndex);
}

function normalizeStageDescription(stageDescription: string | null | undefined): string {
  return stageDescription?.trim().toLowerCase() ?? '';
}

function buildOriginalNodeFlatRanges(flatSteps: FlatWorkflowStep[]): FlatIndexRange[] {
  const ranges: FlatIndexRange[] = [];

  flatSteps.forEach((step, flatIndex) => {
    const currentRange = ranges[step.originalNodeIndex];
    if (currentRange) {
      currentRange.end = flatIndex;
      return;
    }

    ranges[step.originalNodeIndex] = { start: flatIndex, end: flatIndex };
  });

  return ranges;
}

function findStepIndex(
  flatSteps: FlatWorkflowStep[],
  predicate: (step: FlatWorkflowStep) => boolean,
  startIndex = 0,
  endIndex = flatSteps.length - 1,
): number {
  for (let index = Math.max(0, startIndex); index <= endIndex && index < flatSteps.length; index += 1) {
    if (predicate(flatSteps[index])) {
      return index;
    }
  }

  return -1;
}

export function matchesStageDescription(step: FlatWorkflowStep, stageDescription: string): boolean {
  const stage = normalizeStageDescription(stageDescription);
  if (!stage) return false;

  const mentionsWhatsapp = /whats?\s*app/.test(stage);
  const mentionsSms = /\bsms\b/.test(stage);
  const mentionsPhoneCall = /\b(phone|call|dial|ring)\b/.test(stage);
  const mentionsWait = stage.includes('wait');
  const mentionsReply = stage.includes('reply');
  const mentionsBefore = stage.includes('before');
  const mentionsSend = stage.includes('send');
  const mentionsSent = stage.includes('sent');

  switch (step.type) {
    case 'wait_for_reply':
      return mentionsWait && mentionsReply;
    case 'engage_delay':
      if (!mentionsWait || !mentionsBefore) return false;
      if (step.channelType === 'whatsapp') return mentionsWhatsapp;
      if (step.channelType === 'sms') return mentionsSms;
      return mentionsPhoneCall;
    case 'send_sms':
      return mentionsSms && !mentionsBefore && (!mentionsWait || mentionsSend || mentionsSent);
    case 'send_whatsapp':
      return mentionsWhatsapp && !mentionsBefore && (!mentionsWait || mentionsSend || mentionsSent);
    case 'phone_call':
      return mentionsPhoneCall && (stage.includes('calling') || stage.includes('outbound') || mentionsSend || mentionsSent || !mentionsWait);
    case 'delay':
      return mentionsWait && !mentionsBefore && !mentionsReply && !mentionsSms && !mentionsWhatsapp && !mentionsPhoneCall;
    default:
      return false;
  }
}

function findStageMatch(
  flatSteps: FlatWorkflowStep[],
  stageDescription: string,
  startIndex = 0,
  endIndex = flatSteps.length - 1,
): number {
  return findStepIndex(flatSteps, (step) => matchesStageDescription(step, stageDescription), startIndex, endIndex);
}

export function resolveExecutionFlatIndex(
  execution: EngagementExecutionResolverState,
  flatSteps: FlatWorkflowStep[],
): number {
  if (!flatSteps.length) return -1;
  if (isCompletedExecution(execution.status)) return flatSteps.length - 1;

  const rawIndex = typeof execution.current_node_index === 'number' ? execution.current_node_index : -1;
  const stageDescription = normalizeStageDescription(execution.stage_description);
  const canUseHints = isActiveExecution(execution.status) || isFailedExecution(execution.status) || isStoppedExecution(execution);

  if (rawIndex >= 0) {
    const originalRanges = buildOriginalNodeFlatRanges(flatSteps);
    const originalRange = originalRanges[rawIndex];

    if (originalRange) {
      if (canUseHints && execution.waiting_for_reply_until) {
        const waitInRange = findStepIndex(flatSteps, (step) => step.type === 'wait_for_reply', originalRange.start, originalRange.end);
        if (waitInRange !== -1) return waitInRange;

        const nextWait = findStepIndex(flatSteps, (step) => step.type === 'wait_for_reply', originalRange.end + 1);
        if (nextWait !== -1) return nextWait;
      }

      if (stageDescription) {
        const matchInRange = findStageMatch(flatSteps, stageDescription, originalRange.start, originalRange.end);
        if (matchInRange !== -1) return matchInRange;

        const nextMatch = findStageMatch(flatSteps, stageDescription, originalRange.end + 1);
        if (nextMatch !== -1) return nextMatch;
      }

      return originalRange.start;
    }

    if (rawIndex < flatSteps.length) {
      if (canUseHints && execution.waiting_for_reply_until) {
        const nextWait = findStepIndex(flatSteps, (step) => step.type === 'wait_for_reply', rawIndex);
        if (nextWait !== -1) return nextWait;
      }

      if (stageDescription) {
        const nextMatch = findStageMatch(flatSteps, stageDescription, rawIndex);
        if (nextMatch !== -1) return nextMatch;
      }

      return rawIndex;
    }
  }

  if (canUseHints && execution.waiting_for_reply_until) {
    const nextWait = findStepIndex(flatSteps, (step) => step.type === 'wait_for_reply');
    if (nextWait !== -1) return nextWait;
  }

  if (stageDescription) {
    const nextMatch = findStageMatch(flatSteps, stageDescription);
    if (nextMatch !== -1) return nextMatch;
  }

  return -1;
}