# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source of Truth

`AGENTS.md` is the canonical development guide — project structure, file dependency chain, agent loop, slash command registry, tool registration, skin engine, profiles, and the full list of "Known Pitfalls." Read it before making non-trivial changes. `CONTRIBUTING.md` covers the skill-vs-tool decision and skill authoring.

Additional repo-specific rules live in `.claude/workflows/development-rules.md`.

## Environment Setup

Python 3.11+ with `uv`. The venv is required for every Python invocation.

```bash
uv venv venv --python 3.11
source venv/bin/activate            # REQUIRED before any python/pytest call
uv pip install -e ".[all,dev]"      # full dev install (messaging, cron, cli, dev)
npm install                         # optional — browser tools / WhatsApp bridge
```

User state lives in `~/.hermes/` (config.yaml, .env, skills/, memories/, sessions/, state.db). For a dev shell, copy `cli-config.yaml.example` → `~/.hermes/config.yaml` and add at least one provider key to `~/.hermes/.env`.

## Common Commands

```bash
# Tests (pytest.ini_options already sets -m 'not integration' -n auto)
source venv/bin/activate
python -m pytest tests/ -q                       # full suite (~3000 tests, ~3 min)
python -m pytest tests/test_model_tools.py -q    # single file
python -m pytest tests/test_cli_init.py::test_name -q   # single test
python -m pytest -m integration tests/           # opt-in: integration tests (need API keys)

# Run the agent
hermes                  # interactive TUI
hermes doctor           # diagnostics
hermes chat -q "..."    # one-shot
hermes gateway start    # messaging gateway
python run_agent.py --help
```

There is no lint/format step configured in the repo — PEP 8 by convention, no strict enforcement.

## Big-Picture Architecture

Hermes is an OpenAI-compatible agent loop with a self-registering tool system, a persistent SQLite session store, and multiple front-ends (CLI, gateway, ACP) that all share the same core.

**Dependency chain** (bottom → top, loading order matters):

```
tools/registry.py                                  # pure registry, zero deps
  ↑ each tools/*.py calls registry.register() at import time
model_tools.py                                     # imports tool modules → triggers discovery
  ↑
run_agent.py  ·  cli.py  ·  batch_runner.py  ·  gateway/run.py  ·  acp_adapter/
```

**Agent loop** lives in `run_agent.py::AIAgent.run_conversation()` — synchronous `while` loop that calls an OpenAI-compatible completions endpoint, dispatches any `tool_calls` through `handle_function_call()` in `model_tools.py`, appends tool result messages, and repeats until the model returns text. Messages use OpenAI format; reasoning content goes in `assistant_msg["reasoning"]`. Context compression runs when approaching the model's window.

**Front-ends sharing the core:**
- `cli.py` — `HermesCLI` interactive TUI (prompt_toolkit + Rich), `KawaiiSpinner` activity feed
- `gateway/` — `GatewayRunner` routes messages from Telegram/Discord/Slack/WhatsApp/Signal/Matrix/HomeAssistant/Email through the same `AIAgent`
- `acp_adapter/` — VS Code / Zed / JetBrains integration
- `batch_runner.py` — parallel trajectory generation

**Slash commands are single-sourced** in `hermes_cli/commands.py::COMMAND_REGISTRY` (list of `CommandDef`). Dispatch, `/help` text, Telegram BotCommand menu, Slack subcommand map, and autocomplete are all derived from it. Adding a command means: registry entry + handler in `cli.py::process_command()` + (if applicable) handler in `gateway/run.py`. Adding an alias is a one-line change to the `aliases` tuple.

**Tools self-register** — create `tools/your_tool.py`, call `registry.register(...)`, add the import to `_discover_tools()` in `model_tools.py`, and add the tool to a toolset in `toolsets.py` (`_HERMES_CORE_TOOLS` or a new toolset). Handlers must return a JSON string. Schemas must not hard-reference tools from other toolsets by name (availability is dynamic — use the post-processing blocks in `get_tool_definitions()` instead).

**Session persistence** — `hermes_state.py::SessionDB` backs SQLite with FTS5 full-text search. JSON session logs go to `~/.hermes/sessions/`. System prompts and prefill messages are injected ephemerally at API call time — never persisted.

**Profiles (multi-instance isolation)** — `hermes_cli/main.py::_apply_profile_override()` sets `HERMES_HOME` before any other import. Always use `get_hermes_home()` / `display_hermes_home()` from `hermes_constants`; never hardcode `~/.hermes` or `Path.home() / ".hermes"` in code that reads or writes state (broke 5 bugs in PR #3575).

## Critical Invariants

- **Prompt caching must stay valid.** Do not alter past context, swap toolsets, reload memories, or rebuild system prompts mid-conversation. The only sanctioned mutation is context compression.
- **Skill slash commands are injected as a user message**, not into the system prompt — preserves the cache.
- **Tests must not touch `~/.hermes/`.** The `_isolate_hermes_home` autouse fixture in `tests/conftest.py` redirects `HERMES_HOME` to a temp dir. Profile tests additionally mock `Path.home()` — see `tests/hermes_cli/test_profiles.py`.
- **CLI cwd = `os.getcwd()`. Gateway cwd = `MESSAGING_CWD`** (defaults to `$HOME`). Don't conflate them.
- **Avoid `simple_term_menu`** — rendering bugs in tmux/iTerm2. Use `curses` (see `hermes_cli/tools_config.py`).
- **No `\033[K`** in spinner/display code — leaks as literal `?[K` under prompt_toolkit's `patch_stdout`. Pad with spaces.
- `_last_resolved_tool_names` in `model_tools.py` is a process-global saved/restored by `delegate_tool.py::_run_single_child()` around subagent runs — may be temporarily stale.

## Skill vs Tool

Default to **skill** (markdown + scripts in `skills/` or `optional-skills/`). Build a **tool** only when you need end-to-end Python integration, managed API-key auth, binary/streaming data, or logic that must run deterministically every time (browser automation, TTS, vision). See `CONTRIBUTING.md`.
