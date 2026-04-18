/**
 * transcript-parser.cjs - Extract tool/agent/todo state from session JSONL
 *
 * Parses Claude Code transcript files to extract tool usage, agent spawns,
 * and todo/task items for statusline and context display.
 *
 * @module transcript-parser
 */

'use strict';

const fs = require('fs');
const readline = require('readline');

/**
 * Parse transcript JSONL file
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<{tools: Object[], agents: Object[], todos: Object[], sessionStart: Date|null}>}
 */
async function parseTranscript(transcriptPath) {
  const result = {
    tools: [],
    agents: [],
    todos: [],
    sessionStart: null
  };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return result;
  }

  const toolMap = new Map();
  const agentMap = new Map();
  const latestTodos = [];

  try {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        processEntry(entry, toolMap, agentMap, latestTodos, result);
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Return partial results on read error
  }

  result.tools = Array.from(toolMap.values()).slice(-20);
  result.agents = Array.from(agentMap.values()).slice(-10);
  result.todos = latestTodos;

  return result;
}

/**
 * Process a single JSONL entry from the transcript
 * @param {Object} entry - Parsed JSON line
 * @param {Map} toolMap - Tool tracking map (id → tool state)
 * @param {Map} agentMap - Agent tracking map (id → agent state)
 * @param {Object[]} latestTodos - Mutable todo array (in-place updates)
 * @param {Object} result - Result object (session start tracking)
 */
function processEntry(entry, toolMap, agentMap, latestTodos, result) {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

  // Track session start (first timestamp seen)
  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }

  const content = entry.message?.content;
  if (!content || !Array.isArray(content)) return;

  for (const block of content) {
    // Handle tool_use blocks (tool invocations)
    if (block.type === 'tool_use' && block.id && block.name) {
      if (block.name === 'Task') {
        // Agent spawn
        agentMap.set(block.id, {
          id: block.id,
          type: block.input?.subagent_type ?? 'unknown',
          model: block.input?.model ?? null,
          description: block.input?.description ?? null,
          status: 'running',
          startTime: timestamp,
          endTime: null
        });
      } else if (block.name === 'TodoWrite') {
        // Legacy todo replacement (backward compat)
        if (block.input?.todos && Array.isArray(block.input.todos)) {
          latestTodos.length = 0;
          latestTodos.push(...block.input.todos);
        }
      } else if (block.name === 'TaskCreate') {
        // Native Task API: add new task
        if (block.input?.subject) {
          latestTodos.push({
            content: block.input.subject,
            status: 'pending',
            activeForm: block.input.activeForm || null
          });
        }
      } else if (block.name === 'TaskUpdate') {
        // Native Task API: update task status
        if (block.input?.taskId && block.input?.status) {
          const task = latestTodos.find(t => t.id === block.input.taskId);
          if (task) task.status = block.input.status;
        }
      } else {
        // Regular tool invocation
        toolMap.set(block.id, {
          id: block.id,
          name: block.name,
          target: extractTarget(block.name, block.input),
          status: 'running',
          startTime: timestamp,
          endTime: null
        });
      }
    }

    // Handle tool_result blocks (completions)
    if (block.type === 'tool_result' && block.tool_use_id) {
      const tool = toolMap.get(block.tool_use_id);
      if (tool) {
        tool.status = block.is_error ? 'error' : 'completed';
        tool.endTime = timestamp;
      }

      const agent = agentMap.get(block.tool_use_id);
      if (agent) {
        agent.status = 'completed';
        agent.endTime = timestamp;
      }
    }
  }
}

/**
 * Extract a human-readable target from tool input
 * @param {string} toolName - Tool name
 * @param {Object} input - Tool input object
 * @returns {string|null} Extracted target or null
 */
function extractTarget(toolName, input) {
  if (!input) return null;

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return input.file_path ?? input.path ?? null;

    case 'Glob':
    case 'Grep':
      return input.pattern ?? null;

    case 'Bash': {
      const cmd = input.command;
      if (!cmd) return null;
      return cmd.length > 30 ? cmd.slice(0, 30) + '...' : cmd;
    }

    default:
      return null;
  }
}

module.exports = {
  parseTranscript,
  // Export internals for testing
  processEntry,
  extractTarget
};
