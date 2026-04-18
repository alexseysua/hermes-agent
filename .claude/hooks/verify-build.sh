#!/bin/bash
# verify-build.sh - Quality gate for Agent Teams (TeammateIdle equivalent)
# Purpose: Verify build passes before agent goes idle or completes work
# Usage: Called by SubagentStop hook or manually before PR submission
#
# This hook validates the build still passes after agent modifications.
# Designed for future TeammateIdle event when Claude Code supports it.

set -e

PROJECT_ROOT="${CK_PROJECT_ROOT:-$(pwd)}"
BUILD_CMD=""

# Detect build command based on project type
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if command -v pnpm &> /dev/null && [ -f "$PROJECT_ROOT/pnpm-lock.yaml" ]; then
    BUILD_CMD="pnpm run build"
  elif command -v npm &> /dev/null; then
    BUILD_CMD="npm run build"
  fi
elif [ -f "$PROJECT_ROOT/Cargo.toml" ]; then
  BUILD_CMD="cargo build"
elif [ -f "$PROJECT_ROOT/go.mod" ]; then
  BUILD_CMD="go build ./..."
elif [ -f "$PROJECT_ROOT/Makefile" ]; then
  BUILD_CMD="make build"
fi

# Skip if no build command detected
if [ -z "$BUILD_CMD" ]; then
  echo "verify-build: No build system detected, skipping"
  exit 0
fi

# Check if build script exists in package.json
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if ! grep -q '"build"' "$PROJECT_ROOT/package.json"; then
    echo "verify-build: No build script in package.json, skipping"
    exit 0
  fi
fi

echo "verify-build: Running $BUILD_CMD"
cd "$PROJECT_ROOT"

if $BUILD_CMD 2>&1; then
  echo "verify-build: Build passed"
  exit 0
else
  echo "verify-build: Build failed!"
  exit 1
fi
