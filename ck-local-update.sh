#!/bin/bash

# ck-local-update.sh
# Local ClaudeKit Engineer installer - copies kit files from local source to target project
# Usage: ck-local-update.sh [target-directory]

set -e

# Source directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"

# Target directory (current dir or provided argument)
TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ClaudeKit Engineer - Local Update${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Source:  ${YELLOW}$SOURCE_DIR${NC}"
echo -e "Target:  ${YELLOW}$TARGET_DIR${NC}"
echo ""

# Prevent copying to self
if [ "$SOURCE_DIR" = "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Cannot update source directory itself${NC}"
    exit 1
fi

# Confirm with user
read -p "Proceed with update? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Copying ClaudeKit files...${NC}"

# Function to copy with backup
copy_with_info() {
    local src="$1"
    local dest="$2"
    local name="$3"

    if [ -e "$src" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
        cp -R "$src" "$dest"
    else
        echo -e "  ${YELLOW}⊘${NC} $name (not found in source)"
    fi
}

# Core directories
copy_with_info "$SOURCE_DIR/.claude" "$TARGET_DIR/" ".claude/"
copy_with_info "$SOURCE_DIR/.opencode" "$TARGET_DIR/" ".opencode/"
copy_with_info "$SOURCE_DIR/docs" "$TARGET_DIR/" "docs/"
copy_with_info "$SOURCE_DIR/plans" "$TARGET_DIR/" "plans/"

# Core files
copy_with_info "$SOURCE_DIR/CLAUDE.md" "$TARGET_DIR/" "CLAUDE.md"

# Optional files (only if they don't exist in target)
if [ ! -f "$TARGET_DIR/.gitignore" ] && [ -f "$SOURCE_DIR/.gitignore" ]; then
    copy_with_info "$SOURCE_DIR/.gitignore" "$TARGET_DIR/" ".gitignore"
fi

if [ ! -f "$TARGET_DIR/.env.example" ] && [ -f "$SOURCE_DIR/.env.example" ]; then
    copy_with_info "$SOURCE_DIR/.env.example" "$TARGET_DIR/" ".env.example"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Update complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. cd $TARGET_DIR"
echo -e "  2. claude"
echo -e "  3. Try /plan, /cook, /fix commands"
echo ""
