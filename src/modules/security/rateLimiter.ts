import { info, warn } from '../log';

interface RateLimitConfig {
    maxRequestsPerMinute: number;
    cooldownPeriod: number; // milliseconds
    maxBurstRequests: number;
}

export class RateLimiter {
    private requestCounter = 0;
    private requestTimestamps: number[] = [];
    private isInCooldown = false;
    private cooldownTimeout: NodeJS.Timeout | null = null;

    constructor(private config: RateLimitConfig = {
        maxRequestsPerMinute: 60,
        cooldownPeriod: 30000, // 30 seconds
        maxBurstRequests: 20
    }) { }

    /**
     * Checks if a request should be allowed based on rate limits
     * @returns boolean indicating if request is allowed
     */
    public requestAllowed(): boolean {
        const now = Date.now();

        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        // If in cooldown, reject the request
        if (this.isInCooldown) {
            warn('Request rejected: rate limiter in cooldown period');
            return false;
        }

        // Check if max requests per minute exceeded
        if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
            warn('Request rejected: exceeded rate limit');
            this.enterCooldown();
            return false;
        }

        // Check burst limit (many requests in a short time)
        const last10Sec = this.requestTimestamps.filter(
            timestamp => now - timestamp < 10000
        );
        if (last10Sec.length > this.config.maxBurstRequests) {
            warn('Request rejected: exceeded burst limit');
            this.enterCooldown();
            return false;
        }

        // Request is allowed, record timestamp
        this.requestTimestamps.push(now);
        this.requestCounter++;
        return true;
    }

    private enterCooldown(): void {
        this.isInCooldown = true;
        info(`Entering rate limit cooldown for ${this.config.cooldownPeriod}ms`);

        if (this.cooldownTimeout) {
            clearTimeout(this.cooldownTimeout);
        }

        this.cooldownTimeout = setTimeout(() => {
            this.isInCooldown = false;
            this.cooldownTimeout = null;
            info('Rate limit cooldown period ended');
        }, this.config.cooldownPeriod);
    }

    public getUsageStatistics(): Record<string, any> {
        const now = Date.now();
        return {
            totalRequests: this.requestCounter,
            requestsLastMinute: this.requestTimestamps.length,
            requestsLast10Seconds: this.requestTimestamps.filter(ts => now - ts < 10000).length,
            inCooldown: this.isInCooldown,
            cooldownRemaining: this.isInCooldown && this.cooldownTimeout ?
                this.config.cooldownPeriod - (now - Math.min(...this.requestTimestamps)) : 0
        };
    }

    public resetCounters(): void {
        this.requestTimestamps = [];
        if (this.cooldownTimeout) {
            clearTimeout(this.cooldownTimeout);
            this.cooldownTimeout = null;
        }
        this.isInCooldown = false;
        info('Rate limiter counters reset');
    }
}

// Singleton instance for application-wide use
export const globalRateLimiter = new RateLimiter();
