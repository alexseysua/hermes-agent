# Primary Workflow

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT**: Ensure token efficiency while maintaining high quality.

#### 0. Context Loading
- If `plans/STATE.md` exists → read it first for project context (current position, decisions, blockers)
- Pass relevant context (phase, blockers, recent decisions) to subsequent agents
- After completing any major step, update `plans/STATE.md` (position, status, decisions)
- If `/plan` or `/cook` is invoked and no `plans/STATE.md` exists → auto-create from `plans/templates/state.md` with initial values

#### 1. Code Implementation
- Before you start, delegate to `planner` agent to create a implementation plan with TODO tasks in `./plans` directory.
- When in planning phase, use multiple `researcher` agents in parallel to conduct research on different relevant technical topics and report back to `planner` agent to create implementation plan.
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.
- **[IMPORTANT]** After creating or modifying code file, run compile command/script to check for any compile errors.

#### 2. Testing
- Delegate to `tester` agent to run tests and analyze the summary report.
  - Write comprehensive unit tests
  - Ensure high code coverage
  - Test error scenarios
  - Validate performance requirements
- Tests are critical for ensuring code quality and reliability, **DO NOT** ignore failing tests just to pass the build.
- **IMPORTANT:** make sure you don't use fake data, mocks, cheats, tricks, temporary solutions, just to pass the build or github actions.
- **IMPORTANT:** Always fix failing tests follow the recommendations and delegate to `tester` agent to run tests again, only finish your session when all tests pass.

#### 3. Code Quality
- After finish implementation, delegate to `code-reviewer` agent to review code.
- Follow coding standards and conventions
- Write self-documenting code
- Add meaningful comments for complex logic
- Optimize for performance and maintainability

#### 4. Integration
- Always follow the plan given by `planner` agent
- Ensure seamless integration with existing code
- Follow API contracts precisely
- Maintain backward compatibility
- Document breaking changes
- Delegate to `docs-manager` agent to update docs in `./docs` directory if any.

#### 5. Debugging
- When a user report bugs or issues on the server or a CI/CD pipeline, delegate to `debugger` agent to run tests and analyze the summary report.
- Read the summary report from `debugger` agent and implement the fix.
- Delegate to `tester` agent to run tests and analyze the summary report.
- If the `tester` agent reports failed tests, fix them follow the recommendations and repeat from the **Step 2**.

---

## Checkpoint Protocol

Checkpoints pause automated execution to collect genuine human input. Use only when automation is insufficient — Claude runs code, servers, and CLI commands itself.

### Checkpoint Types

**human-verify (~90% of use)**
When: Automated work needs human visual or functional confirmation.
Examples: UI layout matches design, form flow works, animation feels right, output looks correct.
Marker: `<!-- checkpoint: human-verify -->`
Behavior: Present what was done + what to verify. Wait for "approved" or issue report.

**decision (~9% of use)**
When: Multiple valid paths exist; human must choose direction.
Examples: Choose between two API designs, select caching strategy, pick library.
Marker: `<!-- checkpoint: decision -->`
Behavior: Present options with pros/cons. Wait for selection.

**human-action (~1% of use)**
When: Physical action required that Claude cannot automate.
Examples: Click email verification link, complete OAuth flow, scan QR code.
Marker: `<!-- checkpoint: human-action -->`
Behavior: Describe required action clearly. Wait for "done" or issue report.

### Checkpoint Rules

1. Claude does everything automatable — checkpoints ONLY for genuine human judgment
2. Never ask user to run CLI commands (Claude runs them)
3. Never ask user to start dev servers (Claude starts them)
4. Secrets come from user; automation comes from Claude

### Executor Behavior

1. Execute tasks sequentially until hitting a checkpoint marker
2. **STOP** — do not read past the checkpoint or execute subsequent steps
3. Present checkpoint using AskUserQuestion with checkpoint type, work summary, and what needs action
4. Wait for explicit user response
5. If approved / decided / done → resume from next step
6. If issues reported → address, re-attempt, or escalate before continuing

**Never:** Skip checkpoints, hallucinate user approval, or proceed without explicit confirmation.

See also: `.claude/workflows/checkpoint-protocol.md`

---

## Questioning Methodology

Reference for requirement elicitation before planning or execution.

### When to Ask
- Before planning: clarify scope, constraints, success criteria
- During discussion: resolve ambiguity in requirements
- Before execution: confirm architectural decisions with significant tradeoffs

### When to STOP Asking
- User said "just do it", "use your judgment", or similar
- Question would only change cosmetic details (color, naming)
- Answer is derivable from existing context or codebase patterns
- Already asked 5+ questions in current topic
- Repeating a question already answered earlier in conversation

### Feature-Type-Specific Probes

**Visual / UI:** Layout preference? Density? Empty states? Loading states? Responsive behavior?

**API / Backend:** Response format? Error handling? Authentication? Rate limiting? Backward compatibility?

**Data / Database:** Volume expectations? Query patterns? Consistency requirements? Migration strategy?

**Infrastructure / DevOps:** Target environment? Scaling? Monitoring? Rollback strategy?

### Question Quality Rules
1. Each question must be **answerable** — not abstract philosophy
2. Each question must **affect implementation** — skip pure curiosity
3. **Offer options** where possible — don't make user think from scratch
4. **Group related questions** — ask 3-5 at once, not one at a time
5. **State your default** — "I'll use X unless you prefer Y"

See also: `.claude/workflows/questioning-methodology.md`