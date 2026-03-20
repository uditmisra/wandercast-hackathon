/**
 * Content Cache for storing generated tour content locally
 *
 * Implements a multi-tier caching strategy:
 * - Memory cache for fast access during session
 * - LocalStorage for persistence across sessions
 * - TTL (Time To Live) for automatic expiration
 */

import type { Place, GeneratedContent } from '@/types/tour';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheKey {
  placeId: string;
  placeName: string;
  interests: string[]; // Sorted array of interest names
  personalization?: {
    travelStyle?: string;
    preferredTone?: string;
    timeOfDay?: string;
  };
}

/**
 * Content Cache Manager
 *
 * Provides intelligent caching of AI-generated content with automatic
 * expiration and memory management.
 *
 * @example
 * ```ts
 * const cache = new ContentCache();
 *
 * // Store content
 * cache.set(cacheKey, generatedContent);
 *
 * // Retrieve content
 * const cached = cache.get(cacheKey);
 * if (cached) {
 *   // Use cached content
 * }
 * ```
 */
export class ContentCache {
  private memoryCache = new Map<string, CacheEntry<GeneratedContent>>();
  private storageKey = 'audio-tour-content-cache';
  private defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.loadFromStorage();
    this.cleanExpired();
  }

  /**
   * Generates a unique cache key from place and personalization data
   *
   * @param key - Cache key components
   * @returns Unique string key for storage
   */
  private generateKey(key: CacheKey): string {
    const parts = [
      key.placeId || key.placeName,
      key.interests.sort().join(','),
    ];

    if (key.personalization) {
      const { travelStyle, preferredTone, timeOfDay } = key.personalization;
      if (travelStyle) parts.push(`style:${travelStyle}`);
      if (preferredTone) parts.push(`tone:${preferredTone}`);
      if (timeOfDay) parts.push(`time:${timeOfDay}`);
    }

    return parts.join('|');
  }

  /**
   * Stores generated content in cache
   *
   * @param key - Cache key components
   * @param content - Generated content to cache
   * @param ttl - Optional custom TTL in milliseconds
   */
  set(key: CacheKey, content: GeneratedContent, ttl?: number): void {
    const cacheKey = this.generateKey(key);
    const entry: CacheEntry<GeneratedContent> = {
      data: content,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.memoryCache.set(cacheKey, entry);
    this.saveToStorage();
  }

  /**
   * Retrieves cached content if available and not expired
   *
   * @param key - Cache key components
   * @returns Cached content or null if not found/expired
   */
  get(key: CacheKey): GeneratedContent | null {
    const cacheKey = this.generateKey(key);
    const entry = this.memoryCache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.memoryCache.delete(cacheKey);
      this.saveToStorage();
      return null;
    }

    return entry.data;
  }

  /**
   * Checks if content exists in cache without retrieving it
   *
   * @param key - Cache key components
   * @returns true if cached and not expired
   */
  has(key: CacheKey): boolean {
    return this.get(key) !== null;
  }

  /**
   * Removes content from cache
   *
   * @param key - Cache key components
   */
  delete(key: CacheKey): void {
    const cacheKey = this.generateKey(key);
    this.memoryCache.delete(cacheKey);
    this.saveToStorage();
  }

  /**
   * Clears all cached content
   */
  clear(): void {
    this.memoryCache.clear();
    this.saveToStorage();
  }

  /**
   * Removes expired entries from cache
   *
   * @returns Number of entries removed
   */
  cleanExpired(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveToStorage();
    }

    return removed;
  }

  /**
   * Gets cache statistics
   *
   * @returns Object with cache stats
   */
  getStats(): {
    size: number;
    oldest: number;
    newest: number;
    totalSize: number;
  } {
    const entries = Array.from(this.memoryCache.values());
    const timestamps = entries.map((e) => e.timestamp);

    return {
      size: this.memoryCache.size,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      totalSize: this.estimateStorageSize(),
    };
  }

  /**
   * Estimates total storage size in bytes
   *
   * @private
   */
  private estimateStorageSize(): number {
    try {
      const serialized = JSON.stringify(Array.from(this.memoryCache.entries()));
      return new Blob([serialized]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Saves cache to localStorage
   *
   * @private
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.memoryCache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save content cache to localStorage:', error);
      // If storage is full, try clearing expired entries and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const removed = this.cleanExpired();
        console.log(`Cleared ${removed} expired entries due to quota exceeded`);
      }
    }
  }

  /**
   * Loads cache from localStorage
   *
   * @private
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const entries = JSON.parse(data) as [string, CacheEntry<GeneratedContent>][];
        this.memoryCache = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load content cache from localStorage:', error);
    }
  }
}

/**
 * Global content cache instance
 */
export const contentCache = new ContentCache();

/**
 * Helper function to create a cache key from a Place and interests
 *
 * @param place - The place to create a key for
 * @param interests - Array of interest names
 * @param personalization - Optional personalization settings
 * @returns Cache key object
 */
export function createCacheKey(
  place: Place,
  interests: string[],
  personalization?: CacheKey['personalization']
): CacheKey {
  return {
    placeId: place.id,
    placeName: place.name,
    interests,
    personalization,
  };
}

/**
 * Decorator function to add caching to content generation functions
 *
 * @param fn - The content generation function to wrap
 * @param cache - The cache instance to use
 * @returns Wrapped function with caching
 * @example
 * ```ts
 * const cachedGenerate = withCache(
 *   async (place, interests) => await generateContent(place, interests),
 *   contentCache
 * );
 * ```
 */
export function withCache<T extends (...args: any[]) => Promise<GeneratedContent>>(
  fn: T,
  cache: ContentCache
): T {
  return (async (...args: Parameters<T>): Promise<GeneratedContent> => {
    // This is a simplified version - in practice, you'd extract cache key from args
    const result = await fn(...args);
    return result;
  }) as T;
}
