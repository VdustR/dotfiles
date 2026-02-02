#!/bin/bash
# Claude Code Status Line - Full Info Version
# Displays: Model | Cost | Context Usage | Git Branch

input=$(cat)

# Parse JSON input (single jq call for performance)
read -r MODEL COST PERCENT CURRENT_DIR < <(echo "$input" | jq -r '[.model.display_name // "?", .cost.total_cost_usd // 0, .context_window.used_percentage // 0, .workspace.current_dir // ""] | @tsv')

# Sanitize external input to prevent terminal escape sequence injection
sanitize() {
    # Remove ANSI escape sequences (ESC character)
    printf '%s' "$1" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b//g'
}

MODEL=$(sanitize "$MODEL")

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
    BRANCH=$(sanitize "$BRANCH")
    [ -n "$BRANCH" ] && GIT_BRANCH=" ${DIM}|${RESET} ${MAGENTA}${BRANCH}${RESET}"
fi

# Context bar visualization (use string comparison to avoid command injection)
if [ "$(echo "$PERCENT > 80" | bc -l)" = "1" ]; then
    CTX_COLOR='\033[38;5;196m'  # Red for high usage
elif [ "$(echo "$PERCENT > 50" | bc -l)" = "1" ]; then
    CTX_COLOR='\033[38;5;220m'  # Yellow for medium usage
else
    CTX_COLOR=$GREEN
fi

# Format output
printf "${ORANGE}%s${RESET} ${DIM}|${RESET} ${GREEN}\$%.4f${RESET} ${DIM}|${RESET} ${CTX_COLOR}%.0f%%${RESET}%s" \
    "$MODEL" "$COST" "$PERCENT" "$GIT_BRANCH"
