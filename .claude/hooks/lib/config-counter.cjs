/**
 * config-counter.cjs - Count CLAUDE.md, rules, MCPs, hooks across user and project scopes
 *
 * Used by statusline to display configuration summary.
 *
 * @module config-counter
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get MCP server names from a Claude settings file
 * @param {string} filePath - Path to settings JSON file
 * @returns {Set<string>} Set of MCP server names
 */
function getMcpServerNames(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      return new Set(Object.keys(config.mcpServers));
    }
  } catch {
    // Silent fail - corrupt or inaccessible file
  }
  return new Set();
}

/**
 * Count MCP servers in a settings file, optionally excluding servers from another file
 * @param {string} filePath - Settings file to count from
 * @param {string} [excludeFrom] - Settings file whose servers to exclude (dedup)
 * @returns {number} Count of unique MCP servers
 */
function countMcpServersInFile(filePath, excludeFrom) {
  const servers = getMcpServerNames(filePath);
  if (excludeFrom) {
    const exclude = getMcpServerNames(excludeFrom);
    for (const name of exclude) {
      servers.delete(name);
    }
  }
  return servers.size;
}

/**
 * Count hook event listeners in a Claude settings file
 * @param {string} filePath - Path to settings JSON file
 * @returns {number} Number of hook event entries
 */
function countHooksInFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    if (config.hooks && typeof config.hooks === 'object') {
      return Object.keys(config.hooks).length;
    }
  } catch {
    // Silent fail
  }
  return 0;
}

/**
 * Recursively count .md files in a rules directory
 * Skips symlinks to prevent infinite loops. Depth-limited.
 * @param {string} rulesDir - Directory to scan
 * @param {number} [depth=0] - Current recursion depth
 * @returns {number} Total .md file count
 */
function countRulesInDir(rulesDir, depth = 0) {
  // Depth limit prevents symlink loops and excessive recursion
  if (depth > 5 || !fs.existsSync(rulesDir)) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue; // Skip symlinks to prevent loops
      const fullPath = path.join(rulesDir, entry.name);
      if (entry.isDirectory()) {
        count += countRulesInDir(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        count++;
      }
    }
  } catch {
    // Silent fail - unreadable directory
  }
  return count;
}

/**
 * Count all config items across user and project scopes
 * @param {string} [cwd] - Project directory (defaults to process.cwd())
 * @returns {{ claudeMdCount: number, rulesCount: number, mcpCount: number, hooksCount: number }}
 */
function countConfigs(cwd) {
  let claudeMdCount = 0, rulesCount = 0, mcpCount = 0, hooksCount = 0;
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');

  // User scope
  if (fs.existsSync(path.join(claudeDir, 'CLAUDE.md'))) claudeMdCount++;
  rulesCount += countRulesInDir(path.join(claudeDir, 'rules'));
  const userSettings = path.join(claudeDir, 'settings.json');
  mcpCount += countMcpServersInFile(userSettings);
  hooksCount += countHooksInFile(userSettings);
  mcpCount += countMcpServersInFile(path.join(homeDir, '.claude.json'), userSettings);

  // Project scope
  const projectDir = cwd || process.cwd();
  if (fs.existsSync(path.join(projectDir, 'CLAUDE.md'))) claudeMdCount++;
  if (fs.existsSync(path.join(projectDir, 'CLAUDE.local.md'))) claudeMdCount++;
  if (fs.existsSync(path.join(projectDir, '.claude', 'CLAUDE.md'))) claudeMdCount++;
  if (fs.existsSync(path.join(projectDir, '.claude', 'CLAUDE.local.md'))) claudeMdCount++;
  rulesCount += countRulesInDir(path.join(projectDir, '.claude', 'rules'));
  mcpCount += countMcpServersInFile(path.join(projectDir, '.mcp.json'));
  const projectSettings = path.join(projectDir, '.claude', 'settings.json');
  mcpCount += countMcpServersInFile(projectSettings);
  hooksCount += countHooksInFile(projectSettings);
  const localSettings = path.join(projectDir, '.claude', 'settings.local.json');
  mcpCount += countMcpServersInFile(localSettings);
  hooksCount += countHooksInFile(localSettings);

  return { claudeMdCount, rulesCount, mcpCount, hooksCount };
}

module.exports = {
  countConfigs,
  getMcpServerNames,
  countMcpServersInFile,
  countHooksInFile,
  countRulesInDir
};
