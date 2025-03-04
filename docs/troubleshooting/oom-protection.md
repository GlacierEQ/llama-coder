# Out-of-Memory Protection

Large language models like CodeLlama can consume significant amounts of system memory. This guide covers strategies to prevent out-of-memory (OOM) errors when using Llama Coder.

## Understanding Memory Usage

Memory usage in Llama Coder comes primarily from:

1. **Model Size**: The main factor determining memory consumption
2. **Context Length**: Longer contexts require more memory
3. **Batch Size**: Affects memory usage during processing
4. **Quantization Level**: Lower quantization reduces memory requirements

## OOM Protection Features

Llama Coder includes several built-in protections against memory exhaustion:

### Memory Guardian

The Memory Guardian feature automatically monitors system memory and takes protective actions when memory pressure is detected:

```json
{
  "llamaCoder.memoryGuardian.enabled": true,
  "llamaCoder.memoryGuardian.thresholdPercentage": 90,
  "llamaCoder.memoryGuardian.checkIntervalMs": 5000
}
```

When memory usage exceeds the threshold:
1. Ongoing completions are gracefully terminated
2. A warning notification appears
3. Automatic completions are temporarily suspended
4. Manual completion remains available

### Adaptive Context Sizing

This feature dynamically adjusts context window size based on available memory:

```json
{
  "llamaCoder.adaptiveContext.enabled": true,
  "llamaCoder.adaptiveContext.maxContextRatio": 0.75
}
```

The context window will shrink under memory pressure, prioritizing essential code segments.

### Model Fallback Chain

Configure smaller fallback models to automatically switch to when memory is constrained:

```json
{
  "llamaCoder.modelFallbackChain": [
    "codellama:13b-instruct",
    "codellama:7b-instruct",
    "codellama:7b-instruct-q4_0"
  ]
}
```

## Prevention Strategies

### Choose Appropriate Models

| Available RAM | Recommended Model | Quantization |
|---------------|-------------------|-------------|
| 8GB           | 7B models only    | Q4_0/Q4_1   |
| 16GB          | Up to 13B models  | Q4_K/Q5_K   |
| 32GB          | Up to 34B models  | Q5_K/Q6_K   |
| 64GB+         | Any model size    | Any         |

### Configure Memory Limits

Set explicit memory limits to prevent Ollama from using all available resources:

```json
{
  "llamaCoder.memorySettings.maxRamPercent": 70,
  "llamaCoder.memorySettings.maxVramPercent": 85
}
```

For Ollama directly (in `.env` or system environment):

```
OLLAMA_MAX_RAM_PCT=70
OLLAMA_MAX_VRAM_PCT=85
```

### Context Management

Reduce memory usage by limiting context:

```json
{
  "llamaCoder.maxContextLength": 2048,
  "llamaCoder.maxContextFiles": 3,
  "llamaCoder.prioritizeVisibleFiles": true
}
```

### Quantized Models

Use quantized models to reduce memory footprint:

```bash
# Original model (higher quality, more memory)
ollama pull codellama:13b-instruct

# Quantized model (lower memory usage)
ollama pull codellama:13b-instruct-q4_0
```

Quantization comparison:
- **q4_0**: ~25% of original model size
- **q4_1**: ~27% of original model size
- **q5_0**: ~32% of original model size
- **q5_1**: ~35% of original model size
- **q8_0**: ~50% of original model size

### Processing Settings

Optimize batch size and threads:

```json
{
  "llamaCoder.advanced.batchSize": 512,
  "llamaCoder.advanced.threads": 4
}
```

For memory-constrained systems, use smaller batch sizes (256 or less).

## Emergency Recovery

If VS Code becomes unresponsive due to memory pressure:

### Windows
1. Open Task Manager (Ctrl+Shift+Esc)
2. End the Ollama process
3. End the VS Code process if necessary
4. Restart with smaller model or reduced settings

### macOS
1. Open Activity Monitor
2. Force quit Ollama and VS Code if necessary
3. Restart with adjusted settings

### Linux
1. In terminal: `killall ollama`
2. If necessary: `killall code`
3. Restart with memory limits

## Swap Space/Virtual Memory Configuration

Increasing swap space can help prevent OOM errors, though performance may suffer:

### Linux
```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
Add to `/etc/fstab` for persistence: `/swapfile none swap sw 0 0`

### Windows
1. Search for "Advanced system settings"
2. Go to Performance → Settings → Advanced → Virtual Memory → Change
3. Increase paging file size (2x RAM recommended for LLM work)

### macOS
macOS manages swap automatically, but you can monitor it:
```bash
sysctl vm.swapusage
```

## Docker Considerations

When running Ollama in Docker, set memory limits:

```bash
docker run -d --name ollama \
  --restart unless-stopped \
  --gpus all \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  -m 8g \
  --memory-swap 12g \
  ollama/ollama
```

## Monitoring Memory Usage

Enable the memory monitor to track usage in real-time:

```json
{
  "llamaCoder.memoryMonitor.enabled": true,
  "llamaCoder.memoryMonitor.showInStatusBar": true,
  "llamaCoder.memoryMonitor.warningThreshold": 80
}
```

This displays current memory usage in the VS Code status bar and warns when approaching limits.

## Intelligent Completion Throttling

Enable intelligent throttling to automatically adjust completion frequency based on system load:

```json
{
  "llamaCoder.intelligentThrottling.enabled": true,
  "llamaCoder.intelligentThrottling.memoryBasedDelay": true,
  "llamaCoder.intelligentThrottling.maxDelayMs": 2000
}
```

As memory pressure increases, the time between automatic completion suggestions will increase accordingly.
