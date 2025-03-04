# Using Custom Models with Llama Coder

This guide explains how to use custom or fine-tuned models with Llama Coder for specialized code completion tasks.

## Supported Model Types

Llama Coder works best with:
- CodeLlama variants
- Stable Code models
- Other code-specialized LLMs compatible with Ollama

## Adding a Custom Model to Ollama

### Using Pre-Built Models

1. **Import a pre-built model** from Hugging Face or other sources:
   ```bash
   ollama pull username/model-name:tag
   ```

2. **Verify the model is available**:
   ```bash
   ollama list
   ```

### Creating a Custom Modelfile

1. **Create a Modelfile** (similar to a Dockerfile):
   ```
   # Custom CodeLlama model
   FROM codellama:7b-code
   
   # Set custom parameters
   PARAMETER temperature 0.1
   PARAMETER top_p 0.8
   PARAMETER seed 42
   
   # Add custom system prompt
   SYSTEM """
   You are an AI programming assistant specialized in Go language.
   Always provide idiomatic Go code with proper error handling.
   Include documentation comments that follow Go best practices.
   """
   ```

2. **Build the model**:
   ```bash
   ollama create custom-go-assistant -f Modelfile
   ```

3. **Test the model**:
   ```bash
   ollama run custom-go-assistant "Write a function to read a file in Go"
   ```

## Using the Custom Model with Llama Coder

1. Open VS Code settings (Ctrl+,)
2. Search for "Llama Coder model"
3. Add your custom model name to the settings:
   ```json
   {
     "llamaCoder.model": "custom-go-assistant"
   }
   ```

## Fine-Tuning Models for Specific Codebases

For teams looking to fine-tune models on their codebase:

1. **Prepare your dataset**:
   - Collect code examples from your repositories
   - Format them as instruction-response pairs
   - Clean and preprocess the data

2. **Fine-tune using Ollama** (if supported) or external tools:
   ```bash
   # Example with hypothetical fine-tuning support
   ollama finetune --model codellama:7b-code --data training_data.jsonl --output my-company-model
   ```

3. **Import the fine-tuned model**:
   ```bash
   ollama import my-company-model.tar.gz
   ```

## Advanced: Model Quantization

Customize the quantization level to balance quality and resource usage:

1. **Choose a quantization method**:
   - Q4_0: Smallest size, fastest inference
   - Q4_K_M: Good balance
   - Q6_K: Better quality than Q4
   - Q8_0: High quality, larger size
   - F16: No quantization, best quality but largest

2. **Create a quantized model**:
   ```
   FROM codellama:7b-code-f16
   
   # Choose quantization level (example)
   QUANTIZE q4_k_m
   ```

3. **Build the quantized model**:
   ```bash
   ollama create custom-model-q4 -f Modelfile
   ```

## Optimizing Custom Models

Improve your custom model's performance:

1. **Use a specialized system prompt**:
   ```
   SYSTEM """
   You are an expert in [specific language/framework]. 
   Always follow these specific conventions:
   1. [Convention 1]
   2. [Convention 2]
   3. [Convention 3]
   """
   ```

2. **Adjust parameters for better results**:
   ```
   PARAMETER temperature 0.05  # More deterministic
   PARAMETER top_k 40          # Limited token selection
   PARAMETER repeat_penalty 1.1 # Reduce repetition
   ```

## Sharing Custom Models with Your Team

1. **Export the model**:
   ```bash
   ollama export custom-model > custom-model.tar.gz
   ```

2. **Distribute and import**:
   ```bash
   ollama import custom-model.tar.gz
   ```

3. **Create a team configuration guide** for VS Code settings

## Troubleshooting Custom Models

Common issues and solutions:

1. **Model not appearing in Llama Coder**:
   - Verify it's correctly imported in Ollama
   - Restart VS Code
   - Check VS Code extension output panel for errors

2. **Poor quality completions**:
   - Adjust temperature and top_p settings
   - Review your system prompt
   - Consider using a larger base model

3. **Model is too slow**:
   - Try a higher quantization level
   - Reduce the model size
   - Check system resources during inference

## Performance Expectations

| Model Type | Size | Memory Usage | Inference Speed | Use Case |
|------------|------|--------------|-----------------|----------|
| Custom 3B  | 2-5GB  | 3-6GB RAM     | Fast            | Resource-constrained environments |
| Custom 7B  | 4-8GB  | 5-9GB RAM     | Moderate        | Balanced performance |
| Custom 13B | 8-15GB | 10-16GB RAM   | Slower          | High quality completions |
| Custom 34B | 20-35GB| 24-40GB RAM   | Slowest         | Maximum quality, specialized tasks |

Remember that customized models might require additional optimization to match the performance of official Ollama models.
