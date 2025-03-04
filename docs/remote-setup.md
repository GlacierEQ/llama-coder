# Remote Setup Guide

This guide explains how to set up Llama Coder with a remote Ollama instance, allowing you to leverage more powerful hardware for inference.

## Why Use Remote Setup?

- Run larger models on dedicated hardware
- Free up local resources on your development machine
- Share a single powerful GPU across multiple developers
- Use larger models than your local machine could support

## Server Requirements

- Linux recommended (Ubuntu 22.04 LTS or newer)
- NVIDIA GPU with CUDA support (RTX series recommended)
- At least 16GB RAM (more recommended for larger models)
- SSD storage with at least 30GB free space

## Server Setup

1. **Install Ollama** on your server:

   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Configure Ollama** to accept remote connections:

   Create or edit `/etc/systemd/system/ollama.service.d/override.conf`:
   
   ```ini
   [Service]
   Environment="OLLAMA_HOST=0.0.0.0"
   ```

   Or set the environment variable before starting:
   
   ```bash
   export OLLAMA_HOST=0.0.0.0
   ```

3. **Restart Ollama** to apply changes:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

4. **Pull Models** you want to use:

   ```bash
   ollama pull codellama:34b-code-q4_K_M
   ollama pull codellama:13b-code-q4_K_M
   ollama pull stable-code:3b-code-q4_0
   ```

5. **Configure Firewall** to allow connections on port 11434:

   ```bash
   sudo ufw allow 11434/tcp
   sudo ufw reload
   ```

## Authentication (Optional but Recommended)

For secure remote access, set up authentication:

1. **Create an API key**:

   ```bash
   openssl rand -base64 32 > ollama-api.key
   ```

2. **Configure Ollama** to use the API key:

   Add to your service configuration:
   
   ```bash
   export OLLAMA_AUTH_TOKEN=$(cat /path/to/ollama-api.key)
   ```

## Client Setup

1. In VS Code, open Settings (Ctrl+,)

2. Search for "Llama Coder"

3. Configure the following settings:

   ```json
   {
     "llamaCoder.apiEndpoint": "http://your-server-ip:11434/api/generate",
     "llamaCoder.bearerToken": "your-api-key-if-configured",
     "llamaCoder.model": "codellama:13b-code-q4_K_M"
   }
   ```

4. Save settings and reload VS Code

## Testing the Connection

1. Open Command Palette (Ctrl+Shift+P)
2. Type "Llama Coder: Test Connection" and press Enter
3. You should see a success message with server information

## Troubleshooting Remote Connections

If you encounter connection issues:

1. **Verify Server Availability**:
   
   ```bash
   curl -X POST http://your-server-ip:11434/api/generate -d '{"model": "codellama:7b-code-q4_K_M", "prompt": "// test"}'
   ```

2. **Check Firewall Settings** on both client and server

3. **Verify Network Connectivity** between your development machine and server

4. **Review Server Logs**:
   
   ```bash
   journalctl -u ollama -f
   ```

## Advanced Configuration

### Load Balancing Multiple Servers

For teams, you can set up multiple Ollama servers and use load balancing:

