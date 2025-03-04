declare const vscode: any;
import { info, error } from '../log';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export class ChatProvider {
    private messages: ChatMessage[] = [];
    private webviewPanel: any = null;
    private readonly viewType = 'llamaCoder.chat';

    constructor(private context: any) { }

    public show() {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            this.viewType,
            'Llama Coder Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.webviewPanel.webview.html = this.getWebviewContent();
        this.webviewPanel.onDidDispose(() => { this.webviewPanel = null; });

        this.webviewPanel.webview.onDidReceiveMessage(async (message: any) => {
            switch (message.command) {
                case 'sendMessage':
                    await this.handleUserMessage(message.text);
                    break;
                case 'clearHistory':
                    this.clearHistory();
                    break;
            }
        });
    }

    private async handleUserMessage(text: string) {
        try {
            this.addMessage({ role: 'user', content: text, timestamp: Date.now() });
            const response = await this.processUserMessage(text);
            this.addMessage({ role: 'assistant', content: response, timestamp: Date.now() });
            this.updateWebview();
        } catch (err) {
            error('Failed to process message', err as Error);
        }
    }

    private async processUserMessage(text: string): Promise<string> {
        return `Processing your request: ${text}`;
    }

    private addMessage(message: ChatMessage) {
        this.messages.push(message);
        this.updateWebview();
    }

    private clearHistory() {
        this.messages = [];
        this.updateWebview();
    }

    private updateWebview() {
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                command: 'updateMessages',
                messages: this.messages
            });
        }
    }

    private getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 10px; }
                    .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
                    .user { background: var(--vscode-editor-background); }
                    .assistant { background: var(--vscode-editor-selectionBackground); }
                    #input-box { width: 100%; padding: 10px; margin-top: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
                    .actions { margin-top: 10px; display: flex; gap: 10px; }
                    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div id="messages"></div>
                <div class="actions">
                    <input type="text" id="input-box" placeholder="Type your message...">
                    <button onclick="sendMessage()">Send</button>
                    <button onclick="clearHistory()">Clear</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const messagesDiv = document.getElementById('messages');
                    const inputBox = document.getElementById('input-box');
                    function sendMessage() {
                        const text = inputBox.value.trim();
                        if (text) {
                            vscode.postMessage({ command: 'sendMessage', text });
                            inputBox.value = '';
                        }
                    }
                    function clearHistory() { vscode.postMessage({ command: 'clearHistory' }); }
                    inputBox.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        if (message.command === 'updateMessages') {
                            updateMessages(message.messages);
                        }
                    });
                    function updateMessages(messages) {
                        messagesDiv.innerHTML = messages.map(msg => 
                            '<div class="message ' + msg.role + '">' +
                            '<strong>' + msg.role + ':</strong>' +
                            '<pre>' + msg.content + '</pre>' +
                            '<small>' + new Date(msg.timestamp).toLocaleString() + '</small>' +
                            '</div>'
                        ).join('');
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    }
                </script>
            </body>
            </html>
        `;
    }
}
