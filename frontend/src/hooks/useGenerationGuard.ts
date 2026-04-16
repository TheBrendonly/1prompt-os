import { useEffect } from 'react';

/**
 * Blocks browser close/refresh while an LLM generation
 * (or any long-running operation) is active.
 *
 * @param isGenerating - whether a generation is currently running
 */
export function useGenerationGuard(isGenerating: boolean) {
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isGenerating]);
}
