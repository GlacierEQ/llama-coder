import * as vscode from 'vscode';
import { info, error } from '../log';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { getOllamaCompletion } from '../ollama/completion';
import { OllamaModel } from '../ollama/models';

/**
 * Result from generating code
 */
interface CodeGenResult {
    success: boolean;
    code?: string;
    error?: string;
}

/**
 * Generates code from a natural language description using the Llama model
 * 
 * @param description Natural language description of the code to generate
 * @param language Target programming language
 * @param contextCode Optional context code from the editor
 * @param templateType Type of prompt template to use
 * @param cancellationToken Optional cancellation token
 */
export async function generateCodeFromDescription(
    description: string,
    language: string,
    contextCode: string = '',
    templateType: string = 'standard',
    cancellationToken?: vscode.CancellationToken
): Promise<CodeGenResult> {
    try {
        // Load configuration
        const config = vscode.workspace.getConfiguration('llama');
        const ollamaEndpoint = config.get<string>('inference.endpoint', '');
        const bearerToken = config.get<string>('inference.bearerToken', '');
        const promptTemperature = config.get<number>('inference.temperature', 0.2);
        const maxTokens = config.get<number>('nlCodeGen.maxTokens', 1000);

        // Get the model to use
        const modelConfig = config.get<string>('inference.model', 'stable-code:3b-code-q4_0');
        let model: OllamaModel;

        if (modelConfig === 'custom') {
            const customModel = config.get<string>('inference.custom.model', '');
            const customFormat = config.get<string>('inference.custom.format', 'stable-code');
            model = { name: customModel, format: customFormat as 'stable-code' | 'codellama' | 'deepseek' };
        } else {
            // Parse model name and format
            const parts = modelConfig.split(':');
            const format = parts[0] as 'stable-code' | 'codellama' | 'deepseek';
            model = { name: modelConfig, format };
        }

        // Get the appropriate template
        const template = PROMPT_TEMPLATES[templateType] || PROMPT_TEMPLATES.standard;

        // Build the prompt with the description, language, and optional context
        let prompt = template
            .replace('{{LANGUAGE}}', language)
            .replace('{{DESCRIPTION}}', description);

        // Add context if available and requested
        if (contextCode) {
            prompt += `\n\nHere is some context from the current file that might be helpful:\n\`\`\`${language}\n${contextCode}\n\`\`\``;
        }

        info(`Sending prompt for code generation: ${prompt.substring(0, 100)}...`);

        // Call the Ollama API for completion
        const completion = await getOllamaCompletion(
            ollamaEndpoint,
            model,
            prompt,
            {
                temperature: promptTemperature,
                max_tokens: maxTokens,
                bearer_token: bearerToken
            },
            cancellationToken
        );

        if (!completion || cancellationToken?.isCancellationRequested) {
            return {
                success: false,
                error: 'Generation cancelled or no response received'
            };
        }

        // Extract the code from the response
        const generatedCode = extractCodeFromResponse(completion, language);

        return {
            success: true,
            code: generatedCode
        };
    } catch (err) {
        error('Error generating code', err as Error);
        return {
            success: false,
            error: (err as Error).message
        };
    }
}

/**
 * Extracts code blocks from the LLM response
 */
function extractCodeFromResponse(response: string, language: string): string {
    // Try to find code blocks with the target language
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?([\\s\\S]*?)\`\`\``, 'gi');
    const matches = response.match(codeBlockRegex);

    if (matches && matches.length > 0) {
        // Extract code from the first matching code block
        const codeBlock = matches[0];
        return codeBlock
            .replace(/```(?:\w+)?/g, '') // Remove the code fence markers
            .replace(/```/g, '')        // Remove the closing code fence
            .trim();
    }

    // If no code blocks found, try to heuristically extract what looks like code
    const lines = response.split('\n');
    let inCodeSection = false;
    const codeLines = [];

    for (const line of lines) {
        // Skip explanation lines at the beginning
        if (!inCodeSection && (line.startsWith('Here') || line.startsWith('I') || line.startsWith('This') || line.trim() === '')) {
            continue;
        }

        // Once we start seeing code-like lines, we're in the code section
        inCodeSection = true;
        codeLines.push(line);
    }

    return codeLines.join('\n').trim();
}
