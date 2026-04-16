import React from 'react';
import { supabase } from '@/integrations/supabase/client';

const { useState, useEffect, useCallback } = React;

export interface OpenRouterCredits {
  total_credits: number;
  total_usage: number;
  remaining: number;
}

export interface KeyUsageData {
  label: string;
  usage: number;
  usage_daily: number;
  usage_weekly: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
  is_free_tier: boolean;
}

export interface ActivityItem {
  date: string;
  model: string;
  model_permaslug: string;
  endpoint_id: string;
  provider_name: string;
  usage: number;
  byok_usage_inference: number;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
}

export interface ModelUsageSummary {
  model: string;
  totalCost: number;
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
}

export interface DailyUsage {
  date: string;
  cost: number;
  requests: number;
}

export function useOpenRouterUsage(clientId: string | undefined) {
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null);
  const [keyUsage, setKeyUsage] = useState<KeyUsageData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [managementKey, setManagementKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const fetchApiKey = useCallback(async () => {
    if (!clientId) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('openrouter_api_key, openrouter_management_key')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      const key = (data as any)?.openrouter_api_key || null;
      const mgmtKey = (data as any)?.openrouter_management_key || null;
      setApiKey(key);
      setManagementKey(mgmtKey);
      setHasKey(!!key);
    } catch (err: any) {
      setError(err.message);
      setHasKey(false);
    }
  }, [clientId]);

  // Load from cache on mount
  const loadCache = useCallback(async () => {
    if (!clientId) return;
    try {
      const { data } = await supabase
        .from('openrouter_usage_cache' as any)
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (data && (data as any).cached_data) {
        const cached = (data as any).cached_data as any;
        if (cached.credits) setCredits(cached.credits);
        if (cached.keyUsage) setKeyUsage(cached.keyUsage);
        if (cached.activity) setActivity(cached.activity);
        setLastRefreshed((data as any).last_refreshed);
        setCacheLoaded(true);
        setLoading(false);
      }
    } catch {
      // Cache miss is fine
    }
  }, [clientId]);

  // Save to cache
  const saveCache = useCallback(async (creditsData: OpenRouterCredits | null, keyData: KeyUsageData | null, activityData: ActivityItem[]) => {
    if (!clientId) return;
    const now = new Date().toISOString();
    try {
      const { data: existing } = await supabase
        .from('openrouter_usage_cache' as any)
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();

      const cachePayload = { credits: creditsData, keyUsage: keyData, activity: activityData };

      if (existing) {
        await supabase
          .from('openrouter_usage_cache' as any)
          .update({ cached_data: cachePayload, last_refreshed: now } as any)
          .eq('client_id', clientId);
      } else {
        await supabase
          .from('openrouter_usage_cache' as any)
          .insert({ client_id: clientId, cached_data: cachePayload, last_refreshed: now } as any);
      }
      setLastRefreshed(now);
    } catch {
      // Non-critical
    }
  }, [clientId]);

  const fetchCredits = useCallback(async () => {
    if (!apiKey) return null;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Credits API error: ${res.status}`);
      const json = await res.json();
      const data = json.data;
      const c: OpenRouterCredits = {
        total_credits: data.total_credits ?? 0,
        total_usage: data.total_usage ?? 0,
        remaining: (data.total_credits ?? 0) - (data.total_usage ?? 0),
      };
      setCredits(c);
      return c;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [apiKey]);

  const fetchKeyInfo = useCallback(async () => {
    if (!apiKey) return null;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Key API error: ${res.status}`);
      const json = await res.json();
      const d = json.data;
      const k: KeyUsageData = {
        label: d.label ?? '',
        usage: d.usage ?? 0,
        usage_daily: d.usage_daily ?? 0,
        usage_weekly: d.usage_weekly ?? 0,
        usage_monthly: d.usage_monthly ?? 0,
        limit: d.limit ?? null,
        limit_remaining: d.limit_remaining ?? null,
        is_free_tier: d.is_free_tier ?? false,
      };
      setKeyUsage(k);
      return k;
    } catch (err: any) {
      return null;
    }
  }, [apiKey]);

  const fetchActivity = useCallback(async () => {
    const keyToUse = managementKey || apiKey;
    if (!keyToUse) return [];
    try {
      const res = await fetch('https://openrouter.ai/api/v1/activity', {
        headers: { 'Authorization': `Bearer ${keyToUse}` },
      });
      if (res.status === 403) {
        setActivityError('Activity data requires a management key. Add your OpenRouter Management Key in Credentials to unlock model breakdown and daily activity.');
        return [];
      }
      if (!res.ok) throw new Error(`Activity API error: ${res.status}`);
      const json = await res.json();
      const items = json.data || [];
      setActivity(items);
      setActivityError(null);
      return items;
    } catch (err: any) {
      setActivityError(err.message);
      return [];
    }
  }, [apiKey, managementKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [c, k, a] = await Promise.all([fetchCredits(), fetchKeyInfo(), fetchActivity()]);
    await saveCache(c, k, a);
    setLoading(false);
  }, [fetchCredits, fetchKeyInfo, fetchActivity, saveCache]);

  useEffect(() => { fetchApiKey(); }, [fetchApiKey]);
  useEffect(() => { loadCache(); }, [loadCache]);

  useEffect(() => {
    if (apiKey && !cacheLoaded) {
      refresh();
    } else if (apiKey && cacheLoaded) {
      // Cache was loaded, don't auto-fetch
      setLoading(false);
    } else if (hasKey === false) {
      setLoading(false);
    }
  }, [apiKey, hasKey, cacheLoaded]);

  // Aggregate: usage by model
  const modelUsage: ModelUsageSummary[] = (() => {
    const map = new Map<string, ModelUsageSummary>();
    activity.forEach((item) => {
      const existing = map.get(item.model) || {
        model: item.model, totalCost: 0, totalRequests: 0,
        promptTokens: 0, completionTokens: 0, reasoningTokens: 0,
      };
      existing.totalCost += item.usage || 0;
      existing.totalRequests += item.requests || 0;
      existing.promptTokens += item.prompt_tokens || 0;
      existing.completionTokens += item.completion_tokens || 0;
      existing.reasoningTokens += item.reasoning_tokens || 0;
      map.set(item.model, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
  })();

  // Aggregate: daily usage
  const dailyUsage: DailyUsage[] = (() => {
    const map = new Map<string, DailyUsage>();
    activity.forEach((item) => {
      const existing = map.get(item.date) || { date: item.date, cost: 0, requests: 0 };
      existing.cost += item.usage || 0;
      existing.requests += item.requests || 0;
      map.set(item.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return {
    credits, keyUsage, activity, modelUsage, dailyUsage,
    loading, error, activityError, hasKey, refresh, lastRefreshed,
  };
}