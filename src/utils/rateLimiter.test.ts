import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, UsageTracker, withRateLimit } from './rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    });
  });

  describe('tryAcquire', () => {
    it('should allow requests within the limit', () => {
      expect(limiter.tryAcquire('test-key')).toBe(true);
      expect(limiter.tryAcquire('test-key')).toBe(true);
      expect(limiter.tryAcquire('test-key')).toBe(true);
    });

    it('should block requests exceeding the limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(limiter.tryAcquire('test-key')).toBe(true);
      }
      expect(limiter.tryAcquire('test-key')).toBe(false);
    });

    it('should track different keys independently', () => {
      for (let i = 0; i < 5; i++) {
        expect(limiter.tryAcquire('key-1')).toBe(true);
      }
      expect(limiter.tryAcquire('key-1')).toBe(false);
      expect(limiter.tryAcquire('key-2')).toBe(true);
    });

    it('should reset after the time window', async () => {
      for (let i = 0; i < 5; i++) {
        limiter.tryAcquire('test-key');
      }
      expect(limiter.tryAcquire('test-key')).toBe(false);

      // Wait for window to pass
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(limiter.tryAcquire('test-key')).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining count', () => {
      expect(limiter.getRemaining('test-key')).toBe(5);

      limiter.tryAcquire('test-key');
      expect(limiter.getRemaining('test-key')).toBe(4);

      limiter.tryAcquire('test-key');
      limiter.tryAcquire('test-key');
      expect(limiter.getRemaining('test-key')).toBe(2);
    });

    it('should return 0 when limit is exceeded', () => {
      for (let i = 0; i < 5; i++) {
        limiter.tryAcquire('test-key');
      }
      expect(limiter.getRemaining('test-key')).toBe(0);
    });

    it('should return max for unknown key', () => {
      expect(limiter.getRemaining('unknown-key')).toBe(5);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for unknown key', () => {
      expect(limiter.getResetTime('unknown-key')).toBe(0);
    });

    it('should return time until window expires', () => {
      limiter.tryAcquire('test-key');
      const resetTime = limiter.getResetTime('test-key');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for specific key', () => {
      for (let i = 0; i < 5; i++) {
        limiter.tryAcquire('test-key');
      }
      expect(limiter.tryAcquire('test-key')).toBe(false);

      limiter.reset('test-key');
      expect(limiter.tryAcquire('test-key')).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('should reset all rate limits', () => {
      for (let i = 0; i < 5; i++) {
        limiter.tryAcquire('key-1');
        limiter.tryAcquire('key-2');
      }

      limiter.resetAll();

      expect(limiter.tryAcquire('key-1')).toBe(true);
      expect(limiter.tryAcquire('key-2')).toBe(true);
    });
  });
});

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    localStorage.clear();
    tracker = new UsageTracker();
  });

  describe('recordSuccess', () => {
    it('should record successful request', () => {
      tracker.recordSuccess('test-service', 0.01);

      const stats = tracker.getStats('test-service');
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
      expect(stats.totalCost).toBe(0.01);
      expect(stats.lastRequestTime).toBeGreaterThan(0);
    });

    it('should accumulate costs', () => {
      tracker.recordSuccess('test-service', 0.01);
      tracker.recordSuccess('test-service', 0.02);
      tracker.recordSuccess('test-service', 0.03);

      const stats = tracker.getStats('test-service');
      expect(stats.totalCost).toBeCloseTo(0.06, 5);
      expect(stats.successfulRequests).toBe(3);
    });
  });

  describe('recordFailure', () => {
    it('should record failed request', () => {
      tracker.recordFailure('test-service');

      const stats = tracker.getStats('test-service');
      expect(stats.totalRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return default stats for unknown key', () => {
      const stats = tracker.getStats('unknown');

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.totalCost).toBe(0);
    });

    it('should track mixed success and failures', () => {
      tracker.recordSuccess('test-service', 0.01);
      tracker.recordFailure('test-service');
      tracker.recordSuccess('test-service', 0.02);

      const stats = tracker.getStats('test-service');
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(1);
    });
  });

  describe('getAllStats', () => {
    it('should return all tracked services', () => {
      tracker.recordSuccess('service-1', 0.01);
      tracker.recordSuccess('service-2', 0.02);

      const allStats = tracker.getAllStats();
      expect(allStats.size).toBe(2);
      expect(allStats.get('service-1')?.totalCost).toBe(0.01);
      expect(allStats.get('service-2')?.totalCost).toBe(0.02);
    });
  });

  describe('reset', () => {
    it('should reset stats for specific service', () => {
      tracker.recordSuccess('service-1', 0.01);
      tracker.recordSuccess('service-2', 0.02);

      tracker.reset('service-1');

      expect(tracker.getStats('service-1').totalRequests).toBe(0);
      expect(tracker.getStats('service-2').totalRequests).toBe(1);
    });
  });

  describe('resetAll', () => {
    it('should reset all stats', () => {
      tracker.recordSuccess('service-1', 0.01);
      tracker.recordSuccess('service-2', 0.02);

      tracker.resetAll();

      expect(tracker.getAllStats().size).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should save to localStorage', () => {
      tracker.recordSuccess('test-service', 0.01);

      const stored = localStorage.getItem('audio-tour-usage-stats');
      expect(stored).toBeDefined();

      const data = JSON.parse(stored!);
      expect(data).toHaveLength(1);
    });

    it('should load from localStorage', () => {
      tracker.recordSuccess('test-service', 0.01);

      // Create new tracker (should load from storage)
      const newTracker = new UsageTracker();
      const stats = newTracker.getStats('test-service');

      expect(stats.totalCost).toBe(0.01);
    });
  });

  describe('exportStats', () => {
    it('should export stats as JSON', () => {
      tracker.recordSuccess('test-service', 0.01);

      const exported = tracker.exportStats();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });
  });
});

describe('withRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute function when rate limit allows', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await withRateLimit('openai', 'test-key', mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throw error when rate limited', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    // Exhaust rate limit
    const limiter = (await import('./rateLimiter')).rateLimiters.openai;
    limiter.reset('test-key');

    for (let i = 0; i < 50; i++) {
      limiter.tryAcquire('test-key');
    }

    await expect(
      withRateLimit('openai', 'test-key', mockFn)
    ).rejects.toThrow(/Rate limit exceeded/);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should call onRateLimited callback when limited', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const onRateLimited = vi.fn();

    const limiter = (await import('./rateLimiter')).rateLimiters.openai;
    limiter.reset('test-key');

    // Exhaust rate limit
    for (let i = 0; i < 50; i++) {
      limiter.tryAcquire('test-key');
    }

    await expect(
      withRateLimit('openai', 'test-key', mockFn, { onRateLimited })
    ).rejects.toThrow();

    expect(onRateLimited).toHaveBeenCalled();
  });

  it('should track usage on success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const tracker = (await import('./rateLimiter')).usageTracker;
    tracker.reset('openai');

    await withRateLimit('openai', 'test-key-unique', mockFn, { cost: 0.05 });

    const stats = tracker.getStats('openai');
    expect(stats.successfulRequests).toBeGreaterThan(0);
  });

  it('should track usage on failure', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('API Error'));
    const tracker = (await import('./rateLimiter')).usageTracker;
    tracker.reset('openai');

    await expect(
      withRateLimit('openai', 'test-key-error', mockFn)
    ).rejects.toThrow('API Error');

    const stats = tracker.getStats('openai');
    expect(stats.failedRequests).toBeGreaterThan(0);
  });
});
