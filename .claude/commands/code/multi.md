---
description: ⚡ Multi — execute parallel or sequential phases based on plan structure
argument-hint: [plan-path]
---

Execute plan: <plan>$ARGUMENTS</plan>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.

## Workflow

### 1. Plan Analysis
- Read `plan.md` from given path
- **Check for:** Dependency graph, Execution strategy, Parallelization Info, File Ownership matrix
- **Decision:** IF parallel-executable → Step 2A, ELSE → Step 2B

### 2A. Parallel Execution (Wave-Based)

**Phase discovery and dependency parsing:**
1. List all `phase-*.md` files in the plan directory
2. For each phase file, read YAML frontmatter for `depends_on` field:
   ```yaml
   ---
   depends_on: [01, 02]  # phase numbers this phase depends on
   ---
   ```
   If `depends_on` absent → treat as no dependencies

**Wave grouping algorithm:**
1. Wave 1: phases with no dependencies (or absent `depends_on`)
2. Wave N: phases whose ALL listed `depends_on` phase numbers are fully in waves 1..N-1
3. Repeat until all phases assigned
4. Circular dependency check: if any phase remains unassigned after exhausting iterations → STOP, report cycle, do not execute

**Wave-by-wave execution:**
For each wave (Wave 1, Wave 2, ...):
1. Report: `Wave {N}: executing [{phase-list}] in parallel`
2. Spawn parallel `fullstack-developer` Task agents — one per phase in the wave
   - Pass: phase file path only (agent reads the file itself — do NOT pass content)
   - Pass: plan directory path, environment info, file ownership boundaries
3. Wait for ALL agents in wave to complete
4. Report: `Wave {N} complete. Results: {one-line summary per phase}`
5. If any phase failed → ask user: "Continue to Wave {N+1} or stop and fix?"
6. If user says stop → halt execution

**After all waves:**
- If `goal-verifier` agent is available, invoke it with the plan directory path
- Report overall execution summary

### 2B. Sequential Execution
Follow `./.claude/workflows/primary-workflow.md`:
1. Use main agent step by step
2. Read `plan.md`, implement phases one by one
3. Use `project-manager` for progress updates
4. Use `ui-ux-designer` for frontend
5. Run type checking after each phase
6. Proceed to Step 3

### 3. Testing
- Use `tester` for full suite (NO fake data/mocks)
- If fail: `debugger` → fix → repeat

### 4. Code Review
- Use `code-reviewer` for all changes
- If critical: fix → retest

### 5. Project Management & Docs
- If approved: `project-manager` + `docs-manager` in parallel (update plans, docs, roadmap)
- If rejected: fix → repeat

### 6. Onboarding
- Guide user step by step (1 question at a time)

### 7. Final Report
- Summary, guide, next steps
- Ask to commit (use `git-manager` if yes)

**Examples:**
- Parallel: "Phases 1-3 parallel, then 4" → Launch 3 agents → Wait → Launch 1 agent
- Sequential: "Phase 1 → 2 → 3" → Main agent implements each phase