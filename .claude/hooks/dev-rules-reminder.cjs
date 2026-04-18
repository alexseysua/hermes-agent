#!/usr/bin/env node
/**
 * Development Rules Reminder - UserPromptSubmit Hook (Optimized)
 *
 * Injects context: session info, rules, modularization reminders, and Plan Context.
 * Static env info (Node, Python, OS) now comes from SessionStart env vars.
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const path = require('path');
const {
  loadConfig
} = require('./lib/ck-config-utils.cjs');
const {
  buildReminderContext,
  wasRecentlyInjected,
  resolveRulesPath,
  resolveScriptPath: _resolveScriptPath,
  resolveSkillsVenv: _resolveSkillsVenv
} = require('./lib/context-builder.cjs');

// Thin wrappers preserved for backward compatibility (tests verify these exist)
function resolveWorkflowPath(filename) { return resolveRulesPath(filename); }
function resolveScriptPath(filename) { return _resolveScriptPath(filename); }
function resolveSkillsVenv() { return _resolveSkillsVenv(); }

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    if (wasRecentlyInjected(payload.transcript_path)) process.exit(0);

    const sessionId = process.env.CK_SESSION_ID || null;
    const config = loadConfig({ includeProject: false, includeAssertions: false });

    // Build full reminder using context-builder (extracted shared logic)
    const { lines } = buildReminderContext({ sessionId, config });

    console.log(lines.join('\n'));
    process.exit(0);
  } catch (error) {
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
}

// Outer crash wrapper - ensures hook never blocks Claude (fail-open)
main().catch(err => {
  try {
    const logsDir = path.join(__dirname, '.logs');
    require('fs').mkdirSync(logsDir, { recursive: true });
    require('fs').appendFileSync(
      path.join(logsDir, 'dev-rules-reminder-crash.log'),
      `[${new Date().toISOString()}] ${err.stack || err.message}\n`
    );
  } catch { /* ignore logging failure */ }
  process.exit(0); // Fail-open: never block Claude
});
