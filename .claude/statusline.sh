#!/bin/bash
# Claude Code Status Line - Full Info Version
# Displays: Model | Cost | Context Usage | Git Branch

input=$(cat)

# Parse JSON input
MODEL=$(echo "$input" | jq -r '.model.display_name // "?"')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
PERCENT=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')

# ANSI colors
ORANGE='\033[38;5;208m'
GREEN='\033[38;5;82m'
CYAN='\033[38;5;45m'
MAGENTA='\033[38;5;213m'
DIM='\033[2m'
RESET='\033[0m'

# Get Git branch if in a git repo
GIT_BRANCH=""
if [ -n "$CURRENT_DIR" ] && [ -d "$CURRENT_DIR/.git" ] || git -C "$CURRENT_DIR" rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git -C "$CURRENT_DIR" branch --show-current 2>/dev/null)
    [ -n "$BRANCH" ] && GIT_BRANCH=" ${DIM}|${RESET} ${MAGENTA}${BRANCH}${RESET}"
fi

# Context bar visualization
if (( $(echo "$PERCENT > 80" | bc -l) )); then
    CTX_COLOR='\033[38;5;196m'  # Red for high usage
elif (( $(echo "$PERCENT > 50" | bc -l) )); then
    CTX_COLOR='\033[38;5;220m'  # Yellow for medium usage
else
    CTX_COLOR=$GREEN
fi

# Format output
printf "${ORANGE}%s${RESET} ${DIM}|${RESET} ${GREEN}\$%.4f${RESET} ${DIM}|${RESET} ${CTX_COLOR}%.0f%%${RESET}%s" \
    "$MODEL" "$COST" "$PERCENT" "$GIT_BRANCH"
