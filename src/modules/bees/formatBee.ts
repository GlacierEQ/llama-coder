import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info } from '../log';

/**
 * FormatBee automatically formats code according to project style guidelines
 */
export const formatBee: BuilderBee = {
    id: 'formatBee',
    displayName: 'Format Bee',
    description: 'Automatically formats code to match style guidelines',
    runOnSave: true,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document } = task;
        info(`Format Bee formatting ${document.uri.toString()}`);

        // Use VS Code's document formatting API
        try {
            await vscode.commands.executeCommand('editor.action.formatDocument');

            return {
                success: true,
                message: 'Document formatted successfully'
            };
        } catch (err) {
            return {
                success: false,
                message: `Formatting failed: ${(err as Error).message}`
            };
        }
    }
};
