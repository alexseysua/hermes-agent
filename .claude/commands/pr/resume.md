---
name: pr:resume
description: Resume session linked to a pull request
---

Resume a Claude Code session linked to a specific pull request.

## Arguments

- `$1`: PR identifier (number, #number, or full URL)

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Current directory is a git repository

## Actions

1. Parse PR identifier from argument
2. Fetch PR context via `gh pr view`
3. Display PR title, branch, and description
4. Set session PR context for continued work
5. Find related plan by branch name (if exists)

## Usage

```bash
# By number
/pr:resume 123

# With hash prefix
/pr:resume #123

# By URL
/pr:resume https://github.com/owner/repo/pull/123

# Interactive (if no arg, show recent PRs)
/pr:resume
```

## Output

Shows:
- PR number and title
- Source branch
- PR description summary (first 500 chars)
- Related plan (if branch matches)

## Implementation

1. Use `parsePrIdentifier()` to normalize input
2. Use `extractPrContext()` to fetch from GitHub
3. Store in session state via `writeSessionState()`
4. Use `resolvePlanPath()` to find matching plan

## Fallback

If gh CLI unavailable:
1. Display installation instructions:
   ```
   brew install gh  # macOS
   gh auth login
   ```
2. Allow manual branch checkout: `git checkout <branch>`
3. Use `/plan` to find related plan by branch name

## Example

```
/pr:resume 42

PR #42: feat: add user authentication
Branch: feat/add-auth
Description: Implements OAuth2 login with Google and GitHub providers...
Related Plan: plans/260207-1201-add-auth/
```

## Environment Variables

When PR is linked, these env vars are set:
- `CK_PR_NUMBER` - PR number
- `CK_PR_URL` - Full PR URL
- `CK_PR_BRANCH` - Source branch name
