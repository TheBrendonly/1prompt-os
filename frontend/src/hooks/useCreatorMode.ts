import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STORAGE_KEY_PREFIX = 'creator_mode_';

function getKey(clientId: string) {
  return `${STORAGE_KEY_PREFIX}${clientId}`;
}

export function useCreatorMode() {
  const { clientId } = useParams<{ clientId: string }>();

  const [isCreatorMode, setIsCreatorMode] = useState(() => {
    if (!clientId) return false;
    return localStorage.getItem(getKey(clientId)) === 'true';
  });

  // Sync when clientId changes
  useEffect(() => {
    if (!clientId) { setIsCreatorMode(false); return; }
    setIsCreatorMode(localStorage.getItem(getKey(clientId)) === 'true');
  }, [clientId]);

  // Listen for cross-tab / cross-component changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (clientId && e.key === getKey(clientId)) {
        setIsCreatorMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [clientId]);

  const enableCreatorMode = useCallback(() => {
    if (!clientId) return;
    localStorage.setItem(getKey(clientId), 'true');
    setIsCreatorMode(true);
  }, [clientId]);

  const disableCreatorMode = useCallback(() => {
    if (!clientId) return;
    localStorage.removeItem(getKey(clientId));
    setIsCreatorMode(false);
  }, [clientId]);

  const toggleCreatorMode = useCallback(() => {
    if (isCreatorMode) disableCreatorMode();
    else enableCreatorMode();
  }, [isCreatorMode, enableCreatorMode, disableCreatorMode]);

  /** Utility: returns 'creator-blur' when active, '' otherwise */
  const cb = isCreatorMode ? 'creator-blur' : '';
  /** Heavy blur for large analytics numbers */
  const cbHeavy = isCreatorMode ? 'creator-blur-heavy' : '';

  return { isCreatorMode, enableCreatorMode, disableCreatorMode, toggleCreatorMode, cb, cbHeavy };
}
