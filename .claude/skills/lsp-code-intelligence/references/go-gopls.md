# Go Language Server (gopls)

Setup guide for Go LSP support.

**Version**: gopls 0.16.x (Feb 2026)
**Official docs**: https://pkg.go.dev/golang.org/x/tools/gopls

## Installation

```bash
go install golang.org/x/tools/gopls@latest
```

Ensure `$GOPATH/bin` is in PATH:
```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

## Configuration

gopls uses go.mod for project detection:
```bash
go mod init myproject
```

## Editor-agnostic Config

Create `.golangci.yml` for linting integration:
```yaml
linters:
  enable:
    - gofmt
    - govet
    - errcheck
    - staticcheck
```

## Verification

```bash
ENABLE_LSP_TOOL=1 claude
> Go to definition of http.HandleFunc
```

## Workspace Mode

For multi-module repos, create `go.work`:
```bash
go work init ./service-a ./service-b
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "gopls not found" | Add $GOPATH/bin to PATH |
| Missing dependencies | Run `go mod tidy` |
| Slow indexing | Check go.mod is valid |
| Build errors shown | Run `go build ./...` to fix |
