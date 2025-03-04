import * as vscode from 'vscode';

/**
 * Review severity levels
 */
export type ReviewSeverity = 'error' | 'warning' | 'info';

/**
 * Represents a code issue detected in a review
 */
export interface ReviewItem {
    /**
     * Unique identifier for the review item
     */
    id: string;

    /**
     * URI of the file where the issue was found
     */
    fileUri: vscode.Uri;

    /**
     * Description of the issue
     */
    message: string;

    /**
     * Range in the file where the issue is located
     */
    range: vscode.Range;

    /**
     * Severity of the issue
     */
    severity: ReviewSeverity;

    /**
     * Issue code (e.g. "unused-variable")
     */
    code?: string;

    /**
     * Suggested fix for the issue
     */
    suggestedFix?: string;
}

/**
 * Represents a complete code review
 */
export interface Review {
    /**
     * Unique identifier for the review
     */
    id: string;

    /**
     * URI of the main file or folder being reviewed
     */
    uri: vscode.Uri;

    /**
     * Display name for the review
     */
    name: string;

    /**
     * Programming language being reviewed
     */
    language: string;

    /**
     * Collection of review items
     */
    items: ReviewItem[];

    /**
     * Timestamp when the review was started
     */
    startedAt: Date;

    /**
     * Timestamp when the review was completed
     */
    completedAt?: Date;

    /**
     * Whether the review is completed
     */
    completed: boolean;
}

/**
 * Creates a new review object
 */
export function createReview(uri: vscode.Uri, name: string, language: string): Review {
    return {
        id: `review-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uri,
        name,
        language,
        items: [],
        startedAt: new Date(),
        completed: false
    };
}
