---
description: System health diagnostic for ClaudeKit
argument-hint:
---

Run a full health check of the ClaudeKit installation. Each subsystem returns OK, WARN, or FAIL.

## Checks

Run all 7 checks and collect results:

### 1. Hooks loaded
- Read `.claude/settings.json` (or `~/.claude/settings.json` if project one missing)
- Parse JSON → if parse error → FAIL
- For each hook entry, verify the referenced file exists
- All files exist → OK | Some missing → WARN | Parse error or no hooks section → FAIL

### 2. Agents accessible
- Glob `.claude/agents/*.md` and count
- ≥10 → OK | 1–9 → WARN | 0 or directory missing → FAIL

### 3. Settings valid
- JSON.parse `.claude/settings.json`
- Valid JSON → OK | Parse error → FAIL

### 4. Temp dir writable
- Attempt to write a test file to `/tmp/ck/` (create dir if needed)
- Write succeeds → OK | Permission denied or write error → FAIL

### 5. Commands available
- Glob `.claude/commands/**/*.md` and count
- ≥20 → OK | 1–19 → WARN | 0 or directory missing → FAIL

### 6. Workflows present
- Glob `.claude/workflows/*.md` and count
- ≥3 → OK | 1–2 → WARN | 0 or directory missing → FAIL

### 7. Skills accessible
- Glob `.claude/skills/*/SKILL.md` and count
- ≥5 → OK | 1–4 → WARN | 0 or directory missing → FAIL

## Output Format

Print exactly this format with real values:

```
ClaudeKit Health Check
══════════════════════
Hooks:      ✓ OK   (8 registered, all files exist)
Agents:     ✓ OK   (19 agents found)
Settings:   ✓ OK   (valid JSON)
Temp dir:   ✓ OK   (/tmp/ck/ writable)
Commands:   ✓ OK   (36 commands)
Workflows:  ✓ OK   (6 workflows)
Skills:     ✓ OK   (20 skills)
══════════════════════
Status: HEALTHY
```

Use `✓ OK`, `⚠ WARN`, or `✗ FAIL` as the indicator per row.

**Overall status rules:**
- Any FAIL → `Status: UNHEALTHY`
- Any WARN (no FAIL) → `Status: DEGRADED`
- All OK → `Status: HEALTHY`

Add a blank line after the double line, then list any WARN/FAIL items with brief remediation hints.
