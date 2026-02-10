import { KeyStatus, KeyHealth, ErrorType } from '@/types/gemini';

/**
 * Gemini API Key Manager
 * Handles rotation, health tracking, and rate limit management for up to 10 API keys
 */
class GeminiKeyManager {
    private keys: KeyStatus[] = [];
    private readonly MAX_KEYS = 10;
    private readonly MIN_KEY_LENGTH = 20;
    private readonly MAX_CONSECUTIVE_ERRORS = 5;
    private readonly MIN_SUCCESS_RATE = 0.2; // 20%
    private readonly MIN_REQUESTS_FOR_RATE = 10;
    private readonly MAX_RESPONSE_TIME_SAMPLES = 100;

    constructor() {
        this.loadKeys();
    }

    /**
     * Load API keys from environment and initialize status tracking
     */
    private loadKeys(): void {
        const loadedKeys: KeyStatus[] = [];

        // Load keys from GEMINI_API_KEY_1 through GEMINI_API_KEY_10
        for (let i = 1; i <= this.MAX_KEYS; i++) {
            const envKey = process.env[`GEMINI_API_KEY_${i}`];

            if (envKey && envKey.length > this.MIN_KEY_LENGTH) {
                loadedKeys.push({
                    key: envKey,
                    requests: 0,
                    successes: 0,
                    errors: 0,
                    consecutiveErrors: 0,
                    lastUsed: 0,
                    responseTimes: [],
                });
            }
        }

        // Shuffle keys to distribute initial load
        this.keys = this.shuffleArray(loadedKeys);

        if (this.keys.length === 0) {
            console.warn('[KeyManager] No valid API keys found. Please set GEMINI_API_KEY_1 through GEMINI_API_KEY_10');
        } else {
            console.log(`[KeyManager] Loaded ${this.keys.length} API key(s)`);
        }
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Check if a key is currently rate limited
     */
    private isRateLimited(status: KeyStatus): boolean {
        if (!status.rateLimitedUntil) return false;
        return Date.now() < status.rateLimitedUntil;
    }

    /**
     * Calculate success rate for a key
     */
    private getSuccessRate(status: KeyStatus): number {
        if (status.requests === 0) return 1.0; // New keys assumed good
        return status.successes / status.requests;
    }

    /**
     * Check if a key is healthy and available for use
     */
    private isHealthy(status: KeyStatus): boolean {
        // Not rate limited
        if (this.isRateLimited(status)) return false;

        // Circuit breaker: too many consecutive errors
        if (status.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) return false;

        // Success rate check (only after minimum requests)
        if (status.requests >= this.MIN_REQUESTS_FOR_RATE) {
            const successRate = this.getSuccessRate(status);
            if (successRate < this.MIN_SUCCESS_RATE) return false;
        }

        return true;
    }

    /**
     * Get health metrics for a key
     */
    getKeyHealth(apiKey: string): KeyHealth | null {
        const status = this.keys.find(k => k.key === apiKey);
        if (!status) return null;

        const avgResponseTime = status.responseTimes.length > 0
            ? status.responseTimes.reduce((a, b) => a + b, 0) / status.responseTimes.length
            : 0;

        return {
            isHealthy: this.isHealthy(status),
            successRate: this.getSuccessRate(status),
            isRateLimited: this.isRateLimited(status),
            averageResponseTime: avgResponseTime,
        };
    }

    /**
     * Get the next available API key using smart selection
     * Prioritizes healthy keys with higher success rates
     */
    getNextKey(): string | null {
        if (this.keys.length === 0) return null;

        // Filter to healthy keys
        const healthyKeys = this.keys.filter(k => this.isHealthy(k));

        if (healthyKeys.length > 0) {
            // Sort by success rate (desc) and lastUsed (asc)
            healthyKeys.sort((a, b) => {
                const rateA = this.getSuccessRate(a);
                const rateB = this.getSuccessRate(b);

                if (Math.abs(rateA - rateB) > 0.1) {
                    return rateB - rateA; // Higher success rate first
                }

                return a.lastUsed - b.lastUsed; // Least recently used first
            });

            const selected = healthyKeys[0];
            selected.lastUsed = Date.now();
            return selected.key;
        }

        // No healthy keys available - attempt recovery
        this.attemptRecovery();

        // Try again after recovery
        const recoveredHealthy = this.keys.filter(k => this.isHealthy(k));
        if (recoveredHealthy.length > 0) {
            const selected = recoveredHealthy[0];
            selected.lastUsed = Date.now();
            return selected.key;
        }

        // Last resort: return least recently used key even if unhealthy
        const leastRecentlyUsed = [...this.keys].sort((a, b) => a.lastUsed - b.lastUsed)[0];
        if (leastRecentlyUsed) {
            leastRecentlyUsed.lastUsed = Date.now();
            console.warn('[KeyManager] All keys unhealthy, using least recently used as fallback');
            return leastRecentlyUsed.key;
        }

        return null;
    }

    /**
     * Mark a key as successfully used
     */
    markSuccess(apiKey: string, responseTime?: number): void {
        const status = this.keys.find(k => k.key === apiKey);
        if (!status) return;

        status.requests++;
        status.successes++;
        status.consecutiveErrors = 0; // Reset on success

        if (responseTime !== undefined) {
            status.responseTimes.push(responseTime);

            // Keep only recent samples
            if (status.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
                status.responseTimes.shift();
            }
        }

        console.log(`[KeyManager] ✓ Key success (rate: ${(this.getSuccessRate(status) * 100).toFixed(1)}%)`);
    }

    /**
     * Mark a key as rate limited with exponential backoff
     */
    markRateLimited(apiKey: string): void {
        const status = this.keys.find(k => k.key === apiKey);
        if (!status) return;

        status.requests++;
        status.errors++;
        status.consecutiveErrors++;
        status.lastError = Date.now();

        // Exponential backoff: 1min, 2min, 4min, 8min, cap at 15min
        const backoffMinutes = Math.min(Math.pow(2, status.consecutiveErrors - 1), 15);
        status.rateLimitedUntil = Date.now() + backoffMinutes * 60 * 1000;

        console.warn(`[KeyManager] ⚠ Key rate limited for ${backoffMinutes} minute(s)`);
    }

    /**
     * Mark a key as having encountered an error
     */
    markError(apiKey: string, errorType: ErrorType): void {
        const status = this.keys.find(k => k.key === apiKey);
        if (!status) return;

        status.requests++;
        status.errors++;
        status.consecutiveErrors++;
        status.lastError = Date.now();

        console.warn(`[KeyManager] ✗ Key error: ${errorType} (consecutive: ${status.consecutiveErrors})`);

        // Auth errors are permanent - mark with very high consecutive errors
        if (errorType === 'auth') {
            status.consecutiveErrors = this.MAX_CONSECUTIVE_ERRORS;
            console.error('[KeyManager] Invalid API key detected - key disabled');
        }
    }

    /**
     * Attempt to recover unhealthy keys
     */
    private attemptRecovery(): void {
        const now = Date.now();
        const GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes

        this.keys.forEach(status => {
            // Clear expired rate limits
            if (status.rateLimitedUntil && now > status.rateLimitedUntil + GRACE_PERIOD) {
                status.rateLimitedUntil = undefined;
                console.log('[KeyManager] ↻ Rate limit expired, key recovered');
            }

            // Gradually reduce consecutive errors for keys that haven't been used recently
            if (status.consecutiveErrors > 0 && status.lastError) {
                const timeSinceError = now - status.lastError;
                const hoursSinceError = timeSinceError / (60 * 60 * 1000);

                if (hoursSinceError > 1) {
                    status.consecutiveErrors = Math.max(0, status.consecutiveErrors - 1);
                }
            }
        });
    }

    /**
     * Emergency reset of all rate limits (use sparingly)
     */
    resetRateLimits(): void {
        this.keys.forEach(status => {
            status.rateLimitedUntil = undefined;
        });
        console.log('[KeyManager] ⚠ All rate limits reset manually');
    }

    /**
     * Get statistics for all keys (for monitoring/debugging)
     */
    getStats() {
        return this.keys.map(status => {
            const health = this.getKeyHealth(status.key);
            return {
                keyPrefix: status.key.substring(0, 10) + '...',
                requests: status.requests,
                successRate: health?.successRate.toFixed(2),
                isHealthy: health?.isHealthy,
                isRateLimited: health?.isRateLimited,
                consecutiveErrors: status.consecutiveErrors,
                avgResponseTime: health?.averageResponseTime.toFixed(0) + 'ms',
            };
        });
    }
}

// Singleton instance
export const keyManager = new GeminiKeyManager();
