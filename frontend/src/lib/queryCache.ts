/**
 * Global in-memory stale-while-revalidate cache.
 * Survives React component unmounts so navigating back shows data instantly.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default: always revalidate (show cached instantly, fetch live data in background)
const DEFAULT_STALE_MS = 0;

/**
 * Get cached data if it exists (regardless of staleness).
 * Returns null if no cache entry exists.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.data as T;
}

/**
 * Returns true if the cached data is still fresh (within staleMs).
 */
export function isFresh(key: string, staleMs: number = DEFAULT_STALE_MS): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < staleMs;
}

/**
 * Store data in the global cache.
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache keys that start with a prefix.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Stale-while-revalidate fetch helper.
 * - If cache exists: returns cached data immediately via onData, then revalidates in background
 * - If cache is fresh: skips the fetch entirely
 * - If no cache: fetches and calls onData when done
 *
 * Returns a promise that resolves when the fetch completes (or immediately if skipped).
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  options?: { staleMs?: number; forceRefresh?: boolean }
): Promise<T | null> {
  const staleMs = options?.staleMs ?? DEFAULT_STALE_MS;
  const forceRefresh = options?.forceRefresh ?? false;

  const cached = getCached<T>(key);

  // Return cached data immediately if available
  if (cached !== null) {
    onData(cached);

    // If data is still fresh and no force refresh, skip the fetch
    if (!forceRefresh && isFresh(key, staleMs)) {
      return cached;
    }
  }

  // Fetch in background (or foreground if no cache)
  try {
    const fresh = await fetcher();
    setCache(key, fresh);
    onData(fresh);
    return fresh;
  } catch (err) {
    console.error(`[queryCache] Error fetching ${key}:`, err);
    // If we had cached data, we already called onData - don't throw
    if (cached !== null) return cached;
    throw err;
  }
}
