#!/usr/bin/env node
'use strict';
/**
 * PostToolUse hook: Tracks file modifications and reminds to run code-simplifier
 *
 * Fires after Edit/Write/MultiEdit operations:
 * 1. Invalidates git cache for fresh statusline data
 * 2. Tracks modified files per session (2h window)
 * 3. After 5+ edits, injects a code-simplifier reminder (debounced 10min)
 */

// Crash wrapper — catches require() failures and logs to .logs/
try {

const fs = require('fs');
const path = require('path');
const os = require('os');
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');
const { invalidateCache } = require('./lib/git-info-cache.cjs');
const { createHookTimer } = require('./lib/hook-logger.cjs');

const HOOK_NAME = 'post-edit-simplify-reminder';
const SESSION_FILE = path.join(os.tmpdir(), 'ck-simplify-session.json');
const EDIT_THRESHOLD = 5;
const DEBOUNCE_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Early exit if hook disabled
if (!isHookEnabled(HOOK_NAME)) {
  process.exit(0);
}

// --------------------------------------------------------------------------
// Session persistence helpers
// --------------------------------------------------------------------------

function initSession() {
  return { startTime: Date.now(), editCount: 0, modifiedFiles: [], lastReminder: 0 };
}

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      if (Date.now() - data.startTime < SESSION_TTL_MS) return data;
    }
  } catch (_) { /* re-init on any error */ }
  return initSession();
}

function saveSession(data) {
  try { fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2)); } catch (_) {}
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

function main() {
  const timer = createHookTimer(HOOK_NAME);

  try {
    const raw = fs.readFileSync(0, 'utf8');
    const hookData = JSON.parse(raw || '{}');
    const toolName = hookData.tool_name || '';
    const toolInput = hookData.tool_input || {};

    // Only track edit-class operations (guard redundantly — settings matcher handles this)
    const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);
    if (!EDIT_TOOLS.has(toolName)) {
      console.log(JSON.stringify({ continue: true }));
      timer.end({ tool: toolName, status: 'skip' });
      return;
    }

    // Invalidate git cache so statusline shows fresh diff counts after changes.
    // Use hookData.cwd (not process.cwd()) to handle subagent CWD mismatch.
    const cwd = hookData.cwd || process.cwd();
    invalidateCache(cwd);

    // Track edit in session
    const session = loadSession();
    session.editCount++;

    const filePath = toolInput.file_path || toolInput.path || '';
    if (filePath && !session.modifiedFiles.includes(filePath)) {
      session.modifiedFiles.push(filePath);
    }

    // Determine if reminder should fire
    const now = Date.now();
    const shouldRemind =
      session.editCount >= EDIT_THRESHOLD &&
      (now - session.lastReminder) > DEBOUNCE_MS;

    const result = { continue: true };

    if (shouldRemind) {
      session.lastReminder = now;
      result.additionalContext =
        `\n\n[Code Simplification Reminder] You have modified ` +
        `${session.modifiedFiles.length} file(s) across ${session.editCount} edits this session. ` +
        `Consider using the \`code-simplifier\` agent to refine recent changes before ` +
        `proceeding to code review. This is a MANDATORY step in the workflow.`;
    }

    saveSession(session);
    console.log(JSON.stringify(result));
    timer.end({ tool: toolName, status: shouldRemind ? 'reminded' : 'ok' });

  } catch (e) {
    // Fail-open: let the operation continue
    console.log(JSON.stringify({ continue: true }));
    timer.end({ status: 'error', error: e.message });
  }
}

main();

} catch (e) {
  // Minimal crash logging using only Node builtins
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      p.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: p.basename(__filename, '.cjs'), status: 'crash', error: e.message }) + '\n'
    );
  } catch (_) {}
  process.exit(0); // fail-open
}
