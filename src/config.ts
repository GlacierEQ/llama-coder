declare const vscode: any;
import { ModelFormat } from './prompts/processors/models';
import { error } from './modules/log';

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}




class Config {

    // Inference
    get inference() {
        let config = this.#config;

        // Load endpoint
        let endpoint = (config.get('endpoint') as string).trim();
        if (endpoint.endsWith('/')) {
            endpoint = endpoint.slice(0, endpoint.length - 1).trim();
        }
        if (endpoint === '') {
            endpoint = 'http://127.0.0.1:11434';
        }
        
        // Validate endpoint URL
        try {
            if (!isValidUrl(endpoint)) {
                throw new Error('Invalid URL format');
            }

        } catch (err) {
            error('Invalid endpoint URL', err as Error);
            endpoint = 'http://127.0.0.1:11434';
        }

        let bearerToken = (config.get('bearerToken') as string || '').trim();
        if (bearerToken.length > 512) {
            error('Bearer token is too long');
            bearerToken = '';
        }


        // Load general paremeters
        let maxLines = Math.min(Math.max(config.get('maxLines') as number || 10, 1), 100);
        let maxTokens = Math.min(Math.max(config.get('maxTokens') as number || 50, 10), 1000);
        let temperature = Math.min(Math.max(config.get('temperature') as number || 0.7, 0), 1);


        // Load model
        let modelName = (config.get('model') as string || 'codellama').trim();
        let modelFormat: ModelFormat = 'codellama';
        if (modelName === 'custom') {
            modelName = (config.get('custom.model') as string || 'codellama').trim();
            modelFormat = config.get('custom.format') as ModelFormat || 'codellama';

        } else {
            if (modelName.startsWith('deepseek-coder')) {
                modelFormat = 'deepseek';
            } else if (modelName.startsWith('stable-code')) {
                modelFormat = 'stable-code';
            }
        }

        let delay = Math.min(Math.max(config.get('delay') as number || 100, 0), 5000);


        return {
            endpoint,
            bearerToken,
            maxLines,
            maxTokens,
            temperature,
            modelName,
            modelFormat,
            delay
        };
    }

    // Notebook
    get notebook() {
        let config = vscode.workspace.getConfiguration('notebook');

        let includeMarkup = config.get('includeMarkup') as boolean;
        let includeCellOutputs = config.get('includeCellOutputs') as boolean;
        let cellOutputLimit = config.get('cellOutputLimit') as number;
        return {
            includeMarkup,
            includeCellOutputs,
            cellOutputLimit,
        };
    }

    get #config() {
        return vscode.workspace.getConfiguration('inference');
    };
}

export const config = new Config();
