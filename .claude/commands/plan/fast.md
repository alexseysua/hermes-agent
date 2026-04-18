---
description: ⚡⚡ Fast plan — no research, only codebase analysis and planning
argument-hint: [task]
---

Think.
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

## Workflow
Use `planner` subagent to:
1. If creating new: Create directory using `Plan dir:` from `## Naming` section, then run `CK="${HOME}/.claude"; [ -f .claude/scripts/set-active-plan.cjs ] && CK=".claude"; node "${CK}/scripts/set-active-plan.cjs" {plan-dir}`
   If reusing: Use the active plan path from Plan Context.
   Make sure you pass the directory path to every subagent during the process.
2. Follow strictly to the "Plan Creation & Organization" rules of `planning` skill.
3. Analyze the codebase by reading `codebase-summary.md`, `code-standards.md`, `system-architecture.md` and `project-overview-pdr.md` file.
4. Gather all information and create an implementation plan of this task.
5. Ask user to review the plan.

## Output Requirements

**Plan Directory Structure** (use `Plan dir:` from `## Naming` section)
```
{plan-dir}/
├── reports/
│   ├── XX-report.md
│   └── ...
├── plan.md
├── phase-XX-phase-name-here.md
└── ...
```

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
- For each phase, create `{plan-dir}/phase-XX-phase-name-here.md` containing the following sections in order: Context links, Overview (date, description, priority, implementation status, review status), Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps.

## Important Notes
- **IMPORTANT:** Ensure token efficiency while maintaining high quality.
- **IMPORTANT:** Analyze the skills catalog and activate skills needed.
- **IMPORTANT:** Sacrifice grammar for concision when writing reports.
- **IMPORTANT:** In reports, list unresolved questions at end.
- **IMPORTANT:** Do not start implementing.
