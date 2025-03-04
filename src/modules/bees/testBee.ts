import * as vscode from 'vscode';
import * as path from 'path';
import { BuilderBee, BeeTask, BeeResult } from './types';
import { info, warn, error } from '../log';

/**
 * TestBee runs tests for the current project or file
 */
export const testBee: BuilderBee = {
    id: 'testBee',
    displayName: 'Test Bee',
    description: 'Runs tests and reports results',
    runOnSave: false,

    async execute(task: BeeTask): Promise<BeeResult> {
        const { document, context } = task;
        info(`Test Bee running tests for ${document.uri.toString()}`);

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return {
                success: false,
                message: 'No workspace folder found for current document'
            };
        }

        try {
            // Check if current file is a test file
            const fileName = path.basename(document.uri.fsPath);
            const isTestFile = fileName.includes('.test.') ||
                fileName.includes('.spec.') ||
                fileName.endsWith('Test.js') ||
                fileName.endsWith('Test.ts');

            // Detect project type
            const projectType = await detectProjectType(workspaceFolder.uri);

            // Run appropriate test command
            const diagnostics: vscode.Diagnostic[] = [];
            let success = false;
            let message = '';

            if (isTestFile) {
                // Run test for this specific file
                success = true;
                message = await runTestForFile(document.uri, projectType);
            } else {
                // Run tests for the project
                message = await runProjectTests(workspaceFolder.uri, projectType);
                success = !message.toLowerCase().includes('fail');
            }

            return {
                success,
                message,
                diagnostics
            };
        } catch (err) {
            error('Test Bee error', err as Error);
            return {
                success: false,
                message: `Test execution failed: ${(err as Error).message}`
            };
        }
    }
};

/**
 * Detects the type of test framework used in the project
 */
async function detectProjectType(workspaceUri: vscode.Uri): Promise<'jest' | 'mocha' | 'jasmine' | 'unknown'> {
    const packageJsonUri = vscode.Uri.joinPath(workspaceUri, 'package.json');

    try {
        const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
        const packageJson = JSON.parse(packageJsonContent.toString());

        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        if (dependencies.jest) return 'jest';
        if (dependencies.mocha) return 'mocha';
        if (dependencies.jasmine) return 'jasmine';

        return 'unknown';
    } catch {
        return 'unknown';
    }
}

/**
 * Runs tests for a specific file
 */
async function runTestForFile(fileUri: vscode.Uri, projectType: string): Promise<string> {
    const relativePath = vscode.workspace.asRelativePath(fileUri);
    const terminal = vscode.window.createTerminal(`Test Bee - ${relativePath}`);
    terminal.show();

    switch (projectType) {
        case 'jest':
            terminal.sendText(`npx jest ${relativePath} --verbose`);
            return `Running Jest tests for ${relativePath}...`;

        case 'mocha':
            terminal.sendText(`npx mocha ${relativePath}`);
            return `Running Mocha tests for ${relativePath}...`;

        case 'jasmine':
            terminal.sendText(`npx jasmine ${relativePath}`);
            return `Running Jasmine tests for ${relativePath}...`;

        default:
            // Try to run the test script from package.json
            terminal.sendText(`npm test -- ${relativePath}`);
            return `Running tests for ${relativePath} using npm test...`;
    }
}

/**
 * Runs all tests for the project
 */
async function runProjectTests(workspaceUri: vscode.Uri, projectType: string): Promise<string> {
    const terminal = vscode.window.createTerminal(`Test Bee - Project Tests`);
    terminal.show();

    switch (projectType) {
        case 'jest':
            terminal.sendText(`npx jest`);
            return `Running all Jest tests...`;

        case 'mocha':
            terminal.sendText(`npx mocha`);
            return `Running all Mocha tests...`;

        case 'jasmine':
            terminal.sendText(`npx jasmine`);
            return `Running all Jasmine tests...`;

        default:
            // Run the test script from package.json
            terminal.sendText(`npm test`);
            return `Running project tests using npm test...`;
    }
}
