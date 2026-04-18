---
description: ⚡⚡⚡ Intelligent plan creation with complexity-based routing
argument-hint: [task]
---

## Your mission
<task>
$ARGUMENTS
</task>

## Pre-Creation Check (Active vs Suggested Plan Detection)

Check the `## Plan Context` section in the injected context:
- If "Plan:" shows a path → Active plan exists. Ask user: "Active plan found: {path}. Continue with this? [Y/n]"
- If "Suggested:" shows a path → Branch-matched plan hint only. Ask user if they want to activate it or create new.
- If "Plan: none" → Proceed to create new plan using naming pattern from `## Naming` section.

## Complexity Detection

Analyze `$ARGUMENTS` to choose the planning depth:

**Use `/plan:deep` (research-backed) when:**
- Task mentions new technology, third-party APIs, or unknown libraries
- Keywords: `integrate`, `research`, `explore`, `evaluate`, `compare`, `new tech`
- Complex architecture changes or multi-system features

**Use `/plan:fast` (no research) — default when:**
- Task is clearly scoped to existing codebase
- Straightforward feature addition or refactor
- Simple or routine tasks

**Default: `/plan:fast`** — when in doubt, use fast planning.

## Workflow
- Analyze the given task and use `AskUserQuestion` tool to ask for more details if needed.
- Activate `planning` skill.
- Execute SlashCommand based on complexity detection above:
  - `/plan:fast <detailed-instructions-prompt>` — for standard tasks (default)
  - `/plan:deep <detailed-instructions-prompt>` — for research-heavy tasks
- Note: `detailed-instructions-prompt` is **an enhanced prompt** describing the task in detail.

## Important Notes
**IMPORTANT:** Analyze the skills catalog and activate skills needed for the task.
**IMPORTANT:** Sacrifice grammar for concision when writing reports.
**IMPORTANT:** Ensure token efficiency while maintaining high quality.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT:** Do not start implementing.
