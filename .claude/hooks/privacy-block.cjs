#!/usr/bin/env node
/**
 * privacy-block.cjs - Block access to sensitive files unless user-approved
 *
 * PRIVACY-based blocking (separate from SIZE-based scout-block)
 * Blocks sensitive files. LLM must get user approval and use APPROVED: prefix.
 *
 * Flow:
 * 1. LLM tries: Read ".env" → BLOCKED
 * 2. LLM asks user for permission
 * 3. User approves
 * 4. LLM retries: Read "APPROVED:.env" → ALLOWED
 */

const path = require('path');
const fs = require('fs');

const {
  checkPrivacy,
  isSafeFile,
  isPrivacyBlockDisabled,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  extractPaths,
  isSuspiciousPath
} = require('./lib/privacy-checker.cjs');

/**
 * Format block message with approval instructions
 * @param {string} filePath - Blocked file path
 * @returns {string} Formatted block message
 */
function formatBlockMessage(filePath) {
  const basename = path.basename(filePath);
  return `
\x1b[36mNOTE:\x1b[0m This is not an error - this block protects sensitive data.

\x1b[33mPRIVACY BLOCK\x1b[0m: Sensitive file access requires user approval

  \x1b[33mFile:\x1b[0m ${filePath}

  This file may contain secrets (API keys, passwords, tokens).

  \x1b[34mAction required:\x1b[0m
  Ask user: "I need to read ${basename} which may contain sensitive data. Approve?"

  \x1b[32mIf YES:\x1b[0m Retry with prefix: APPROVED:${filePath}
  \x1b[31mIf NO:\x1b[0m  Do NOT retry. Continue without this file.
`;
}

/**
 * Format approval notice
 * @param {string} filePath - Approved file path
 * @returns {string} Formatted approval notice
 */
function formatApprovalNotice(filePath) {
  return `\x1b[32m✓\x1b[0m Privacy: User-approved access to ${path.basename(filePath)}`;
}

// Main
try {
  // Check if privacy block is disabled via .ck.json
  if (isPrivacyBlockDisabled()) {
    process.exit(0); // Disabled, allow all
  }

  // Read stdin synchronously (more reliable for hooks)
  const input = fs.readFileSync(0, 'utf-8');

  if (!input || input.trim().length === 0) {
    process.exit(0); // Empty input, allow
  }

  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch (e) {
    process.exit(0); // Invalid JSON, allow
  }

  const { tool_input: toolInput, tool_name: toolName } = hookData;

  // Use privacy-checker for path extraction and sensitivity check
  const paths = extractPaths(toolInput);

  // Check each path
  for (const { value: testPath } of paths) {
    if (!isPrivacySensitive(testPath)) continue;

    // Check for approval prefix
    if (hasApprovalPrefix(testPath)) {
      const strippedPath = stripApprovalPrefix(testPath);
      // Warn on suspicious paths (path traversal or absolute)
      if (isSuspiciousPath(strippedPath)) {
        console.error('\x1b[33mWARN:\x1b[0m Approved path is outside project:', strippedPath);
      }
      // User approved - allow with notice
      console.error(formatApprovalNotice(testPath));
      continue; // Check other paths
    }

    // No approval - block
    console.error(formatBlockMessage(testPath));
    process.exit(2); // Block
  }

  process.exit(0); // Allow

} catch (error) {
  // Fail-open for unexpected errors
  console.error('WARN: Hook error, allowing operation -', error.message);
  process.exit(0);
}

// Export functions for unit testing
module.exports = {
  isSafeFile,
  isPrivacyBlockDisabled,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  extractPaths,
};
