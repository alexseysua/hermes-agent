---
description: ⚡⚡ Run test suite and fix issues
argument-hint: [issues]
---

Analyze the skills catalog and activate the skills that are needed for the task during the process.

## Reported Issues:
<issues>$ARGUMENTS</issues>

## Workflow:
1. Use `tester` subagent to compile the code and fix all syntax errors if any.
2. Use `tester` subagent to run the tests and report back to main agent.
3. If there are issues or failed tests, use `debugger` subagent to find the root cause of the issues, then report back to main agent.
3.5. **Gap Analysis** (only if tests failed after a `/cook` or `/code` execution):
   - Read the original plan that was just executed
   - Generate a gap plan at `plans/reports/gap-plan-{timestamp}.md` using this format:
     ```markdown
     ---
     title: "Gap Plan: {original plan title}"
     type: gap-closure
     original_plan: {path to original plan}
     created: {timestamp}
     ---

     # Gap Analysis

     ## What Failed
     {Specific test failures with error messages}

     ## Root Cause
     {From debugger analysis}

     ## Original Assumption vs Reality
     | Assumption | Reality |
     |-----------|---------|
     | {what plan assumed} | {what actually happened} |

     ## Fix Steps
     1. {Specific step with file and line references}
     2. {Specific step}

     ## Verification
     {How to verify the fix resolves the gap}
     ```
   - Present to user: "Gap plan generated at `plans/reports/gap-plan-{timestamp}.md`. Review and `/code` it?"
   - If this is a **standalone** `/fix:test` (not post-implementation): skip gap analysis, proceed to step 4.
4. Use `planner` subagent to create an implementation plan based on the reports, then report back to main agent.
5. Use main agent to implement the plan step by step.
6. Use `tester` agent to test the fix and make sure it works, then report back to main agent.
7. Use `code-reviewer` subagent to quickly review the code changes and make sure it meets requirements, then report back to main agent.
8. If there are issues or failed tests, repeat from step 2.
9. After finishing, respond back to user with a summary of the changes and explain everything briefly, guide user to get started and suggest the next steps.