---
description: ⚡⚡⚡ Deep plan — research, validate, and create an implementation plan
argument-hint: [task]
---

Think harder.
Activate `planning` skill.

## Your mission
<task>
$ARGUMENTS
</task>

## Pre-Creation Check (Active vs Suggested Plan)

Check the `## Plan Context` section in the injected context:
- If "Plan:" shows a path → Active plan exists. Ask user: "Continue with this? [Y/n]"
- If "Suggested:" shows a path → Branch-matched hint only. Ask if they want to activate or create new.
- If "Plan: none" → Create new plan using naming from `## Naming` section.

## Vision Capture (Optional)

Before research, offer to capture the user's vision:

Use `AskUserQuestion`: "Want to discuss implementation details before planning?"
- **Yes (Recommended)** — Captures your preferences and locks decisions before research
- **No** — Skip to research phase (Claude makes reasonable defaults)

If **Yes**:
1. Analyze the task description to identify gray areas (using `.claude/workflows/questioning-methodology.md`)
2. Ask 3-5 targeted questions based on feature type
3. Capture locked decisions as context preamble for researcher and planner agents
4. Save decisions in the plan directory as `vision.md`:

```markdown
# Vision: {task title}

## Locked Decisions
- {Decision 1}: {user's choice}
- {Decision 2}: {user's choice}

## Claude's Discretion
- {Area not discussed}: Claude decides based on best practices
```

5. Pass `vision.md` path to researcher and planner agents as required reading before starting their tasks

If **No**: skip (backward compatible — same behavior as before this step).

## Workflow
1. If creating new: Create directory using `Plan dir:` from `## Naming` section, then run `CK="${HOME}/.claude"; [ -f .claude/scripts/set-active-plan.cjs ] && CK=".claude"; node "${CK}/scripts/set-active-plan.cjs" {plan-dir}`
   If reusing: Use the active plan path from Plan Context.
   Make sure you pass the directory path to every subagent during the process.
2. Follow strictly to the "Plan Creation & Organization" rules of `planning` skill.
3. Use multiple `researcher` agents (max 2 agents) in parallel to research for this task:
   Each agent research for a different aspect of the task and are allowed to perform max 5 tool calls.
4. Analyze the codebase by reading `codebase-summary.md`, `code-standards.md`, `system-architecture.md` and `project-overview-pdr.md` file.
   **ONLY PERFORM THIS FOLLOWING STEP IF `codebase-summary.md` is not available or older than 3 days**: Use `/scout <instructions>` slash command to search the codebase for files needed to complete the task.
5. Main agent gathers all research and scout report filepaths, and pass them to `planner` subagent with the prompt to create an implementation plan of this task.
6. **Plan Quality Check** (automatic, skip with `--no-check` flag in $ARGUMENTS):
   - Spawn `plan-checker` agent with the created plan directory
   - If verdict is PASS → proceed to step 7
   - If verdict is NEEDS_REVISION → pass issues back to planner agent, re-run step 5 (max 3 iterations)
   - If still failing after 3 iterations → present issues to user, ask: "Accept plan with known issues?" or "Revise manually?"
7. Main agent receives the validated plan, and ask user to review the plan

## Post-Plan Validation (Built-in)

After plan creation, automatically run a validation interview to confirm decisions before implementation.

**Check `## Plan Context` → `Validation: mode=X, questions=MIN-MAX`:**

| Mode | Behavior |
|------|----------|
| `prompt` | Ask user: "Validate this plan with a brief interview?" → Yes (Recommended) / No |
| `auto` | Automatically run validation interview |
| `off` | Skip validation step entirely |

**Default behavior (when no mode configured):** Run validation interview automatically — scan plan for assumptions, risks, tradeoffs; ask 3-5 targeted questions; document answers in `## Validation Summary` in `plan.md`.

**If mode is `prompt`:** Use `AskUserQuestion` tool with options above.
**If user chooses validation or mode is `auto`:** Execute validation inline:
1. Read all `phase-*.md` files, scan for: assumptions, risks, tradeoffs, architecture decisions
2. Ask 3-5 questions with 2-4 concrete options each (mark recommended option)
3. Add `## Validation Summary` to `plan.md` with confirmed decisions + action items
4. If answers require plan changes, note them without modifying phase files

## Output Requirements

**Plan Directory Structure** (use `Plan dir:` from `## Naming` section)
```
{plan-dir}/
├── research/
│   ├── researcher-XX-report.md
│   └── ...
├── reports/
│   ├── XX-report.md
│   └── ...
├── scout/
│   ├── scout-XX-report.md
│   └── ...
├── plan.md
├── phase-XX-phase-name-here.md
└── ...
```

**Research Output Requirements**
- Ensure every research markdown report remains concise (≤150 lines) while covering all requested topics and citations.

**Plan File Specification**
- Every `plan.md` MUST start with YAML frontmatter:
  ```yaml
  ---
  title: "{Brief title}"
  description: "{One sentence for card preview}"
  status: pending
  priority: P2
  effort: {sum of phases, e.g., 4h}
  branch: {current git branch}
  tags: [relevant, tags]
  created: {YYYY-MM-DD}
  ---
  ```
- Save the overview access point at `{plan-dir}/plan.md`. Keep it generic, under 80 lines, and list each implementation phase with status and progress plus links to phase files.
- For each phase, create `{plan-dir}/phase-XX-phase-name-here.md` containing the following sections in order: Context links (reference parent plan, dependencies, docs), Overview (date, description, priority, implementation status, review status), Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps.

## Important Notes
**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** Ensure token efficiency while maintaining high quality.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT**: **Do not** start implementing.