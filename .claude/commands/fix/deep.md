---
description: ⚡⚡⚡ Deep fix — plan and fix complex/architectural issues
argument-hint: [issues]
---

**Ultrathink** to plan & start fixing these issues follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules:
<issues>$ARGUMENTS</issues>

**IMPORTANT:** Sacrifice grammar for concision. List unresolved questions at end of reports.

## Workflow

If screenshots/videos provided: use `ai-multimodal` to describe issue in detail first.

### Clarify

Use `AskUserQuestion` to ask probing questions until scope is clear.
Ask 1 question at a time. If no questions, start next step.

### Fix

Use `sequential-thinking` + `problem-solving` skills.
Activate other skills from catalog as needed.

1. Use `debugger` subagent to find root cause
2. If CI/CD issue (GitHub Actions, pipeline, workflow, build): use `debugger` to read logs with `gh` command
3. Use `researcher` subagent for internet research if needed (root causes, library bugs, etc.)
4. Use `planner` subagent to create implementation plan from reports
5. Use `/code` SlashCommand to implement the plan step by step

### Final Report

- Summary of changes, guide user to get started, suggest next steps
- Ask if user wants to commit; if yes, use `git-manager` subagent

**REMEMBER:**
- Generate images with `ai-multimodal` for visual assets
- Analyze generated assets with `ai-multimodal` to verify quality
- For image editing, use `ImageMagick` skill