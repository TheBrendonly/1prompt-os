import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PromptConfigEntry {
  id?: string;
  client_id: string;
  slot_id: string;
  config_key: string;
  selected_option: string;
  custom_content: string;
}

type PromptConfigWriteEntry = {
  configKey: string;
  selectedOption: string;
  customContent: string;
};

function getCacheKey(clientId: string, slotId: string) {
  return `prompt_configs_${clientId}_${slotId}`;
}

function readCache(clientId: string, slotId: string): Record<string, PromptConfigEntry> | null {
  try {
    const raw = localStorage.getItem(getCacheKey(clientId, slotId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(clientId: string, slotId: string, configs: Record<string, PromptConfigEntry>) {
  try {
    localStorage.setItem(getCacheKey(clientId, slotId), JSON.stringify(configs));
  } catch {}
}

export function usePromptConfigurations(clientId: string | undefined, slotId: string | null) {
  // Initialize from cache for instant render
  const [configs, setConfigs] = useState<Record<string, PromptConfigEntry>>(() => {
    if (!clientId || !slotId) return {};
    return readCache(clientId, slotId) || {};
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const prevKeyRef = useRef<string>('');

  const mergeConfigs = useCallback((rows: PromptConfigEntry[]) => {
    if (!clientId || !slotId || rows.length === 0) return;

    setConfigs((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        next[row.config_key] = row;
      });
      writeCache(clientId, slotId, next);
      return next;
    });
  }, [clientId, slotId]);

  const persistConfigs = useCallback(async (entries: PromptConfigWriteEntry[]) => {
    if (!clientId || !slotId || entries.length === 0) return;

    const dedupedEntries = Array.from(
      new Map(entries.map((entry) => [entry.configKey, entry])).values()
    );

    const payload = dedupedEntries.map((entry) => ({
      client_id: clientId,
      slot_id: slotId,
      config_key: entry.configKey,
      selected_option: entry.selectedOption,
      custom_content: entry.customContent,
    }));

    const { data, error } = await (supabase as any)
      .from('prompt_configurations')
      .upsert(payload, { onConflict: 'client_id,slot_id,config_key' })
      .select('*');

    if (error) throw error;

    if (data?.length) {
      mergeConfigs(data as PromptConfigEntry[]);
      return;
    }

    mergeConfigs(payload as PromptConfigEntry[]);
  }, [clientId, slotId, mergeConfigs]);

  // When clientId/slotId changes, immediately load cache for new key
  useEffect(() => {
    if (!clientId || !slotId) {
      setConfigs({});
      setLoading(false);
      return;
    }
    const key = getCacheKey(clientId, slotId);
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      const cached = readCache(clientId, slotId);
      if (cached) setConfigs(cached);
    }
  }, [clientId, slotId]);

  const fetchConfigs = useCallback(async () => {
    if (!clientId || !slotId) { setLoading(false); return; }
    try {
      const { data, error } = await (supabase as any)
        .from('prompt_configurations')
        .select('*')
        .eq('client_id', clientId)
        .eq('slot_id', slotId);
      if (error) throw error;
      const map: Record<string, PromptConfigEntry> = {};
      (data || []).forEach((row: any) => {
        map[row.config_key] = row;
      });
      setConfigs(map);
      writeCache(clientId, slotId, map);
    } catch (err) {
      console.error('Error fetching prompt configs:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, slotId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const getConfig = (configKey: string): PromptConfigEntry | null => {
    return configs[configKey] || null;
  };

  const saveConfig = async (configKey: string, selectedOption: string, customContent: string) => {
    if (!clientId || !slotId) return;
    try {
      await persistConfigs([{ configKey, selectedOption, customContent }]);
    } catch (err) {
      console.error('Error saving prompt config:', err);
      toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive' });
    }
  };

  const saveAllConfigs = async (entries: Array<{ configKey: string; selectedOption: string; customContent: string }>) => {
    if (!clientId || !slotId) return;
    try {
      await persistConfigs(entries);
      toast({ title: 'Configuration saved', description: 'Agent configuration updated successfully.' });
    } catch (err) {
      console.error('Error saving prompt configs:', err);
      toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive' });
    }
  };

  const saveAllConfigsSilent = async (entries: Array<{ configKey: string; selectedOption: string; customContent: string }>) => {
    if (!clientId || !slotId) return;
    try {
      await persistConfigs(entries);
    } catch (err) {
      console.error('Error auto-saving prompt configs:', err);
    }
  };

  const buildPromptFromConfigs = (localConfigs: Record<string, { selectedOption: string; customContent: string }>, conversationExamples?: string): { persona: string; content: string } => {
    const personaKeys = ['agent_name', 'agent_goal', 'identity_behavior', 'personality', 'communication_tone', 'grammar_style'];
    const promptKeys = ['company_knowledge', 'response_length', 'formatting_rules', 'banned_phrases', 'conversation_flow', 'custom_prompt'];

    const SECTION_SEPARATOR = '\n\n── ── ── ── ── ── ── ── ── ── ── ── ── ──\n\n';

    let personaParts: string[] = [];
    let contentParts: string[] = [];

    for (const key of personaKeys) {
      const config = localConfigs[key];
      if (!config?.customContent?.trim()) continue;

      if (key === 'personality') {
        // Extract readable prompt from JSON structure
        try {
          const parsed = JSON.parse(config.customContent);
          if (parsed.prompt?.trim()) {
            personaParts.push(parsed.prompt.trim());
          }
        } catch {
          personaParts.push(config.customContent.trim());
        }
      } else {
        personaParts.push(config.customContent.trim());
      }
    }

    for (const key of promptKeys) {
      const config = localConfigs[key];
      if (config?.customContent?.trim()) {
        contentParts.push(config.customContent.trim());
      }
    }

    // Append conversation examples if provided
    if (conversationExamples?.trim()) {
      contentParts.push(conversationExamples.trim());
    }

    return {
      persona: personaParts.join(SECTION_SEPARATOR),
      content: contentParts.join(SECTION_SEPARATOR),
    };
  };

  return { configs, loading, getConfig, saveConfig, saveAllConfigs, saveAllConfigsSilent, buildPromptFromConfigs, refetch: fetchConfigs };
}
