#!/usr/bin/env node
/**
 * SessionStart Hook - Scans plans/ for pending/in-progress plans
 *
 * Fires: On startup|resume only
 * Purpose: Inject additionalContext with undone plan list so Claude can suggest continuing
 *
 * Exit Codes:
 *   0 - Always (non-blocking)
 */

const fs = require('fs');
const path = require('path');

// Directories to skip when scanning plans/
const SKIP_DIRS = new Set(['archive', 'reports', 'templates', 'research', 'scout']);

// Statuses considered "done" — everything else is shown
const DONE_STATUSES = new Set(['completed', 'done', 'archived']);

/**
 * Parse YAML frontmatter from plan.md content
 * Simple regex parser — no YAML lib needed for flat key:value pairs
 * @param {string} content - File content
 * @returns {Object} Parsed frontmatter fields
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 1) continue;
    const key = line.slice(0, colonIdx).trim();
    if (!/^\w[\w-]*$/.test(key)) continue;
    let val = line.slice(colonIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    result[key] = val;
  }
  return result;
}

try {
  const plansDir = path.resolve('plans');
  if (!fs.existsSync(plansDir)) process.exit(0);

  const entries = fs.readdirSync(plansDir, { withFileTypes: true });
  const planDirs = entries
    .filter(e => e.isDirectory() && /^\d{6}/.test(e.name) && !SKIP_DIRS.has(e.name))
    .map(e => e.name)
    .sort()
    .reverse(); // newest first

  if (planDirs.length === 0) process.exit(0);

  const pendingPlans = [];

  for (const dir of planDirs) {
    const planFile = path.join(plansDir, dir, 'plan.md');
    if (!fs.existsSync(planFile)) continue;

    try {
      const content = fs.readFileSync(planFile, 'utf-8');
      const fm = parseFrontmatter(content);
      const status = (fm.status || 'unknown').toLowerCase();

      if (DONE_STATUSES.has(status)) continue;

      pendingPlans.push({
        title: fm.title || dir,
        status: fm.status || 'unknown',
        priority: fm.priority || '-',
        effort: fm.effort || '-',
        created: fm.created || dir.slice(0, 6),
        path: `plans/${dir}`
      });
    } catch {
      // Skip malformed plan files
    }
  }

  if (pendingPlans.length === 0) process.exit(0);

  // Build table
  const rows = pendingPlans.map((p, i) =>
    `| ${i + 1} | ${p.title} | ${p.status} | ${p.priority} | \`${p.path}\` |`
  );

  const table = [
    '## Pending Plans',
    '',
    '| # | Plan | Status | Priority | Path |',
    '|---|------|--------|----------|------|',
    ...rows,
    '',
    'Continue a plan with `/code <path>` or archive with `/plan:archive`.'
  ].join('\n');

  console.log(JSON.stringify({ additionalContext: table }));
} catch {
  // Non-blocking — exit silently on any error
}
