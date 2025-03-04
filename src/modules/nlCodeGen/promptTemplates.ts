/**
 * Templates for different code generation prompts
 */
export const PROMPT_TEMPLATES: Record<string, string> = {
    /**
     * Standard template for general code generation
     */
    standard: `You are an expert programmer and code assistant. Please write {{LANGUAGE}} code that does the following:

{{DESCRIPTION}}

Respond with clean, efficient, production-ready code. Include only the code without any explanation or markdown formatting.`,

    /**
     * Detailed template that asks for comments and documentation
     */
    detailed: `You are an expert programmer and code assistant. Please write {{LANGUAGE}} code that does the following:

{{DESCRIPTION}}

Requirements:
1. The code should be well-commented and documented
2. Include function/method documentation in the standard format for {{LANGUAGE}}
3. Include appropriate error handling
4. Follow best practices for {{LANGUAGE}}
5. Be efficient and well-optimized

Respond with clean, production-ready code that meets all requirements.`,

    /**
     * Concise template that prioritizes brevity
     */
    concise: `Expert programmer: Write minimal {{LANGUAGE}} code for:

{{DESCRIPTION}}

Provide only the most concise implementation possible with no explanation.`,

    /**
     * Template focused on performance optimization
     */
    optimized: `As an expert in {{LANGUAGE}} performance optimization, write highly efficient code that accomplishes:

{{DESCRIPTION}}

Your code should:
1. Minimize time complexity
2. Minimize space complexity
3. Avoid unnecessary operations
4. Use appropriate data structures
5. Follow {{LANGUAGE}} performance best practices

Provide only the optimized code without explanation.`
};
