#!/bin/bash
# install-global.sh - Install ClaudeKit Engineer to ~/.claude/ (global)
#
# Usage:
#   ./install-global.sh                    # From ClaudeKit repo root
#   ./install-global.sh --source /path     # Specify source directory
#
# What it does:
#   - Copies commands, agents, skills, hooks, workflows, scripts to ~/.claude/
#   - Generates settings.json with $HOME-based absolute paths
#   - Preserves existing ~/.claude/CLAUDE.md (won't overwrite)
#   - Backs up existing settings.json

set -euo pipefail

# Parse args
SOURCE="."
while [[ $# -gt 0 ]]; do
  case $1 in
    --source) SOURCE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

DEST="$HOME/.claude"

# Validate source
if [ ! -d "$SOURCE/.claude/commands" ]; then
  echo "Error: ClaudeKit source not found at $SOURCE"
  echo "Run from ClaudeKit repo root or use --source /path/to/claudekit"
  exit 1
fi

echo "Installing ClaudeKit to $DEST..."

# Create dest if needed
mkdir -p "$DEST"

# Backup settings.json
if [ -f "$DEST/settings.json" ]; then
  cp "$DEST/settings.json" "$DEST/settings.json.bak"
  echo "  Backed up settings.json -> settings.json.bak"
fi

# Copy directories
DIRS=(commands agents skills hooks workflows scripts output-styles)
for dir in "${DIRS[@]}"; do
  if [ -d "$SOURCE/.claude/$dir" ]; then
    cp -r "$SOURCE/.claude/$dir" "$DEST/"
    echo "  Copied $dir/"
  fi
done

# Copy single files
FILES=(.ckignore metadata.json statusline.cjs)
for file in "${FILES[@]}"; do
  if [ -f "$SOURCE/.claude/$file" ]; then
    cp "$SOURCE/.claude/$file" "$DEST/"
    echo "  Copied $file"
  fi
done

# Generate settings.json with absolute paths
if [ -f "$SOURCE/scripts/generate-global-settings.js" ]; then
  node "$SOURCE/scripts/generate-global-settings.js" > "$DEST/settings.json"
  echo "  Generated settings.json (absolute paths)"
else
  echo "  WARN: generate-global-settings.js not found, skipping settings.json"
fi

# Copy CLAUDE.md template (don't overwrite existing)
if [ ! -f "$DEST/CLAUDE.md" ]; then
  if [ -f "$SOURCE/templates/global-claude.md" ]; then
    cp "$SOURCE/templates/global-claude.md" "$DEST/CLAUDE.md"
    echo "  Created CLAUDE.md from template"
  fi
else
  echo "  Kept existing CLAUDE.md (not overwritten)"
fi

echo ""
echo "Done! ClaudeKit installed to $DEST"
echo "All projects now have access to ClaudeKit commands, agents, and skills."
echo ""
echo "Update: git pull && ./install-global.sh"
