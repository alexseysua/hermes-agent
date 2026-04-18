# Rust Language Server (rust-analyzer)

Setup guide for Rust LSP support.

**Version**: rust-analyzer 2024.x (Feb 2026)
**Official docs**: https://rust-analyzer.github.io/

## Installation

Via rustup (recommended):
```bash
rustup component add rust-analyzer
```

Or standalone:
```bash
brew install rust-analyzer  # macOS
apt install rust-analyzer   # Debian/Ubuntu
```

## Configuration

rust-analyzer reads from `Cargo.toml`. Create project:
```bash
cargo init myproject
```

## Advanced Config

Create `.rust-analyzer.json` in project root:
```json
{
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.checkOnSave.command": "clippy"
}
```

Or in `Cargo.toml`:
```toml
[workspace.metadata.rust-analyzer]
cargo = { features = "all" }
```

## Verification

```bash
ENABLE_LSP_TOOL=1 claude
> Show type of this variable
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "rust-analyzer not found" | Run `rustup component add rust-analyzer` |
| Slow on first load | Wait for initial cargo build |
| Features not detected | Add `features = ["all"]` to config |
| Proc macros failing | Enable proc-macro server in config |

## Performance Tips

- Use `cargo check` instead of `cargo build` for faster feedback
- Enable incremental compilation in Cargo.toml
- For large projects, consider limiting proc-macro expansion
