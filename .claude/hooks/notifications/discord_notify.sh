#!/bin/bash

# Discord Notification Hook for Claude Code
# This hook sends a notification to Discord when Claude finishes a task

set -euo pipefail

# Load environment variables with priority: process.env > .claude/.env > .claude/hooks/.env
load_env() {
    # 1. Start with lowest priority: .claude/hooks/.env
    if [[ -f "$(dirname "$0")/.env" ]]; then
        set -a
        source "$(dirname "$0")/.env"
        set +a
    fi

    # 2. Override with .claude/.env
    if [[ -f .claude/.env ]]; then
        set -a
        source .claude/.env
        set +a
    fi

    # 3. Process env (already loaded) has highest priority - no action needed
    # Variables already in process.env will not be overwritten by 'source'
}

load_env

# Read JSON input from stdin
INPUT=$(cat)

# Extract relevant information from the hook input
HOOK_TYPE=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // ""')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""')
PROJECT_NAME=$(basename "$PROJECT_DIR" 2>/dev/null)
[[ -z "$PROJECT_NAME" || "$PROJECT_NAME" == "." ]] && PROJECT_NAME="unknown"

# Configuration - these will be set via environment variables
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# Validate required environment variables
if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    echo "⚠️  Discord notification skipped: DISCORD_WEBHOOK_URL not set" >&2
    exit 0
fi

# Function to send Discord message with embeds
send_discord_embed() {
    local title="$1"
    local description="$2"
    local color="$3"
    local fields="$4"

    local timestamp
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"

    local payload
    payload=$(jq -n \
        --arg title "$title" \
        --arg description "$description" \
        --argjson color "$color" \
        --arg timestamp "$timestamp" \
        --arg footer "Project Name • ${PROJECT_NAME}" \
        --argjson fields "$fields" \
        '{embeds: [{title: $title, description: $description, color: $color, timestamp: $timestamp, footer: {text: $footer}, fields: $fields}]}')

    curl -s -X POST "$DISCORD_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" > /dev/null 2>&1
}

# Generate summary based on hook type
case "$HOOK_TYPE" in
    "Stop")
        # Extract tool usage summary
        TOOLS_USED=$(echo "$INPUT" | jq -r '.toolsUsed[]?.tool // empty' | sort | uniq -c | sort -nr)
        FILES_MODIFIED=$(echo "$INPUT" | jq -r '.toolsUsed[]? | select(.tool == "Edit" or .tool == "Write" or .tool == "MultiEdit") | .parameters.file_path // empty' | sort | uniq)

        # Count operations
        TOTAL_TOOLS=$(echo "$INPUT" | jq '.toolsUsed | length')

        # Build description
        DESCRIPTION="✅ Claude Code session completed successfully"

        # Build tools used text
        TOOLS_TEXT=""
        if [[ -n "$TOOLS_USED" ]]; then
            TOOLS_TEXT=$(echo "$TOOLS_USED" | while read count tool; do
                echo "• **${count}** ${tool}"
            done | paste -sd '\n' -)
        else
            TOOLS_TEXT="No tools used"
        fi

        # Build files modified text
        FILES_TEXT=""
        if [[ -n "$FILES_MODIFIED" ]]; then
            FILES_TEXT=$(echo "$FILES_MODIFIED" | while IFS= read -r file; do
                if [[ -n "$file" ]]; then
                    relative_file=$(echo "$file" | sed "s|^${PROJECT_DIR}/||")
                    echo "• \`${relative_file}\`"
                fi
            done | paste -sd '\n' -)
        else
            FILES_TEXT="No files modified"
        fi

        # Build fields JSON safely via jq
        FIELDS=$(jq -n \
            --arg ts "$TIMESTAMP" \
            --arg ops "$TOTAL_TOOLS" \
            --arg sid "\`${SESSION_ID:0:8}...\`" \
            --arg tools "$TOOLS_TEXT" \
            --arg files "$FILES_TEXT" \
            --arg loc "\`${PROJECT_DIR}\`" \
            '[
                {name: "⏰ Session Time", value: $ts, inline: true},
                {name: "🔧 Total Operations", value: $ops, inline: true},
                {name: "🆔 Session ID", value: $sid, inline: true},
                {name: "📦 Tools Used", value: $tools, inline: false},
                {name: "📝 Files Modified", value: $files, inline: false},
                {name: "📍 Location", value: $loc, inline: false}
            ]')

        send_discord_embed "🤖 Claude Code Session Complete" "$DESCRIPTION" 5763719 "$FIELDS"
        ;;

    "SubagentStop")
        SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')

        DESCRIPTION="Specialized agent completed its task"

        FIELDS=$(jq -n \
            --arg ts "$TIMESTAMP" \
            --arg agent "$SUBAGENT_TYPE" \
            --arg sid "\`${SESSION_ID:0:8}...\`" \
            --arg loc "\`${PROJECT_DIR}\`" \
            '[
                {name: "⏰ Time", value: $ts, inline: true},
                {name: "🔧 Agent Type", value: $agent, inline: true},
                {name: "🆔 Session ID", value: $sid, inline: true},
                {name: "📍 Location", value: $loc, inline: false}
            ]')

        send_discord_embed "🎯 Claude Code Subagent Complete" "$DESCRIPTION" 3447003 "$FIELDS"
        ;;

    *)
        DESCRIPTION="Claude Code event triggered"

        FIELDS=$(jq -n \
            --arg ts "$TIMESTAMP" \
            --arg evt "$HOOK_TYPE" \
            --arg sid "\`${SESSION_ID:0:8}...\`" \
            --arg loc "\`${PROJECT_DIR}\`" \
            '[
                {name: "⏰ Time", value: $ts, inline: true},
                {name: "📋 Event Type", value: $evt, inline: true},
                {name: "🆔 Session ID", value: $sid, inline: true},
                {name: "📍 Location", value: $loc, inline: false}
            ]')

        send_discord_embed "📝 Claude Code Event" "$DESCRIPTION" 10070709 "$FIELDS"
        ;;
esac

# Log the notification (optional)
echo "✅ Discord notification sent for $HOOK_TYPE event in project $PROJECT_NAME" >&2
