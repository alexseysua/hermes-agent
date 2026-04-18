# Python Language Server (Pyright)

Setup guide for Python LSP support.

**Version**: Pyright 1.1.x (Feb 2026)
**Official docs**: https://microsoft.github.io/pyright/

## Installation

Recommended: Pyright (fastest, strictest)
```bash
npm install -g pyright
```

Alternative: Pylsp
```bash
pip install python-lsp-server
```

## Configuration

Create `pyrightconfig.json`:
```json
{
  "include": ["src"],
  "exclude": ["**/__pycache__", "**/node_modules", ".venv"],
  "venvPath": ".",
  "venv": ".venv",
  "typeCheckingMode": "basic"
}
```

Or use `pyproject.toml`:
```toml
[tool.pyright]
include = ["src"]
typeCheckingMode = "basic"
venvPath = "."
venv = ".venv"
```

## Virtual Environment

Pyright detects venv automatically:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## Verification

```bash
ENABLE_LSP_TOOL=1 claude
> Find all references to DatabaseConnection
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Module not found" | Activate virtual environment |
| Type info missing | Add type hints or install stubs |
| Slow on large projects | Exclude __pycache__, .venv |
| Wrong Python version | Set `pythonVersion` in config |
