#!/usr/bin/env node
'use strict';

/**
 * ClaudeKit Paths - Centralized path constants for all temporary/runtime files
 *
 * All ClaudeKit temp files consolidated under /tmp/ck/ namespace for:
 * - Cleaner /tmp directory (single namespace)
 * - Easier cleanup (rm -rf /tmp/ck/)
 * - Debugging (all state in one place)
 * - No collisions with other tools
 *
 * Fixes:
 * - #177: Race condition from shared global state file
 * - #178: Scattered temp files consolidation
 *
 * @module ck-paths
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// Root directory for all ClaudeKit temp files
const CK_TMP_DIR = path.join(os.tmpdir(), 'ck');

// Session-specific marker files (per-session, no race conditions)
const MARKERS_DIR = path.join(CK_TMP_DIR, 'markers');

// Global calibration data (shared by design - records compact thresholds)
const CALIBRATION_PATH = path.join(CK_TMP_DIR, 'calibration.json');

// Debug logs directory
const DEBUG_DIR = path.join(CK_TMP_DIR, 'debug');

// Context warning debounce state (per-session)
const CONTEXT_WARNING_DIR = path.join(CK_TMP_DIR, 'ctx-warn');

// Hook status summary for statusline (written by memory-provision, read by statusline)
const HOOK_STATUS_PATH = path.join(CK_TMP_DIR, 'hook-status.json');

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path to create
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    // Silent fail - non-critical, but log for debugging
    if (process.env.CK_DEBUG) {
      console.error(`[CK] Failed to create ${dirPath}: ${err.message}`);
    }
  }
}

// Sanitize sessionId to prevent path traversal
function sanitizeSessionId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

/**
 * Get marker file path for a session
 * @param {string} sessionId - Session ID
 * @returns {string} Full path to marker file
 */
function getMarkerPath(sessionId) {
  return path.join(MARKERS_DIR, `${sanitizeSessionId(sessionId)}.json`);
}

/**
 * Get debug log path for a session
 * @param {string} sessionId - Session ID
 * @returns {string} Full path to debug log
 */
function getDebugLogPath(sessionId) {
  return path.join(DEBUG_DIR, `${sanitizeSessionId(sessionId)}.log`);
}

/**
 * Get context warning debounce state path for a session
 * @param {string} sessionId - Session ID
 * @returns {string} Full path to warning state file
 */
function getContextWarningPath(sessionId) {
  return path.join(CONTEXT_WARNING_DIR, `${sanitizeSessionId(sessionId)}.json`);
}

/**
 * Encode CWD to filesystem-safe project identifier
 * Matches Claude Code's auto-memory path convention: /home/user/project → home-user-project
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 * @returns {string} Encoded path safe for directory names
 */
function encodeCwdPath(cwd) {
  return (cwd || process.cwd()).replace(/^\//, '').replace(/\//g, '-');
}

/**
 * Initialize ClaudeKit temp directories
 * Call this at startup to ensure directories exist
 */
function initDirs() {
  ensureDir(CK_TMP_DIR);
  ensureDir(MARKERS_DIR);
  ensureDir(DEBUG_DIR);
  ensureDir(CONTEXT_WARNING_DIR);
}

/**
 * Clean up all ClaudeKit temp files
 * Useful for testing or manual cleanup
 */
function cleanAll() {
  try {
    if (fs.existsSync(CK_TMP_DIR)) {
      fs.rmSync(CK_TMP_DIR, { recursive: true, force: true });
    }
  } catch (err) {
    // Silent fail
  }
}

module.exports = {
  // Directories
  CK_TMP_DIR,
  MARKERS_DIR,
  DEBUG_DIR,
  CONTEXT_WARNING_DIR,

  // Files
  CALIBRATION_PATH,
  HOOK_STATUS_PATH,

  // Helpers
  encodeCwdPath,
  sanitizeSessionId,
  ensureDir,
  getMarkerPath,
  getDebugLogPath,
  getContextWarningPath,
  initDirs,
  cleanAll
};
