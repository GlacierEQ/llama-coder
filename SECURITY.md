# Security Policy

This document outlines security procedures and general policies for the Llama Coder project.

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions are:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.14  | :white_check_mark: |
| 0.0.13  | :white_check_mark: |
| 0.0.12  | :white_check_mark: |
| < 0.0.12 | :x:                |

## Reporting a Vulnerability

The Llama Coder team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory "Report a Vulnerability" button at the top of the Security tab of the repository.

The Llama Coder team will send a response indicating the next steps in handling your report. After the initial reply to your report, we will keep you informed of the progress toward a fix and full announcement, and may ask for additional information or guidance.

Please report security vulnerabilities in third-party modules to the person or team maintaining that module.

## Disclosure Policy

When the security team receives a security bug report, they will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

1. Confirm the problem and determine the affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all releases still under maintenance
4. Release patches as soon as possible

## Security Features in Llama Coder

Llama Coder is designed with privacy and security in mind:

- **Local Processing**: Code completions are processed locally on your device or on your controlled infrastructure, ensuring your code never leaves your environment
- **No Telemetry**: We do not collect usage data or send any information back to our servers
- **Input Validation**: All inputs are validated before processing to prevent injection attacks
- **Authentication**: Support for bearer token authentication when using remote Ollama instances
- **Secure Communication**: TLS support for connections to remote instances

## Security Best Practices for Users

### Local Setup

- Keep Ollama and Llama Coder updated to the latest versions
- Follow standard system security practices
- Use models from trusted sources only

### Remote Setup

- Use authentication with strong bearer tokens
- Configure proper firewall rules to restrict access to your Ollama instance
- Use TLS/SSL for all remote connections
- Consider using a VPN or SSH tunnel for added security

## Updates and Patching

Security updates will be released as soon as possible after a vulnerability is confirmed. We strongly recommend users to keep their installations up to date.

## Security-Related Configuration

These configuration options can enhance security:

# Security Enhancements for Llama Coder

This document outlines security measures implemented to protect Llama Coder from unauthorized access and misuse.

## Security Features

### 1. API Rate Limiting

To prevent abuse and ensure service stability:
- Maximum 60 requests per minute per user
- Cooldown periods after sustained high usage
- Automatic throttling during heavy usage periods

### 2. Encryption & Data Protection

- All communication with remote Ollama instances is encrypted via TLS
- Bearer token authentication is required for remote connections
- No telemetry or user data is collected or transmitted
- Local data is stored with filesystem encryption when possible

### 3. Input/Output Validation

- All model inputs are sanitized to prevent prompt injection
- Output is scanned for potentially harmful code patterns
- Content filtering reduces risk of generating inappropriate responses

### 4. Access Controls

- Role-based permissions for multi-user setups
- IP allowlisting for remote configurations
- Configurable usage quotas per user or workspace

## Implementation

These security features are implemented throughout the codebase:
- Rate limiting in `src/modules/rateLimiter.ts`
- Encryption in `src/modules/secureComms.ts`
- Validation in `src/modules/inputSanitizer.ts` and `src/modules/outputValidator.ts`
- Access controls in `src/modules/accessControl.ts`

## Security Best Practices for Users

1. **Keep models local** when possible for maximum security
2. **Use bearer tokens** for all remote connections
3. **Restrict network access** to Ollama servers
4. **Update regularly** to receive the latest security patches
5. **Monitor logs** for suspicious activity

For security issues or vulnerabilities, please report them to the project maintainers directly.
