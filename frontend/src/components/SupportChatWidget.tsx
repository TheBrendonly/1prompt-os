import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SupportRequestDialog } from '@/components/SupportRequestDialog';

export const SupportChatWidget = () => {
  const { clientId: routeParamClientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [activeClientId, setActiveClientId] = useState<string | null>(routeParamClientId ?? null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const match = location.pathname.match(/\/client\/([0-9a-fA-F-]+)/);
    const fromPath = routeParamClientId || (match ? match[1] : null);
    const stored = (() => { try { return localStorage.getItem('activeClientId'); } catch { return null; } })();
    const chosen = fromPath || stored || null;
    if (chosen && chosen !== activeClientId) {
      setActiveClientId(chosen);
      try { localStorage.setItem('activeClientId', chosen); } catch {}
    }
  }, [routeParamClientId, location.pathname]);

  return (
    <>
      <div className="fixed" style={{ zIndex: 9999, bottom: '36px', right: '12px' }}>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center text-foreground bg-card hover:bg-accent transition-colors groove-border"
          style={{ width: '42px', height: '42px', padding: 0 }}
          title="Contact support"
          aria-label="Contact support"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ imageRendering: 'pixelated' }}>
            <rect x="3" y="4" width="18" height="2" fill="currentColor" />
            <rect x="1" y="6" width="2" height="2" fill="currentColor" />
            <rect x="21" y="6" width="2" height="2" fill="currentColor" />
            <rect x="1" y="8" width="2" height="2" fill="currentColor" />
            <rect x="21" y="8" width="2" height="2" fill="currentColor" />
            <rect x="1" y="10" width="2" height="2" fill="currentColor" />
            <rect x="21" y="10" width="2" height="2" fill="currentColor" />
            <rect x="1" y="12" width="2" height="2" fill="currentColor" />
            <rect x="21" y="12" width="2" height="2" fill="currentColor" />
            <rect x="3" y="14" width="18" height="2" fill="currentColor" />
            <rect x="5" y="16" width="2" height="2" fill="currentColor" />
            <rect x="3" y="18" width="2" height="2" fill="currentColor" />
            <rect x="6" y="9" width="2" height="2" fill="currentColor" />
            <rect x="11" y="9" width="2" height="2" fill="currentColor" />
            <rect x="16" y="9" width="2" height="2" fill="currentColor" />
          </svg>
        </button>
      </div>

      <SupportRequestDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        clientId={activeClientId}
        user={user ? { id: user.id, email: user.email } : null}
      />
    </>
  );
};

export default SupportChatWidget;
