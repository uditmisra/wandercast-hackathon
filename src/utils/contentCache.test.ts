import { describe, it, expect, beforeEach } from 'vitest';
import { ContentCache, createCacheKey } from './contentCache';
import type { Place, GeneratedContent } from '@/types/tour';

describe('ContentCache', () => {
  let cache: ContentCache;

  const mockPlace: Place = {
    id: '1',
    name: 'Edinburgh Castle',
    city: 'Edinburgh',
    country: 'Scotland',
    estimatedDuration: 60,
  };

  const mockContent: GeneratedContent = {
    overview: 'Historic castle',
    audioNarration: 'Welcome to Edinburgh Castle',
  };

  beforeEach(() => {
    localStorage.clear();
    cache = new ContentCache();
  });

  describe('set and get', () => {
    it('should store and retrieve content', () => {
      const key = createCacheKey(mockPlace, ['history']);

      cache.set(key, mockContent);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(mockContent);
    });

    it('should return null for non-existent key', () => {
      const key = createCacheKey(mockPlace, ['history']);
      const retrieved = cache.get(key);

      expect(retrieved).toBeNull();
    });

    it('should differentiate between different interests', () => {
      const key1 = createCacheKey(mockPlace, ['history']);
      const key2 = createCacheKey(mockPlace, ['architecture']);

      const content1: GeneratedContent = {
        overview: 'Historical content',
        audioNarration: 'History narration',
      };

      const content2: GeneratedContent = {
        overview: 'Architectural content',
        audioNarration: 'Architecture narration',
      };

      cache.set(key1, content1);
      cache.set(key2, content2);

      expect(cache.get(key1)).toEqual(content1);
      expect(cache.get(key2)).toEqual(content2);
    });

    it('should differentiate based on personalization', () => {
      const key1 = createCacheKey(mockPlace, ['history'], {
        travelStyle: 'first-time',
      });

      const key2 = createCacheKey(mockPlace, ['history'], {
        travelStyle: 'repeat',
      });

      cache.set(key1, mockContent);
      cache.set(key2, { ...mockContent, overview: 'Different content' });

      expect(cache.get(key1)?.overview).toBe('Historic castle');
      expect(cache.get(key2)?.overview).toBe('Different content');
    });

    it('should handle multiple interests in consistent order', () => {
      const key1 = createCacheKey(mockPlace, ['history', 'architecture']);
      const key2 = createCacheKey(mockPlace, ['architecture', 'history']);

      cache.set(key1, mockContent);

      // Should retrieve same content regardless of interest order
      expect(cache.get(key2)).toEqual(mockContent);
    });
  });

  describe('has', () => {
    it('should return true for existing content', () => {
      const key = createCacheKey(mockPlace, ['history']);
      cache.set(key, mockContent);

      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent content', () => {
      const key = createCacheKey(mockPlace, ['history']);

      expect(cache.has(key)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove content from cache', () => {
      const key = createCacheKey(mockPlace, ['history']);

      cache.set(key, mockContent);
      expect(cache.has(key)).toBe(true);

      cache.delete(key);
      expect(cache.has(key)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all content from cache', () => {
      const key1 = createCacheKey(mockPlace, ['history']);
      const key2 = createCacheKey(mockPlace, ['architecture']);

      cache.set(key1, mockContent);
      cache.set(key2, mockContent);

      expect(cache.has(key1)).toBe(true);
      expect(cache.has(key2)).toBe(true);

      cache.clear();

      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired content', async () => {
      const key = createCacheKey(mockPlace, ['history']);

      // Set with very short TTL
      cache.set(key, mockContent, 100); // 100ms

      // Should exist initially
      expect(cache.get(key)).toEqual(mockContent);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired now
      expect(cache.get(key)).toBeNull();
    });

    it('should not expire content within TTL', async () => {
      const key = createCacheKey(mockPlace, ['history']);

      cache.set(key, mockContent, 1000); // 1 second

      // Wait less than TTL
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should still exist
      expect(cache.get(key)).toEqual(mockContent);
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries', async () => {
      const key1 = createCacheKey(mockPlace, ['history']);
      const key2 = createCacheKey({ ...mockPlace, id: '2' }, ['architecture']);

      cache.set(key1, mockContent, 100); // Expires quickly
      cache.set(key2, mockContent, 10000); // Expires slowly

      await new Promise((resolve) => setTimeout(resolve, 150));

      const removed = cache.cleanExpired();

      expect(removed).toBe(1);
      expect(cache.has(key1)).toBe(false);
      expect(cache.has(key2)).toBe(true);
    });

    it('should return 0 when no entries expired', () => {
      const key = createCacheKey(mockPlace, ['history']);
      cache.set(key, mockContent, 10000);

      const removed = cache.cleanExpired();

      expect(removed).toBe(0);
      expect(cache.has(key)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const key1 = createCacheKey(mockPlace, ['history']);
      const key2 = createCacheKey({ ...mockPlace, id: '2' }, ['architecture']);

      cache.set(key1, mockContent);
      cache.set(key2, mockContent);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.oldest).toBeGreaterThan(0);
      expect(stats.newest).toBeGreaterThanOrEqual(stats.oldest);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should return zero stats for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.oldest).toBe(0);
      expect(stats.newest).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should save to and load from localStorage', () => {
      const key = createCacheKey(mockPlace, ['history']);

      cache.set(key, mockContent);

      // Create new cache instance (should load from storage)
      const newCache = new ContentCache();

      expect(newCache.get(key)).toEqual(mockContent);
    });

    it('should persist multiple entries', () => {
      const key1 = createCacheKey(mockPlace, ['history']);
      const key2 = createCacheKey({ ...mockPlace, id: '2' }, ['architecture']);

      cache.set(key1, mockContent);
      cache.set(key2, { ...mockContent, overview: 'Different' });

      const newCache = new ContentCache();

      expect(newCache.get(key1)?.overview).toBe('Historic castle');
      expect(newCache.get(key2)?.overview).toBe('Different');
    });
  });

  describe('createCacheKey', () => {
    it('should create key with place id and interests', () => {
      const key = createCacheKey(mockPlace, ['history', 'architecture']);

      expect(key.placeId).toBe('1');
      expect(key.placeName).toBe('Edinburgh Castle');
      expect(key.interests).toEqual(['history', 'architecture']);
    });

    it('should include personalization when provided', () => {
      const key = createCacheKey(mockPlace, ['history'], {
        travelStyle: 'first-time',
        preferredTone: 'casual',
      });

      expect(key.personalization).toEqual({
        travelStyle: 'first-time',
        preferredTone: 'casual',
      });
    });

    it('should work without personalization', () => {
      const key = createCacheKey(mockPlace, ['history']);

      expect(key.personalization).toBeUndefined();
    });
  });
});
