import * as vscode from 'vscode';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info, error } from '../log';

/**
 * BuildBee assists with building and compiling code
 */
export const buildBee: BuilderBee = {
    id: 'buildBee',
    displayName: 'Build Bee',
    description: 'Triggers builds and reports compilation issues',
    runOnSave: false,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document } = task;
        info(`Build Bee building project for ${document.uri.toString()}`);

        // Detect project type
        const projectType = await detectProjectType(document.uri);

        try {
            let success: boolean;
            let message: string;
            let diagnostics: vscode.Diagnostic[] = [];

            // Execute appropriate build command based on project type
            switch (projectType) {
                case 'typescript':
                    // For TypeScript, run tsc
                    await vscode.commands.executeCommand('typescript.build');
                    message = 'TypeScript build completed';
                    success = true;
                    break;

                case 'javascript':
                    // For JS/Node.js, run npm script
                    success = await executeNpmScript('build');
                    message = success ? 'npm build completed' : 'npm build failed';
                    break;

                case 'unknown':
                default:
                    // Try the default build task
                    try {
                        await vscode.commands.executeCommand('workbench.action.tasks.build');
                        success = true;
                        message = 'Build task completed';
                    } catch (e) {
                        success = false;
                        message = 'No build task configured';
                    }
            }

            return {
                success,
                message,
                diagnostics
            };
        } catch (err) {
            error('Build Bee error', err as Error);
            return {
                success: false,
                message: `Build failed: ${(err as Error).message}`
            };
        }
    }
};

/**
 * Detects the type of project in the workspace
 */
async function detectProjectType(documentUri: vscode.Uri): Promise<'typescript' | 'javascript' | 'unknown'> {
    const workspaceRoot = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!workspaceRoot) return 'unknown';

    // Check for tsconfig.json
    const tsconfigUri = vscode.Uri.joinPath(workspaceRoot.uri, 'tsconfig.json');
    try {
        await vscode.workspace.fs.stat(tsconfigUri);
        return 'typescript';
    } catch {
        // tsconfig.json not found
    }

    // Check for package.json
    const packageJsonUri = vscode.Uri.joinPath(workspaceRoot.uri, 'package.json');
    try {
        await vscode.workspace.fs.stat(packageJsonUri);
        return 'javascript';
    } catch {
        // package.json not found
    }

    return 'unknown';
}

/**
 * Executes an npm script in the workspace
 */
async function executeNpmScript(scriptName: string): Promise<boolean> {
    const terminal = vscode.window.createTerminal(`Build Bee - npm run ${scriptName}`);
    terminal.show();
    terminal.sendText(`npm run ${scriptName}`);

    // We can't easily know if the npm script succeeded from here,
    // so we'll optimistically return true.
    // A more sophisticated implementation could parse output.
    return true;
}
