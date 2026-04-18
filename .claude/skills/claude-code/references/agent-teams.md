# Agent Teams (Experimental)

Multi-agent coordination in Claude Code v2.1.32+.

## Activation

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Or in settings:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Architecture

| Role | Description |
|------|-------------|
| **Lead** | Main session, spawns teammates, synthesizes results |
| **Teammates** | Independent Claude instances, own context windows |
| **Task List** | Shared at `~/.claude/tasks/{team-name}/` |

## Tools Restriction

### Allowlist (Recommended)

```yaml
---
name: researcher
tools: Read, Grep, Glob, WebSearch, WebFetch
---
```

### Denylist

```yaml
---
name: safe-developer
disallowedTools: Bash(rm*|sudo*), Write(*.env)
---
```

### Pattern Syntax

- Comma-separated tool names
- Glob patterns: `mcp__github__*`
- Bash patterns: `Bash(npm*|pnpm*)`

## Display Modes

| Mode | Setup | Best For |
|------|-------|----------|
| In-process | Default | Simple teams |
| tmux | `brew install tmux` | Parallel monitoring |
| iTerm2 | macOS only | Native splits |

## Quality Gates

### TeammateIdle Hook

Block idle until build passes:

```bash
#!/bin/bash
# .claude/hooks/verify-build.sh
npm run build --if-present || { echo "Build failed" >&2; exit 2; }
```

### TaskCompleted Hook

Block completion until tests pass:

```bash
#!/bin/bash
# .claude/hooks/verify-tests.sh
npm test --if-present || { echo "Tests failed" >&2; exit 2; }
```

## Hook Configuration

```json
{
  "hooks": {
    "TeammateIdle": [{
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/verify-build.sh",
        "timeout": 60
      }]
    }],
    "TaskCompleted": [{
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/verify-tests.sh",
        "timeout": 120
      }]
    }]
  }
}
```

## Coordination Patterns

### Fan-Out (Research)

```
Lead → [Researcher A, B, C] → Lead (synthesis)
```

Best for: Exploring multiple approaches

### Pipeline

```
Planner → Implementer → Tester → Reviewer
```

Best for: Sequential dependent stages

### Hybrid

```
Lead → Researchers (parallel) → Lead → Implementers (parallel) → Tester
```

Best for: Complex features

## Limitations

- No session resumption with in-process teammates
- One team per session
- Task status may lag between teammates
- Slow teammate shutdown (finishes current request)

## Best Practices

1. Use tools restriction for defense-in-depth
2. Add quality gate hooks for implementer agents
3. Keep research agents read-only
4. Use descriptive teammate names

## See Also

- Agent Teams Skill: `.claude/skills/agent-teams/`
- Hooks Reference: `references/hooks-comprehensive.md`
- Configuration: `references/configuration.md`
