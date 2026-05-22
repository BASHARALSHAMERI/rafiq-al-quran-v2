/**
 * A simple in-memory cache with TTL (Time To Live) support.
 */
export class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  /**
   * Set a value in the cache.
   * @param key The cache key
   * @param value The value to store
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache. Returns null if not found or expired.
   * @param key The cache key
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Remove a specific key from the cache.
   * @param key The cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete a specific key from the cache.
   * Alias used by call sites that prefer Map-like semantics.
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items starting with a specific prefix.
   * Useful for invalidating all cache for a specific user.
   * @param prefix The prefix to match
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance for global use
export const memoryCache = new MemoryCache();
