import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from '@/components/icons';

interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

function computeLineDiff(oldText: string, newText: string): DiffSegment[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const segments: DiffSegment[] = [];

  // Simple LCS-based line diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffSegment[] = [];
  let i = m, j = n;
  const stack: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'unchanged', text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }

  stack.reverse();

  // Merge consecutive segments of the same type
  for (const seg of stack) {
    const last = result[result.length - 1];
    if (last && last.type === seg.type) {
      last.text += '\n' + seg.text;
    } else {
      result.push({ ...seg });
    }
  }

  return result;
}

export interface PromptVersion {
  prompt: string;
  timestamp: number;
  description: string;
}

interface PromptDiffViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: PromptVersion[];
  currentVersionIndex: number;
  onRevert: (prompt: string) => void;
}

export const PromptDiffViewer: React.FC<PromptDiffViewerProps> = ({
  open,
  onOpenChange,
  versions,
  currentVersionIndex,
  onRevert,
}) => {
  const [viewIndex, setViewIndex] = useState(currentVersionIndex);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) setViewIndex(currentVersionIndex);
  }, [open, currentVersionIndex]);

  const hasPrev = viewIndex > 0;
  const hasNext = viewIndex < versions.length - 1;
  const isLatest = viewIndex === versions.length - 1;

  const diffSegments = useMemo(() => {
    if (viewIndex <= 0 || !versions[viewIndex - 1]) return null;
    return computeLineDiff(versions[viewIndex - 1].prompt, versions[viewIndex].prompt);
  }, [viewIndex, versions]);

  const currentVersion = versions[viewIndex];
  if (!currentVersion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !w-[90vw] !max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Prompt Changes — Version {viewIndex + 1} of {versions.length}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 pb-4">
          {/* Navigation bar */}
          <div
            className="flex items-center justify-between py-3 mb-3 shrink-0"
            style={{ borderBottom: '3px groove hsl(var(--border-groove))' }}
          >
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!hasPrev}
                onClick={() => setViewIndex(v => v - 1)}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!hasNext}
                onClick={() => setViewIndex(v => v + 1)}
              >
                Next
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="text-muted-foreground"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}
              >
                {currentVersion.description}
              </span>
              {!isLatest && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onRevert(currentVersion.prompt);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Revert to this
                </Button>
              )}
            </div>
          </div>

          {/* Legend */}
          {diffSegments && (
            <div className="flex items-center gap-4 mb-3 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--destructive) / 0.2)' }} />
                <span className="text-muted-foreground">Removed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142 71% 45% / 0.2)' }} />
                <span className="text-muted-foreground">Added</span>
              </span>
            </div>
          )}

          {/* Diff content */}
          <div className="flex-1 min-h-0 overflow-y-auto groove-border bg-background p-4">
            {viewIndex === 0 || !diffSegments ? (
              <pre
                className="whitespace-pre-wrap text-foreground"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', lineHeight: '1.7' }}
              >
                {currentVersion.prompt}
              </pre>
            ) : (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', lineHeight: '1.7' }}>
                {diffSegments.map((seg, i) => {
                  if (seg.type === 'unchanged') {
                    return (
                      <pre key={i} className="whitespace-pre-wrap text-foreground">
                        {seg.text}
                      </pre>
                    );
                  }
                  if (seg.type === 'removed') {
                    return (
                      <pre
                        key={i}
                        className="whitespace-pre-wrap"
                        style={{
                          backgroundColor: 'hsl(var(--destructive) / 0.15)',
                          color: 'hsl(var(--destructive))',
                          textDecoration: 'line-through',
                          padding: '2px 4px',
                          margin: '1px 0',
                          borderRadius: '2px',
                        }}
                      >
                        {seg.text}
                      </pre>
                    );
                  }
                  // added
                  return (
                    <pre
                      key={i}
                      className="whitespace-pre-wrap"
                      style={{
                        backgroundColor: 'hsl(142 71% 45% / 0.15)',
                        color: 'hsl(142 71% 45%)',
                        padding: '2px 4px',
                        margin: '1px 0',
                        borderRadius: '2px',
                      }}
                    >
                      {seg.text}
                    </pre>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
