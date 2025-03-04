# Contributing to Llama Coder

Thank you for your interest in contributing to Llama Coder! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Set up the development environment** following the instructions below

## Development Environment Setup

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- VS Code
- Git

### Installation

1. Clone your forked repository:
   ```bash
   git clone https://github.com/your-username/llama-coder.git
   cd llama-coder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Launch the extension in development mode:
   ```bash
   npm run watch
   ```

## Coding Standards

- Follow the existing code style
- Use TypeScript for all new code
- Write JSDoc comments for public APIs
- Add unit tests for new functionality

## Pull Request Process

1. **Create a branch** for your feature or bugfix
2. **Make your changes** following the coding standards
3. **Add tests** that verify your changes
4. **Update documentation** as needed
5. **Ensure all tests pass**:
   ```bash
   npm run test
   ```
6. **Submit a pull request** with a clear description of the changes

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

