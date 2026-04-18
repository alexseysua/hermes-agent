/**
 * privacy-checker.cjs - Privacy pattern matching logic for sensitive file detection
 *
 * Pure logic module extracted from privacy-block.cjs for reuse.
 * No stdin/stdout, no exit codes.
 *
 * @module privacy-checker
 */

'use strict';

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const APPROVED_PREFIX = 'APPROVED:';

// Safe file patterns - exempt from privacy checks (documentation/template files)
const SAFE_PATTERNS = [
  /\.example$/i,   // .env.example, config.example
  /\.sample$/i,    // .env.sample
  /\.template$/i,  // .env.template
];

// Privacy-sensitive patterns
const PRIVACY_PATTERNS = [
  /^\.env$/,              // .env
  /^\.env\./,             // .env.local, .env.production, etc.
  /\.env$/,               // path/to/.env
  /\/\.env\./,            // path/to/.env.local
  /credentials/i,         // credentials.json, etc.
  /secrets?\.ya?ml$/i,    // secrets.yaml, secret.yml
  /\.pem$/,               // Private keys
  /\.key$/,               // Private keys
  /id_rsa/,               // SSH keys
  /id_ed25519/,           // SSH keys
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if path is a safe file (example/sample/template - exempt from privacy checks)
 * @param {string} testPath - Path to check
 * @returns {boolean}
 */
function isSafeFile(testPath) {
  if (!testPath) return false;
  const basename = path.basename(testPath);
  return SAFE_PATTERNS.some(p => p.test(basename));
}

/**
 * Check if path has APPROVED: prefix
 * @param {string} testPath - Path to check
 * @returns {boolean}
 */
function hasApprovalPrefix(testPath) {
  return Boolean(testPath && testPath.startsWith(APPROVED_PREFIX));
}

/**
 * Strip APPROVED: prefix from path
 * @param {string} testPath - Path to process
 * @returns {string} Path without APPROVED: prefix
 */
function stripApprovalPrefix(testPath) {
  if (hasApprovalPrefix(testPath)) {
    return testPath.slice(APPROVED_PREFIX.length);
  }
  return testPath;
}

/**
 * Check if stripped path is suspicious (path traversal or absolute)
 * @param {string} strippedPath - Path after stripping APPROVED: prefix
 * @returns {boolean}
 */
function isSuspiciousPath(strippedPath) {
  return strippedPath.includes('..') || path.isAbsolute(strippedPath);
}

/**
 * Check if path matches privacy-sensitive patterns
 * @param {string} testPath - Path to check
 * @returns {boolean}
 */
function isPrivacySensitive(testPath) {
  if (!testPath) return false;

  // Strip prefix for pattern matching
  const cleanPath = stripApprovalPrefix(testPath);
  let normalized = cleanPath.replace(/\\/g, '/');

  // Decode URI components to catch obfuscated paths (%2e = '.')
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Invalid encoding - use as-is
  }

  // Check safe patterns first - exempt example/sample/template files
  if (isSafeFile(normalized)) return false;

  const basename = path.basename(normalized);

  for (const pattern of PRIVACY_PATTERNS) {
    if (pattern.test(basename) || pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract paths from tool input (file_path, path, pattern, or command)
 * @param {Object} toolInput - Tool input object
 * @returns {Array<{value: string, field: string}>} Extracted paths with field names
 */
function extractPaths(toolInput) {
  const paths = [];
  if (!toolInput) return paths;

  if (toolInput.file_path) paths.push({ value: toolInput.file_path, field: 'file_path' });
  if (toolInput.path) paths.push({ value: toolInput.path, field: 'path' });
  if (toolInput.pattern) paths.push({ value: toolInput.pattern, field: 'pattern' });

  // Check bash commands for sensitive file paths
  if (toolInput.command) {
    const approvedMatch = toolInput.command.match(/APPROVED:[^\s]+/g) || [];
    approvedMatch.forEach(p => paths.push({ value: p, field: 'command' }));

    // Only look for .env patterns if no APPROVED: version found
    if (approvedMatch.length === 0) {
      const envMatch = toolInput.command.match(/\.env[^\s]*/g) || [];
      envMatch.forEach(p => paths.push({ value: p, field: 'command' }));

      // Check bash variable assignments: FILE=.env, ENV_FILE=.env.local
      const varAssignments = toolInput.command.match(/\w+=[^\s]*\.env[^\s]*/g) || [];
      varAssignments.forEach(a => {
        const value = a.split('=')[1];
        if (value) paths.push({ value, field: 'command' });
      });

      // Check command substitution containing .env: $(cat .env)
      const cmdSubst = toolInput.command.match(/\$\([^)]*?(\.env[^\s)]*)[^)]*\)/g) || [];
      for (const subst of cmdSubst) {
        const inner = subst.match(/\.env[^\s)]*/);
        if (inner) paths.push({ value: inner[0], field: 'command' });
      }
    }
  }

  return paths.filter(p => p.value);
}

/**
 * Load .ck.json config to check if privacy block is disabled
 * @param {string} [configDir] - Directory containing .ck.json (defaults to .claude in cwd)
 * @returns {boolean} true if privacy block should be skipped
 */
function isPrivacyBlockDisabled(configDir) {
  try {
    const configPath = configDir
      ? path.join(configDir, '.ck.json')
      : path.join(process.cwd(), '.claude', '.ck.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.privacyBlock === false;
  } catch {
    return false; // Default to enabled on error
  }
}

/**
 * Build prompt data for user approval request
 * @param {string} filePath - Blocked file path
 * @returns {Object} Prompt data object
 */
function buildPromptData(filePath) {
  const basename = path.basename(filePath);
  return {
    type: 'PRIVACY_PROMPT',
    file: filePath,
    basename,
    question: {
      header: 'File Access',
      text: `I need to read "${basename}" which may contain sensitive data (API keys, passwords, tokens). Do you approve?`,
      options: [
        { label: 'Yes, approve access', description: `Allow reading ${basename} this time` },
        { label: 'No, skip this file', description: 'Continue without accessing this file' }
      ]
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a tool call accesses privacy-sensitive files
 *
 * @param {Object} params
 * @param {string} params.toolName - Name of tool (Read, Write, Bash, etc.)
 * @param {Object} params.toolInput - Tool input object
 * @param {Object} [params.options]
 * @param {boolean} [params.options.disabled] - Skip checks if true
 * @param {string} [params.options.configDir] - Directory for .ck.json config
 * @param {boolean} [params.options.allowBash=true] - Allow Bash tool without blocking
 * @returns {{
 *   blocked: boolean,
 *   filePath?: string,
 *   reason?: string,
 *   approved?: boolean,
 *   isBash?: boolean,
 *   suspicious?: boolean,
 *   promptData?: Object
 * }}
 */
function checkPrivacy({ toolName, toolInput, options = {} }) {
  const { disabled, configDir, allowBash = true } = options;

  if (disabled || isPrivacyBlockDisabled(configDir)) {
    return { blocked: false };
  }

  const isBashTool = toolName === 'Bash';
  const paths = extractPaths(toolInput);

  for (const { value: testPath } of paths) {
    if (!isPrivacySensitive(testPath)) continue;

    if (hasApprovalPrefix(testPath)) {
      const strippedPath = stripApprovalPrefix(testPath);
      return {
        blocked: false,
        approved: true,
        filePath: strippedPath,
        suspicious: isSuspiciousPath(strippedPath)
      };
    }

    // For Bash: warn but don't block (allows "Yes → bash cat" flow)
    if (isBashTool && allowBash) {
      return {
        blocked: false,
        isBash: true,
        filePath: testPath,
        reason: `Bash command accesses sensitive file: ${testPath}`
      };
    }

    return {
      blocked: true,
      filePath: testPath,
      reason: 'Sensitive file access requires user approval',
      promptData: buildPromptData(testPath)
    };
  }

  return { blocked: false };
}

module.exports = {
  checkPrivacy,
  isSafeFile,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  isSuspiciousPath,
  extractPaths,
  isPrivacyBlockDisabled,
  buildPromptData,
  APPROVED_PREFIX,
  SAFE_PATTERNS,
  PRIVACY_PATTERNS
};
