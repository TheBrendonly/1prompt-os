import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PromptVersionRecord } from '@/hooks/usePromptVersions';

interface PromptVersionPanelProps {
  dbVersions: PromptVersionRecord[];
  activeView: number | null;
  hasPendingDiffs: boolean;
  hasAnyDiffs: boolean;
  isFirstReview?: boolean;
  onSelectView: (versionNumber: number) => void;
}

const ITEM_FONT = { fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' };
const HEADER_FONT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' };

export const PromptVersionPanel: React.FC<PromptVersionPanelProps> = ({
  dbVersions,
  activeView,
  hasPendingDiffs,
  hasAnyDiffs,
  isFirstReview = false,
  onSelectView,
}) => {
  const isLocked = isFirstReview && hasPendingDiffs;

  const maxVersion = dbVersions.length > 0 ? Math.max(...dbVersions.map(d => d.version_number)) : 0;

  return (
    <div
      className="shrink-0 flex flex-col"
      style={{
        width: '180px',
        borderRight: '1px solid hsl(var(--border-groove) / 0.3)',
      }}
    >
      <div
        className="px-5 shrink-0 bg-background flex items-center"
        style={{
          borderBottom: '3px groove hsl(var(--border-groove))',
          height: '40px',
        }}
      >
        <span
          className="text-foreground font-medium tracking-wide capitalize"
          style={HEADER_FONT}
        >
          Versions
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-card">
        <div>
          {[...dbVersions].reverse().map((v) => {
            const isActive = activeView === v.version_number;
            const isLatest = v.version_number === maxVersion;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => !isLocked && onSelectView(v.version_number)}
                className={`w-full text-left px-5 py-3 transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isLocked
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'hover:bg-accent text-foreground'
                }`}
                disabled={isLocked}
              >
                <span className="uppercase font-medium" style={ITEM_FONT}>
                  V{v.version_number}{isLatest ? ' (Current)' : ''}
                </span>
              </button>
            );
          })}

          {dbVersions.length === 0 && (
            <div
              className="px-5 py-6 text-center text-muted-foreground opacity-50"
              style={HEADER_FONT}
            >
              No versions yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
