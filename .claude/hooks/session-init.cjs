#!/usr/bin/env node
/**
 * SessionStart Hook - Initializes session environment with project detection
 *
 * Fires: Once per session (startup, resume, clear, compact)
 * Purpose: Load config, detect project info, persist to env vars, output context
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  loadConfig,
  writeEnv,
  writeSessionState,
  readSessionState,
  resolvePlanPath,
  getReportsPath,
  resolveNamingPattern,
  getMemoryStatus,
  buildMemoryOutput,
  parsePrIdentifier,
  extractPrContext,
  buildPrOutput
} = require('./lib/ck-config-utils.cjs');
const { writeResetMarker } = require('./lib/context-tracker.cjs');
const {
  detectProjectType,
  detectPackageManager,
  detectFramework,
  getPythonVersion,
  getGitRemoteUrl,
  getGitBranch,
  getGitRoot,
  getCodingLevelStyleName,
  getCodingLevelGuidelines,
  buildContextOutput
} = require('./lib/project-detector.cjs');

/**
 * Main hook execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    const data = stdin ? JSON.parse(stdin) : {};
    const envFile = process.env.CLAUDE_ENV_FILE;
    const source = data.source || 'unknown';
    const sessionId = data.session_id || null;

    const config = loadConfig();

    // Layer 3: Write reset marker on /clear to signal statusline to reset baseline
    // This ensures context window percentage resets to 0% on fresh sessions
    if (source === 'clear' && sessionId) {
      writeResetMarker(sessionId, 'clear');
    }

    const detections = {
      type: detectProjectType(config.project?.type),
      pm: detectPackageManager(config.project?.packageManager),
      framework: detectFramework(config.project?.framework)
    };

    // Resolve plan - now returns { path, resolvedBy }
    const resolved = resolvePlanPath(sessionId, config);

    // Get memory status (Phase 3)
    const memoryStatus = getMemoryStatus(config);

    // Get PR context (Phase 5) - check env var or existing session state
    const prNumber = process.env.CLAUDE_PR_NUMBER;
    const existingState = readSessionState(sessionId);
    let prContext = null;

    if (prNumber) {
      const parsedPr = parsePrIdentifier(prNumber);
      if (parsedPr) {
        prContext = extractPrContext(parsedPr);
      }
    } else if (existingState?.prNumber) {
      // Preserve existing PR link from previous session
      prContext = {
        number: existingState.prNumber,
        url: existingState.prUrl,
        title: existingState.prTitle,
        headRefName: existingState.prBranch
      };
    }

    // CRITICAL FIX: Only persist explicitly-set plans to session state
    // Branch-matched plans are "suggested" - stored separately, not as activePlan
    // This prevents stale plan pollution on fresh sessions
    if (sessionId) {
      writeSessionState(sessionId, {
        sessionOrigin: process.cwd(),
        // Only session-resolved plans are truly "active"
        activePlan: resolved.resolvedBy === 'session' ? resolved.path : null,
        // Track suggested plan separately (for UI hints, not for report paths)
        suggestedPlan: resolved.resolvedBy === 'branch' ? resolved.path : null,
        // PR context (Phase 5)
        prNumber: prContext?.number || null,
        prUrl: prContext?.url || null,
        prTitle: prContext?.title || null,
        prBranch: prContext?.headRefName || null,
        timestamp: Date.now(),
        source
      });
    }

    // Reports path only uses active plans, not suggested ones
    const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, config.plan, config.paths);

    // Collect static environment info (computed once per session)
    const gitRoot = getGitRoot();
    const staticEnv = {
      nodeVersion: process.version,
      pythonVersion: getPythonVersion(),
      osPlatform: process.platform,
      gitUrl: getGitRemoteUrl(),
      gitBranch: getGitBranch(),
      gitRoot,
      user: process.env.USERNAME || process.env.USER || process.env.LOGNAME || os.userInfo().username,
      locale: process.env.LANG || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      claudeSettingsDir: path.resolve(__dirname, '..')
    };

    // Compute resolved naming pattern (date + issue resolved, {slug} kept as placeholder)
    const namePattern = resolveNamingPattern(config.plan, staticEnv.gitBranch);

    if (envFile) {
      // Session & plan config
      writeEnv(envFile, 'CK_SESSION_ID', sessionId || '');
      writeEnv(envFile, 'CK_PLAN_NAMING_FORMAT', config.plan.namingFormat);
      writeEnv(envFile, 'CK_PLAN_DATE_FORMAT', config.plan.dateFormat);
      writeEnv(envFile, 'CK_PLAN_ISSUE_PREFIX', config.plan.issuePrefix || '');
      writeEnv(envFile, 'CK_PLAN_REPORTS_DIR', config.plan.reportsDir);

      // NEW: Resolved naming pattern for DRY file naming in agents
      // Example: "251212-1830-GH-88-{slug}" or "251212-1830-{slug}"
      // Agents use: `{agent-type}-$CK_NAME_PATTERN.md` and substitute {slug}
      writeEnv(envFile, 'CK_NAME_PATTERN', namePattern);

      // Plan resolution
      writeEnv(envFile, 'CK_ACTIVE_PLAN', resolved.resolvedBy === 'session' ? resolved.path : '');
      writeEnv(envFile, 'CK_SUGGESTED_PLAN', resolved.resolvedBy === 'branch' ? resolved.path : '');
      writeEnv(envFile, 'CK_REPORTS_PATH', reportsPath);

      // Paths
      writeEnv(envFile, 'CK_DOCS_PATH', config.paths.docs);
      writeEnv(envFile, 'CK_PLANS_PATH', config.paths.plans);
      writeEnv(envFile, 'CK_PROJECT_ROOT', process.cwd());

      // Project detection
      writeEnv(envFile, 'CK_PROJECT_TYPE', detections.type || '');
      writeEnv(envFile, 'CK_PACKAGE_MANAGER', detections.pm || '');
      writeEnv(envFile, 'CK_FRAMEWORK', detections.framework || '');

      // NEW: Static environment info (so other hooks don't need to recompute)
      writeEnv(envFile, 'CK_NODE_VERSION', staticEnv.nodeVersion);
      writeEnv(envFile, 'CK_PYTHON_VERSION', staticEnv.pythonVersion || '');
      writeEnv(envFile, 'CK_OS_PLATFORM', staticEnv.osPlatform);
      writeEnv(envFile, 'CK_GIT_URL', staticEnv.gitUrl || '');
      writeEnv(envFile, 'CK_GIT_BRANCH', staticEnv.gitBranch || '');
      writeEnv(envFile, 'CK_USER', staticEnv.user);
      writeEnv(envFile, 'CK_LOCALE', staticEnv.locale);
      writeEnv(envFile, 'CK_TIMEZONE', staticEnv.timezone);
      writeEnv(envFile, 'CK_CLAUDE_SETTINGS_DIR', staticEnv.claudeSettingsDir);

      // Locale config
      if (config.locale?.thinkingLanguage) {
        writeEnv(envFile, 'CK_THINKING_LANGUAGE', config.locale.thinkingLanguage);
      }
      if (config.locale?.responseLanguage) {
        writeEnv(envFile, 'CK_RESPONSE_LANGUAGE', config.locale.responseLanguage);
      }

      // Plan validation config (for /plan:validate, /plan:hard, /plan:parallel)
      const validation = config.plan?.validation || {};
      writeEnv(envFile, 'CK_VALIDATION_MODE', validation.mode || 'prompt');
      writeEnv(envFile, 'CK_VALIDATION_MIN_QUESTIONS', validation.minQuestions || 3);
      writeEnv(envFile, 'CK_VALIDATION_MAX_QUESTIONS', validation.maxQuestions || 8);
      writeEnv(envFile, 'CK_VALIDATION_FOCUS_AREAS', (validation.focusAreas || ['assumptions', 'risks', 'tradeoffs', 'architecture']).join(','));

      // Memory config (Phase 3)
      writeEnv(envFile, 'CK_MEMORY_ENABLED', memoryStatus.enabled ? '1' : '0');
      if (memoryStatus.auto.path) {
        writeEnv(envFile, 'CK_MEMORY_AUTO_PATH', memoryStatus.auto.path);
      }

      // PR context (Phase 5)
      if (prContext) {
        writeEnv(envFile, 'CK_PR_NUMBER', prContext.number);
        writeEnv(envFile, 'CK_PR_URL', prContext.url || '');
        writeEnv(envFile, 'CK_PR_BRANCH', prContext.headRefName || '');
      }

      // Experimental features
      writeEnv(envFile, 'CK_EXPERIMENTAL_AGENT_TEAMS', config.experimental?.agentTeams ? '1' : '0');

      // Coding level config (for output style selection)
      const codingLevel = config.codingLevel ?? -1;
      writeEnv(envFile, 'CK_CODING_LEVEL', codingLevel);
      writeEnv(envFile, 'CK_CODING_LEVEL_STYLE', getCodingLevelStyleName(codingLevel));
    }

    console.log(`Session ${source}. ${buildContextOutput(config, detections, resolved, gitRoot)}`);

    // Output memory status (Phase 3)
    const memoryOutput = buildMemoryOutput(memoryStatus);
    if (memoryOutput) {
      console.log(memoryOutput);
    }

    // Output PR context (Phase 5)
    const prOutput = buildPrOutput(prContext);
    if (prOutput) {
      console.log(prOutput);
    }

    // Auto-inject coding level guidelines (if not disabled)
    const codingLevel = config.codingLevel ?? -1;
    // Pass config dir so project-detector knows where to find output-styles
    const guidelines = getCodingLevelGuidelines(codingLevel, path.resolve(__dirname, '..'));
    if (guidelines) {
      console.log(`\n${guidelines}`);
    }

    if (config.assertions?.length > 0) {
      console.log(`\nUser Assertions:`);
      config.assertions.forEach((assertion, i) => {
        console.log(`  ${i + 1}. ${assertion}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(`SessionStart hook error: ${error.message}`);
    process.exit(0);
  }
}

// Outer crash wrapper - ensures hook never blocks Claude (fail-open)
main().catch(err => {
  try {
    const fs2 = require('fs');
    const path2 = require('path');
    const logsDir = path2.join(__dirname, '.logs');
    fs2.mkdirSync(logsDir, { recursive: true });
    fs2.appendFileSync(
      path2.join(logsDir, 'session-init-crash.log'),
      `[${new Date().toISOString()}] ${err.stack || err.message}\n`
    );
  } catch { /* ignore logging failure */ }
  process.exit(0); // Fail-open: never block Claude
});
