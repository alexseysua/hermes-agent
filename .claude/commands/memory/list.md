---
name: memory:list
description: List stored memories across all scopes
---

List memories from all scopes (user, project, local, auto).

## Memory Scopes

Check these locations for memory content:

1. **User Memory**: `~/.claude/CLAUDE.md`, `~/.claude/rules/`
2. **Project Memory**: `./.claude/CLAUDE.md`, `./.claude/rules/`
3. **Local Memory**: `./CLAUDE.local.md` (gitignored)
4. **Auto Memory**: `~/.claude/projects/{project}/memory/`

## Arguments

- `$1` (optional): Scope to list - `user`, `project`, `local`, `auto`, or `all` (default)

## Actions

1. Read each location that exists
2. Display content summary (first 10 lines per file)
3. Show total size and line count

## Usage

```
/memory:list             # List all scopes
/memory:list user        # List user-level only
/memory:list project     # List project-level only
/memory:list auto        # List auto-generated only
```

## Output Format

For each scope with content:
- Path to memory file
- Line count
- First 10 lines preview

## Implementation

Use the memory utilities from ck-config-utils.cjs:
- `getMemoryPaths()` - Get paths for all scopes
- `getMemoryStatus()` - Check existence and line counts

Read files using the Read tool and display summarized content.
