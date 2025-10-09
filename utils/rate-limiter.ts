// Rate limiting utility for API calls and user actions

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (userId: string) => string;
}

interface RateLimitEntry {
  requests: number[];
  lastReset: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  // Check if request is allowed
  canMakeRequest(userId: string): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(userId) : userId;
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry) {
      // First request
      this.requests.set(key, {
        requests: [now],
        lastReset: now
      });
      return true;
    }

    // Clean old requests outside the window
    const windowStart = now - this.config.windowMs;
    const validRequests = entry.requests.filter(time => time > windowStart);

    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, {
      requests: validRequests,
      lastReset: entry.lastReset
    });

    return true;
  }

  // Get time until next request is allowed
  getTimeUntilReset(userId: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(userId) : userId;
    const entry = this.requests.get(key);

    if (!entry || entry.requests.length < this.config.maxRequests) {
      return 0;
    }

    const oldestRequest = Math.min(...entry.requests);
    const resetTime = oldestRequest + this.config.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  // Get remaining requests
  getRemainingRequests(userId: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(userId) : userId;
    const entry = this.requests.get(key);

    if (!entry) {
      return this.config.maxRequests;
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validRequests = entry.requests.filter(time => time > windowStart);

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  // Reset rate limit for user
  resetUser(userId: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(userId) : userId;
    this.requests.delete(key);
  }

  // Clean up old entries
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (this.config.windowMs * 2); // Keep some buffer

    for (const [key, entry] of this.requests.entries()) {
      if (entry.lastReset < cutoff) {
        this.requests.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different use cases
export const AI_CHAT_RATE_LIMITER = new RateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
  keyGenerator: (userId: string) => `ai_chat_${userId}`
});

export const API_RATE_LIMITER = new RateLimiter({
  maxRequests: 30, // 30 requests
  windowMs: 60 * 1000, // per minute
  keyGenerator: (userId: string) => `api_${userId}`
});

export const FILE_UPLOAD_RATE_LIMITER = new RateLimiter({
  maxRequests: 5, // 5 uploads
  windowMs: 60 * 1000, // per minute
  keyGenerator: (userId: string) => `file_upload_${userId}`
});

export const GENERAL_RATE_LIMITER = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
  keyGenerator: (userId: string) => `general_${userId}`
});

// Rate limiting decorator for functions
export function withRateLimit(
  rateLimiter: RateLimiter,
  errorMessage: string = 'Rate limit exceeded. Please wait before trying again.'
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = args[0]; // Assume first argument is userId
      
      if (!rateLimiter.canMakeRequest(userId)) {
        const timeUntilReset = rateLimiter.getTimeUntilReset(userId);
        const seconds = Math.ceil(timeUntilReset / 1000);
        throw new Error(`${errorMessage} Try again in ${seconds} seconds.`);
      }

      return method.apply(this, args);
    };
  };
}

// Rate limiting middleware for API calls
export const createRateLimitMiddleware = (
  rateLimiter: RateLimiter,
  errorMessage: string = 'Rate limit exceeded'
) => {
  return (userId: string) => {
    if (!rateLimiter.canMakeRequest(userId)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(userId);
      const seconds = Math.ceil(timeUntilReset / 1000);
      throw new Error(`${errorMessage}. Try again in ${seconds} seconds.`);
    }
  };
};

// Cleanup old entries periodically
setInterval(() => {
  AI_CHAT_RATE_LIMITER.cleanup();
  API_RATE_LIMITER.cleanup();
  FILE_UPLOAD_RATE_LIMITER.cleanup();
  GENERAL_RATE_LIMITER.cleanup();
}, 5 * 60 * 1000); // Clean up every 5 minutes

export { RateLimiter };
