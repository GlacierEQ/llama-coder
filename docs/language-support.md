# Programming Language Support

This guide details the programming languages supported by Llama Coder and provides optimization tips for each language.

## Supported Languages

Llama Coder provides code completion for a wide range of programming languages. Support quality varies based on the model used and the popularity of the language.

### Tier 1: Excellent Support

These languages receive the best code completions across all models:

| Language | File Extensions | Notes |
|----------|----------------|-------|
| Python | .py, .pyw, .ipynb | All models perform well |
| JavaScript | .js, .jsx, .mjs | Excellent across all models |
| TypeScript | .ts, .tsx | Great type inference |
| Java | .java | Strong support for classes and methods |
| C# | .cs | Good support for .NET patterns |
| C/C++ | .c, .cpp, .h, .hpp | Good function and header completion |
| Go | .go | Clean idiomatic suggestions |
| Rust | .rs | Good safety patterns |
| PHP | .php | Solid support for common patterns |

### Tier 2: Good Support

These languages have good support but may occasionally provide less accurate completions:

| Language | File Extensions | Notes |
|----------|----------------|-------|
| Ruby | .rb | Good support for common patterns |
| Swift | .swift | Decent iOS/macOS development support |
| Kotlin | .kt | Good Android development support |
| HTML/CSS | .html, .css | Good for structure and styling |
| SQL | .sql | Good for common queries |
| Shell/Bash | .sh, .bash | Good for common commands |
| PowerShell | .ps1 | Decent command completion |
| Dart | .dart | Good Flutter support |
| R | .r, .R | Basic statistical functions |

### Tier 3: Basic Support

These languages have basic support and may require larger models for better results:

| Language | File Extensions | Notes |
|----------|----------------|-------|
| Perl | .pl | Basic functionality |
| Lua | .lua | Basic scripting patterns |
| Scala | .scala | Basic functional patterns |
| Haskell | .hs | Basic type-based completions |
| Julia | .jl | Basic scientific computing |
| MATLAB | .m | Basic matrix operations |
| Assembly | .asm, .s | Basic instruction completion |
| Groovy | .groovy | Basic syntax completion |
| Objective-C | .m, .mm | Legacy Apple development |

## Language-Specific Optimization

### Python

For best Python completions:
- Use docstrings to describe functions
- Specify types with type hints for better accuracy
- Add imports at the top of your file for library-specific completions

**Recommended models:**
- Best quality: `codellama:13b-code-q4_K_M` or larger
- Balanced: `codellama:7b-code-q4_K_M`
- Resource-constrained: `stable-code:3b-code-q4_0`

### JavaScript/TypeScript

For best JS/TS completions:
- Add JSDoc comments above functions
- Include type definitions for TypeScript
- Import components/libraries at the top

**Recommended models:**
- Best quality: `codellama:13b-code-q4_K_M` or larger
- Balanced: `codellama:7b-code-q4_K_M`
- Resource-constrained: `stable-code:3b-code-q4_0`

### Java

For best Java completions:
- Add JavaDoc comments
- Define clear class structures
- Import packages at the top

**Recommended models:**
- Best quality: `codellama:34b-code-q4_K_M`
- Balanced: `codellama:13b-code-q4_K_M`
- Resource-constrained: `codellama:7b-code-q4_K_M`

## Customization for Specific Languages

You can customize Llama Coder settings per language using VS Code's language-specific settings:

