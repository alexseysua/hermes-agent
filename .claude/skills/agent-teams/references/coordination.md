# Agent Teams Coordination Patterns

## Teammate Communication

- Peer-to-peer messaging via shared task system
- No direct file sharing between teammates during execution
- Lead agent synthesizes results from all teammates
- Task files at `~/.claude/tasks/{team-name}/`

## Task Claiming

- File-locked claiming prevents race conditions
- Teammates claim tasks independently
- Dependencies tracked in task metadata
- Status: `pending` → `in_progress` → `completed`

## Parallel Execution Patterns

### Fan-Out (Research)
Best for: Exploring multiple approaches simultaneously

```
Lead → [Researcher A, Researcher B, Researcher C] → Lead (synthesis)
```

Example: Research authentication options (OAuth, JWT, Session-based)

### Pipeline (Implementation)
Best for: Sequential dependent stages

```
Planner → Implementer → Tester → Reviewer → Git Manager
```

Example: Feature development with quality gates

### Hybrid (Feature Development)
Best for: Complex features with research + implementation

```
Lead → Researchers (parallel) → Lead → Implementers (parallel) → Tester
```

Example: New API endpoint with multiple data sources

## Agent Specializations

| Agent | Purpose | Suggested Tools |
|-------|---------|-----------------|
| researcher | Information gathering | Read, Grep, Glob, WebSearch, WebFetch |
| scout | Codebase exploration | Read, Grep, Glob, LS |
| fullstack-developer | Implementation | Read, Write, Edit, Bash, Grep, Glob |
| tester | Test execution | Read, Write, Bash(npm test*), Grep |
| code-reviewer | Quality review | Read, Grep, Glob |

## Quality Gate Integration

### Before Teammate Idle
```bash
# verify-build.sh
npm run build --if-present
# Exit 2 to block idle if build fails
```

### Before Task Completion
```bash
# verify-tests.sh
npm test --if-present
# Exit 2 to block completion if tests fail
```

## Best Practices

1. **Clear task boundaries** - Each task should be completable by one teammate
2. **Minimal dependencies** - Reduce blocking between teammates
3. **Explicit handoffs** - Document what each teammate produces
4. **Fail fast** - Quality gates catch issues early
5. **Lead synthesis** - Lead agent reviews and integrates all work
