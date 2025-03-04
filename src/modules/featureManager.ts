declare const vscode: any;

class FeatureManager {
    private features: Record<string, boolean> = {};
    private readonly featureConfigKey = 'llamaCoder.features';

    constructor(private context: any) {
        this.loadFeatures();
    }

    private loadFeatures() {
        const config = vscode.workspace.getConfiguration();
        this.features = config.get(this.featureConfigKey, {});
    }

    private saveFeatures() {
        const config = vscode.workspace.getConfiguration();
        config.update(this.featureConfigKey, this.features, true);
    }

    isEnabled(feature: string): boolean {
        return this.features[feature] || false;
    }

    enableFeature(feature: string) {
        this.features[feature] = true;
        this.saveFeatures();
    }

    disableFeature(feature: string) {
        this.features[feature] = false;
        this.saveFeatures();
    }

    getAvailableFeatures(): string[] {
        return Object.keys(this.features);
    }

    registerFeature(feature: string, enabledByDefault = false) {
        if (!this.features.hasOwnProperty(feature)) {
            this.features[feature] = enabledByDefault;
            this.saveFeatures();
        }
    }
}

let featureManager: FeatureManager | null = null;

export function initializeFeatureManager(context: any) {
    featureManager = new FeatureManager(context);
}

export function isFeatureEnabled(feature: string): boolean {
    return featureManager?.isEnabled(feature) || false;
}

export function enableFeature(feature: string) {
    featureManager?.enableFeature(feature);
}

export function disableFeature(feature: string) {
    featureManager?.disableFeature(feature);
}

export function registerFeature(feature: string, enabledByDefault = false) {
    featureManager?.registerFeature(feature, enabledByDefault);
}
