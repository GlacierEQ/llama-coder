import * as vscode from 'vscode';
import { info, error } from '../log';

/**
 * Feedback types that users can provide
 */
export enum FeedbackType {
    Thumbs_Up = 'thumbs_up',
    Thumbs_Down = 'thumbs_down',
    Inaccurate = 'inaccurate',
    OutOfContext = 'out_of_context',
    NotHelpful = 'not_helpful',
    TooVerbose = 'too_verbose',
    TooSimple = 'too_simple',
    SecurityIssue = 'security_issue',
    Other = 'other'
}

/**
 * Interface for a feedback entry
 */
export interface FeedbackEntry {
    /**
     * Unique ID of the feedback
     */
    id: string;

    /**
     * Type of feedback
     */
    type: FeedbackType;

    /**
     * The prompt that generated the code
     */
    prompt: string;

    /**
     * Generated code that received feedback
     */
    generatedCode: string;

    /**
     * Optional comment from the user
     */
    comment?: string;

    /**
     * Programming language of the code
     */
    language: string;

    /**
     * Model name used for generation
     */
    model: string;

    /**
     * Timestamp when the feedback was submitted
     */
    timestamp: number;

    /**
     * Whether the feedback has been processed
     */
    processed: boolean;

    /**
     * If the user made edits after the completion, this contains those edits
     */
    subsequentEdits?: string;
}

/**
 * Manages collection and submission of user feedback
 */
export class FeedbackManager {
    private feedbackItems: FeedbackEntry[] = [];
    private statusBarItem: vscode.StatusBarItem;
    private context: vscode.ExtensionContext;
    private readonly storageKey = 'llamaCoder.feedbackEntries';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;

        // Create status bar item for the feedback system
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            90
        );
        this.statusBarItem.text = '$(feedback) Feedback';
        this.statusBarItem.tooltip = 'Provide feedback on Llama Coder completions';
        this.statusBarItem.command = 'llama.feedback.showPanel';
        this.statusBarItem.show();

        // Load existing feedback
        this.loadFeedbackItems();

        // Register commands
        this.registerCommands();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.feedback.showPanel', () => {
                this.showFeedbackPanel();
            }),

            vscode.commands.registerCommand('llama.feedback.collect',
                (prompt: string, generatedCode: string, language: string, model: string) => {
                    this.collectFeedback(prompt, generatedCode, language, model);
                }),

            vscode.commands.registerCommand('llama.feedback.quickThumbsUp',
                (prompt: string, generatedCode: string, language: string, model: string) => {
                    this.submitFeedback(
                        FeedbackType.Thumbs_Up,
                        prompt,
                        generatedCode,
                        language,
                        model
                    );
                }),

            vscode.commands.registerCommand('llama.feedback.quickThumbsDown',
                (prompt: string, generatedCode: string, language: string, model: string) => {
                    this.collectDetailedFeedback(
                        prompt,
                        generatedCode,
                        language,
                        model,
                        FeedbackType.Thumbs_Down
                    );
                })
        );
    }

    /**
     * Shows the feedback panel for viewing submitted feedback
     */
    private showFeedbackPanel(): void {
        const panel = vscode.window.createWebviewPanel(
            'llamaCoderFeedback',
            'Llama Coder Feedback',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getFeedbackPanelHtml();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'deleteFeedback':
                    this.deleteFeedback(message.id);
                    panel.webview.html = this.getFeedbackPanelHtml();
                    break;

                case 'submitAllFeedback':
                    this.submitAllFeedback();
                    panel.webview.html = this.getFeedbackPanelHtml();
                    break;

                case 'clearAllFeedback':
                    this.clearAllFeedback();
                    panel.webview.html = this.getFeedbackPanelHtml();
                    break;
            }
        });
    }

    /**
     * Collects quick feedback for a completion
     */
    private collectFeedback(
        prompt: string,
        generatedCode: string,
        language: string,
        model: string
    ): void {
        // Show quick buttons for thumbs up / thumbs down
        vscode.window.showInformationMessage(
            'How was this code completion?',
            '👍 Good',
            '👎 Could be better'
        ).then(selection => {
            if (selection === '👍 Good') {
                this.submitFeedback(
                    FeedbackType.Thumbs_Up,
                    prompt,
                    generatedCode,
                    language,
                    model
                );

                vscode.window.showInformationMessage('Thanks for your feedback!');
            } else if (selection === '👎 Could be better') {
                this.collectDetailedFeedback(prompt, generatedCode, language, model, FeedbackType.Thumbs_Down);
            }
        });
    }

    /**
     * Collects detailed feedback when there are issues
     */
    private async collectDetailedFeedback(
        prompt: string,
        generatedCode: string,
        language: string,
        model: string,
        initialType: FeedbackType = FeedbackType.Other
    ): Promise<void> {
        const feedbackTypes = [
            { label: 'Not accurate', value: FeedbackType.Inaccurate },
            { label: 'Out of context', value: FeedbackType.OutOfContext },
            { label: 'Not helpful', value: FeedbackType.NotHelpful },
            { label: 'Too verbose', value: FeedbackType.TooVerbose },
            { label: 'Too simple', value: FeedbackType.TooSimple },
            { label: 'Security issue', value: FeedbackType.SecurityIssue },
            { label: 'Other', value: FeedbackType.Other }
        ];

        // Ask for the type of issue
        const selectedType = await vscode.window.showQuickPick(
            feedbackTypes.map(type => type.label),
            { placeHolder: 'What was the issue with this completion?' }
        );

        if (!selectedType) {
            return; // User cancelled
        }

        const feedbackType = feedbackTypes.find(type => type.label === selectedType)?.value || initialType;

        // Ask for a comment
        const comment = await vscode.window.showInputBox({
            prompt: 'Any additional comments? (optional)',
            placeHolder: 'Enter your feedback here'
        });

        // Submit the feedback
        this.submitFeedback(
            feedbackType,
            prompt,
            generatedCode,
            language,
            model,
            comment
        );

        vscode.window.showInformationMessage('Thanks for your detailed feedback!');
    }

    /**
     * Submits feedback and stores it
     */
    private submitFeedback(
        type: FeedbackType,
        prompt: string,
        generatedCode: string,
        language: string,
        model: string,
        comment?: string,
    ): void {
        const feedbackEntry: FeedbackEntry = {
            id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            prompt,
            generatedCode,
            language,
            model,
            timestamp: Date.now(),
            processed: false,
            comment
        };

        // Store the feedback
        this.feedbackItems.push(feedbackEntry);
        this.saveFeedbackItems();

        // Try to submit immediately
        this.attemptSubmitFeedback(feedbackEntry);

        info(`Feedback collected: ${type}`);
    }

    /**
     * Attempts to submit feedback to the server
     */
    private async attemptSubmitFeedback(feedbackEntry: FeedbackEntry): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('llama');
            const feedbackEndpoint = config.get<string>('feedback.endpoint', '');

            if (!feedbackEndpoint) {
                // No endpoint configured, just store locally
                return;
            }

            // Submit to the feedback endpoint
            const response = await fetch(feedbackEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackEntry)
            });

            if (response.ok) {
                // Mark as processed
                feedbackEntry.processed = true;
                this.saveFeedbackItems();
                info(`Feedback ${feedbackEntry.id} submitted successfully`);
            } else {
                throw new Error(`Failed to submit feedback: ${response.statusText}`);
            }
        } catch (err) {
            error('Error submitting feedback', err as Error);
            // We'll keep the feedback locally and try again later
        }
    }

    /**
     * Submits all unprocessed feedback items
     */
    private async submitAllFeedback(): Promise<void> {
        const unprocessedItems = this.feedbackItems.filter(item => !item.processed);

        if (unprocessedItems.length === 0) {
            vscode.window.showInformationMessage('No feedback to submit');
            return;
        }

        let successCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Submitting ${unprocessedItems.length} feedback items`,
            cancellable: false
        }, async (progress) => {
            const total = unprocessedItems.length;

            for (let i = 0; i < total; i++) {
                const item = unprocessedItems[i];
                progress.report({
                    message: `Submitting item ${i + 1} of ${total}`,
                    increment: 100 / total
                });

                try {
                    await this.attemptSubmitFeedback(item);
                    if (item.processed) {
                        successCount++;
                    }
                } catch (err) {
                    // Continue with next item
                }
            }
        });

        vscode.window.showInformationMessage(
            `Submitted ${successCount} of ${unprocessedItems.length} feedback items`
        );
    }

    /**
     * Deletes a single feedback item
     */
    private deleteFeedback(id: string): void {
        const initialCount = this.feedbackItems.length;
        this.feedbackItems = this.feedbackItems.filter(item => item.id !== id);

        if (this.feedbackItems.length < initialCount) {
            this.saveFeedbackItems();
            info(`Feedback ${id} deleted`);
        }
    }

    /**
     * Clears all feedback items
     */
    private clearAllFeedback(): void {
        this.feedbackItems = [];
        this.saveFeedbackItems();
        info('All feedback cleared');

        vscode.window.showInformationMessage('All feedback has been cleared');
    }

    /**
     * Loads feedback items from storage
     */
    private loadFeedbackItems(): void {
        try {
            const items = this.context.globalState.get<FeedbackEntry[]>(this.storageKey, []);
            this.feedbackItems = items;
            info(`Loaded ${items.length} feedback items from storage`);
        } catch (err) {
            error('Error loading feedback items', err as Error);
            this.feedbackItems = [];
        }
    }

    /**
     * Saves feedback items to storage
     */
    private saveFeedbackItems(): void {
        try {
            this.context.globalState.update(this.storageKey, this.feedbackItems);
        } catch (err) {
            error('Error saving feedback items', err as Error);
        }
    }

    /**
     * Generates the HTML for the feedback panel
     */
    private getFeedbackPanelHtml(): string {
        const unprocessedCount = this.feedbackItems.filter(item => !item.processed).length;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Llama Coder Feedback</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .feedback-item {
                    border: 1px solid var(--vscode-panel-border);
                    margin-bottom: 15px;
                    padding: 10px;
                    border-radius: 3px;
                }
                .feedback-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .feedback-type {
                    font-weight: bold;
                }
                .feedback-content {
                    margin-top: 10px;
                }
                .feedback-meta {
                    color: var(--vscode-descriptionForeground);
                    font-size: 0.9em;
                    margin-top: 5px;
                }
                .feedback-actions {
                    margin-top: 10px;
                    text-align: right;
                }
                .badge {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8em;
                }
                .thumbs-up { color: green; }
                .thumbs-down { color: red; }
                pre {
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                    overflow: auto;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                .empty-state {
                    text-align: center;
                    padding: 50px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Llama Coder Feedback</h1>
                <div class="actions">
                    ${unprocessedCount > 0 ?
                `<button id="submit-all">Submit All Feedback (${unprocessedCount})</button>` :
                ''}
                    <button id="clear-all">Clear All Feedback</button>
                </div>
            </div>
            
            ${this.feedbackItems.length === 0 ?
                `<div class="empty-state">
                    <h2>No feedback collected yet</h2>
                    <p>Feedback will appear here when you provide it for code completions.</p>
                </div>` :
                this.renderFeedbackItems()}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('clear-all')?.addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all feedback?')) {
                        vscode.postMessage({
                            command: 'clearAllFeedback'
                        });
                    }
                });
                
                ${unprocessedCount > 0 ?
                `document.getElementById('submit-all').addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'submitAllFeedback'
                        });
                    });` :
                ''}
                
                document.querySelectorAll('.delete-feedback').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.id;
                        if (confirm('Delete this feedback item?')) {
                            vscode.postMessage({
                                command: 'deleteFeedback',
                                id
                            });
                        }
                    });
                });
            </script>
        </body>
        </html>`;
    }

    /**
     * Renders the HTML for feedback items
     */
    private renderFeedbackItems(): string {
        // Sort by timestamp, most recent first
        const sortedItems = [...this.feedbackItems].sort((a, b) => b.timestamp - a.timestamp);

        return sortedItems.map(item => {
            const date = new Date(item.timestamp).toLocaleString();
            const typeLabel = this.getFeedbackTypeLabel(item.type);
            const typeIcon = item.type === FeedbackType.Thumbs_Up ?
                '<span class="thumbs-up">👍</span>' :
                item.type === FeedbackType.Thumbs_Down ?
                    '<span class="thumbs-down">👎</span>' : '';

            return `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div class="feedback-type">${typeIcon} ${typeLabel}</div>
                    <div>
                        <span class="badge">${item.language}</span>
                        ${item.processed ? '<span class="badge">Submitted</span>' : '<span class="badge">Pending</span>'}
                    </div>
                </div>
                
                ${item.comment ? `<div class="feedback-comment">"${item.comment}"</div>` : ''}
                
                <div class="feedback-meta">
                    <div>Model: ${item.model}</div>
                    <div>Date: ${date}</div>
                </div>
                
                <div class="feedback-actions">
                    <button class="delete-feedback" data-id="${item.id}">Delete</button>
                </div>
            </div>`;
        }).join('');
    }

    /**
     * Gets a human-readable label for a feedback type
     */
    private getFeedbackTypeLabel(type: FeedbackType): string {
        switch (type) {
            case FeedbackType.Thumbs_Up: return 'Positive Feedback';
            case FeedbackType.Thumbs_Down: return 'Needs Improvement';
            case FeedbackType.Inaccurate: return 'Inaccurate';
            case FeedbackType.OutOfContext: return 'Out of Context';
            case FeedbackType.NotHelpful: return 'Not Helpful';
            case FeedbackType.TooVerbose: return 'Too Verbose';
            case FeedbackType.TooSimple: return 'Too Simple';
            case FeedbackType.SecurityIssue: return 'Security Issue';
            case FeedbackType.Other: return 'Other Issue';
            default: return 'Unknown';
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

// Export a function to create the manager
export function createFeedbackManager(context: vscode.ExtensionContext): FeedbackManager {
    return new FeedbackManager(context);
}
