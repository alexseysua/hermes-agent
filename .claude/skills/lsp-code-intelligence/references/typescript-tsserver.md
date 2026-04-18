# TypeScript Language Server (tsserver)

Setup guide for TypeScript/JavaScript LSP support.

**Version**: TypeScript 5.x (Feb 2026)
**Official docs**: https://www.typescriptlang.org/docs/

## Installation

Already included with TypeScript:
```bash
npm install -g typescript
```

Or in project:
```bash
npm install --save-dev typescript
```

## Configuration

Create `tsconfig.json` in project root:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Verification

Test LSP is working:
```bash
ENABLE_LSP_TOOL=1 claude
> Go to definition of MyComponent
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "tsserver not found" | Run `npm install -g typescript` |
| Definitions not found | Check tsconfig.json includes paths |
| Slow startup | Wait 10-30s for initial indexing |
| Wrong types shown | Run `npm install` to get @types packages |

## Performance Tips

- Exclude node_modules in tsconfig.json
- Use project references for monorepos
- Keep tsconfig strict for better type info
- Add `"skipLibCheck": true` to speed up checking
