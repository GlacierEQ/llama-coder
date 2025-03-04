import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { info, warn } from '../log';

/**
 * Interface for cached completion items
 */
interface CachedCompletion {
    /**
     * The generated completion text
     */
    completion: string;

    /**
     * When this completion was cached
     */
    timestamp: number;

    /**
     * Hash of the prompt that generated this completion
     */
    promptHash: string;

    /**
     * Model used for generation
     */
    model: string;

    /**
     * How many times this cache entry has been hit
     */
    hitCount: number;
}

/**
 * Smart cache for completion results to improve response time and reduce API calls
 */
export class CompletionCache {
    private cache: Map<string, CachedCompletion> = new Map();
    private readonly maxCacheSize: number;
    private readonly cacheTTL: number;

    constructor(
        maxCacheSize: number = 1000,
        cacheTTLInMinutes: number = 60
    ) {
        this.maxCacheSize = maxCacheSize;
        this.cacheTTL = cacheTTLInMinutes * 60 * 1000; // Convert to milliseconds

        // Schedule periodic cleaning
        setInterval(() => this.cleanExpiredEntries(), 5 * 60 * 1000); // Clean every 5 minutes
    }

    /**
     * Generates a hash key for a prompt
     */
    private hashPrompt(prompt: string, model: string, temperature: number): string {
        // Include model and temperature in the hash to differentiate between 
        // same prompts with different parameters
        const data = `${prompt}|${model}|${temperature}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Gets a cached completion if available
     * @returns The cached completion or undefined if not found
     */
    public get(prompt: string, model: string, temperature: number): string | undefined {
        const key = this.hashPrompt(prompt, model, temperature);
        const cachedResult = this.cache.get(key);

        if (!cachedResult) {
            return undefined;
        }

        // Check if the entry has expired
        if (Date.now() - cachedResult.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return undefined;
        }

        // Update hit count
        cachedResult.hitCount++;
        this.cache.set(key, cachedResult);

        info(`Cache hit for prompt: ${prompt.substring(0, 50)}...`);
        return cachedResult.completion;
    }

    /**
     * Stores a completion in the cache
     */
    public set(prompt: string, model: string, temperature: number, completion: string): void {
        const key = this.hashPrompt(prompt, model, temperature);

        this.cache.set(key, {
            completion,
            timestamp: Date.now(),
            promptHash: key,
            model,
            hitCount: 0
        });

        // If cache is too large, remove least frequently used entries
        if (this.cache.size > this.maxCacheSize) {
            this.trimCache();
        }
    }

    /**
     * Clears all entries from the cache
     */
    public clear(): void {
        this.cache.clear();
        info('Completion cache cleared');
    }

    /**
     * Trims the cache to the maximum size by removing the least used entries
     */
    private trimCache(): void {
        if (this.cache.size <= this.maxCacheSize) {
            return;
        }

        // Sort entries by hit count and remove the least used ones
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].hitCount - b[1].hitCount);

        // Remove bottom 20% of entries or at least enough to get under maxCacheSize
        const entriesToRemove = Math.max(
            Math.floor(entries.length * 0.2),
            entries.length - this.maxCacheSize
        );

        for (let i = 0; i < entriesToRemove; i++) {
            this.cache.delete(entries[i][0]);
        }

        info(`Cache trimmed: removed ${entriesToRemove} least used entries`);
    }

    /**
     * Removes expired entries from the cache
     */
    private cleanExpiredEntries(): void {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheTTL) {
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            info(`Cache cleaned: removed ${removedCount} expired entries`);
        }
    }

    /**
     * Get statistics about the cache usage
     */
    public getStats(): Record<string, any> {
        const now = Date.now();
        let totalHits = 0;
        let oldestEntry = now;
        let newestEntry = 0;

        for (const entry of this.cache.values()) {
            totalHits += entry.hitCount;
            oldestEntry = Math.min(oldestEntry, entry.timestamp);
            newestEntry = Math.max(newestEntry, entry.timestamp);
        }

        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            totalHits,
            averageHitsPerEntry: totalHits / Math.max(1, this.cache.size),
            oldestEntryAge: now - oldestEntry,
            newestEntryAge: now - newestEntry
        };
    }
}

// Create singleton instance
export const completionCache = new CompletionCache();
