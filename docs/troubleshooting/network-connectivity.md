# Network Connectivity Troubleshooting

## Introduction
This guide helps you resolve common network connectivity issues, particularly fetch timeout errors that may occur when using Llama Coder. Following these steps systematically will help identify and resolve most connectivity problems.

## Common Error Messages
- `Error: fetch timeout after X seconds`
- `Network request failed: timeout exceeded`
- `Unable to connect to completion service`
- `Connection refused at endpoint`
- `SSL certificate verification failed`

## Basic Troubleshooting Steps

1. **Verify Network Connectivity:**  
   Ensure your internet connection is stable and that no firewall or proxy settings are interfering with outbound requests.

2. **Increase Timeout (if configurable):**  
   Check extension settings or configuration files for an option to increase the fetch timeout value:
   ```json
   {
     "llamaCoder.network.fetchTimeout": 30000,
     "llamaCoder.network.retryCount": 3
   }
   ```

3. **Disable Conflicting Extensions:**  
   If you're using third-party extensions (such as Blackbox) that perform network requests, try disabling them temporarily to see if the issue persists.

4. **Review Developer Logs:**  
   Open VS Code's Developer Tools (Help → Toggle Developer Tools → Console) for additional error details which might help isolate the problem.

## Advanced Troubleshooting

5. **Network Traffic Analysis:**
   Use tools like Wireshark or Fiddler to analyze network traffic and identify specific connection issues.

6. **API Endpoint Verification:**
   Verify the API endpoints are correctly configured in your settings:
   ```json
   {
     "llamaCoder.apiEndpoint": "https://your-ollama-server:11434/api/generate"
   }
   ```

7. **Self-Diagnosis Tools:**  
   Run the built-in diagnostics:
   ```
   Command Palette → Llama Coder: Run Network Diagnostics
   ```

## Remote Ollama Troubleshooting

When connecting to a remote Ollama instance:

1. **Verify OLLAMA_HOST setting** on the remote machine
   ```bash
   export OLLAMA_HOST=0.0.0.0
   ```

2. **Check firewall settings** on the remote machine to allow port 11434

3. **Verify connectivity** using curl:
   ```bash
   curl -X POST http://your-ollama-server:11434/api/generate -d '{"model": "codellama:7b-code-q4_K_M", "prompt": "// function to add two numbers"}'
   ```

Remember, the most autonomous developers take ownership of their tools. Don't be afraid to explore configuration options, read documentation thoroughly, and experiment with different settings to find what works best for your specific situation.
