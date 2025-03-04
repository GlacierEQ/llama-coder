import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info } from '../log';

/**
 * OptimizeBee analyzes and improves code performance
 */
export const optimizeBee: BuilderBee = {
    id: 'optimizeBee',
    displayName: 'Optimize Bee',
    description: 'Analyzes and suggests performance improvements',
    runOnSave: false,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document } = task;
        info(`Optimize Bee optimizing ${document.uri.toString()}`);

        // This would ideally use Llama Coder's model to analyze and suggest optimizations
        // For now, we'll implement some basic optimization checks

        const text = document.getText();
        const langId = document.languageId;
        const diagnostics: vscode.Diagnostic[] = [];

        // Check for inefficient patterns based on language
        if (langId === 'javascript' || langId === 'typescript') {
            // Check for array concatenation in loops
            const arrayConcat = /\.concat\(/g;
            let match: RegExpExecArray | null;

            while ((match = arrayConcat.exec(text)) !== null) {
                if (isInLoop(text, match.index)) {
                    const pos = document.positionAt(match.index);
                    const range = new vscode.Range(pos, pos.translate(0, match[0].length));

                    diagnostics.push({
                        code: 'optimize-array-concat',
                        message: 'Using array.concat() inside a loop may cause performance issues. Consider using push() or a single concat operation outside the loop.',
                        range,
                        severity: vscode.DiagnosticSeverity.Information,
                        source: 'Optimize Bee'
                    });
                }
            }

            // Check for inefficient DOM operations
            if (text.includes('document.getElementById') || text.includes('document.querySelector')) {
                const domPattern = /(document\.getElementById|document\.querySelector)\(/g;
                while ((match = domPattern.exec(text)) !== null) {
                    if (isInLoop(text, match.index)) {
                        const pos = document.positionAt(match.index);
                        const range = new vscode.Range(pos, pos.translate(0, match[0].length));

                        diagnostics.push({
                            code: 'optimize-dom-query',
                            message: 'DOM queries inside loops can be expensive. Consider storing the result in a variable outside the loop.',
                            range,
                            severity: vscode.DiagnosticSeverity.Information,
                            source: 'Optimize Bee'
                        });
                    }
                }
            }
        }

        if (diagnostics.length > 0) {
            return {
                success: true,
                message: `Found ${diagnostics.length} optimization opportunities`,
                diagnostics
            };
        }

        return {
            success: true,
            message: 'No optimization opportunities found'
        };
    }
};

/**
 * Helper to determine if a position is inside a loop
 */
function isInLoop(text: string, position: number): boolean {
    // Simple check: look for for/while/forEach before the position
    const textBeforePosition = text.substring(0, position);
    const lastOpenBrace = textBeforePosition.lastIndexOf('{');
    if (lastOpenBrace === -1) return false;

    const relevantText = textBeforePosition.substring(lastOpenBrace - 40, lastOpenBrace);
    return /\b(for|while|forEach|map|reduce|filter)\b/.test(relevantText);
}
