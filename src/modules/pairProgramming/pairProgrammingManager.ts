import * as vscode from 'vscode';
import { getOllamaCompletion } from '../ollama/completion';
import { info, warn, error } from '../log';
import { getSecurityManager } from '../security/securityManager';
import { AssistantMessage, PairProgrammingSession } from './types';

/**
 * Manages AI pair programming sessions that provide interactive coding assistance
 */
export class PairProgrammingManager {
    private activeSessions: Map<string, PairProgrammingSession> = new Map();
    private decorationType: vscode.TextEditorDecorationType;
    private statusBarItem: vscode.StatusBarItem;
    private isPairModeEnabled: boolean = false;
    private webviewPanel: vscode.WebviewPanel | undefined;
    private currentSession: PairProgrammingSession | undefined;
    private assistantIsThinking: boolean = false;

    constructor(private context: vscode.ExtensionContext) {
        // Create decorations for inline comments
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 10px',
                color: new vscode.ThemeColor('editorCodeLens.foreground'),
                fontStyle: 'italic'
            }
        });

        // Create status bar item for pair programming mode
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(hubot) AI Pair";
        this.statusBarItem.tooltip = "Start AI Pair Programming Session";
        this.statusBarItem.command = "llama.pairProgramming.toggle";
        this.statusBarItem.show();
        this.context.subscriptions.push(this.statusBarItem);

        // Register commands
        this.registerCommands();

        // Set up file watchers
        this.registerFileWatchers();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.pairProgramming.toggle', () => {
                this.togglePairMode();
            }),

            vscode.commands.registerCommand('llama.pairProgramming.ask', async () => {
                await this.askAssistant();
            }),

            vscode.commands.registerCommand('llama.pairProgramming.explain', async () => {
                await this.explainSelectedCode();
            }),

            vscode.commands.registerCommand('llama.pairProgramming.suggest', async () => {
                await this.suggestImprovement();
            }),

            vscode.commands.registerCommand('llama.pairProgramming.debug', async () => {
                await this.debugSelectedCode();
            }),

            vscode.commands.registerCommand('llama.pairProgramming.insertSuggestion', async (text: string) => {
                await this.insertText(text);
            }),

            vscode.commands.registerCommand('llama.pairProgramming.startNewSession', () => {
                this.startNewSession();
            })
        );
    }

    private registerFileWatchers(): void {
        // React to changes in the active editor
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && this.isPairModeEnabled) {
                this.attachToEditor(editor);
            }
        });

        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isPairModeEnabled && vscode.window.activeTextEditor) {
                if (event.document === vscode.window.activeTextEditor.document) {
                    this.onDocumentChanged(event);
                }
            }
        });
    }

    /**
     * Toggles AI pair programming mode on/off
     */
    private async togglePairMode(): Promise<void> {
        this.isPairModeEnabled = !this.isPairModeEnabled;

        if (this.isPairModeEnabled) {
            // Starting pair programming mode
            this.statusBarItem.text = "$(hubot) AI Pair $(check)";
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

            // Start a new session if no active editor, otherwise attach to current editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await this.attachToEditor(editor);
            } else {
                await this.startNewSession();
            }

            vscode.window.showInformationMessage(
                "AI Pair Programming mode activated. I'll assist you as you code!",
                "Learn More"
            ).then(selection => {
                if (selection === "Learn More") {
                    vscode.env.openExternal(vscode.Uri.parse(
                        'https://github.com/ex3ndr/llama-coder/blob/main/docs/pair-programming.md'
                    ));
                }
            });
        } else {
            // Stopping pair programming mode
            this.statusBarItem.text = "$(hubot) AI Pair";
            this.statusBarItem.backgroundColor = undefined;
            this.hidePanel();

            // Clear decorations
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(this.decorationType, []);
            }

            vscode.window.showInformationMessage("AI Pair Programming mode deactivated");
        }
    }

    /**
     * Attaches the pair programming assistant to the current editor
     */
    private async attachToEditor(editor: vscode.TextEditor): Promise<void> {
        if (!this.isPairModeEnabled) {
            return;
        }

        const document = editor.document;
        const fileName = document.fileName;

        // Check if we already have a session for this file
        if (!this.activeSessions.has(fileName)) {
            // Create a new session for this file
            await this.createSessionForFile(fileName, document);
        }

        this.currentSession = this.activeSessions.get(fileName);

        // Update the conversation panel if it's open
        if (this.webviewPanel) {
            this.updateConversationPanel();
        }

        // Notify the AI about the file we're working with
        if (this.currentSession) {
            await this.notifyContextChange(document);
        }
    }

    /**
     * Creates a new pair programming session for a file
     */
    private async createSessionForFile(fileName: string, document: vscode.TextDocument): Promise<void> {
        const session: PairProgrammingSession = {
            fileName,
            language: document.languageId,
            conversation: [
                {
                    role: 'system',
                    content: this.getSystemPrompt(document.languageId)
                },
                {
                    role: 'assistant',
                    content: `I'm ready to help with your ${document.languageId} code. What are you working on?`
                }
            ],
            annotations: [],
            lastAnalysisText: document.getText()
        };

        this.activeSessions.set(fileName, session);
        info(`Created new pair programming session for ${fileName}`);
    }

    /**
     * Starts a new conversation session
     */
    private async startNewSession(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("Please open a file to start pair programming");
            return;
        }

        const fileName = editor.document.fileName;

        // Create a new session
        await this.createSessionForFile(fileName, editor.document);
        this.currentSession = this.activeSessions.get(fileName);

        // Show the conversation panel
        this.showConversationPanel();
    }

    /**
     * Called when the document text changes
     */
    private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isPairModeEnabled || !this.currentSession) {
            return;
        }

        // Only process significant changes to avoid constant triggers
        const significantChange = event.contentChanges.some(change =>
            change.text.includes('\n') || change.text.length > 20 || change.rangeLength > 20
        );

        if (significantChange && !this.assistantIsThinking) {
            // Schedule analysis after a brief delay to let the user finish typing
            this.debounceAnalysis(event.document);
        }
    }

    // Track timeout ID for debouncing
    private analyzeTimeoutId: NodeJS.Timeout | null = null;

    /**
     * Debounces the code analysis to avoid too frequent updates
     */
    private debounceAnalysis(document: vscode.TextDocument): void {
        if (this.analyzeTimeoutId) {
            clearTimeout(this.analyzeTimeoutId);
        }

        this.analyzeTimeoutId = setTimeout(() => {
            this.analyzeCurrentCode(document);
            this.analyzeTimeoutId = null;
        }, 2000); // 2 second delay
    }

    /**
     * Analyzes the current code for opportunities to help
     */
    private async analyzeCurrentCode(document: vscode.TextDocument): Promise<void> {
        if (!this.isPairModeEnabled || !this.currentSession || this.assistantIsThinking) {
            return;
        }

        const text = document.getText();

        // Skip if the text hasn't changed significantly
        if (text === this.currentSession.lastAnalysisText) {
            return;
        }

        this.currentSession.lastAnalysisText = text;

        try {
            // Only analyze the visible portion + some context for performance
            const visibleRanges = vscode.window.activeTextEditor?.visibleRanges || [];
            if (visibleRanges.length === 0) return;

            // Get the combined text of all visible ranges plus some context
            const expandedRanges = visibleRanges.map(range => {
                // Expand the range by 10 lines in each direction for context
                const startLine = Math.max(0, range.start.line - 10);
                const endLine = Math.min(document.lineCount - 1, range.end.line + 10);
                return new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(endLine, document.lineAt(endLine).text.length)
                );
            });

            // Merge overlapping ranges
            const mergedRanges = this.mergeRanges(expandedRanges);

            // Extract text from the merged ranges
            let visibleText = '';
            for (const range of mergedRanges) {
                visibleText += document.getText(range) + '\n\n';
            }

            // Get AI feedback on the code
            const feedback = await this.getCodeFeedback(visibleText, document.languageId);

            // Clear previous annotations
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(this.decorationType, []);
            }

            // Update the session with the new suggestions
            if (feedback && feedback.annotations) {
                this.currentSession.annotations = feedback.annotations;

                // Display the annotations if they exist
                this.displayAnnotations();
            }

            // If there's a message from the AI, add it to the conversation
            if (feedback && feedback.message) {
                this.addAssistantMessage(feedback.message);
            }
        } catch (err) {
            error('Error analyzing code', err as Error);
        }
    }

    /**
     * Merges overlapping ranges
     */
    private mergeRanges(ranges: vscode.Range[]): vscode.Range[] {
        if (ranges.length <= 1) return ranges;

        // Sort the ranges by their start positions
        const sortedRanges = [...ranges].sort((a, b) => {
            if (a.start.line !== b.start.line) {
                return a.start.line - b.start.line;
            }
            return a.start.character - b.start.character;
        });

        const mergedRanges: vscode.Range[] = [sortedRanges[0]];

        for (let i = 1; i < sortedRanges.length; i++) {
            const current = sortedRanges[i];
            const previous = mergedRanges[mergedRanges.length - 1];

            if (current.start.isBefore(previous.end) || current.start.isEqual(previous.end)) {
                // Ranges overlap, merge them
                mergedRanges[mergedRanges.length - 1] = new vscode.Range(
                    previous.start,
                    current.end.isAfter(previous.end) ? current.end : previous.end
                );
            } else {
                // Ranges don't overlap, add the current range
                mergedRanges.push(current);
            }
        }

        return mergedRanges;
    }

    /**
     * Gets AI feedback on the code
     */
    private async getCodeFeedback(
        code: string,
        language: string
    ): Promise<{ message?: string; annotations?: Array<{ line: number; message: string }> } | null> {
        try {
            // Limit code size to prevent sending too large prompts
            const maxCodeLength = 5000;
            const truncatedCode = code.length > maxCodeLength
                ? code.substring(0, maxCodeLength) + "\n... (code truncated)"
                : code;

            const prompt = `
You are an AI pair programmer working on this ${language} code. The user is actively coding in this file.
Your task is to analyze this code and provide:
1. Any observations about potential issues or improvements
2. Inline annotations on specific lines that need attention

Here's the current code:

\`\`\`${language}
${truncatedCode}
\`\`\`

Respond with:
1. A brief overall message if relevant (keep it concise and only if you have something valuable to say)
2. A list of line-specific annotations in this format: "LINE:123|MESSAGE" (one per line)
If you have nothing to say, respond with "No feedback needed at this time".`;

            const config = vscode.workspace.getConfiguration('llama');
            const ollamaEndpoint = config.get<string>('inference.endpoint', '');
            const modelConfig = config.get<string>('inference.model', 'stable-code:3b-code-q4_0');
            const temperature = 0.1; // Lower temperature for more precise analysis

            // Get the bearer token if available
            const bearerToken = config.get<string>('inference.bearerToken', '');

            // Parse model information
            let modelName = modelConfig;
            let modelFormat = 'stable-code';
            if (modelConfig === 'custom') {
                modelName = config.get<string>('inference.custom.model', '');
                modelFormat = config.get<string>('inference.custom.format', 'stable-code');
            } else if (typeof modelConfig === 'string') {
                const parts = modelConfig.split(':');
                if (parts.length > 1) {
                    modelFormat = parts[0];
                }
            }

            // Send the prompt to Ollama
            const response = await getOllamaCompletion(
                ollamaEndpoint,
                { name: modelName as string, format: modelFormat as 'stable-code' | 'codellama' | 'deepseek' },
                prompt,
                {
                    temperature,
                    max_tokens: 500,
                    bearer_token: bearerToken
                }
            );

            if (!response || response.trim() === 'No feedback needed at this time.') {
                return null;
            }

            // Extract line annotations and message
            const lines = response.split('\n');
            const annotations: Array<{ line: number; message: string }> = [];
            let message = '';

            for (const line of lines) {
                const annotationMatch = line.match(/LINE:(\d+)\|(.*)/);
                if (annotationMatch) {
                    const lineNumber = parseInt(annotationMatch[1], 10);
                    const annotationText = annotationMatch[2].trim();
                    if (!isNaN(lineNumber) && annotationText) {
                        annotations.push({
                            line: lineNumber - 1, // Convert to 0-based indexing
                            message: annotationText
                        });
                    }
                } else if (line.trim() && !line.startsWith('LINE:')) {
                    message += (message ? '\n' : '') + line;
                }
            }

            return {
                message: message.trim(),
                annotations: annotations.length > 0 ? annotations : undefined
            };
        } catch (err) {
            error('Error getting code feedback', err as Error);
            return null;
        }
    }

    /**
     * Displays annotations from the AI in the editor
     */
    private displayAnnotations(): void {
        if (!this.isPairModeEnabled || !this.currentSession || !this.currentSession.annotations) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];

        for (const annotation of this.currentSession.annotations) {
            try {
                // Make sure the line number is valid
                if (annotation.line >= editor.document.lineCount) {
                    continue;
                }

                const line = editor.document.lineAt(annotation.line);
                const decoration: vscode.DecorationOptions = {
                    range: line.range,
                    renderOptions: {
                        after: {
                            contentText: `// 🤖 ${annotation.message}`,
                        }
                    }
                };

                decorations.push(decoration);
            } catch (err) {
                warn(`Error displaying annotation on line ${annotation.line}`, err as Error);
            }
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    /**
     * Shows the conversation panel
     */
    private showConversationPanel(): void {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'pairProgramming',
            'AI Pair Programming',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        this.updateConversationPanel();

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });

        this.webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'sendMessage':
                    this.handleUserMessage(message.text);
                    break;
                case 'insertCode':
                    this.insertText(message.code);
                    break;
            }
        });
    }

    /**
     * Updates the conversation panel with the current session
     */
    private updateConversationPanel(): void {
        if (!this.webviewPanel || !this.currentSession) {
            return;
        }

        this.webviewPanel.webview.html = this.getConversationHtml();
    }

    /**
     * Hides the conversation panel
     */
    private hidePanel(): void {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
    }

    /**
     * Handles a message from the user in the conversation panel
     */
    private async handleUserMessage(text: string): Promise<void> {
        if (!this.currentSession) {
            return;
        }

        // Add the user message to the conversation
        this.currentSession.conversation.push({
            role: 'user',
            content: text
        });

        // Update the panel right away to show the user message
        this.updateConversationPanel();

        // Get the AI response
        await this.getAssistantResponse();
    }

    /**
     * Gets a response from the AI assistant
     */
    private async getAssistantResponse(): Promise<void> {
        if (!this.currentSession || this.assistantIsThinking) {
            return;
        }

        try {
            this.assistantIsThinking = true;

            if (this.webviewPanel) {
                // Send a message to the webview that the AI is thinking
                this.webviewPanel.webview.postMessage({
                    type: 'assistantThinking',
                    thinking: true
                });
            }

            // Extract the conversation history
            const messages = this.currentSession.conversation.slice(-10); // Last 10 messages for context

            // Add current file context if available
            const editor = vscode.window.activeTextEditor;
            let codeContext = '';
            if (editor && editor.document.fileName === this.currentSession.fileName) {
                // Get selected text or visible text
                if (!editor.selection.isEmpty) {
                    codeContext = editor.document.getText(editor.selection);
                } else {
                    // Get the visible portion of the document
                    const visibleRanges = editor.visibleRanges;
                    if (visibleRanges.length > 0) {
                        const firstRange = visibleRanges[0];
                        const lastRange = visibleRanges[visibleRanges.length - 1];
                        const combinedRange = new vscode.Range(firstRange.start, lastRange.end);
                        codeContext = editor.document.getText(combinedRange);
                    }
                }
            }

            // Build the prompt with conversation history
            let prompt = '';
            for (const message of messages) {
                if (message.role === 'system') {
                    prompt += `System: ${message.content}\n\n`;
                } else if (message.role === 'user') {
                    prompt += `User: ${message.content}\n\n`;
                } else if (message.role === 'assistant') {
                    prompt += `Assistant: ${message.content}\n\n`;
                }
            }

            // Add code context if available
            if (codeContext) {
                prompt += `Current code context:\n\`\`\`${this.currentSession.language}\n${codeContext}\n\`\`\`\n\n`;
            }

            // Add final instruction
            prompt += "Assistant: ";

            // Get the configuration
            const config = vscode.workspace.getConfiguration('llama');
            const ollamaEndpoint = config.get<string>('inference.endpoint', '');
            const modelConfig = config.get<string>('inference.model', 'stable-code:3b-code-q4_0');
            const temperature = config.get<number>('inference.temperature', 0.2);

            // Get the bearer token if available
            const bearerToken = config.get<string>('inference.bearerToken', '');

            // Parse model information
            let modelName = modelConfig;
            let modelFormat = 'stable-code';
            if (modelConfig === 'custom') {
                modelName = config.get<string>('inference.custom.model', '');
                modelFormat = config.get<string>('inference.custom.format', 'stable-code');
            } else if (typeof modelConfig === 'string') {
                const parts = modelConfig.split(':');
                if (parts.length > 1) {
                    modelFormat = parts[0];
                }
            }

            // Send the prompt to Ollama
            const response = await getOllamaCompletion(
                ollamaEndpoint,
                { name: modelName as string, format: modelFormat as 'stable-code' | 'codellama' | 'deepseek' },
                prompt,
                {
                    temperature,
                    max_tokens: 1000,
                    bearer_token: bearerToken
                }
            );

            if (response) {
                // Add the assistant response to the conversation
                this.addAssistantMessage(response);
            } else {
                // Handle error case
                this.addAssistantMessage("I'm sorry, I'm having trouble responding right now. Please try again.");
            }
        } catch (err) {
            error('Error getting assistant response', err as Error);
            this.addAssistantMessage("I'm sorry, I encountered an error while processing your request. Please try again.");
        } finally {
            this.assistantIsThinking = false;

            if (this.webviewPanel) {
                // Send a message to the webview that the AI is done thinking
                this.webviewPanel.webview.postMessage({
                    type: 'assistantThinking',
                    thinking: false
                });
            }
        }
    }

    /**
     * Adds an assistant message to the conversation
     */
    private addAssistantMessage(content: string): void {
        if (!this.currentSession) {
            return;
        }

        // Add the message to the conversation
        this.currentSession.conversation.push({
            role: 'assistant',
            content
        });

        // Update the panel
        this.updateConversationPanel();
    }

    /**
     * Notifies the assistant about a context change
     */
    private async notifyContextChange(document: vscode.TextDocument): Promise<void> {
        if (!this.currentSession) {
            return;
        }

        // Add a system message about the context change
        this.currentSession.conversation.push({
            role: 'system',
            content: `The user is now working on ${document.fileName} (${document.languageId}).`
        });

        // Update the panel
        this.updateConversationPanel();
    }

    /**
     * Asks the assistant a question
     */
    private async askAssistant(): Promise<void> {
        if (!this.isPairModeEnabled) {
            vscode.window.showInformationMessage("Please enable AI Pair Programming mode first.");
            return;
        }

        // Show the conversation panel
        this.showConversationPanel();

        // Prompt for a question
        const question = await vscode.window.showInputBox({
            prompt: "What would you like to ask your AI pair programmer?",
            placeHolder: "E.g., How can I optimize this function?"
        });

        if (!question) {
            return; // User cancelled
        }

        // Make sure we have an active session
        if (!this.currentSession) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await this.createSessionForFile(editor.document.fileName, editor.document);
                this.currentSession = this.activeSessions.get(editor.document.fileName);
            } else {
                vscode.window.showErrorMessage("Please open a file to start pair programming");
                return;
            }
        }

        // Add the user question to the conversation
        this.handleUserMessage(question);
    }

    /**
     * Explains the selected code
     */
    private async explainSelectedCode(): Promise<void> {
        if (!this.isPairModeEnabled) {
            vscode.window.showInformationMessage("Please enable AI Pair Programming mode first.");
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Please open a file with code to explain.");
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage("Please select some code to explain.");
            return;
        }

        const selectedText = editor.document.getText(selection);
        const message = `Please explain this code:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;

        // Show the conversation panel
        this.showConversationPanel();

        // Create a session if needed
        if (!this.currentSession) {
            await this.createSessionForFile(editor.document.fileName, editor.document);
            this.currentSession = this.activeSessions.get(editor.document.fileName);
        }

        // Send the message
        this.handleUserMessage(message);
    }

    /**
     * Suggests improvements for selected code
     */
    private async suggestImprovement(): Promise<void> {
        if (!this.isPairModeEnabled) {
            vscode.window.showInformationMessage("Please enable AI Pair Programming mode first.");
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Please open a file with code to improve.");
            return;
        }

        const selection = editor.selection;
        let selectedText: string;

        if (selection.isEmpty) {
            // If no selection, get the current function or block
            const document = editor.document;
            const position = selection.active;
            const line = document.lineAt(position.line);

            // Try to find the start and end of the current function or block
            // This is a simple implementation - could be improved with language-specific parsing
            let startLine = position.line;
            while (startLine > 0) {
                const currentLine = document.lineAt(startLine).text.trim();
                if (currentLine.includes('{') && (
                    currentLine.includes('function') ||
                    currentLine.includes('class') ||
                    currentLine.includes('if') ||
                    currentLine.includes('for') ||
                    currentLine.includes('while')
                )) {
                    break;
                }
                startLine--;
            }

            let endLine = position.line;
            let braceCount = 0;
            let foundOpening = false;

            for (let i = startLine; i < document.lineCount; i++) {
                const currentLine = document.lineAt(i).text;

                for (const char of currentLine) {
                    if (char === '{') {
                        braceCount++;
                        foundOpening = true;
                    } else if (char === '}') {
                        braceCount--;
                    }
                }

                if (foundOpening && braceCount === 0) {
                    endLine = i;
                    break;
                }
            }

            // Get the text of the block
            const blockRange = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, document.lineAt(endLine).text.length)
            );

            selectedText = document.getText(blockRange);

            // If we couldn't identify a block, use the current line
            if (!selectedText) {
                selectedText = line.text;
            }
        } else {
            selectedText = editor.document.getText(selection);
        }

        const message = `Please suggest improvements for this code:\n\n\`\`\`${