#!/usr/bin/env node
'use strict';

/**
 * PostToolUse Hook: Context Warning System
 *
 * Reads CK's existing context tracker marker data and emits
 * additionalContext warnings when context usage is high.
 *
 * - WARNING at ≤35% remaining (usage ≥65%)
 * - CRITICAL at ≤25% remaining (usage ≥75%)
 * - Debounce: every 5 tool calls (severity escalation bypasses)
 *
 * GSD-inspired, but reads CK's existing marker files — no parallel tracking.
 *
 * @module context-warning
 */

const fs = require('fs');
const {
  CONTEXT_WARNING_DIR,
  ensureDir,
  getMarkerPath,
  getContextWarningPath
} = require('./lib/ck-paths.cjs');
const { trackContext } = require('./lib/context-tracker.cjs');

// Thresholds (GSD-proven values)
const WARNING_THRESHOLD = 65;  // remaining ≤35% → usage ≥65%
const CRITICAL_THRESHOLD = 75; // remaining ≤25% → usage ≥75%
const DEBOUNCE_CALLS = 5;

/**
 * Read debounce state for session
 * @param {string} sessionId
 * @returns {Object} { callsSinceWarn, lastSeverity }
 */
function readDebounce(sessionId) {
  try {
    const p = getContextWarningPath(sessionId);
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data && typeof data.callsSinceWarn === 'number') return data;
    }
  } catch (_) {
    // Corrupt → reset
  }
  return { callsSinceWarn: 0, lastSeverity: null };
}

/**
 * Write debounce state for session
 * @param {string} sessionId
 * @param {Object} state
 */
function writeDebounce(sessionId, state) {
  try {
    ensureDir(CONTEXT_WARNING_DIR);
    fs.writeFileSync(getContextWarningPath(sessionId), JSON.stringify(state));
  } catch (_) {
    // Silent fail
  }
}

// Read stdin (PostToolUse payload)
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || 'default';

    // Extract context window data from PostToolUse payload
    const contextInput = data.context_window?.total_input_tokens || 0;
    const contextOutput = data.context_window?.total_output_tokens || 0;
    const contextWindowSize = data.context_window?.context_window_size || 0;

    // No context data → exit silently
    if (!contextWindowSize || !contextInput) {
      process.exit(0);
    }

    // Use CK's existing context tracker to get percentage
    const result = trackContext({ sessionId, contextInput, contextOutput, contextWindowSize });
    const usage = result.percentage; // percentage of compact threshold used
    const remaining = 100 - usage;

    // Not at warning level → reset debounce only if prior state exists, then exit
    if (usage < WARNING_THRESHOLD) {
      if (fs.existsSync(getContextWarningPath(sessionId))) {
        writeDebounce(sessionId, { callsSinceWarn: 0, lastSeverity: null });
      }
      process.exit(0);
    }

    // Determine severity
    const severity = usage >= CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING';

    // Read debounce state
    const debounce = readDebounce(sessionId);
    debounce.callsSinceWarn = (debounce.callsSinceWarn || 0) + 1;

    // Severity escalation bypasses debounce
    const escalated = debounce.lastSeverity === 'WARNING' && severity === 'CRITICAL';

    // Debounce: only warn every N calls unless escalated
    if (debounce.callsSinceWarn < DEBOUNCE_CALLS && !escalated) {
      writeDebounce(sessionId, debounce);
      process.exit(0);
    }

    // Reset counter after emitting warning
    writeDebounce(sessionId, { callsSinceWarn: 0, lastSeverity: severity });

    // Build warning message
    let message;
    if (severity === 'CRITICAL') {
      message = `CONTEXT CRITICAL: Usage at ${usage}%. Remaining: ${remaining}%. STOP new work. Run /pause NOW to save execution state.`;
    } else {
      message = `CONTEXT WARNING: Usage at ${usage}%. Remaining: ${remaining}%. Wrap up current task. Don't start new complex work. Consider /pause to save state.`;
    }

    // Emit via PostToolUse additionalContext
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));

  } catch (_) {
    // Silent fail — never break the tool execution
  }
});
