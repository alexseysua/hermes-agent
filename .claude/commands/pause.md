---
description: Save execution state before context exhaustion
argument-hint: [reason]
---

Save current execution state so work can be resumed in a fresh session.

## Instructions

1. **Gather current state:**
   - Read active plan from session context (check TodoWrite tasks, recent file changes, active plan path)
   - Identify: current phase, current step, what's completed, what's pending
   - Collect key decisions made this session
   - Note any blockers or issues encountered

2. **Determine timestamp:**
   - Run `date +%y%m%d-%H%M` to get current timestamp

3. **Write continue-here file** to `plans/reports/continue-here-{timestamp}.md`:

```markdown
---
created: {ISO timestamp}
plan: {active plan path or "none"}
reason: {$ARGUMENTS or "context exhaustion"}
---

## Current State
{What phase/step we're on}

## Completed Work
{What was finished this session — bullet list}

## Remaining Work
{What's left to do — bullet list with checkboxes}

## Decisions Made
{Key decisions that affect remaining work}

## Blockers
{Any issues encountered, or "None"}

## Next Action
Start with: {specific first action for next session}
```

4. **Confirm save:** Report the file path and suggest: "Run `/resume` in a new session to continue."

## Rules
- Keep the file under 80 lines — it's a resumption aid, not an archive
- Focus on actionable context: what to do next, not what happened in detail
- If `$ARGUMENTS` is provided, use it as the reason; otherwise default to "context exhaustion"
- Include file paths and line numbers where relevant for quick navigation
