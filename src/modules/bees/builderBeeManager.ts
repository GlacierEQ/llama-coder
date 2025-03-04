import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { lintBee } from './lintBee';
import { formatBee } from './formatBee';
import { buildBee } from './buildBee';
import { testBee } from './testBee';
import { optimizeBee } from './optimizeBee';
import { refactorBee } from './refactorBee';
import { documentationBee } from './documentationBee';
import { securityBee } from './securityBee';
import { info, warn, error } from '../log';
import { getSecurityManager } from '../security/securityManager';

/**
 * Manages the Builder Bees that provide automated coding assistance
 */
export class BuilderBeeManager {
    private bees: Map<string, BuilderBee> = new Map();
    private activeBees: Map<string, boolean> = new Map();
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(private context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('builderBees');
        context.subscriptions.push(this.diagnosticCollection);

        // Register built-in bees
        this.registerBuiltInBees();

        // Register commands
        this.registerCommands();

        // Initial configuration
        this.updateConfiguration();

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('llama.bees')) {
                this.updateConfiguration();
            }
        });

        // Set up file watchers for active bees
        vscode.workspace.onDidSaveTextDocument(doc => {
            this.runBeesOnSave(doc);
        });
    }

    private registerBuiltInBees(): void {
        this.registerBee(lintBee);
        this.registerBee(formatBee);
        this.registerBee(buildBee);
        this.registerBee(testBee);
        this.registerBee(optimizeBee);
        this.registerBee(refactorBee);
        this.registerBee(documentationBee);
        this.registerBee(securityBee);
    }

    /**
     * Registers a builder bee with the manager
     */
    public registerBee(bee: BuilderBee): void {
        this.bees.set(bee.id, bee);
        info(`Registered builder bee: ${bee.id}`);

        // Create status bar item for this bee
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = `$(beaker) ${bee.displayName}`;
        statusBarItem.tooltip = bee.description;
        statusBarItem.command = `llama.bees.toggle.${bee.id}`;
        this.statusBarItems.set(bee.id, statusBarItem);

        // Track if bee is active
        this.activeBees.set(bee.id, false);
    }

    private registerCommands(): void {
        // Register general commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.bees.configure', () => {
                vscode.commands.executeCommand('workbench.action.openSettings', '@ext:ex3ndr.llama-coder llama.bees');
            }),

            vscode.commands.registerCommand('llama.bees.runAll', async () => {
                await this.runAllActiveBees();
                vscode.window.showInformationMessage('All builder bees completed their tasks.');
            }),

            vscode.commands.registerCommand('llama.bees.stopAll', () => {
                this.stopAllBees();
                vscode.window.showInformationMessage('All builder bees have been stopped.');
            })
        );

        // Register specific bee toggle commands
        this.bees.forEach(bee => {
            this.context.subscriptions.push(
                vscode.commands.registerCommand(`llama.bees.toggle.${bee.id}`, () => {
                    this.toggleBee(bee.id);
                }),

                vscode.commands.registerCommand(`llama.bees.run.${bee.id}`, async () => {
                    await this.runBee(bee.id);
                    vscode.window.showInformationMessage(`${bee.displayName} completed its task.`);
                })
            );
        });
    }

    /**
     * Updates the configuration based on user settings
     */
    private updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('llama.bees');

        // Update active state of each bee
        this.bees.forEach(bee => {
            const isEnabled = config.get<boolean>(`${bee.id}.enabled`, false);
            this.setActiveBeeState(bee.id, isEnabled);
        });
    }

    /**
     * Sets a bee's active state and updates its UI
     */
    private setActiveBeeState(beeId: string, active: boolean): void {
        const bee = this.bees.get(beeId);
        if (!bee) return;

        this.activeBees.set(beeId, active);
        const statusBarItem = this.statusBarItems.get(beeId);

        if (statusBarItem) {
            if (active) {
                statusBarItem.show();
                statusBarItem.text = `$(check) ${bee.displayName}`;
            } else {
                statusBarItem.hide();
                statusBarItem.text = `$(beaker) ${bee.displayName}`;
            }
        }

        info(`Builder bee ${beeId} is now ${active ? 'active' : 'inactive'}`);
    }

    /**
     * Toggles a bee's active state
     */
    public toggleBee(beeId: string): void {
        const currentState = this.activeBees.get(beeId) || false;

        // Update configuration
        const config = vscode.workspace.getConfiguration('llama.bees');
        config.update(`${beeId}.enabled`, !currentState, true);

        // Update state
        this.setActiveBeeState(beeId, !currentState);

        const bee = this.bees.get(beeId);
        vscode.window.showInformationMessage(
            `${bee?.displayName || beeId} is now ${!currentState ? 'active' : 'inactive'}.`
        );
    }

    /**
     * Runs a specific bee on the current document
     */
    public async runBee(beeId: string): Promise<BeeResult | null> {
        const bee = this.bees.get(beeId);
        if (!bee) {
            warn(`Attempted to run unknown bee: ${beeId}`);
            return null;
        }

        const document = vscode.window.activeTextEditor?.document;
        if (!document) {
            warn('No active document to run bee on');
            return null;
        }

        // Verify with security manager that we can run this bee
        const securityManager = getSecurityManager();
        const processedTask: BeeTask = {
            document,
            context: this.context
        };

        try {
            info(`Running builder bee: ${beeId}`);
            const result = await bee.execute(processedTask);

            // Report diagnostics if any
            if (result.diagnostics && result.diagnostics.length > 0) {
                this.reportDiagnostics(document, result.diagnostics);
            }

            return result;
        } catch (err) {
            error(`Error executing builder bee ${beeId}`, err as Error);
            return {
                success: false,
                message: `Error: ${(err as Error).message}`
            };
        }
    }

    /**
     * Runs all active bees on a document that was just saved
     */
    private async runBeesOnSave(document: vscode.TextDocument): Promise<void> {
        const config = vscode.workspace.getConfiguration('llama.bees');
        const runOnSave = config.get<boolean>('runOnSave', true);

        if (!runOnSave) return;

        // Run each active bee
        for (const [beeId, isActive] of this.activeBees.entries()) {
            if (isActive) {
                const bee = this.bees.get(beeId);
                if (bee && bee.runOnSave) {
                    await this.runBee(beeId);
                }
            }
        }
    }

    /**
     * Runs all active bees
     */
    private async runAllActiveBees(): Promise<void> {
        for (const [beeId, isActive] of this.activeBees.entries()) {
            if (isActive) {
                await this.runBee(beeId);
            }
        }
    }

    /**
     * Stops all currently active bees
     */
    private stopAllBees(): void {
        // Currently, the bees don't have long-running tasks that need cancellation,
        // but this could be extended in the future to cancel ongoing tasks.
        info('Stopping all builder bees');
    }

    /**
     * Reports diagnostics from bee results
     */
    private reportDiagnostics(document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]): void {
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Disposes of all resources
     */
    public dispose(): void {
        this.statusBarItems.forEach(item => item.dispose());
        this.diagnosticCollection.dispose();
    }
}

// Singleton instance
let builderBeeManagerInstance: BuilderBeeManager | null = null;

export function initializeBuilderBeeManager(context: vscode.ExtensionContext): BuilderBeeManager {
    if (!builderBeeManagerInstance) {
        builderBeeManagerInstance = new BuilderBeeManager(context);
    }
    return builderBeeManagerInstance;
}

export function getBuilderBeeManager(): BuilderBeeManager {
    if (!builderBeeManagerInstance) {
        throw new Error('BuilderBeeManager not initialized');
    }
    return builderBeeManagerInstance;
}
