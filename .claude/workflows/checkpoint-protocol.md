# Checkpoint Protocol

Checkpoints pause automated execution to collect genuine human input. Use only when automation is insufficient — Claude runs code, servers, and CLI commands itself.

## Checkpoint Types

### human-verify (~90% of use)
**When:** Automated work needs human visual or functional confirmation.
**Examples:** UI layout matches design, form flow works, animation feels right, output looks correct.
**Marker:** `<!-- checkpoint: human-verify -->`
**Behavior:** Present what was done + what to verify. Wait for "approved" or issue report.

### decision (~9% of use)
**When:** Multiple valid paths exist; human must choose direction.
**Examples:** Choose between two API designs, select caching strategy, pick library.
**Marker:** `<!-- checkpoint: decision -->`
**Behavior:** Present options with pros/cons. Wait for selection.

### human-action (~1% of use)
**When:** Physical action required that Claude cannot automate.
**Examples:** Click email verification link, complete OAuth flow, scan QR code.
**Marker:** `<!-- checkpoint: human-action -->`
**Behavior:** Describe required action clearly. Wait for "done" or issue report.

## Rules

1. Claude does everything automatable — checkpoints ONLY for genuine human judgment
2. Never ask user to run CLI commands (Claude runs them)
3. Never ask user to start dev servers (Claude starts them)
4. Secrets come from user; automation comes from Claude

## Checkpoint Format in Plan Files

Mark checkpoints inline within phase step descriptions:

```markdown
<!-- checkpoint: human-verify -->
**Verify:** {what to check — be specific}
**Expected:** {what it should look or feel like}
```

```markdown
<!-- checkpoint: decision -->
**Choose:** {what decision is needed}
**Option A:** {description + tradeoffs}
**Option B:** {description + tradeoffs}
```

```markdown
<!-- checkpoint: human-action -->
**Action required:** {exact steps for human to take}
**Then:** Return here and confirm "done"
```

## Executor Behavior

1. Execute tasks sequentially until hitting a checkpoint marker
2. **STOP** — do not read past the checkpoint or execute subsequent steps
3. Present checkpoint using AskUserQuestion with:
   - Checkpoint type (human-verify / decision / human-action)
   - Summary of work completed since last checkpoint
   - What needs verification, decision, or action
   - Expected outcome or available options
4. Wait for explicit user response
5. If approved / decided / done → resume execution from next step
6. If issues reported → address issues, re-attempt, or escalate before continuing

**Never:** Skip checkpoints, hallucinate user approval, or proceed without explicit confirmation.
