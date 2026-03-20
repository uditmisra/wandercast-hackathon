/**
 * Rate Limiter utility for controlling API request frequency
 *
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  strategy?: 'sliding' | 'fixed';
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * Token Bucket Rate Limiter
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
 *
 * if (limiter.tryAcquire('api-key')) {
 *   await makeApiCall();
 * } else {
 *   console.log('Rate limit exceeded');
 * }
 * ```
 */
export class RateLimiter {
  private requests = new Map<string, RequestRecord[]>();
  private config: Required<RateLimiterConfig>;

  constructor(config: RateLimiterConfig) {
    this.config = {
      ...config,
      strategy: config.strategy || 'sliding',
    };
  }

  /**
   * Attempts to acquire a token for the given key
   * @param key - Identifier for the rate limit bucket (e.g., user ID, API key)
   * @returns true if request is allowed, false if rate limited
   */
  tryAcquire(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or initialize request history
    let history = this.requests.get(key) || [];

    // Clean up old requests outside the window
    history = history.filter((record) => record.timestamp > windowStart);

    // Count requests in current window
    const requestCount = history.reduce((sum, record) => sum + record.count, 0);

    if (requestCount >= this.config.maxRequests) {
      // Update the map with cleaned history
      this.requests.set(key, history);
      return false;
    }

    // Add new request
    history.push({ timestamp: now, count: 1 });
    this.requests.set(key, history);

    return true;
  }

  /**
   * Gets the remaining requests available for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const history = this.requests.get(key) || [];
    const validHistory = history.filter((record) => record.timestamp > windowStart);
    const requestCount = validHistory.reduce((sum, record) => sum + record.count, 0);

    return Math.max(0, this.config.maxRequests - requestCount);
  }

  /**
   * Gets the time until the rate limit resets (in milliseconds)
   */
  getResetTime(key: string): number {
    const history = this.requests.get(key) || [];
    if (history.length === 0) return 0;

    const oldestRequest = history[0];
    const resetTime = oldestRequest.timestamp + this.config.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Resets the rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clears all rate limit data
   */
  resetAll(): void {
    this.requests.clear();
  }
}

/**
 * Usage Tracker for monitoring API consumption
 */
interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  lastRequestTime: number;
}

export class UsageTracker {
  private stats = new Map<string, UsageStats>();
  private storageKey = 'audio-tour-usage-stats';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Records a successful API request
   */
  recordSuccess(key: string, cost: number = 0): void {
    const stats = this.getStats(key);
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.totalCost += cost;
    stats.lastRequestTime = Date.now();
    this.stats.set(key, stats);
    this.saveToStorage();
  }

  /**
   * Records a failed API request
   */
  recordFailure(key: string): void {
    const stats = this.getStats(key);
    stats.totalRequests++;
    stats.failedRequests++;
    stats.lastRequestTime = Date.now();
    this.stats.set(key, stats);
    this.saveToStorage();
  }

  /**
   * Gets usage statistics for a key
   */
  getStats(key: string): UsageStats {
    return this.stats.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      lastRequestTime: 0,
    };
  }

  /**
   * Gets all usage statistics
   */
  getAllStats(): Map<string, UsageStats> {
    return new Map(this.stats);
  }

  /**
   * Resets statistics for a specific key
   */
  reset(key: string): void {
    this.stats.delete(key);
    this.saveToStorage();
  }

  /**
   * Resets all statistics
   */
  resetAll(): void {
    this.stats.clear();
    this.saveToStorage();
  }

  /**
   * Saves statistics to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.stats.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save usage stats to localStorage:', error);
    }
  }

  /**
   * Loads statistics from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const entries = JSON.parse(data);
        this.stats = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load usage stats from localStorage:', error);
    }
  }

  /**
   * Exports statistics as JSON
   */
  exportStats(): string {
    const data = Array.from(this.stats.entries());
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Global rate limiter instances for different services
 */
export const rateLimiters = {
  openai: new RateLimiter({
    maxRequests: 50, // 50 requests per minute
    windowMs: 60 * 1000,
  }),
  elevenlabs: new RateLimiter({
    maxRequests: 30, // 30 requests per minute
    windowMs: 60 * 1000,
  }),
  supabase: new RateLimiter({
    maxRequests: 100, // 100 requests per minute
    windowMs: 60 * 1000,
  }),
};

/**
 * Global usage tracker instance
 */
export const usageTracker = new UsageTracker();

/**
 * Helper function to execute an API call with rate limiting and usage tracking
 *
 * @example
 * ```ts
 * const result = await withRateLimit(
 *   'openai',
 *   'user-123',
 *   async () => await fetch('https://api.openai.com/...'),
 *   { cost: 0.002 }
 * );
 * ```
 */
export async function withRateLimit<T>(
  service: keyof typeof rateLimiters,
  key: string,
  fn: () => Promise<T>,
  options: { cost?: number; onRateLimited?: () => void } = {}
): Promise<T> {
  const limiter = rateLimiters[service];

  if (!limiter.tryAcquire(key)) {
    const resetTime = limiter.getResetTime(key);
    const resetSeconds = Math.ceil(resetTime / 1000);

    options.onRateLimited?.();

    throw new Error(
      `Rate limit exceeded for ${service}. Please try again in ${resetSeconds} seconds.`
    );
  }

  try {
    const result = await fn();
    usageTracker.recordSuccess(service, options.cost || 0);
    return result;
  } catch (error) {
    usageTracker.recordFailure(service);
    throw error;
  }
}
