import * as vscode from 'vscode';
import { getOllamaCompletion } from '../ollama/completion';
import { info, error } from '../log';

/**
 * Code quality issue severity
 */
export enum QualitySeverity {
    High = 'high',
    Medium = 'medium',
    Low = 'low',
    Info = 'info'
}

/**
 * Code quality issue categories
 */
export enum QualityCategory {
    Performance = 'performance',
    Security = 'security',
    Maintainability = 'maintainability',
    Readability = 'readability',
    BestPractices = 'bestPractices',
    Reliability = 'reliability',
    Complexity = 'complexity',
    Design = 'design'
}

/**
 * Represents a code quality issue
 */
export interface QualityIssue {
    /**
     * Line number where the issue occurs
     */
    line: number;

    /**
     * Column number where the issue starts
     */
    column: number;

    /**
     * End line (if the issue spans multiple lines)
     */
    endLine?: number;

    /**
     * End column
     */
    endColumn?: number;

    /**
     * Description of the issue
     */
    message: string;

    /**
     * Issue severity
     */
    severity: QualitySeverity;

    /**
     * Issue category
     */
    category: QualityCategory;

    /**
     * Suggestion for how to fix the issue
     */
    suggestion?: string;

    /**
     * Code that would implement the suggestion
     */
    fixCode?: string;
}

/**
 * Result of a code quality analysis
 */
export interface QualityAnalysisResult {
    /**
     * Issues found in the code
     */
    issues: QualityIssue[];

    /**
     * Overall quality score (0-100)
     */
    score: number;

    /**
     * Summary of the quality analysis
     */
    summary: string;
}

/**
 * AI-powered code quality analyzer that goes beyond traditional linters
 */
export class CodeQualityAnalyzer {
    /**
     * Performs a deep quality analysis of code using AI
     */
    public static async analyze(
        document: vscode.TextDocument,
        cancellationToken?: vscode.CancellationToken
    ): Promise<QualityAnalysisResult> {
        try {
            // Load configuration
            const config = vscode.workspace.getConfiguration('llama');
            const ollamaEndpoint = config.get<string>('inference.endpoint', '');
            const bearerToken = config.get<string>('inference.bearerToken', '');
            const modelConfig = config.get<string>('inference.model', 'stable-code:3b-code-q4_0');

            // Get document content
            const text = document.getText();
            const languageId = document.languageId;

            if