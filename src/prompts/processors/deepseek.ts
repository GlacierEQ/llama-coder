export function adaptDeepseekPrompt({ prefix, suffix }: { prefix: string; suffix: string; }): { prompt: string; stop: string[] } {
    // Clean up and merge prefix and suffix for deepseek formatting
    const cleanedPrefix = prefix.trimEnd();
    const cleanedSuffix = suffix.trimStart();
    // Deepseek may perform better with clear prompt boundaries and a custom stop sequence
    const prompt = `${cleanedPrefix}\n${cleanedSuffix}`;
    const stop = ['\n\n']; // Stop token indicating end of completion
    return { prompt, stop };
}
