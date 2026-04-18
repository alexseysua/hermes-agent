---
description: ⚡⚡ Analyze and fix issues [SMART ROUTER]
argument-hint: [issues]
---

**Analyze issues and fix them:**
<issues>$ARGUMENTS</issues>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.

## Smart Router

Analyze `$ARGUMENTS` to classify issue type, then apply the matching workflow below.

### A) Type Errors
**Detect:** keywords `type`, `typescript`, `tsc`, `type error`, `interface`, `generic`

Run `bun run typecheck` or `tsc` or `npx tsc` and fix all type errors.
- Fix all errors, repeat until zero remain
- Do not use `any` just to pass the type check

### B) UI/UX Issues
**Detect:** keywords `ui`, `ux`, `design`, `layout`, `style`, `visual`, `button`, `component`, `css`, `responsive`

Required skills: `ui-ux-pro-max` (first), `aesthetic`, `frontend-design`

1. Run `ui-ux-pro-max` searches for context
2. Use `ui-ux-designer` subagent to read `./docs/design-guidelines.md` then implement fix
3. If screenshot/video provided: use `ai-multimodal` to describe issue in detail first
4. Use `chrome-devtools` skill to verify fix matches design guidelines
5. Use `tester` agent to test and compile

### C) CI/CD Issues
**Detect:** keywords `github actions`, `pipeline`, `ci/cd`, `workflow`, `deployment`, `build failed`, `ci`, `action`

1. Use `debugger` subagent to read GitHub Actions logs with `gh` command
2. Implement fix based on root cause analysis
3. Use `tester` agent to verify fix
- Note: if `gh` not available, instruct user to install GitHub CLI

### D) Test Failures
**Detect:** keywords `test`, `spec`, `jest`, `vitest`, `failing test`, `test suite`

1. Use `tester` subagent to compile code and fix syntax errors first
2. Use `tester` subagent to run tests and report back
3. If tests failed post-`/cook` or `/code`: generate gap plan at `plans/reports/gap-plan-{timestamp}.md`
4. Use `debugger` for root cause, `planner` for fix plan, implement, re-run `tester`
5. Use `code-reviewer` for final review

### E) Log Analysis
**Detect:** keywords `logs`, `error logs`, `log file`, `stack trace`, `logs.txt`

1. Check if `./logs.txt` exists; if not, set up log piping in project scripts
2. Use `debugger` subagent with `Grep` (`head_limit: 30`) on `./logs.txt`
3. Use `scout` to find exact code locations
4. Use `planner` for fix plan, implement, test, review

### F) Multiple Independent Issues
**Detect:** 2+ unrelated issues in different areas

→ Use `/fix:multi <detailed-description>` for parallel fix execution

### G) Complex/Architectural Issues
**Detect:** keywords `complex`, `architecture`, `refactor`, `major`, `system-wide`, `multiple components`

Use `sequential-thinking` + `problem-solving` skills.

1. Use `AskUserQuestion` to clarify scope if needed
2. Use `debugger` for root cause
3. Use `researcher` if internet research needed
4. Use `planner` for implementation plan
5. Use `/code` to implement plan

### H) Simple/Quick Fix (default)
**Default when no specific keywords match**

Activate `debugging` + `problem-solving` skills.

1. If screenshot/video provided: use `ai-multimodal` to describe issue
2. Use `debugger` subagent to find root cause
3. Implement fix
4. Use `tester` agent to verify
5. Report summary with next steps

## Fallback

If issue type is unclear after analysis, use `AskUserQuestion` to ask user before routing.

## Notes
- For existing markdown plan → use `/code <plan-path>` directly
- Can combine: multiple type errors + UI issue → `/fix:multi`
