---
description: Resume from last saved execution state
argument-hint: [continue-here-file]
---

Resume work from a previously saved execution state (created by `/pause`).

## Instructions

1. **Find continue-here file:**
   - If `$ARGUMENTS` provided → use that file path directly
   - Else → scan `plans/reports/continue-here-*.md`, sort by filename (date-based), take the latest one
   - If no files found → report: "No saved state found. Start fresh with /plan or /cook."

2. **Read the continue-here file** and present a concise summary to the user:
   - What plan was active
   - What was completed last session
   - What's remaining
   - The suggested next action

3. **Ask the user:**
   Use AskUserQuestion with options:
   - **Continue (Recommended)** — Execute the suggested next action
   - **Review first** — Show full state details before continuing
   - **Start fresh** — Ignore saved state, start new work

4. **If Continue:** Begin executing the next action described in the file.

5. **Cleanup:** After successful resumption, keep only the last 3 continue-here files. Delete older ones:
   ```
   ls -t plans/reports/continue-here-*.md | tail -n +4 | xargs rm -f
   ```

## Rules
- Never auto-execute without showing the user what they're resuming
- If the referenced plan no longer exists, warn the user
- The continue-here file is a guide, not a contract — user can deviate
