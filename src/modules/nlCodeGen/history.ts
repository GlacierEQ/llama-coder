import * as vscode from 'vscode';
import { info, error } from '../log';
import { HistoryItem } from './types';

/**
 * Manages history of generated code snippets
 */
export class CodeGenerationHistory {
    private readonly historyKey = 'llamaCoder.nlCodeGen.history';
    private maxHistoryItems = 100;

    constructor(private context: vscode.ExtensionContext) {
        // Load max history items setting
        const config = vscode.workspace.getConfiguration('llama.nlCodeGen');
        this.maxHistoryItems = config.get<number>('maxHistoryItems', 100);
    }

    /**
     * Add a new item to history
     */
    public addItem(item: HistoryItem): void {
        try {
            const items = this.getItems();

            // Add the new item at the beginning
            items.unshift(item);

            // Limit the number of items
            if (items.length > this.maxHistoryItems) {
                items.splice(this.maxHistoryItems);
            }

            // Store the updated history
            this.context.globalState.update(this.historyKey, items);
        } catch (err) {
            error('Error adding history item', err as Error);
        }
    }

    /**
     * Get all history items
     */
    public getItems(): HistoryItem[] {
        try {
            const items = this.context.globalState.get<HistoryItem[]>(this.historyKey, []);
            return items;
        } catch (err) {
            error('Error getting history items', err as Error);
            return [];
        }
    }

    /**
     * Clear all history items
     */
    public clearItems(): void {
        try {
            this.context.globalState.update(this.historyKey, []);
            info('Code generation history cleared');
        } catch (err) {
            error('Error clearing history items', err as Error);
        }
    }
}
