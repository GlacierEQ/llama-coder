import * as vscode from 'vscode';
import { globalRateLimiter, RateLimiter } from './rateLimiter';
import { inputValidator, InputValidator } from './inputValidator';
import { outputValidator, OutputValidator } from './outputValidator';
import { info, warn, error } from '../log';

/**
 * SecurityManager coordinates all security features in Llama Coder
 */
export class SecurityManager {
    private rateLimiter: RateLimiter;
    private inputValidator: InputValidator;
    private outputValidator: OutputValidator;
    private securityEnabled = true;

    constructor(private context: vscode.ExtensionContext) {
        this.rateLimiter = globalRateLimiter;
        this.inputValidator = inputValidator;
        this.outputValidator = outputValidator;

        // Register commands
        this.registerCommands();

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('security')) {
                this.updateSecuritySettings();
            }
        });

        this.updateSecuritySettings();
        info('Security Manager initialized');
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.securityConfig', () => {
                vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    '@ext:ex3ndr.llama-coder security'
                );
            }),
            vscode.commands.registerCommand('llama.resetRateLimits', () => {
                this.rateLimiter.resetCounters();
                vscode.window.showInformationMessage('Rate limits have been reset.');
            })
        );
    }

    private updateSecuritySettings() {
        const config = vscode.workspace.getConfiguration();

        // Update rate limiter settings
        const rateLimitEnabled = config.get<boolean>('security.rateLimit.enabled', true);
        const maxRequestsPerMinute = config.get<number>('security.rateLimit.maxRequestsPerMinute', 60);

        // Update input validation settings
        const validationEnabled = config.get<boolean>('security.inputValidation.enabled', true);

        // Update encryption requirements
        const requireEncryption = config.get<boolean>('security.requireEncryption', true);

        this.securityEnabled = rateLimitEnabled || validationEnabled;

        info('Security settings updated', {
            rateLimitEnabled,
            maxRequestsPerMinute,
            validationEnabled,
            requireEncryption
        });
    }

    /**
     * Process input through all security filters
     * @returns Processed input or null if rejected
     */
    public processInput(input: string): string | null {
        if (!this.securityEnabled) {
            return input;
        }

        // Check rate limits first
        if (!this.rateLimiter.requestAllowed()) {
            vscode.window.showWarningMessage(
                'Rate limit exceeded. Please wait before sending more requests.'
            );
            return null;
        }

        // Then validate and sanitize input
        return this.inputValidator.process(input);
    }

    /**
     * Process output through security filters
     */
    public processOutput(output: string): string {
        if (!this.securityEnabled) {
            return output;
        }

        return this.outputValidator.sanitize(output);
    }

    /**
     * Validate that the endpoint meets security requirements
     */
    public validateEndpoint(endpoint: string): boolean {
        const config = vscode.workspace.getConfiguration();
        const requireEncryption = config.get<boolean>('security.requireEncryption', true);

        if (!requireEncryption) {
            return true;
        }

        // If encryption is required, ensure HTTPS is used for remote endpoints
        if (endpoint && !endpoint.startsWith('https://') && !isLocalhost(endpoint)) {
            warn(`Insecure endpoint rejected: ${endpoint}`);
            vscode.window.showErrorMessage(
                'Remote endpoints must use HTTPS encryption. Please update your endpoint configuration.'
            );
            return false;
        }

        return true;
    }

    /**
     * Get security status information
     */
    public getSecurityStatus(): Record<string, any> {
        return {
            securityEnabled: this.securityEnabled,
            rateLimiter: this.rateLimiter.getUsageStatistics(),
            inputValidationActive: this.inputValidator ? true : false,
            outputValidationActive: this.outputValidator ? true : false
        };
    }
}

/**
 * Checks if an endpoint refers to localhost
 */
function isLocalhost(url: string): boolean {
    if (!url) return true; // Empty endpoint is considered localhost

    const localhostPatterns = [
        /^https?:\/\/localhost\b/i,
        /^https?:\/\/127\.0\.0\.1\b/i,
        /^https?:\/\/0\.0\.0\.0\b/i,
        /^https?:\/\/\[::1\]\b/i,
        /^http:\/\/host\.docker\.internal\b/i
    ];

    return localhostPatterns.some(pattern => pattern.test(url));
}

// Create and export a singleton instance for use throughout the extension
let securityManagerInstance: SecurityManager | null = null;

export function initializeSecurityManager(context: vscode.ExtensionContext): SecurityManager {
    if (!securityManagerInstance) {
        securityManagerInstance = new SecurityManager(context);
    }
    return securityManagerInstance;
}

export function getSecurityManager(): SecurityManager {
    if (!securityManagerInstance) {
        throw new Error('Security Manager not initialized');
    }
    return securityManagerInstance;
}
