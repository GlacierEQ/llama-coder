import { warn } from '../log';

/**
 * OutputValidator ensures that model responses don't contain harmful content
 */
export class OutputValidator {
    /**
     * List of patterns that might indicate harmful output
     * Includes potential malware payloads, dangerous code patterns, etc.
     */
    private harmfulPatterns = [
        // Command execution
        /\bexec\s*\(\s*(['"`])rm\s+-rf\s+[^'"]*\1\s*\)/i,
        /\bspawn\s*\(\s*(['"`])rm\s+-rf\s+[^'"]*\1\s*\)/i,
        /\bchild_process\.exec\s*\(\s*(['"`])rm\s+-rf\s+[^'"]*\1\s*\)/i,

        // SQL injection helpers
        /(?:--[^\r\n]*|\/\*[\w\W]*?(?:\*\/|$))/i,
        /(?:UNION ALL SELECT NULL)/i,

        // XSS patterns
        /<script\b[^>]*>.*?<\/script>/gi,
        /<img\b[^>]*\bonerror\s*=/i,

        // Malicious redirects
        /(?:window|self|top|parent)\.location(?:\s*=\s*|\s*\.\s*(?:replace|assign)\s*\(\s*)(['"`])(?:javascript|data):/i,

        // Interactive shell spawning
        /\bspawn\s*\(\s*(['"`])(?:bash|sh|cmd|powershell).*?-i\b[^'"]*\1\s*\)/i
    ];

    /**
     * Validates output against harmful patterns
     */
    public validate(output: string): boolean {
        for (const pattern of this.harmfulPatterns) {
            if (pattern.test(output)) {
                warn(`Potentially harmful output detected with pattern: ${pattern}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Sanitizes output by removing or modifying harmful content
     */
    public sanitize(output: string): string {
        if (!output) return '';

        // Convert dangerous commands
        output = output.replace(
            /\b(rm\s+-rf\s+\/|rm\s+-rf\s+\*|rmdir\s+\/s\s+\/q\s+[A-Za-z]:\\)/gi,
            '[HARMFUL COMMAND REMOVED]'
        );

        // Neutralize shell script symbols
        output = output.replace(/`([^`]*)`/g, (match, cmd) => {
            if (/\brm\b|\bdel\b|\bformat\b/i.test(cmd)) {
                return '`[POTENTIALLY HARMFUL COMMAND]`';
            }
            return match;
        });

        // Replace potentially harmful URLs
        output = output.replace(
            /(https?:\/\/(?:[a-z0-9-]+\.)*[a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^)\s]*)?)/gi,
            (url) => {
                const suspiciousDomains = [
                    'evil.com', 'malware.org', 'hack.net', 'attacker.dev'
                ];
                if (suspiciousDomains.some(domain => url.includes(domain))) {
                    return '[SUSPICIOUS URL REMOVED]';
                }
                return url;
            }
        );

        // Add warning comments around code with imports/requires of suspicious packages
        output = output.replace(
            /((?:import|require)\s*\(\s*['"`][^'"`]*(?:child_process|exec|spawn|eval)['"`]\s*\))/gi,
            '/* WARNING: Security-sensitive code */ $1 /* Use with caution */'
        );

        return output;
    }

    /**
     * Processes output, validating and sanitizing as needed
     */
    public process(output: string): string {
        if (!this.validate(output)) {
            warn('Output contained potentially harmful content - sanitizing');
        }
        return this.sanitize(output);
    }
}

// Singleton instance
export const outputValidator = new OutputValidator();
