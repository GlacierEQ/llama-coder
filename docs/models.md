# Model Selection Guide

Llama Coder supports various CodeLlama models through Ollama. This guide will help you choose the right model for your needs.

## Available Models

| Model | Size | Strengths | Weaknesses | RAM Required |
|-------|------|-----------|------------|--------------|
| `codellama:7b-instruct` | 4GB | Fast, works on most systems | Less accurate for complex code | 8GB+ |
| `codellama:13b-instruct` | 8GB | Good balance of speed/quality | Requires more resources | 16GB+ |
| `codellama:34b-instruct` | 19GB | High-quality completions | Slow, high resource usage | 32GB+ |
| `codellama:7b-code` | 4GB | Optimized for completion | Less context-aware | 8GB+ |
| `codellama:13b-code` | 8GB | Better completion quality | Less instructable | 16GB+ |
| `wizardcoder:7b-python` | 4GB | Python specialist | Limited to Python | 8GB+ |

## How to Choose

### By Hardware Constraints

- **Low-end systems (8GB RAM)**: `codellama:7b-instruct` or `wizardcoder:7b-python` (Python only)
- **Mid-range systems (16GB RAM)**: `codellama:13b-instruct` is recommended
- **High-end systems (32GB+ RAM)**: `codellama:34b-instruct` for best quality

### By Language

- **Python**: `wizardcoder:7b-python` or `codellama:13b-instruct`
- **JavaScript/TypeScript**: `codellama:7b-instruct` or better
- **C/C++/Rust**: `codellama:13b-instruct` or better
- **General purpose**: `codellama:13b-instruct`

### By Use Case

- **Fast suggestions**: `codellama:7b-code`
- **Balanced performance**: `codellama:7b-instruct`
- **High quality**: `codellama:13b-instruct`
- **Best available**: `codellama:34b-instruct`

## Installing Models

To install a model, use the Ollama command:

```bash
ollama pull MODEL_NAME
```

For example:

```bash
ollama pull codellama:13b-instruct
```

## Switching Models

You can switch models in VS Code settings:

1. Open Settings (Ctrl+, / Cmd+,)
2. Search for "Llama Coder model"
3. Enter the model name (e.g., "codellama:13b-instruct")

You can also set different models for different languages using VS Code's language-specific settings.

## Advanced: Quantization Options

If memory is constrained, you can use quantized models:

```bash
ollama pull codellama:13b-instruct-q4_0
```

Quantization reduces model size and memory requirements at a small cost to quality:

- `q4_0`: Good balance of quality/size (recommended)
- `q4_1`: Better quality, slightly larger
- `q5_0`: Higher quality, larger size
- `q5_1`: Highest quality, largest size

## Performance Tuning

For better performance with larger models:

1. Enable model caching in settings
2. Set lower values for max tokens (128-256)
3. Disable context files if not needed
4. Consider using language-specific models

