import React, { createContext, useContext, useRef, useCallback } from 'react';

type GuardFn = (proceed: () => void) => boolean; // return true if blocked

interface NavigationGuardContextValue {
  registerGuard: (guard: GuardFn) => void;
  unregisterGuard: () => void;
  tryNavigate: (navigate: () => void) => boolean; // returns true if allowed
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  registerGuard: () => {},
  unregisterGuard: () => {},
  tryNavigate: () => true,
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);

export const NavigationGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const guardRef = useRef<GuardFn | null>(null);

  const registerGuard = useCallback((guard: GuardFn) => {
    guardRef.current = guard;
  }, []);

  const unregisterGuard = useCallback(() => {
    guardRef.current = null;
  }, []);

  const tryNavigate = useCallback((navigate: () => void) => {
    if (guardRef.current) {
      const blocked = guardRef.current(navigate);
      return !blocked;
    }
    return true;
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, unregisterGuard, tryNavigate }}>
      {children}
    </NavigationGuardContext.Provider>
  );
};
