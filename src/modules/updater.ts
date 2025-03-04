declare const vscode: any;

class Updater {
    private readonly updateCheckInterval = 24 * 60 * 60 * 1000; // 24 hours
    private readonly githubReleasesUrl = 'https://api.github.com/repos/ex3ndr/llama-coder/releases/latest';
    private timer: any = null;

    constructor(private context: any) {}

    async start() {
        await this.checkForUpdates();
        this.timer = setInterval(() => this.checkForUpdates(), this.updateCheckInterval);
        this.context.subscriptions.push({
            dispose: () => {
                if (this.timer) {
                    clearInterval(this.timer);
                }
            }
        });
    }

    private async checkForUpdates() {
        try {
            const response = await this.fetchLatestVersion();
            const latestVersion = response.tag_name.replace('v', '');
            const currentVersion = this.context.extension.packageJSON.version;

            if (this.isNewerVersion(latestVersion, currentVersion)) {
                this.showUpdateNotification(latestVersion);
            }
        } catch (err) {
            console.error('Failed to check for updates:', err);
        }
    }

    private isNewerVersion(latest: string, current: string): boolean {
        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);

        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        return false;
    }

    private showUpdateNotification(version: string) {
        if (typeof vscode === 'undefined') return;
        
        vscode.window.showInformationMessage(
            `Llama Coder ${version} is available!`,
            'Update Now',
            'Later'
        ).then((selection: string) => {
            if (selection === 'Update Now') {
                vscode.commands.executeCommand('workbench.extensions.installExtension', 'ex3ndr.llama-coder');
            }
        });
    }

    private async fetchLatestVersion(): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.githubReleasesUrl);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`HTTP error ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send();
        });
    }

}

export function initializeUpdater(context: any) {
    const updater = new Updater(context);
    updater.start();
}
