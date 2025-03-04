# Frequently Asked Questions

## General Questions

### What is Llama Coder?
Llama Coder is a self-hosted alternative to GitHub Copilot that runs locally using Ollama and CodeLlama models, providing code completions while preserving your privacy.

### How does Llama Coder compare to GitHub Copilot?
While GitHub Copilot uses cloud-based models with higher quality and faster response times, Llama Coder offers privacy (all processing happens locally), no subscription fees, and customization options. The quality gap is narrowing as local models improve.

### What languages does Llama Coder support?
Llama Coder supports most popular programming languages including JavaScript, TypeScript, Python, Java, C/C++, C#, Go, Rust, PHP, Ruby, and more. Some languages may have better completion quality than others.

## Technical Questions

### Why is Llama Coder slow to generate completions?
Local language models require significant computing power. To improve performance:
- Use a smaller model (e.g., 7B instead of 13B)
- Reduce the max tokens setting
- Use a GPU if available
- Try quantized models (Q4_0 or Q4_1)
- Enable caching in settings

### Can Llama Coder work offline?
Yes, once the model is downloaded, Llama Coder works completely offline as everything runs locally.

### Why does Llama Coder use so much memory?
Large language models require significant RAM to operate efficiently. The models range from 4GB to 20GB+ in memory usage. Use a smaller model or quantized version if you have limited RAM.

### Is a GPU required?
No, but strongly recommended. CPU-only operation is possible but may be slow. Any NVIDIA GPU with 6GB+ VRAM will significantly improve performance.

### Do completions get sent to any remote servers?
No. All processing happens locally between VS Code, the Llama Coder extension, and your local Ollama installation.

## Setup & Configuration

### How do I install Ollama?
Visit [ollama.ai](https://ollama.ai) and follow the installation instructions for your platform.

### Which model should I start with?
For most users, `codellama:7b-instruct` provides a good balance between quality and resource usage. If you have 16GB+ RAM, try `codellama:13b-instruct` for better completions.

### Why isn't Ollama connecting?
Ensure Ollama is running properly (check with `ollama list` in terminal). The default endpoint is `http://localhost:11434`. If using a remote server, make sure to update the endpoint in settings.

### Can I use Llama Coder with remote development?
Yes. For VS Code Remote Development, you need to install the extension in both local and remote VS Code instances and have Ollama running on the remote machine.

## Troubleshooting

### Completions suddenly stopped working
Try these steps:
1. Restart the Ollama service
2. Reload VS Code window
3. Check if Ollama is running (`ollama list` in terminal)
4. Verify the model is properly loaded
5. Check the VS Code error logs

### The completions are low quality
Try:
- Using a larger model (13B or 34B instead of 7B)
- Decreasing the temperature setting (try 0.1-0.2)
- Providing more context in your code
- Enabling the use of open files as context
- Using a more specific model for your language

### Where can I report bugs?
Please report issues on our [GitHub repository](https://github.com/user/llama-coder/issues).
