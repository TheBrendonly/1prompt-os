import { useState } from 'react';
import { useCreatorMode } from '@/hooks/useCreatorMode';
import type { WorkflowExecutionStep } from '@/types/workflow';
import { format } from 'date-fns';
import { X, Square, Zap } from 'lucide-react';
import { StatusTag } from '@/components/StatusTag';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SavingOverlay from '@/components/SavingOverlay';

interface WorkflowExecutionDetailProps {
  executionId: string;
  executionStatus?: string;
  steps: WorkflowExecutionStep[];
  onClose: () => void;
  onEndNow?: (executionId: string) => Promise<void>;
  onPushNow?: (executionId: string) => Promise<void>;
}

const fieldStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' } as const;

export default function WorkflowExecutionDetail({
  executionId,
  executionStatus,
  steps,
  onClose,
  onEndNow,
  onPushNow,
}: WorkflowExecutionDetailProps) {
  const { cb } = useCreatorMode();
  const [stopping, setStopping] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [pushConfirmOpen, setPushConfirmOpen] = useState(false);

  const isRunning = executionStatus === 'running';

  const handleEndNow = async () => {
    if (!onEndNow) return;
    setStopConfirmOpen(false);
    setStopping(true);
    try {
      await onEndNow(executionId);
    } finally {
      setStopping(false);
    }
  };

  const handlePushNow = async () => {
    if (!onPushNow) return;
    setPushConfirmOpen(false);
    setPushing(true);
    try {
      await onPushNow(executionId);
    } finally {
      setPushing(false);
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'positive' as const;
      case 'failed': return 'negative' as const;
      case 'running': return 'warning' as const;
      case 'skipped': return 'neutral' as const;
      default: return 'neutral' as const;
    }
  };

  return (
    <>
      <SavingOverlay
        isVisible={stopping || pushing}
        message={stopping ? 'Ending execution...' : 'Pushing now...'}
        variant="fixed"
      />
      <div className="w-[408px] h-full bg-card overflow-hidden flex flex-col" style={{ borderLeft: '3px groove hsl(var(--border-groove))' }}>
        <div
          className="px-4 shrink-0 flex items-center justify-between"
          style={{ height: 52, borderBottom: '1px solid hsl(var(--border))' }}
        >
          <h3
            className="text-foreground uppercase"
            style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}
          >
            Execution Detail
          </h3>
          <button
            className="groove-btn !h-8 !w-8 !p-0 !min-h-[32px] !min-w-[32px] flex items-center justify-center bg-muted/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action bar for running executions */}
        {isRunning && (onEndNow || onPushNow) && (
          <div className="px-4 py-3 border-b border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <StatusTag variant="warning">RUNNING</StatusTag>
              <span className="text-muted-foreground" style={fieldStyle}>
                {steps[0]?.started_at ? format(new Date(steps[0].started_at), 'MMM d, HH:mm:ss') : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEndNow && (
                <button
                  className="groove-btn groove-btn-destructive !h-7 px-3 uppercase flex items-center flex-1 justify-center"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '14px', letterSpacing: '0.06em' }}
                  onClick={() => setStopConfirmOpen(true)}
                  disabled={stopping}
                >
                  <Square className="h-3.5 w-3.5" />
                  <span className="ml-1.5">{stopping ? 'ENDING...' : 'END NOW'}</span>
                </button>
              )}
              {onPushNow && (
                <button
                  className="groove-btn !h-7 px-3 uppercase text-foreground flex items-center flex-1 justify-center"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '14px', letterSpacing: '0.06em' }}
                  onClick={() => setPushConfirmOpen(true)}
                  disabled={pushing}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="ml-1.5">{pushing ? 'PUSHING...' : 'PUSH NOW'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status bar for non-running */}
        {!isRunning && executionStatus && (
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <StatusTag variant={statusVariant(executionStatus)}>
              {executionStatus.toUpperCase()}
            </StatusTag>
            <span className="text-muted-foreground" style={fieldStyle}>
              {steps[0]?.started_at ? format(new Date(steps[0].started_at), 'MMM d, HH:mm:ss') : '—'}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="groove-border bg-background">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground" style={fieldStyle}>
                    #{idx + 1}
                  </span>
                  <span className="text-foreground capitalize" style={fieldStyle}>
                    {step.node_type}
                  </span>
                </div>
                <StatusTag variant={statusVariant(step.status)}>
                  {step.status}
                </StatusTag>
              </div>

              <div className="px-3 py-2 space-y-2">
                <div className="text-muted-foreground" style={fieldStyle}>
                  Node: {step.node_id}
                </div>

                {step.completed_at && (
                  <div className="text-muted-foreground" style={fieldStyle}>
                    {format(new Date(step.started_at), 'HH:mm:ss.SSS')} →{' '}
                    {format(new Date(step.completed_at), 'HH:mm:ss.SSS')}
                  </div>
                )}

                {step.output_data && Object.keys(step.output_data).length > 0 && (
                  <div>
                    <div className="text-muted-foreground capitalize mb-1" style={fieldStyle}>
                      Output
                    </div>
                    <pre
                      className={`groove-border p-2 overflow-x-auto text-foreground max-h-[200px] overflow-y-auto ${cb}`}
                      style={fieldStyle}
                    >
                      {JSON.stringify(step.output_data, null, 2)}
                    </pre>
                  </div>
                )}

                {step.error_message && (
                  <div className="text-destructive" style={fieldStyle}>
                    Error: {step.error_message}
                  </div>
                )}
              </div>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-muted-foreground p-4" style={fieldStyle}>
              No steps recorded.
            </div>
          )}
        </div>
      </div>

      {/* End Now confirmation */}
      <Dialog open={stopConfirmOpen} onOpenChange={setStopConfirmOpen}>
        <DialogContent className="max-w-md !p-0">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
              END NOW
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
              Are you sure you want to end this execution? This will immediately stop the workflow and mark it as cancelled.
            </p>
            <div className="flex gap-3">
              <button
                className="groove-btn groove-btn-destructive flex-1 !h-9 uppercase flex items-center justify-center"
                style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '1px' }}
                onClick={handleEndNow}
              >
                END NOW
              </button>
              <button
                className="groove-btn flex-1 !h-9 uppercase flex items-center justify-center"
                style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '1px' }}
                onClick={() => setStopConfirmOpen(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Push Now confirmation */}
      <Dialog open={pushConfirmOpen} onOpenChange={setPushConfirmOpen}>
        <DialogContent className="max-w-md !p-0">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
              PUSH NOW
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
              Are you sure you want to push now? This will skip the current wait and advance the execution immediately.
            </p>
            <div className="flex gap-3">
              <button
                className="groove-btn groove-btn-positive flex-1 !h-9 uppercase flex items-center justify-center"
                style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '1px' }}
                onClick={handlePushNow}
              >
                PUSH NOW
              </button>
              <button
                className="groove-btn flex-1 !h-9 uppercase flex items-center justify-center"
                style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '1px' }}
                onClick={() => setPushConfirmOpen(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
