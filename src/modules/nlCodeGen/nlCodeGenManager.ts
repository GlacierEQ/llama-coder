import * as vscode from 'vscode';
import { info, warn, error } from '../log';
import { generateCodeFromDescription } from './codeGenerator';
import { CodeGenerationOptions, GeneratedCodeResult } from './types';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { CodeGenerationHistory } from './history';

/**
 * Manages natural language code generation functionality
 */
export class NLCodeGenManager {
    private statusBarItem: vscode.StatusBarItem;
    private webviewPanel: vscode.WebviewPanel | undefined;
    private history: CodeGenerationHistory;
    private readonly viewType = 'llamaCoder.nlCodeGen';
    private readonly title = 'Natural Language Code Generator';

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 95);
        this.statusBarItem.text = '$(wand) Generate Code';
        this.statusBarItem.tooltip = 'Generate code from natural language description';
        this.statusBarItem.command = 'llama.nlCodeGen.showPanel';
        this.statusBarItem.show();
        this.context.subscriptions.push(this.statusBarItem);

        this.history = new CodeGenerationHistory(this.context);

        this.registerCommands();
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('llama.nlCodeGen.showPanel', () => {
                this.showPanel();
            }),

            vscode.commands.registerCommand('llama.nlCodeGen.generateCode', async (description: string, options: CodeGenerationOptions) => {
                return await this.generateCode(description, options);
            }),

            vscode.commands.registerCommand('llama.nlCodeGen.insertCode', (code: string) => {
                this.insertCodeToEditor(code);
            }),

            vscode.commands.registerCommand('llama.nlCodeGen.showHistory', () => {
                this.showHistory();
            }),

            vscode.commands.registerCommand('llama.nlCodeGen.quickGenerate', async () => {
                await this.quickGenerate();
            })
        );
    }

    /**
     * Shows the natural language code generation panel
     */
    public showPanel(): void {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            this.viewType,
            this.title,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media')
                ]
            }
        );

        this.webviewPanel.iconPath = vscode.Uri.joinPath(
            this.context.extensionUri,
            'media',
            'icons',
            'wand.svg'
        );

        this.webviewPanel.webview.html = this.getWebviewContent();

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });

        this.webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'generate':
                    const result = await this.generateCode(message.description, message.options);
                    this.webviewPanel?.webview.postMessage({
                        command: 'generationResult',
                        result
                    });
                    break;

                case 'insert':
                    this.insertCodeToEditor(message.code);
                    break;

                case 'saveToHistory':
                    this.history.addItem({
                        description: message.description,
                        code: message.code,
                        language: message.language,
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'getHistory':
                    const historyItems = this.history.getItems();
                    this.webviewPanel?.webview.postMessage({
                        command: 'historyItems',
                        items: historyItems
                    });
                    break;

                case 'clearHistory':
                    this.history.clearItems();
                    break;

                case 'getLanguages':
                    const editor = vscode.window.activeTextEditor;
                    const currentLanguage = editor?.document.languageId || 'javascript';
                    this.webviewPanel?.webview.postMessage({
                        command: 'languages',
                        current: currentLanguage,
                        options: this.getSupportedLanguages()
                    });
                    break;
            }
        });
    }

    /**
     * Generates code based on a natural language description
     */
    private async generateCode(description: string, options: CodeGenerationOptions): Promise<GeneratedCodeResult> {
        try {
            info(`Generating code for: "${description}" with options: ${JSON.stringify(options)}`);

            // Show progress indicator
            return await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating code...',
                    cancellable: true
                },
                async (progress, token) => {
                    progress.report({ increment: 10, message: 'Preparing prompt...' });

                    const editor = vscode.window.activeTextEditor;
                    let contextCode = '';

                    // If we should include context and we have an active editor
                    if (options.includeEditorContext && editor) {
                        contextCode = editor.document.getText();
                    }

                    progress.report({ increment: 30, message: 'Generating code...' });

                    // Generate the code
                    const generatedResult = await generateCodeFromDescription(
                        description,
                        options.language,
                        contextCode,
                        options.modelTemplate || 'standard',
                        token
                    );

                    progress.report({ increment: 60, message: 'Processing result...' });

                    if (!generatedResult.success) {
                        return {
                            success: false,
                            error: generatedResult.error || 'Unknown error occurred during code generation'
                        };
                    }

                    // Save to history if successful
                    this.history.addItem({
                        description,
                        code: generatedResult.code,
                        language: options.language,
                        timestamp: new Date().toISOString()
                    });

                    return {
                        success: true,
                        code: generatedResult.code,
                        language: options.language,
                        description
                    };
                }
            );
        } catch (err) {
            error('Error generating code', err as Error);
            return {
                success: false,
                error: (err as Error).message
            };
        }
    }

    /**
     * Inserts the generated code into the active editor
     */
    private insertCodeToEditor(code: string): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor to insert code into');
            return;
        }

        editor.edit(editBuilder => {
            // If there's a selection, replace it; otherwise, insert at cursor position
            const selection = editor.selection;
            if (!selection.isEmpty) {
                editBuilder.replace(selection, code);
            } else {
                editBuilder.insert(selection.active, code);
            }
        }).then(success => {
            if (success) {
                info('Code inserted successfully');
            } else {
                warn('Failed to insert code');
            }
        });
    }

    /**
     * Shows the generation history in the webview
     */
    private showHistory(): void {
        this.showPanel();
        setTimeout(() => {
            this.webviewPanel?.webview.postMessage({ command: 'showHistory' });
        }, 500); // Give the webview time to initialize
    }

    /**
     * Quick generate from selected text or input box
     */
    private async quickGenerate(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        let description = '';

        // If there's selected text, use it as the description
        if (editor && !editor.selection.isEmpty) {
            description = editor.document.getText(editor.selection);
        }

        // If no description from selection, prompt the user
        if (!description) {
            description = await vscode.window.showInputBox({
                prompt: 'Describe the code you want to generate',
                placeHolder: 'e.g., A function that sorts an array of objects by a given property'
            }) || '';
        }

        if (!description) {
            return; // User cancelled
        }

        const language = editor?.document.languageId || 'javascript';
        const options: CodeGenerationOptions = {
            language,
            includeEditorContext: true,
            modelTemplate: 'standard'
        };

        const result = await this.generateCode(description, options);

        if (result.success && result.code) {
            // Show the result with options to insert or discard
            const action = await vscode.window.showInformationMessage(
                'Code generated successfully!',
                'Insert',
                'Show in Panel',
                'Discard'
            );

            if (action === 'Insert') {
                this.insertCodeToEditor(result.code);
            } else if (action === 'Show in Panel') {
                this.showPanel();
                setTimeout(() => {
                    this.webviewPanel?.webview.postMessage({
                        command: 'showGenerated',
                        result
                    });
                }, 500);
            }
        } else {
            vscode.window.showErrorMessage(
                `Failed to generate code: ${result.error || 'Unknown error'}`
            );
        }
    }

    /**
     * Returns the HTML content for the webview panel
     */
    private getWebviewContent(): string {
        const webview = this.webviewPanel!.webview;

        // Create URIs for stylesheets and scripts
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'nlcodegen.css')
        );

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'nlcodegen.js')
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon.css')
        );

        // Get the initial language for the code
        const editor = vscode.window.activeTextEditor;
        const currentLanguage = editor?.document.languageId || 'javascript';

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${codiconsUri}" rel="stylesheet">
            <link href="${styleUri}" rel="stylesheet">
            <title>Natural Language Code Generator</title>
        </head>
        <body>
            <div class="container">
                <div class="tabs">
                    <button id="tab-generate" class="tab active">Generate</button>
                    <button id="tab-history" class="tab">History</button>
                </div>
                
                <div id="panel-generate" class="panel active">
                    <h2>Generate Code from Description</h2>
                    
                    <div class="input-group">
                        <label for="description">Description:</label>
                        <textarea id="description" placeholder="Describe what you want to generate, e.g.: A function that takes an array of objects and returns the sum of a specific property" rows="5"></textarea>
                    </div>
                    
                    <div class="options-container">
                        <div class="input-group">
                            <label for="language">Language:</label>
                            <select id="language">
                                <option value="${currentLanguage}" selected>${currentLanguage}</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label for="template">Prompt Template:</label>
                            <select id="template">
                                <option value="standard" selected>Standard</option>
                                <option value="detailed">Detailed</option>
                                <option value="concise">Concise</option>
                                <option value="optimized">Optimized</option>
                            </select>
                        </div>
                        
                        <div class="input-group checkbox-group">
                            <input type="checkbox" id="include-context" checked>
                            <label for="include-context">Include editor context</label>
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button id="btn-generate" class="primary-button">
                            <i class="codicon codicon-wand"></i> Generate
                        </button>
                    </div>
                    
                    <div id="result-container" class="hidden">
                        <h3>Generated Code:</h3>
                        <div class="code-container">
                            <pre><code id="generated-code"></code></pre>
                            <div class="code-actions">
                                <button id="btn-insert" class="action-button">
                                    <i class="codicon codicon-insert"></i> Insert
                                </button>
                                <button id="btn-copy" class="action-button">
                                    <i class="codicon codicon-copy"></i> Copy
                                </button>
                                <button id="btn-refine" class="action-button">
                                    <i class="codicon codicon-edit"></i> Refine
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="panel-history" class="panel">
                    <h2>Generation History</h2>
                    <div class="history-controls">
                        <button id="btn-clear-history" class="secondary-button">
                            <i class="codicon codicon-clear-all"></i> Clear History
                        </button>
                    </div>
                    <div id="history-container">
                        <div class="placeholder">Loading history...</div>
                    </div>
                </div>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    /**
     * Returns a list of supported programming languages
     */
    private getSupportedLanguages(): string[] {
        return [
            'typescript',
            'javascript',
            'python',
            'java',
            'csharp',
            'c',
            'cpp',
            'go',
            'ruby',
            'rust',
            'php',
            'swift',
            'kotlin',
            'html',
            'css',
            'json',
            'sql'
        ];
    }

    /**
     * Disposes resources used by the manager
     */
    public dispose(): void {
        this.statusBarItem.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}

// Singleton instance management
let nlCodeGenManagerInstance: NLCodeGenManager | null = null;

export function initializeNLCodeGenManager(context: vscode.ExtensionContext): NLCodeGenManager {
    if (!nlCodeGenManagerInstance) {
        nlCodeGenManagerInstance = new NLCodeGenManager(context);
    }
    return nlCodeGenManagerInstance;
}

export function getNLCodeGenManager(): NLCodeGenManager {
    if (!nlCodeGenManagerInstance) {
        throw new Error('NL Code Gen Manager not initialized');
    }
    return nlCodeGenManagerInstance;
}
