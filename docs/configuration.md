# Llama Coder Configuration

Llama Coder offers several configuration options to customize your experience.

## VS Code Settings

Access these settings through VS Code's settings interface (Ctrl+, / Cmd+,) and search for "Llama Coder".

### Core Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `llamaCoder.model` | The CodeLlama model to use for completions | `"codellama:7b-instruct"` |
| `llamaCoder.enabled` | Enable/disable Llama Coder | `true` |
| `llamaCoder.triggerMode` | When to trigger suggestions: "automatic" or "manual" | `"automatic"` |
| `llamaCoder.ollamaEndpoint` | URL to your Ollama server | `"http://localhost:11434"` |

### Completion Behavior

| Setting | Description | Default |
|---------|-------------|---------|
| `llamaCoder.maxTokens` | Maximum number of tokens to generate | `256` |
| `llamaCoder.temperature` | Temperature for generation (0.0-2.0) | `0.2` |
| `llamaCoder.topP` | Top-p sampling (0.0-1.0) | `0.9` |
| `llamaCoder.suggestionDelay` | Delay in ms before showing suggestions | `300` |
| `llamaCoder.useFilesAsContext` | Include open files as context | `true` |
| `llamaCoder.maxContextFiles` | Maximum number of files to include | `5` |

### CodeContext RAG Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `llamaCoder.codecontext.enabled` | Enable/disable the CodeContext RAG system | `false` |
| `llamaCoder.codecontext.indexDepth` | Index depth: "basic", "standard", or "full" | `"standard"` |
| `llamaCoder.codecontext.maxIndexSize` | Maximum size of the codebase index (MB) | `2048` |
| `llamaCoder.codecontext.retrievalCount` | Number of code snippets to retrieve | `5` |
| `llamaCoder.codecontext.similarityThreshold` | Minimum similarity for retrieved snippets (0.0-1.0) | `0.75` |
| `llamaCoder.codecontext.realtimeIndexing` | Update index in real-time as files change | `true` |
| `llamaCoder.codecontext.excludedPaths` | Paths to exclude from indexing | `["node_modules", "dist", ".git"]` |
| `llamaCoder.codecontext.memoryOptimized` | Optimize for lower memory usage | `false` |

### Performance Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `llamaCoder.cacheCompletions` | Cache completions to improve performance | `true` |
| `llamaCoder.maxCacheSize` | Maximum number of cached completions | `1000` |
| `llamaCoder.lowLatencyMode` | Optimize for speed at the cost of quality | `false` |
| `llamaCoder.batchProcessing` | Process completions in batches to save resources | `true` |

### Filter Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `llamaCoder.enabledLanguages` | List of language IDs where Llama Coder is enabled | `["javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go", "rust", "php"]` |
| `llamaCoder.disabledFolders` | Patterns for folders where Llama Coder should be disabled | `["node_modules", ".git", "venv"]` |
| `llamaCoder.ignoreComments` | Ignore code comments when generating suggestions | `false` |

## Per-language Configurations

You can set language-specific configurations by using VS Code's language-specific settings:

```json
"[python]": {
  "llamaCoder.model": "codellama:13b-instruct",
  "llamaCoder.temperature": 0.1,
  "llamaCoder.codecontext.retrievalCount": 7
},
"[javascript]": {
  "llamaCoder.model": "codellama:7b-instruct",
  "llamaCoder.temperature": 0.3,
  "llamaCoder.codecontext.retrievalCount": 4
}
```

## Configuration File

For team settings, create a `.llamacoder.json` file in your project root:

```json
{
  "model": "codellama:7b-instruct",
  "temperature": 0.2,
  "enabledLanguages": ["typescript", "python"],
  "disabledFolders": ["node_modules", "dist"]
}
```

Project-level settings take precedence over user settings.

