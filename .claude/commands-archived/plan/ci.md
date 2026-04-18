---
description: Analyze Github Actions logs and provide a plan to fix the issues
argument-hint: [github-actions-url]
---

Activate `planning` skill.

## Github Actions URL
 $ARGUMENTS

## Pre-Creation Check
Before creating a new plan, check if an active plan already exists:
1. Read session state for `activePlan`
2. If exists, ask user whether to continue existing or create new

Use the `planner` subagent to read the github actions logs, analyze and find the root causes of the issues, then provide a detailed plan for implementing the fixes.

After creating the plan directory, run: `CK="${HOME}/.claude"; [ -f .claude/scripts/set-active-plan.cjs ] && CK=".claude"; node "${CK}/scripts/set-active-plan.cjs" {plan-dir}`

**Plan File Specification:**
- Every `plan.md` MUST start with YAML frontmatter:
  ```yaml
  ---
  title: "{Brief title}"
  description: "{One sentence for card preview}"
  status: pending
  priority: P1
  effort: {estimated fix time}
  branch: {current git branch}
  tags: [ci, bugfix]
  created: {YYYY-MM-DD}
  ---
  ```

**Output:**
Provide at least 2 implementation approaches with clear trade-offs, and explain the pros and cons of each approach, and provide a recommended approach.

**IMPORTANT:** Ask the user for confirmation before implementing.
**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing outputs.