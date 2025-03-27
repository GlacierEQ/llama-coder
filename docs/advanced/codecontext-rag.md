# CodeContext RAG System

The CodeContext RAG (Retrieval-Augmented Generation) system is an advanced feature in Llama Coder that dramatically improves code completion quality by leveraging your existing codebase as context.

## Overview

Traditional LLM-based code completion relies solely on the immediate context (current file and a few open files). CodeContext extends this by:

1. Indexing your entire codebase
2. Retrieving the most relevant code snippets for your current task
3. Using these snippets to inform the model's completions
4. Continuously learning from your interactions

This makes completions more relevant to your specific project structure, naming conventions, and patterns.

## How It Works

### Indexing Process

When enabled, CodeContext creates a searchable vector index of your codebase:

1. **Initial Indexing**: Scans your project files and builds embeddings
2. **Incremental Updates**: Monitors file changes and updates the index
3. **Semantic Understanding**: Represents code as vector embeddings that capture semantic meaning

### Retrieval During Completion

When you request a completion:

1. The current context is vectorized
2. Similar code snippets from your codebase are retrieved
3. These snippets are strategically inserted into the prompt
4. The model generates a completion that's consistent with your codebase

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   User Code     │────▶│  CodeContext    │────▶│   Enhanced      │
│   Context       │     │  RAG Engine     │     │   Completion    │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                        │  Project Code   │
                        │  Vector Index   │
                        │                 │
                        └─────────────────┘
```

## Benefits

- **Project-Specific Completions**: Suggestions that follow your codebase conventions
- **Improved Accuracy**: Better understanding of your APIs and custom components
- **Reduced Context Window Usage**: More efficient use of token limits
- **Learning Over Time**: Performance improves as your codebase grows
- **Works Offline**: All processing remains local and private

## Setting Up CodeContext

### Prerequisites

- 2GB+ additional RAM for the vector index
- SSD storage recommended for best performance

### Basic Setup

1. Enable CodeContext in settings:

   ```json
   "llamaCoder.codecontext.enabled": true
   ```

2. Let the initial indexing complete (a status indicator will show progress)

3. Start coding - completions will automatically leverage your codebase

### Advanced Configuration

```json
{
  "llamaCoder.codecontext.enabled": true,
  "llamaCoder.codecontext.indexDepth": "full", // "basic", "standard", "full"
  "llamaCoder.codecontext.maxIndexSize": 2048, // MB
  "llamaCoder.codecontext.retrievalCount": 5, // Number of snippets to retrieve
  "llamaCoder.codecontext.embeddingModel": "all-minilm-l6-v2", // Embedding model
  "llamaCoder.codecontext.similarityThreshold": 0.75, // Minimum similarity score
  "llamaCoder.codecontext.realtimeIndexing": true, // Update index as you code
  "llamaCoder.codecontext.excludedPaths": ["node_modules", "dist", ".git"]
}
```

## Customizing Retrieval

You can optimize how CodeContext retrieves information:

### By Relevance Types

```json
"llamaCoder.codecontext.retrievalSettings": {
  "prioritizeImplementations": true,
  "includeDocumentation": true,
  "includeTestCases": true,
  "includeInterfaces": true
}
```

### By File Distance

```json
"llamaCoder.codecontext.fileDistanceWeight": 0.7
```

Higher values prioritize files closer to your current file in the directory structure.

## Memory Usage Optimization

CodeContext works efficiently, but you can optimize for lower memory usage:

```json
"llamaCoder.codecontext.memoryOptimized": true,
"llamaCoder.codecontext.unloadIndexWhenIdle": true,
"llamaCoder.codecontext.maxSnippetLength": 500
```

## Troubleshooting

### Slow Initial Indexing

For large codebases, initial indexing may take time. You can:

- Reduce index depth: `"llamaCoder.codecontext.indexDepth": "basic"`
- Exclude more paths: `"llamaCoder.codecontext.excludedPaths": ["node_modules", "build", "assets"]`
- Schedule indexing: `"llamaCoder.codecontext.scheduleIndexing": "on-idle"`

### High Memory Usage

If CodeContext uses too much memory:

- Reduce retrieval count: `"llamaCoder.codecontext.retrievalCount": 3`
- Enable memory optimization: `"llamaCoder.codecontext.memoryOptimized": true`
- Limit index size: `"llamaCoder.codecontext.maxIndexSize": 1024`

### Poor Retrieval Quality

If irrelevant code is being retrieved:

- Increase similarity threshold: `"llamaCoder.codecontext.similarityThreshold": 0.85`
- Adjust chunk size: `"llamaCoder.codecontext.chunkSize": 256`
- Enable semantic chunking: `"llamaCoder.codecontext.semanticChunking": true`

## Best Practices

1. **Be patient with initial indexing** - the system gets faster after setup
2. **Start with default settings** - then tune based on your hardware
3. **Use with larger models** - 13B+ models benefit most from CodeContext
4. **Add meaningful comments** - they help the retrieval system find relevant code
5. **Structure your codebase well** - better organization improves retrieval quality
