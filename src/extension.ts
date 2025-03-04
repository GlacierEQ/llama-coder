import * as vscode from 'vscode';
import { PromptProvider } from './prompts/provider';
import { debug, info, warn, error, registerLogger } from './modules/log';
import { initializeUpdater } from './modules/updater';
import { initializeFeatureManager, registerFeature } from './modules/featureManager';
import { initializeEvolution } from './modules/evolution';
import { ChatProvider } from './modules/chat/chatProvider';
import { initializeSecurityManager } from './modules/security/securityManager';
import { initializeBuilderBeeManager } from './modules/bees/builderBeeManager';
import { initializeNLCodeGenManager } from './modules/nlCodeGen/nlCodeGenManager';
import { OllamaClient, loadConfig } from '@ollama-super/common';

// Provider declared at module scope for cleanup
let provider: PromptProvider | null = null;

export function activate(context: vscode.ExtensionContext) {
	const chatProvider = new ChatProvider(context);

	// Initialize features and update mechanisms
	initializeFeatureManager(context);
	registerFeature('autocomplete', true);
	registerFeature('notebookSupport', false);
	registerFeature('advancedDebugging', false);
	initializeUpdater(context);
	initializeEvolution(context);

	// Initialize security manager
	const securityManager = initializeSecurityManager(context);
	info('Security manager initialized');

	// Initialize builder bees
	const beeManager = initializeBuilderBeeManager(context);
	info('Builder bee manager initialized');

	// Initialize natural language code generation manager
	const nlCodeGenManager = initializeNLCodeGenManager(context);
	info('Natural language code generator initialized');

	// Create logger
	try {
		registerLogger(vscode.window.createOutputChannel('Llama Coder', { log: true }));
		info('Llama Coder is activated.', { version: context.extension.packageJSON.version });
	} catch (err) {
		error('Failed to initialize logger', err as Error);
		return;
	}

	// Load the shared configuration
	const config = loadConfig();
	const ollamaConfig = config.components.llamaCoder;

	// Initialize the client
	const client = new OllamaClient({
		baseURL: config.ollama.endpoint,
		timeout: ollamaConfig.timeout || 3000
	});

	console.log('Llama Coder activated with model:', config.models.code);

	// Register a completion provider
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		{ pattern: '**' },
		{
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				if (!ollamaConfig.enabled) {
					return [];
				}

				try {
					// Get the current line and prefix
					const linePrefix = document.lineAt(position.line).text.substring(0, position.character);

					// Check if we should trigger completion
					const shouldTrigger = ollamaConfig.triggerCharacters.some(char => linePrefix.endsWith(char));
					if (!shouldTrigger && position.character > 0) {
						return [];
					}

					// Get context from the document
					const documentText = document.getText();
					const cursorPosition = document.offsetAt(position);

					// Create a prompt with the document context
					const promptText = documentText.substring(0, cursorPosition);

					// Generate completion
					console.log('Generating completion...');
					const response = await client.generate({
						model: config.models.code,
						prompt: promptText,
						max_tokens: ollamaConfig.maxTokens || 256,
						temperature: ollamaConfig.temperature || 0.2,
						top_p: ollamaConfig.topP || 0.9
					});

					// Create completion item
					const item = new vscode.CompletionItem(
						response.response,
						vscode.CompletionItemKind.Text
					);

					item.insertText = response.response;
					item.detail = 'Llama Coder';
					item.documentation = 'Generated with ' + config.models.code;

					return [item];
				} catch (error) {
					console.error('Completion error:', error);
					return [];
				}
			}
		},
		...ollamaConfig.triggerCharacters
	);

	// Register commands
	const enableCommand = vscode.commands.registerCommand('llamaCoder.enable', () => {
		vscode.workspace.getConfiguration().update('llamaCoder.enabled', true, true);
		vscode.window.showInformationMessage('Llama Coder enabled');
	});

	const disableCommand = vscode.commands.registerCommand('llamaCoder.disable', () => {
		vscode.workspace.getConfiguration().update('llamaCoder.enabled', false, true);
		vscode.window.showInformationMessage('Llama Coder disabled');
	});

	// Add to subscriptions
	context.subscriptions.push(completionProvider, enableCommand, disableCommand);

	// Command to open settings
	context.subscriptions.push(vscode.commands.registerCommand('llama.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:ex3ndr.llama-coder');
	}));

	let statusBarItem: vscode.StatusBarItem;
	try {
		statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		statusBarItem.command = 'llama.toggle';
		statusBarItem.text = `$(chip) Llama Coder`;
		statusBarItem.show();
		context.subscriptions.push(statusBarItem);
		debug('Status bar item created successfully');
	} catch (err) {
		error('Failed to create status bar item', err as Error);
		return;
	}

	// Create provider and register inline completion
	try {
		provider = new PromptProvider(statusBarItem, context, securityManager);
		const disposable = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);
		context.subscriptions.push(disposable);
		debug('Prompt provider registered successfully');
	} catch (err) {
		error('Failed to initialize prompt provider', err as Error);
		return;
	}

	// Command handlers for pause, resume, toggle, and open chat
	context.subscriptions.push(vscode.commands.registerCommand('llama.pause', () => {
		if (provider) {
			provider.paused = true;
			info('Extension paused');
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('llama.resume', () => {
		if (provider) {
			provider.paused = false;
			info('Extension resumed');
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('llama.toggle', () => {
		if (provider) {
			provider.paused = !provider.paused;
			info(`Extension ${provider.paused ? 'paused' : 'resumed'}`);
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('llama.openChat', () => {
		chatProvider.show();
	}));
}

export function deactivate() {
	debug('Extension deactivated');
	if (provider && typeof provider.cleanup === 'function') {
		provider.cleanup();
	}
	provider = null;
}
