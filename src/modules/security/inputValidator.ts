import { warn } from '../log';

/**
 * Validates and sanitizes input to protect against prompt injection and other security issues
 */
export class InputValidator {
    // List of patterns that might indicate malicious input
    private suspiciousPatterns = [
        /ignore previous instructions/i,
        /disregard all previous commands/i,
        /override security protocols/i,
        /system:prompt:/i,
        /\<\!--.*?--\>/g,  // HTML comments that might be used for injection
        /\[\[\s*system\s*\]\]/i,  // System prompt marker patterns
    ];

    // Maximum allowed input length to prevent resource exhaustion
    private maxInputLength = 10000;

    /**
     * Validates input against security rules
     * Returns true if input is safe
     */
    public validate(input: string): boolean {
        // Check for length limits
        if (input.length > this.maxInputLength) {
            warn(`Input rejected: exceeds maximum length of ${this.maxInputLength} characters`);
            return false;
        }

        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(input)) {
                warn(`Input rejected: contains suspicious pattern ${pattern}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitizes input by removing or escaping potentially problematic content
     */
    public sanitize(input: string): string {
        // Limit length
        input = input.slice(0, this.maxInputLength);

        // Remove HTML/XML tags that might be used for injection
        input = input.replace(/<(script|iframe|object|embed|style)\b[^>]*>.*?<\/\1>/gi, '[REMOVED]');

        // Escape system command markers commonly used in prompts
        input = input.replace(/\[\[\s*system\s*\]\]/gi, '\\[\\[system\\]\\]');

        // Normalize whitespace
        input = input.replace(/\s+/g, ' ');

        // Remove zero-width spaces and other invisible characters often used in attacks
        input = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

        return input;
    }

    /**
     * Processes input performing both validation and sanitization
     * Returns the sanitized input if valid, null if invalid
     */
    public process(input: string): string | null {
        if (!this.validate(input)) {
            return null;
        }
        return this.sanitize(input);
    }
}

// Singleton instance
export const inputValidator = new InputValidator();
