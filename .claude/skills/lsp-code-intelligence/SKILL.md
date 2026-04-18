# LSP Code Intelligence

Language Server Protocol integration for IDE-like code navigation in Claude Code.

## When to Use

- Finding symbol definitions quickly
- Navigating large codebases
- Getting type information and documentation
- Finding all references to a symbol

## Prerequisites

1. Enable: `export ENABLE_LSP_TOOL=1`
2. Install language server for your language

## Capabilities

| Feature | Speed | Fallback |
|---------|-------|----------|
| Go-to-definition | ~50ms | Text search (~45s) |
| Find references | ~100ms | Grep pattern match |
| Hover documentation | ~50ms | No equivalent |
| Diagnostics | Real-time | After edit |

## Supported Languages

Python, TypeScript/JavaScript, Go, Rust, Java, C/C++, C#, PHP, Kotlin, Ruby, PowerShell, HTML/CSS

## Usage in Claude Code

Claude automatically uses LSP when enabled:
- "Go to the definition of UserService"
- "Find all references to handleAuth"
- "What type is the config parameter?"

## Limitations

- **Cold start**: First request may take 45+ seconds
- **No UI indicator** for server startup status
- Some language servers require project configuration

## Fallback Strategy

If LSP unavailable, Claude falls back to:
1. Grep/ripgrep for pattern matching
2. AST-based symbol extraction
3. Full-text search

## See Also

- `references/typescript-tsserver.md` - TypeScript/JavaScript setup
- `references/python-pyright.md` - Python setup
- `references/go-gopls.md` - Go setup
- `references/rust-analyzer.md` - Rust setup
