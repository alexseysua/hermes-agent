#!/bin/bash
# Run from project root to remove original files after archiving
# Phase 01: Archive Removed Commands cleanup script

set -e
cd "$(dirname "$0")/../.."

echo "Removing archived command originals from .claude/commands/..."

# fix family
git rm .claude/commands/fix/fast.md
git rm .claude/commands/fix/types.md
git rm .claude/commands/fix/ui.md
git rm .claude/commands/fix/test.md
git rm .claude/commands/fix/logs.md
git rm .claude/commands/fix/ci.md

# plan family
git rm .claude/commands/plan/fast.md
git rm .claude/commands/plan/validate.md
git rm .claude/commands/plan/ci.md
git rm .claude/commands/plan/cro.md

# code family
git rm .claude/commands/code/auto.md
git rm .claude/commands/code/no-test.md

# cook family
git rm .claude/commands/cook/auto.md
git rm .claude/commands/cook/auto/fast.md
git rm .claude/commands/cook/auto/parallel.md

# bootstrap family
git rm .claude/commands/bootstrap/auto.md
git rm .claude/commands/bootstrap/auto/fast.md
git rm .claude/commands/bootstrap/auto/parallel.md

# design family
git rm .claude/commands/design/fast.md
git rm .claude/commands/design/describe.md
git rm .claude/commands/design/screenshot.md
git rm .claude/commands/design/video.md

# content family
git rm .claude/commands/content/fast.md
git rm .claude/commands/content/good.md
git rm .claude/commands/content/enhance.md

# rename originals (remove old names)
git rm .claude/commands/fix/hard.md
git rm .claude/commands/fix/parallel.md
git rm .claude/commands/plan/hard.md
git rm .claude/commands/plan/parallel.md
git rm .claude/commands/code/parallel.md
git rm .claude/commands/cook/auto/parallel.md 2>/dev/null || true  # already removed above
git rm .claude/commands/bootstrap/auto/parallel.md 2>/dev/null || true  # already removed above
git rm .claude/commands/design/good.md

# clean up empty dirs
rmdir .claude/commands/cook/auto 2>/dev/null || true
rmdir .claude/commands/bootstrap/auto 2>/dev/null || true

echo "Done. Run 'git status' to verify."