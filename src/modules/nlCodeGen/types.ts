/**
 * Options for code generation
 */
export interface CodeGenerationOptions {
    /**
     * Target programming language for the generated code
     */
    language: string;

    /**
     * Whether to include the context from the current editor
     */
    includeEditorContext?: boolean;

    /**
     * Prompt template to use for generation
     */
    modelTemplate?: 'standard' | 'detailed' | 'concise' | 'optimized';
}

/**
 * Result of a code generation operation
 */
export interface GeneratedCodeResult {
    /**
     * Whether the generation was successful
     */
    success: boolean;

    /**
     * The generated code (if successful)
     */
    code?: string;

    /**
     * The language of the generated code (if successful)
     */
    language?: string;

    /**
     * The description that was used for generation (if successful)
     */
    description?: string;

    /**
     * Error message (if unsuccessful)
     */
    error?: string;
}

/**
 * History item for a generated code snippet
 */
export interface HistoryItem {
    /**
     * The description that was used for generation
     */
    description: string;

    /**
     * The generated code
     */
    code: string;

    /**
     * The language of the generated code
     */
    language: string;

    /**
     * Timestamp when the code was generated
     */
    timestamp: string;
}
