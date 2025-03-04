import * as vscode from 'vscode';
import { info, error } from '../log';
import { ReviewSeverity } from './reviewTypes';

/**
 * Represents a potential code issue
 */
export interface CodeIssue {
    line: number;
    character: number;
    length?: number;
    message: string;
    severity: ReviewSeverity;
    code?: string;
}

/**
 * Results of code analysis
 */
export interface CodeAnalysisResult {
    issues: CodeIssue[];
}

/**
 * Analyzes code for potential issues
 */
export async function analyzeCode(
    document: vscode.TextDocument,
    cancellationToken?: vscode.CancellationToken
): Promise<CodeAnalysisResult> {
    const language = document.languageId;
    const content = document.getText();
    const issues: CodeIssue[] = [];

    info(`Analyzing ${document.uri.toString()} (${language})`);

    try {
        // First, use quick static analysis for common issues
        await performStaticAnalysis(document, issues);

        if (cancellationToken?.isCancellationRequested) {
            return { issues };
        }

        // Use Llama model for deeper analysis
        await performModelAnalysis(document, issues, cancellationToken);

        return { issues };
    } catch (err) {
        error('Error analyzing code', err as Error);
        return { issues };
    }
}

/**
 * Performs quick static analysis without using the AI model
 */
async function performStaticAnalysis(
    document: vscode.TextDocument,
    issues: CodeIssue[]
): Promise<void> {
    const text = document.getText();
    const lines = text.split('\n');

    // Common patterns to check across languages
    const commonPatterns = [
        // Check for TODOs
        {
            pattern: /\bTODO\b/,
            message: "TODO comment found",
            severity: 'info' as ReviewSeverity,
            code: 'todo-comment'
        },
        // Check for FIXMEs
        {
            pattern: /\bFIXME\b/,
            message: "FIXME comment found",
            severity: 'warning' as ReviewSeverity,
            code: 'fixme-comment'
        },
        // Check for console.log (in JS/TS)
        {
            pattern: /console\.log\(/,
            message: "Console logging statement found",
            severity: 'info' as ReviewSeverity,
            code: 'console-log',
            languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
        },
        // Check for debugger statements
        {
            pattern: /\bdebugger\b/,
            message: "Debugger statement found",
            severity: 'warning' as ReviewSeverity,
            code: 'debugger-statement',
            languages: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
        },
        // Check for commented out code (simple heuristic)
        {
            pattern: /^\s*\/\/\s*[a-zA-Z0-9]+\s*\([^)]*\)/,
            message: "Possible commented out code found",
            severity: 'info' as ReviewSeverity,
            code: 'commented-code',
            languages