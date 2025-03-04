import * as vscode from 'vscode';
import * as path from 'path';
import { info, warn, error } from '../log';
import { getSecurityManager } from '../security/securityManager';
import { createReview, Review, ReviewItem, ReviewSeverity } from './reviewTypes';
import { analyzeCode } from './codeAnalyzer';
import { generateReviewComment } from './commentGenerator';
import { ReviewSummaryProvider } from './reviewSummaryProvider';

/**
 * Manages code reviews across the workspace
 */
export class CodeReviewManager {
    private pendingReviews: Map<string, Review> = new Map();
    private activeReviews: Map<string, Review> = new Map();
    private reviewsInProgress: boolean = false;
    private reviewSummaryProvider: ReviewSummaryProvider;
    private reviewDecorations: Map<string, vscode.TextEditorDecorationType[]> = new Map();
    private statusBarItem: vscode.StatusBarItem;
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(private context: vscode.ExtensionContext) {
        this.reviewSummaryProvider = new ReviewSummaryProvider(context.extensionUri);

        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            90
        );
        this.statusBarItem.text = "$(telescope) Code Review";
        this.statusBarItem.command = "llama.codeReview.showPanel";
        this.statusBarItem.show();

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('llamaCodeReview');

        this.registerCommands();
        this.registerListeners();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.codeReview.reviewFile', async () => {
                await this.reviewActiveFile();
            }),

            vscode.commands.registerCommand('llama.codeReview.reviewWorkspace', async () => {
                await this.reviewWorkspace();
            }),

            vscode.commands.registerCommand('llama.codeReview.reviewChanges', async () => {
                await this.reviewGitChanges();
            }),

            vscode.commands.registerCommand('llama.codeReview.clearReviews', () => {
                this.clearAllReviews();
            }),

            vscode.commands.registerCommand('llama.codeReview.showPanel', () => {
                this.reviewSummaryProvider.show();
            }),

            vscode.commands.registerCommand('llama.codeReview.applyFix', async (uri: string, range: vscode.Range, fix: string) => {
                await this.applyFix(uri, range, fix);
            })
        );
    }

    private registerListeners(): void {
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.updateDecorations(editor);
            }
        });

        vscode.workspace.onDidSaveTextDocument(document => {
            // Optional: Auto-review on save if configured
            const config = vscode.workspace.getConfiguration('llama.codeReview');
            if (config.get<boolean>('reviewOnSave', false)) {
                this.reviewFile(document.uri);
            }
        });
    }

    /**
     * Reviews the currently active file
     */
    public async reviewActiveFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active file to review');
            return;
        }

        await this.reviewFile(editor.document.uri);
    }

    /**
     * Reviews a specific file
     */
    public async reviewFile(uri: vscode.Uri): Promise<Review | null> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);

            // Check file size limit
            const config = vscode.workspace.getConfiguration('llama.codeReview');
            const maxSizeKB = config.get<number>('maxFileSizeKB', 200);
            const contentSizeKB = document.getText().length / 1024;

            if (contentSizeKB > maxSizeKB) {
                vscode.window.showWarningMessage(
                    `File exceeds maximum size limit (${Math.round(contentSizeKB)}KB > ${maxSizeKB}KB)`
                );
                return null;
            }

            info(`Starting code review for ${uri.fsPath}`);
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Reviewing ${path.basename(uri.fsPath)}`,
                cancellable: true
            }, async (progress, token) => {
                // Create a new review
                const reviewId = uri.toString();
                const review = createReview(uri, path.basename(uri.fsPath), document.languageId);
                this.pendingReviews.set(reviewId, review);

                progress.report({ increment: 10, message: "Analyzing code..." });

                // Analyze code
                const analysisResult = await analyzeCode(document, token);
                if (token.isCancellationRequested) {
                    this.pendingReviews.delete(reviewId);
                    return;
                }

                progress.report({ increment: 40, message: "Generating review insights..." });

                // Generate review items
                for (const issue of analysisResult.issues) {
                    const reviewItem: ReviewItem = {
                        id: `${reviewId}:${issue.line}:${issue.character}`,
                        fileUri: uri,
                        message: issue.message,
                        range: new vscode.Range(
                            issue.line, issue.character,
                            issue.line, issue.character + (issue.length || 1)
                        ),
                        severity: issue.severity as ReviewSeverity,
                        code: issue.code,
                        suggestedFix: await generateReviewComment(document, issue)
                    };

                    review.items.push(reviewItem);
                }

                progress.report({ increment: 40, message: "Finalizing review..." });

                // Complete the review
                review.completed = true;
                review.completedAt = new Date();
                this.activeReviews.set(reviewId, review);
                this.pendingReviews.delete(reviewId);

                // Update UI
                this.showReviewResults(review);

                progress.report({ increment: 10, message: "Review complete" });
                return review;
            });

            return this.activeReviews.get(uri.toString()) || null;
        } catch (err) {
            error(`Error reviewing file ${uri.fsPath}`, err as Error);
            vscode.window.showErrorMessage(`Error reviewing file: ${(err as Error).message}`);
            return null;
        }
    }

    /**
     * Reviews all relevant files in the workspace
     */
    public async reviewWorkspace(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('No workspace folder is open');
            return;
        }

        // Check if a review is already in progress
        if (this.reviewsInProgress) {
            vscode.window.showInformationMessage('A code review is already in progress');
            return;
        }

        this.reviewsInProgress = true;
        this.statusBarItem.text = "$(sync~spin) Code Review in Progress";

        try {
            // Get configuration for file types to include
            const config = vscode.workspace.getConfiguration('llama.codeReview');
            const fileTypes = config.get<string[]>('includeFileTypes', [
                '*.ts', '*.js', '*.tsx', '*.jsx', '*.py', '*.java', '*.c', '*.cpp', '*.cs'
            ]);

            // Find files
            const fileUris: vscode.Uri[] = [];
            for (const folder of workspaceFolders) {
                for (const pattern of fileTypes) {
                    const files = await vscode.workspace.findFiles(
                        new vscode.RelativePattern(folder, pattern),
                        '**/node_modules/**'
                    );
                    fileUris.push(...files);
                }
            }

            if (fileUris.length === 0) {
                vscode.window.showInformationMessage('No matching files found for review');
                this.reviewsInProgress = false;
                this.statusBarItem.text = "$(telescope) Code Review";
                return;
            }

            // Confirm with user if many files
            if (fileUris.length > 10) {
                const response = await vscode.window.showWarningMessage(
                    `This will review ${fileUris.length} files. This could take some time. Continue?`,
                    'Yes', 'No'
                );

                if (response !== 'Yes') {
                    this.reviewsInProgress = false;
                    this.statusBarItem.text = "$(telescope) Code Review";
                    return;
                }
            }

            // Start review process
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Reviewing workspace (${fileUris.length} files)`,
                cancellable: true
            }, async (progress, token) => {
                // Track completed files and total files
                let completed = 0;
                const total = fileUris.length;

                // Create master review to hold all results
                const masterReviewId = 'workspace-review-' + Date.now();
                const masterReview = createReview(
                    workspaceFolders[0].uri,
                    'Workspace Review',
                    'workspace'
                );

                // Process files
                for (const uri of fileUris) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    progress.report({
                        increment: 100 / total,
                        message: `Reviewing ${path.basename(uri.fsPath)} (${completed + 1}/${total})`
                    });

                    // Review individual file
                    const review = await this.reviewFile(uri);
                    completed++;

                    // Merge results into master review
                    if (review) {
                        masterReview.items.push(...review.items);
                    }
                }

                masterReview.completed = true;
                masterReview.completedAt = new Date();
                this.activeReviews.set(masterReviewId, masterReview);

                // Show summary
                this.reviewSummaryProvider.update(masterReview);
                this.reviewSummaryProvider.show();

                // Complete the process
                this.reviewsInProgress = false;
                this.statusBarItem.text = "$(telescope) Code Review";

                if (masterReview.items.length === 0) {
                    vscode.window.showInformationMessage('No issues found in workspace review');
                } else {
                    vscode.window.showInformationMessage(
                        `Workspace review complete: found ${masterReview.items.length} issues`,
                        'Show Details'
                    ).then(selection => {
                        if (selection === 'Show Details') {
                            this.reviewSummaryProvider.show();
                        }
                    });
                }
            });
        } catch (err) {
            error('Error reviewing workspace', err as Error);
            vscode.window.showErrorMessage(`Error reviewing workspace: ${(err as Error).message}`);
            this.reviewsInProgress = false;
            this.statusBarItem.text = "$(telescope) Code Review";
        }
    }

    /**
     * Reviews only Git changes (staged and unstaged)
     */
    public async reviewGitChanges(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            if (!gitExtension) {
                vscode.window.showWarningMessage('Git extension is not available');
                return;
            }

            const api = gitExtension.getAPI(1);
            if (!api.repositories || api.repositories.length === 0) {
                vscode.window.showWarningMessage('No Git repositories found');
                return;
            }

            // Get the first repository
            const repo = api.repositories[0];

            // Get changes
            await repo.status();
            const changes = repo.state.workingTreeChanges
                .concat(repo.state.indexChanges)
                .filter(change => change.uri);

            if (changes.length === 0) {
                vscode.window.showInformationMessage('No Git changes to review');
                return;
            }

            // Start the review
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Reviewing ${changes.length} changed files`,
                cancellable: true
            }, async (progress, token) => {
                // Create a review for git changes
                const reviewId = 'git-changes-' + Date.now();
                const review = createReview(
                    repo.rootUri,
                    'Git Changes Review',
                    'git'
                );

                let completed = 0;
                const total = changes.length;

                // Process each changed file
                for (const change of changes) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    progress.report({
                        increment: 100 / total,
                        message: `Reviewing ${path.basename(change.uri.fsPath)} (${completed + 1}/${total})`
                    });

                    // Review the file
                    const fileReview = await this.reviewFile(change.uri);
                    completed++;

                    // Merge results
                    if (fileReview) {
                        review.items.push(...fileReview.items);
                    }
                }

                review.completed = true;
                review.completedAt = new Date();
                this.activeReviews.set(reviewId, review);

                // Show results
                this.reviewSummaryProvider.update(review);
                this.reviewSummaryProvider.show();

                if (review.items.length === 0) {
                    vscode.window.showInformationMessage('No issues found in Git changes');
                } else {
                    vscode.window.showInformationMessage(
                        `Git changes review complete: found ${review.items.length} issues`,
                        'Show Details'
                    ).then(selection => {
                        if (selection === 'Show Details') {
                            this.reviewSummaryProvider.show();
                        }
                    });
                }
            });
        } catch (err) {
            error('Error reviewing Git changes', err as Error);
            vscode.window.showErrorMessage(`Error reviewing Git changes: ${(err as Error).message}`);
        }
    }

    /**
     * Shows review results in the UI
     */
    private showReviewResults(review: Review): void {
        if (review.items.length === 0) {
            vscode.window.showInformationMessage(`No issues found in ${review.name}`);
            return;
        }

        // Update diagnostics collection
        const diagnostics: [vscode.Uri, vscode.Diagnostic[]][] = [];

        for (const item of review.items) {
            const diagnostic = new vscode.Diagnostic(
                item.range,
                item.message,
                this.getSeverity(item.severity)
            );

            diagnostic.code = item.code;
            diagnostic.source = 'Llama Coder Review';

            // Find or create diagnostics array for this URI
            const existingArray = diagnostics.find(d => d[0].toString() === item.fileUri.toString());
            if (existingArray) {
                existingArray[1].push(diagnostic);
            } else {
                diagnostics.push([item.fileUri, [diagnostic]]);
            }
        }

        // Set diagnostics
        for (const [uri, diags] of diagnostics) {
            this.diagnosticCollection.set(uri, diags);
        }

        // Update decorations in visible editors
        if (vscode.window.activeTextEditor) {
            this.updateDecorations(vscode.window.activeTextEditor);
        }

        // Update summary view
        this.reviewSummaryProvider.update(review);

        // Show notification
        vscode.window.showInformationMessage(
            `Review complete: found ${review.items.length} issues in ${review.name}`,
            'Show Details'
        ).then(selection => {
            if (selection === 'Show Details') {
                this.reviewSummaryProvider.show();
            }
        });
    }

    /**
     * Updates editor decorations for a review
     */
    private updateDecorations(editor: vscode.TextEditor): void {
        const uri = editor.document.uri.toString();

        // Clear existing decorations
        if (this.reviewDecorations.has(uri)) {
            for (const decoration of this.reviewDecorations.get(uri) || []) {
                decoration.dispose();
            }
        }

        // Find matching reviews
        const reviewItems: ReviewItem[] = [];
        for (const review of this.activeReviews.values()) {
            reviewItems.push(...review.items.filter(item =>
                item.fileUri.toString() === uri
            ));
        }

        if (reviewItems.length === 0) {
            return;
        }

        // Group by severity
        const errorItems = reviewItems.filter(i => i.severity === 'error');
        const warningItems = reviewItems.filter(i => i.severity === 'warning');
        const infoItems = reviewItems.filter(i => i.severity === 'info');

        // Create decorations
        const decorations: vscode.TextEditorDecorationType[] = [];

        if (errorItems.length > 0) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editorError.background'),
                borderColor: new vscode.ThemeColor('editorError.border'),
                borderStyle: 'solid',
                borderWidth: '1px',
                overviewRulerColor: new vscode.ThemeColor('editorError.foreground'),
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            editor.setDecorations(decoration, errorItems.map(i => i.range));
            decorations.push(decoration);
        }

        if (warningItems.length > 0) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editorWarning.background'),
                borderColor: new vscode.ThemeColor('editorWarning.border'),
                borderStyle: 'solid',
                borderWidth: '1px',
                overviewRulerColor: new vscode.ThemeColor('editorWarning.foreground'),
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            editor.setDecorations(decoration, warningItems.map(i => i.range));
            decorations.push(decoration);
        }

        if (infoItems.length > 0) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editorInfo.background'),
                borderColor: new vscode.ThemeColor('editorInfo.border'),
                borderStyle: 'solid',
                borderWidth: '1px',
                overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            editor.setDecorations(decoration, infoItems.map(i => i.range));
            decorations.push(decoration);
        }

        // Save decorations
        this.reviewDecorations.set(uri, decorations);
    }

    /**
     * Applies a suggested fix to a file
     */
    private async applyFix(uri: string, rangeData: vscode.Range, fix: string): Promise<void> {
        try {
            const vscodeUri = vscode.Uri.parse(uri);
            const document = await vscode.workspace.openTextDocument(vscodeUri);

            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(
                rangeData.start.line, rangeData.start.character,
                rangeData.end.line, rangeData.end.character
            );

            edit.replace(vscodeUri, range, fix);
            await vscode.workspace.applyEdit(edit);

            // Show the document
            await vscode.window.showTextDocument(document);

            // Remove this item from the review
            const reviewId = vscodeUri.toString();
            if (this.activeReviews.has(reviewId)) {
                const review = this.activeReviews.get(reviewId)!;
                review.items = review.items.filter(item =>
                    !(item.range.isEqual(range) && item.fileUri.toString() === uri)
                );
                this.reviewSummaryProvider.update(review);
            }
        } catch (err) {
            error('Error applying fix', err as Error);
            vscode.window.showErrorMessage(`Error applying fix: ${(err as Error).message}`);
        }
    }

    /**
     * Clears all active reviews
     */
    public clearAllReviews(): void {
        this.activeReviews.clear();
        this.pendingReviews.clear();
        this.diagnosticCollection.clear();

        // Dispose all decorations
        for (const decorations of this.reviewDecorations.values()) {
            for (const decoration of decorations) {
                decoration.dispose();
            }
        }
        this.reviewDecorations.clear();

        // Reset summary view
        this.reviewSummaryProvider.clear();

        vscode.window.showInformationMessage('All code review results cleared');
    }

    /**
     * Maps review severity to VS Code diagnostic severity
     */
    private getSeverity(severity: ReviewSeverity): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error': return vscode.DiagnosticSeverity.Error;
            case 'warning': return vscode.DiagnosticSeverity.Warning;
            case 'info': return vscode.DiagnosticSeverity.Information;
            default: return vscode.DiagnosticSeverity.Information;
        }
    }

    /**
     * Disposes resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
        this.diagnosticCollection.dispose();

        for (const decorations of this.reviewDecorations.values()) {
            for (const decoration of decorations) {
                decoration.dispose();
            }
        }

        this.reviewSummaryProvider.dispose();
    }
}

// Singleton instance
let codeReviewManagerInstance: CodeReviewManager | null = null;

export function initializeCodeReviewManager(context: vscode.ExtensionContext): CodeReviewManager {
    if (!codeReviewManagerInstance) {
        codeReviewManagerInstance = new CodeReviewManager(context);
    }
    return codeReviewManagerInstance;
}

export function getCodeReviewManager(): CodeReviewManager {
    if (!codeReviewManagerInstance) {
        throw new Error('Code Review Manager not initialized');
    }
    return codeReviewManagerInstance;
}
