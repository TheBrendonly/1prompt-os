import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw } from '@/components/icons';
import type { SectionDiff } from './diffUtils';

interface PromptDiffReviewProps {
  diffs: SectionDiff[];
  onApproveSection: (index: number) => void;
  onDeclineSection: (index: number) => void;
}

const FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', lineHeight: '1.7' };

const renderPlainText = (text: string) => (
  <pre className="whitespace-pre-wrap text-foreground m-0" style={FONT}>
    {text}
  </pre>
);

export const PromptDiffReview: React.FC<PromptDiffReviewProps> = ({
  diffs,
  onApproveSection,
  onDeclineSection,
}) => {
  return (
    <div className="space-y-0">
      {diffs.map((diff, i) => (
        <React.Fragment key={i}>
          {i > 0 && diff.hasSeparatorBefore && (
            <div
              className="text-center py-2 text-muted-foreground select-none"
              style={{ ...FONT, letterSpacing: '2px' }}
            >
              ── ── ── ── ── ── ── ── ── ── ── ── ── ──
            </div>
          )}

          {i > 0 && !diff.hasSeparatorBefore && (
            <div className="h-3" />
          )}

          <div className="relative">
            <div style={FONT}>
              {/* After approve: show newContent as plain text */}
              {diff.hasChanges && diff.status === 'approved' && renderPlainText(diff.newContent)}

              {/* After decline: show oldContent as plain text */}
              {diff.hasChanges && diff.status === 'declined' && renderPlainText(diff.oldContent)}

              {/* No changes: show as-is */}
              {!diff.hasChanges && renderPlainText(diff.oldContent)}

              {/* Pending: show diff lines */}
              {diff.hasChanges && diff.status === 'pending' && diff.lines.map((line, li) => {
                if (line.type === 'unchanged') {
                  return (
                    <pre key={li} className="whitespace-pre-wrap text-foreground m-0" style={FONT}>
                      {line.text}
                    </pre>
                  );
                }

                if (line.type === 'removed') {
                  return (
                    <pre
                      key={li}
                      className="whitespace-pre-wrap m-0"
                      style={{
                        ...FONT,
                        backgroundColor: 'hsl(var(--destructive) / 0.12)',
                        color: 'hsl(var(--destructive))',
                        textDecoration: 'line-through',
                        padding: '1px 4px',
                        borderRadius: '2px',
                      }}
                    >
                      {line.text}
                    </pre>
                  );
                }

                return (
                  <pre
                    key={li}
                    className="whitespace-pre-wrap m-0"
                    style={{
                      ...FONT,
                      backgroundColor: 'hsl(142 71% 45% / 0.12)',
                      color: 'hsl(142 71% 45%)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    {line.text}
                  </pre>
                );
              })}
            </div>


            {diff.hasChanges && diff.status === 'approved' && (
              <div
                className="mt-2 inline-flex items-center gap-1 px-2 py-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(142 71% 45%)' }}
              >
                <Check className="w-3 h-3" />
                APPROVED
              </div>
            )}

            {diff.hasChanges && diff.status === 'declined' && (
              <div
                className="mt-2 inline-flex items-center gap-1 px-2 py-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}
              >
                <RotateCcw className="w-3 h-3" />
                KEPT ORIGINAL
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
