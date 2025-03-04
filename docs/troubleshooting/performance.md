# Performance Troubleshooting

This guide addresses common performance issues with Llama Coder and provides optimization techniques.

## Common Performance Issues

### Slow Completions

If completions are taking too long to generate:

1. **Check Model Size**: You may be using a model that's too large for your hardware
2. **Monitor System Resources**: Check RAM/VRAM usage during completions
3. **Reduce Concurrent Applications**: Close other resource-intensive applications

### High Memory Usage

If Llama Coder is consuming excessive memory:

1. **Switch to a Smaller Model**: Try stable-code:3b-code-q4_0 instead of larger models
2. **Adjust Max Tokens**: Reduce the maximum token count in settings
3. **Enable Response Caching**: Make sure caching is enabled to reuse previous completions

### High CPU/GPU Usage

If your system slows down during completions:

1. **Check Quantization Level**: Models with lower quantization (FP16) use more resources
2. **Limit Background Tasks**: Disable unnecessary VS Code extensions
3. **Use Remote Inference**: Consider offloading to a more powerful dedicated machine

## Optimization Techniques

### Local Optimization

1. **Adjust Temperature and Top-P**:
   ```json
   {
     "llamaCoder.temperature": 0.1,
     "llamaCoder.topP": 0.9
   }
   ```
   Lower temperature values (0.1-0.3) produce more deterministic and faster results

2. **Configure Completion Caching**:
   ```json
   {
     "llamaCoder.enableResponseCaching": true,
     "llamaCoder.cacheTTL": 86400
   }
   ```

3. **Fine-tune Network Settings**:
   ```json
   {
     "llamaCoder.maxTokens": 128,
     "llamaCoder.triggerDelay": 200
   }
   ```
   Reducing max tokens can improve response time while slightly limiting completion length

### Hardware-Specific Optimization

#### For NVIDIA GPUs:
1. **Update CUDA Drivers**: Ensure you have the latest drivers
2. **Enable Compute Priority**: In NVIDIA Control Panel, set VS Code/Ollama to "Prefer maximum performance"
3. **Monitor with nvidia-smi**: Check GPU utilization and memory usage

#### For Apple Silicon:
1. **Use Native ARM Builds**: Ensure VS Code and Ollama are running native ARM versions
2. **Close Memory-Intensive Apps**: Safari and Chrome can consume significant resources
3. **Reset Neural Engine**: If performance degrades over time, restart your machine

#### For CPU-Only Systems:
1. **Use Smallest Models**: Stick with 3B or 7B parameter models
2. **Increase Response Timeout**: Completions may take longer on CPU-only systems
3. **Consider Remote Inference**: Offload to a more powerful machine if possible

## Remote Setup Optimization

If using a remote Ollama server:

1. **Optimize Network Connection**: Ensure low latency between VS Code and Ollama server
2. **Enable Persistent Connection**: Configure to keep connections alive
3. **Consider Local Fallback**: Enable local fallback for when remote is unavailable

## Benchmarking

To evaluate optimal setup for your system:

1. **Time Completions**: Measure response time with different models
2. **Compare Results**: Balance completion quality vs. performance
3. **Document Best Configuration**: Save optimal settings for your environment

## When to Upgrade Hardware

Consider hardware upgrades if:
- Completions consistently take >5 seconds
- You need to use smaller models despite requiring better completions
- Your system becomes unusable during inference

For best results with larger models (13B+), an NVIDIA RTX 3080 or better is recommended.
