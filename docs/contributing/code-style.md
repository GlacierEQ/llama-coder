# Code Style Guide

This document outlines the coding standards and practices for contributing to the Llama Coder project. Following these guidelines ensures consistency throughout the codebase and makes the project more maintainable.

## General Principles

- **Readability first**: Write code that is easy to understand and maintain
- **Consistency**: Follow established patterns in the existing codebase
- **Documentation**: Document your code thoroughly
- **Testing**: Write tests for new functionality
- **Incremental changes**: Make small, focused changes rather than large overhauls

## TypeScript Style Guidelines

### Naming Conventions

- **Files**: Use kebab-case for filenames: `completion-provider.ts`
- **Classes**: Use PascalCase: `CompletionProvider`
- **Interfaces**: Use PascalCase with "I" prefix: `ICompletionOptions`
- **Types**: Use PascalCase: `CompletionResult`
- **Variables and functions**: Use camelCase: `getCompletion()`
- **Constants**: Use UPPER_SNAKE_CASE for true constants: `MAX_TOKENS`
- **Private properties**: Use camelCase with underscore prefix: `_completionCache`

### Code Organization

- Organize code into logical modules and folders
- Group related functionality together
- Follow a clear, consistent import order:
  1. Built-in Node.js modules
  2. External dependencies
  3. Internal modules (relative imports)

Example:
