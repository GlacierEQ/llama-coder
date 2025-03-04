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
