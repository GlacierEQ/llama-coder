# Development Environment Setup

This guide provides step-by-step instructions for setting up a development environment for contributing to Llama Coder.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or newer)
- [npm](https://www.npmjs.com/) (v6 or newer)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Ollama](https://ollama.ai/) (for local testing)

## Getting the Code

1. **Fork the repository**

   Go to the [Llama Coder GitHub repository](https://github.com/user/llama-coder) and click the "Fork" button in the top right corner.

2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/llama-coder.git
   cd llama-coder
   ```

3. **Add the upstream remote**

   ```bash
   git remote add upstream https://github.com/user/llama-coder.git
   ```

## Setting Up the Development Environment

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Build the extension**

   ```bash
   npm run compile
   ```

3. **Open the project in VS Code**

   ```bash
   code .
   ```

## Development Workflow

### Running the Extension

To launch a new window with your extension loaded:

1. Press `F5` in VS Code
2. This will open a new Extension Development Host window with your development version of Llama Coder

### Watch Mode

For continuous compilation as you make changes:

