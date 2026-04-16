import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from '@/components/icons';
import { toast } from 'sonner';
import {
  fetchSnapshotData,
  formatSnapshot,
  SUPPORT_EMAIL,
  type SnapshotData,
} from '@/lib/supportSnapshot';

interface SupportRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  user: { id?: string | null; email?: string | null } | null;
}

export const SupportRequestDialog: React.FC<SupportRequestDialogProps> = ({
  open, onOpenChange, clientId, user,
}) => {
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setLoading(true);
    fetchSnapshotData(clientId, user)
      .then(setSnapshot)
      .finally(() => setLoading(false));
  }, [open, clientId, user?.id]);

  const snapshotText = snapshot ? formatSnapshot(snapshot, '', '').split('---')[1]?.trim() ?? formatSnapshot(snapshot, '', '') : '';

  const handleCopy = async () => {
    if (!snapshotText) return;
    try {
      await navigator.clipboard.writeText(snapshotText);
      setCopied(true);
      toast.success('Snapshot copied — paste it into your email');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const bodyTextStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '13px',
    lineHeight: '1.6',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '13px',
    color: 'hsl(var(--foreground))',
    fontWeight: 500,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col !p-0">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '1px' }}>
            CONTACT SUPPORT
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-2">
            <p style={bodyTextStyle} className="text-foreground">
              We're available 24/7 via email and usually respond within 1–2 hours. Email is the fastest way to get help from our team.
            </p>
            <p style={bodyTextStyle} className="text-foreground">
              Send your request to:{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div
            className="p-3"
            style={{
              border: '2px solid hsl(var(--destructive))',
              background: 'hsl(var(--destructive) / 0.08)',
            }}
          >
            <p
              style={{ ...bodyTextStyle, color: 'hsl(var(--destructive))' }}
            >
              IMPORTANT: Every email you send must include the technical snapshot below. It contains your account info, active setters, and recent error logs — without it, our team can't see what's happening on your account and resolving your issue will take much longer.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={sectionTitleStyle}>
                Technical snapshot {loading && '— loading...'}
              </label>
            </div>
            <div
              onClick={handleCopy}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="relative cursor-pointer transition-all"
              style={{ opacity: loading ? 0.5 : 1 }}
              title="Click to copy"
            >
              <pre
                className="p-3 bg-muted text-foreground groove-border overflow-auto whitespace-pre-wrap"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  lineHeight: '1.5',
                  height: '220px',
                  margin: 0,
                }}
              >
                {snapshotText || 'Loading snapshot...'}
              </pre>
              {(hovering || copied) && !loading && snapshotText && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    background: copied
                      ? 'hsl(var(--primary) / 0.85)'
                      : 'hsl(var(--foreground) / 0.75)',
                    transition: 'background 120ms',
                  }}
                >
                  <Button variant="default" className="gap-2 pointer-events-none">
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied to clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Click to copy snapshot
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2" style={{ marginTop: '8px' }}>
            <Button variant="default" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={loading || !snapshotText}
              className="flex-1 h-10 font-medium groove-btn-pulse groove-btn-positive"
              style={{ fontFamily: "'VT323', monospace", fontSize: '18px', letterSpacing: '0.5px' }}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              COPY SNAPSHOT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportRequestDialog;
