#!/bin/bash
# verify-tests.sh - Quality gate for Agent Teams (TaskCompleted equivalent)
# Purpose: Verify tests pass before task is marked complete
# Usage: Called by SubagentStop hook or manually before task completion
#
# This hook validates all tests still pass after modifications.
# Designed for future TaskCompleted event when Claude Code supports it.

set -e

PROJECT_ROOT="${CK_PROJECT_ROOT:-$(pwd)}"
TEST_CMD=""

# Detect test command based on project type
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if command -v pnpm &> /dev/null && [ -f "$PROJECT_ROOT/pnpm-lock.yaml" ]; then
    TEST_CMD="pnpm test"
  elif command -v npm &> /dev/null; then
    TEST_CMD="npm test"
  fi
elif [ -f "$PROJECT_ROOT/Cargo.toml" ]; then
  TEST_CMD="cargo test"
elif [ -f "$PROJECT_ROOT/go.mod" ]; then
  TEST_CMD="go test ./..."
elif [ -f "$PROJECT_ROOT/Makefile" ]; then
  if grep -q '^test:' "$PROJECT_ROOT/Makefile"; then
    TEST_CMD="make test"
  fi
fi

# Skip if no test command detected
if [ -z "$TEST_CMD" ]; then
  echo "verify-tests: No test system detected, skipping"
  exit 0
fi

# Check if test script exists in package.json
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if ! grep -q '"test"' "$PROJECT_ROOT/package.json"; then
    echo "verify-tests: No test script in package.json, skipping"
    exit 0
  fi
fi

echo "verify-tests: Running $TEST_CMD"
cd "$PROJECT_ROOT"

if $TEST_CMD 2>&1; then
  echo "verify-tests: All tests passed"
  exit 0
else
  echo "verify-tests: Tests failed!"
  exit 1
fi
