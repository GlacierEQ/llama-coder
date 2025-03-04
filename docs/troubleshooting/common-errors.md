# Common Errors and Solutions

This guide addresses the most common errors you might encounter when using Llama Coder and provides solutions for each issue.

## Installation Errors

### Error: "Ollama not found"

**Symptoms:**
- Extension shows "Ollama not found" message
- No completions appear

**Solutions:**
1. Verify Ollama is installed:
   ```bash
   ollama --version
   ```
2. Ensure Ollama is running:
   ```bash
   # Check if running
   ps aux | grep ollama
   
   # Start if not running
   ollama serve
   ```
3. Restart VS Code

### Error: "Failed to download model"

**Symptoms:**
- Model download fails or hangs
- Error message in VS Code output panel

**Solutions:**
1. Check internet connectivity
2. Verify disk space (models require significant space)
3. Try manual download:
   ```bash
   ollama pull stable-code:3b-code-q4_0
   ```
4. Check Ollama logs for specific errors

## Connection Errors

### Error: "Connection refused"

**Symptoms:**
- "Connection refused" error in VS Code output
- No completions appear

**Solutions:**
1. Verify Ollama is running
2. Check endpoint configuration in settings
3. For remote setup, ensure OLLAMA_HOST is set to "0.0.0.0"
4. Verify firewall allows connections on port 11434

### Error: "Bearer token invalid"

**Symptoms:**
- Authentication errors in logs
- "Unauthorized" messages

**Solutions:**
1. Verify bearer token is correctly set in VS Code settings
2. Check that the token matches what's configured on the server
3. Ensure token has no extra spaces or special characters

### "Failed to connect to Ollama server"

**Symptoms:**
- Status bar shows "Disconnected" 
- No completions appear
- Error message in VS Code notifications

**Solutions:**
1. Verify Ollama is running with `ollama list` in terminal
2. Check if Ollama service started properly
3. Ensure the endpoint in settings is correct (default: `http://localhost:11434`)
4. Try restarting the Ollama service:
   ```bash
   # Linux/macOS
   sudo systemctl restart ollama
   
   # Windows
   # Restart via Services app or Task Manager
   ```
5. Check for firewall blocking connections to port 11434

### "Unable to pull model"

**Symptoms:**
- Error when trying to download a model
- Model doesn't appear in `ollama list`

**Solutions:**
1. Check your internet connection
2. Verify you have sufficient disk space
3. Try with `sudo` (Linux/macOS) if permissions are an issue
4. Check the exact model name spelling
5. Try pulling a smaller model first to test

## Performance Errors

### Error: "Completion timeout"

**Symptoms:**
- Completions start but never finish
- "Timeout" error after long wait

**Solutions:**
1. Increase timeout setting:
   ```json
   {
     "llamaCoder.network.fetchTimeout": 30000
   }
   ```
2. Try a smaller model
3. Check system resource usage during completions

### Error: "Out of memory"

**Symptoms:**
- VS Code crashes
- Ollama process terminates
- System becomes unresponsive

**Solutions:**
1. Use a smaller model or one with higher quantization
2. Close other memory-intensive applications
3. Increase swap space (Linux/macOS) or page file (Windows)
4. Consider remote inference on a more powerful machine

### "Completions are extremely slow"

**Symptoms:**
- Long delay between typing and suggestions
- VS Code becomes unresponsive

**Solutions:**
1. Use a smaller model (e.g., switch from 13B to 7B)
2. Try a quantized model variant (e.g., `codellama:7b-instruct-q4_0`)
3. Reduce `maxTokens` setting to generate shorter completions
4. Enable the cache in settings
5. Disable other resource-intensive extensions
6. Close unnecessary applications to free memory
7. Check if your CPU is throttling due to overheating

### "System runs out of memory"

**Symptoms:**
- VS Code or Ollama crashes
- System becomes extremely slow
- Error about insufficient memory

**Solutions:**
1. Use a smaller model that fits your available RAM
2. Close other memory-intensive applications
3. Increase your swap/page file size
4. Try a quantized model that uses less memory
5. Disable using workspace files as context

## Model Errors

### Error: "Model not found"

**Symptoms:**
- "Model not found" error message
- Completions fail to generate

**Solutions:**
1. Verify model is downloaded:
   ```bash
   ollama list
   ```
2. Download the model if missing:
   ```bash
   ollama pull codellama:7b-code-q4_K_M
   ```
3. Check model name is spelled correctly in settings

### Error: "Incompatible model"

**Symptoms:**
- Error about model compatibility
- Model loads but crashes

**Solutions:**
1. Check hardware compatibility (some models need specific GPU capabilities)
2. Try a different quantization level
3. Update Ollama to the latest version

## Quality Issues

### "Completions are low quality or irrelevant"

**Symptoms:**
- Suggestions don't match your coding style
- Completions contain errors
- Generated code doesn't make sense

**Solutions:**
1. Try a larger model (e.g., 13B instead of 7B)
2. Decrease the temperature setting (0.1-0.2 is often better for code)
3. Enable using workspace files as context
4. Provide more code context before expecting completions
5. Try language-specific models for better results

### "Completions contain outdated practices"

**Symptoms:**
- Model suggests deprecated APIs or methods
- Code doesn't follow modern best practices

**Solutions:**
1. Use newer model versions when available
2. Provide examples of preferred patterns in your code
3. Try a model fine-tuned on newer codebases
4. Explicitly show modern patterns before expecting completions

## Plugin Errors

### Error: "Extension activation failed"

**Symptoms:**
- Llama Coder fails to activate
- Error in VS Code extensions panel

**Solutions:**
1. Check VS Code logs (Help → Toggle Developer Tools)
2. Reinstall the extension
3. Verify VS Code is up to date
4. Try disabling other extensions to check for conflicts

## VS Code Integration Issues

### "Extension doesn't activate"

**Symptoms:**
- No Llama Coder icon in status bar
- No suggestions appear at all
- Extension doesn't show as running

**Solutions:**
1. Check extension is properly installed
2. Verify VS Code version is compatible (1.60.0+)
3. Look for errors in the Output panel (Ctrl+Shift+U, select "Llama Coder")
4. Try reinstalling the extension
5. Check for extension conflicts

### "Keyboard shortcuts don't work"

**Symptoms:**
- Can't accept suggestions with Tab
- Commands don't respond to keyboard shortcuts

**Solutions:**
1. Check for keyboard shortcut conflicts in VS Code settings
2. Reset keyboard shortcuts to defaults
3. Verify the extension is active
4. Try reloading VS Code window
5. Check the keybindings.json file for custom bindings

## How to Report Bugs

If you encounter an error not covered here:

1. Collect logs:
   - VS Code output panel (View → Output → Llama Coder)
   - Ollama logs (typically in system logs)

2. Note your system configuration:
   - OS type and version
   - Hardware specs (CPU, RAM, GPU)
   - VS Code version
   - Llama Coder version
   - Model being used

3. Create a detailed bug report on GitHub including:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Logs and system information
   - Any solutions you've already tried

## Last Resort Solutions

If you've tried everything above and still have issues:

1. Completely uninstall and reinstall both Ollama and the Llama Coder extension
2. Check the VS Code logs for detailed error information
3. Clear the extension's cache folder
4. Try a different VS Code profile
5. Verify you have the latest version of both Ollama and Llama Coder
6. Report the issue on GitHub with detailed information about your setup
