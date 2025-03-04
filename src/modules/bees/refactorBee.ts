import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info, warn } from '../log';

/**
 * RefactorBee suggests and applies code refactoring
 */
export const refactorBee: BuilderBee = {
    id: 'refactorBee',
    displayName: 'Refactor Bee',
    description: 'Suggests code refactoring opportunities',
    runOnSave: false,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document } = task;
        info(`Refactor Bee analyzing ${document.uri.toString()}`);

        const text = document.getText();
        const diagnostics: vscode.Diagnostic[] = [];

        // Analyze code for potential refactoring opportunities
        if (document.languageId === 'javascript' || document.languageId === 'typescript') {
            // Look for long methods (more than 30 lines)
            const methodRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s*)?\([^)]*\)\s*=>|class\s+\w+\s*{[^}]*?(?:constructor|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{)/g;
            const methods: { start: number, end: number, lines: number }[] = [];

            // Extract method ranges
            let match;
            while ((match = methodRegex.exec(text)) !== null) {
                const start = match.index;
                const openBraces = findMatchingBrace(text, start);

                if (openBraces !== -1) {
                    const methodText = text.substring(start, openBraces + 1);
                    const lineCount = (methodText.match(/\n/g) || []).length;

                    methods.push({
                        start,
                        end: openBraces,
                        lines: lineCount
                    });

                    // Add diagnostic for long methods
                    if (lineCount > 30) {
                        const startPos = document.positionAt(start);
                        const endPos = document.positionAt(start + match[0].length);
                        const range = new vscode.Range(startPos, endPos);

                        diagnostics.push({
                            code: 'refactor-long-method',
                            message: `Long method detected (${lineCount} lines). Consider breaking it into smaller functions.`,
                            range,
                            severity: vscode.DiagnosticSeverity.Information,
                            source: 'Refactor Bee'
                        });
                    }
                }
            }

            // Look for duplicate code segments (simplified approach)
            const lines = text.split('\n');
            const lineSignatures = new Map<string, number[]>();

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length > 20) {  // Only check non-trivial lines
                    const signature = line.replace(/\s+/g, ' ');
                    if (!lineSignatures.has(signature)) {
                        lineSignatures.set(signature, []);
                    }
                    lineSignatures.get(signature)!.push(i);
                }
            }

            // Check for duplicated sequences
            lineSignatures.forEach((lineNumbers, signature) => {
                if (lineNumbers.length > 2) {  // Found in more than 2 places
                    for (const lineNumber of lineNumbers) {
                        const range = new vscode.Range(lineNumber, 0, lineNumber, lines[lineNumber].length);

                        diagnostics.push({
                            code: 'refactor-duplicate-code',
                            message: 'Duplicate code detected. Consider extracting to a reusable function.',
                            range,
                            severity: vscode.DiagnosticSeverity.Information,
                            source: 'Refactor Bee'
                        });
                    }
                }
            });
        }

        return {
            success: true,
            message: diagnostics.length > 0
                ? `Found ${diagnostics.length} refactoring opportunities`
                : 'No refactoring opportunities found',
            diagnostics
        };
    }
};

/**
 * Finds the position of the matching closing brace
 */
function findMatchingBrace(text: string, start: number): number {
    const openingChar = text.charAt(start);
    let targetChar: string;

    if (text.indexOf('{', start) === -1) {
        return -1;  // No opening brace found
    }

    // Find first opening brace after start position
    let bracePos = text.indexOf('{', start);
    targetChar = '}';

    let depth = 1;
    for (let i = bracePos + 1; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === '{') depth++;
        else if (char === targetChar) {
            depth--;
            if (depth === 0) return i;
        }
    }

    return -1;  // No matching brace found
}
