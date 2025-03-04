# Getting Started with Llama Coder

This guide will help you install and set up Llama Coder, a privacy-focused code completion tool that runs locally.

## Prerequisites

- [VS Code](https://code.visualstudio.com/) (version 1.60.0 or higher)
- [Ollama](https://ollama.ai/) (latest version recommended)
- At least 8GB RAM (16GB+ recommended for larger models)
- 10GB+ free disk space for model storage

## Installation

### Step 1: Install Ollama

First, install Ollama by following the instructions for your operating system:

- **Windows**: Download the installer from [ollama.ai](https://ollama.ai)
- **macOS**: `brew install ollama`
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`

### Step 2: Install the VS Code Extension

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Llama Coder"
4. Click "Install"

### Step 3: Download a Code Model

Open a terminal and run:

```bash
ollama pull codellama:7b-instruct
```

For better completions with a larger model, you can use:

```bash
ollama pull codellama:13b-instruct
```

### Step 4: Configure Llama Coder

1. Open VS Code settings (Ctrl+, / Cmd+,)
2. Search for "Llama Coder"
3. Set your preferred model (default is "codellama:7b-instruct")
4. Adjust other settings as needed

## First Use

1. Open a code file in VS Code
2. Start typing code 
3. Llama Coder will suggest completions as you type
4. Accept suggestions using Tab or continue typing to ignore them

## Basic Commands

- **Trigger Inline Suggestion**: Ctrl+Space (after disabling other extensions using this shortcut)
- **Accept Suggestion**: Tab
- **Reject Suggestion**: Escape
- **Show Next Suggestion**: Alt+] (Windows/Linux) or Option+] (Mac)
- **Show Previous Suggestion**: Alt+[ (Windows/Linux) or Option+[ (Mac)
- **Trigger Full Completion**: Alt+\ (Windows/Linux) or Option+\ (Mac)

## Next Steps

- Explore the [Configuration](./configuration.md) options
- Learn about [Model Selection](./models.md) to find the right balance of quality and performance
- Check out the [Keyboard Shortcuts](./shortcuts.md) for more efficient usage
