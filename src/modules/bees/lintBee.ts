import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info, warn } from '../log';

/**
 * LintBee analyzes code for potential errors and style issues
 */
export const lintBee: BuilderBee = {
    id: 'lintBee',
    displayName: 'Lint Bee',
    description: 'Analyzes code for potential errors and style issues',
    runOnSave: true,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document } = task;
        info(`Lint Bee analyzing ${document.uri.toString()}`);

        // Use Llama model to analyze the code for potential issues
        const diagnostics: vscode.Diagnostic[] = [];

        // Check for common issues based on language
        const langId = document.languageId;
        const text = document.getText();

        // Example simple checks (would be expanded)
        if (langId === 'javascript' || langId === 'typescript') {
            // Look for console.log statements
            const consolePattern = /console\.log\(/g;
            let match: RegExpExecArray | null;

            while ((match = consolePattern.exec(text)) !== null) {
                const pos = document.positionAt(match.index);
                const range = new vscode.Range(pos, pos.translate(0, match[0].length));

                diagnostics.push({
                    code: 'lint-bee-console-log',
                    message: 'Consider removing console.log before committing',
                    range,
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'Lint Bee'
                });
            }

            // Look for TODO comments
            const todoPattern = /\/\/\s*TODO/g;
            while ((match = todoPattern.exec(text)) !== null) {
                const pos = document.positionAt(match.index);
                const range = new vscode.Range(pos, pos.translate(0, match[0].length));

                diagnostics.push({
                    code: 'lint-bee-todo',
                    message: 'Unresolved TODO comment',
                    range,
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'Lint Bee'
                });
            }
        }

        if (diagnostics.length > 0) {
            return {
                success: true,
                message: `Found ${diagnostics.length} issues`,
                diagnostics
            };
        }

        return {
            success: true,
            message: 'No issues found'
        };
    }
};
