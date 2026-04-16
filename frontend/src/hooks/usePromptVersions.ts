import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCached, setCache } from '@/lib/queryCache';

export interface PromptVersionRecord {
  id: string;
  version_number: number;
  prompt_content: string;
  original_prompt_content: string | null;
  label: string;
  created_at: string;
}

export function usePromptVersions(clientId: string | undefined, slotId: string | undefined) {
  const [versions, setVersions] = useState<PromptVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVersions = useCallback(async () => {
    if (!clientId || !slotId) {
      setVersions([]);
      setLoading(false);
      return;
    }
    const cacheKey = `prompt_versions_${clientId}_${slotId}`;
    const cached = getCached<PromptVersionRecord[]>(cacheKey);
    if (cached) {
      setVersions(cached);
      setLoading(false);
    }
    try {
      const { data, error } = await (supabase as any)
        .from('prompt_versions')
        .select('*')
        .eq('client_id', clientId)
        .eq('slot_id', slotId)
        .order('version_number', { ascending: true });
      if (error) throw error;
      const result = (data || []) as PromptVersionRecord[];
      setVersions(result);
      setCache(cacheKey, result);
    } catch (err) {
      console.error('Error loading prompt versions:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, slotId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const saveVersion = useCallback(async (
    promptContent: string,
    label: string,
    originalPromptContent?: string
  ): Promise<void> => {
    if (!clientId || !slotId) return;
    const nextNumber = versions.length > 0
      ? Math.max(...versions.map(v => v.version_number)) + 1
      : 1;
    try {
      const insertData: any = {
        client_id: clientId,
        slot_id: slotId,
        version_number: nextNumber,
        prompt_content: promptContent,
        label: label || `V${nextNumber}`,
      };
      if (originalPromptContent !== undefined) {
        insertData.original_prompt_content = originalPromptContent;
      }
      const { error } = await (supabase as any)
        .from('prompt_versions')
        .insert(insertData);
      if (error) throw error;
      await loadVersions();
    } catch (err) {
      console.error('Error saving prompt version:', err);
    }
  }, [clientId, slotId, versions, loadVersions]);

  return { versions, loading, loadVersions, saveVersion };
}
