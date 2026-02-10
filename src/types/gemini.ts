/**
 * Error types for Gemini API failures
 */
export type ErrorType = 'rate_limit' | 'auth' | 'timeout' | 'server' | 'unknown';

/**
 * Status tracking for a single API key
 */
export interface KeyStatus {
  key: string;
  requests: number;
  successes: number;
  errors: number;
  consecutiveErrors: number;
  lastUsed: number;
  lastError?: number;
  rateLimitedUntil?: number;
  responseTimes: number[];
}

/**
 * Health metrics for an API key
 */
export interface KeyHealth {
  isHealthy: boolean;
  successRate: number;
  isRateLimited: boolean;
  averageResponseTime: number;
}
