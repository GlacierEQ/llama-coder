# API Reference

This document provides a technical reference for the APIs used by Llama Coder, helpful for advanced users, developers, and those integrating with the extension.

## Ollama API Endpoints

Llama Coder communicates with Ollama using the following endpoints:

### Generate Completion

**Endpoint:** `POST /api/generate`

**Description:** Generates a text completion based on the provided prompt.

**Request Body:**

## Llama Coder Extension API

For integrating with or extending Llama Coder:

### Commands

Llama Coder registers the following VS Code commands:

| Command | Description |
|---------|-------------|
| `llamaCoder.enable` | Enable the extension |
| `llamaCoder.disable` | Disable the extension |
| `llamaCoder.testConnection` | Test connection to Ollama |
| `llamaCoder.changeModel` | Change the current model |
| `llamaCoder.clearCache` | Clear completion cache |
| `llamaCoder.pauseCompletion` | Pause the current completion |

## Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `ECONNREFUSED` | Connection to Ollama refused | Check if Ollama is running |
| `ETIMEDOUT` | Request timed out | Increase timeout setting |
| `MODEL_NOT_FOUND` | Model not found | Pull the requested model |
| `INSUFFICIENT_RESOURCES` | Not enough resources | Use a smaller model or free resources |
| `AUTHENTICATION_ERROR` | Authentication failed | Check bearer token |

## WebSocket API

For streaming completions, Llama Coder uses WebSockets:

**Endpoint:** `ws://localhost:11434/api/generate`

**Connection Parameters:**
- `model`: Model to use
- `token`: Bearer token for authentication (if configured)

**Events:**
- `open`: Connection established
- `message`: Receives streamed completion tokens
- `error`: Connection error
- `close`: Connection closed

**Example WebSocket Usage:**
