# Agent Teams

Multi-agent coordination with parallel execution and shared task management.

## When to Use
- Parallel feature implementation across multiple files
- Research with multiple approaches simultaneously
- Complex tasks requiring specialized agents
- Quality-gated workflows with build/test verification

## Prerequisites

Enable experimental feature:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Or in `.claude/settings.json`:
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
| **Teammates** | Independent instances, peer-to-peer messaging |
| **Task List** | Shared at `~/.claude/tasks/{team-name}/` |

## Tools Restriction

Control teammate capabilities via agent frontmatter:

```yaml
# Allowlist (only these tools available)
tools: Read, Grep, Glob, WebSearch, WebFetch

# Denylist (block specific patterns)
disallowedTools: Bash(rm -rf*|sudo*)
```

**Pattern syntax:**
- Comma-separated tool names
- Wildcards: `Bash(npm*|pnpm*)` matches npm/pnpm commands
- MCP tools: `mcp__github__*` matches all GitHub MCP tools

## Quality Gates

Quality hooks (when supported by Claude Code):
- **TeammateIdle**: Verify build before teammate goes idle
- **TaskCompleted**: Verify tests before marking task complete

Current workaround: Use verify-build.sh and verify-tests.sh manually.

## Display Modes

| Mode | Setup | Best For |
|------|-------|----------|
| In-process | Default | Simple teams, any terminal |
| tmux | `brew install tmux` | Parallel monitoring, split panes |
| iTerm2 | macOS only | Native split panes |

## Limitations

- No session resumption with in-process teammates
- One team per session
- Task status may lag between teammates (file-based sync)

## See Also

- `references/coordination.md` - Coordination patterns and protocols
- `google-adk-python` skill — For building Python-based AI agent systems using Google's ADK (LlmAgent, SequentialAgent, ParallelAgent) deployed to Cloud Run or Vertex AI. Use `agent-teams` for Claude Code subagent orchestration; use `google-adk-python` for standalone Python agent deployment.
