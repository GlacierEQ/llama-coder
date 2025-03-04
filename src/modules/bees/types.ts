import * as vscode from 'vscode';

/**
 * Task information for a BuilderBee to execute
 */
export interface BeeTask {
    document: vscode.TextDocument;
    context: vscode.ExtensionContext;
}

/**
 * Result of a BuilderBee execution
 */
export interface BeeResult {
    success: boolean;
    message?: string;
    diagnostics?: vscode.Diagnostic[];
    edits?: vscode.TextEdit[];
}

/**
 * BuilderBee provides automated assistance for specific coding tasks
 */
export interface BuilderBee {
    id: string;
    displayName: string;
    description: string;
    runOnSave: boolean;
    execute: (task: BeeTask) => Promise<BeeResult>;
}
