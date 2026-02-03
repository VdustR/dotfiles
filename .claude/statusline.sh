#!/bin/bash
# Claude Code Status Line - Starship Style (Emoji Edition)
# Modules: 🧠 Model │ 💰 Cost │ 📊 Context │ Changes │ ⏱️ Duration │ 🌿 Git │ 📦🐍🦀🐹🦕 Language

input=$(cat)

# Parse JSON input (single jq call for performance)
eval "$(echo "$input" | jq -r '
  @sh "MODEL=\(.model.display_name // "?")",
  @sh "COST=\(.cost.total_cost_usd // 0)",
  @sh "PERCENT=\(.context_window.used_percentage // 0)",
  @sh "LINES_ADD=\(.cost.total_lines_added // 0)",
  @sh "LINES_DEL=\(.cost.total_lines_removed // 0)",
  @sh "DURATION_MS=\(.cost.total_duration_ms // 0)",
  @sh "CURRENT_DIR=\(.workspace.current_dir // "")"
')"

# Sanitize external input to prevent terminal escape sequence injection
sanitize() { printf '%s' "$1" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b//g'; }
MODEL=$(sanitize "$MODEL")

# ═══════════════════════════════════════════════════════════════
# Colors (Starship-inspired palette)
# ═══════════════════════════════════════════════════════════════
ORANGE=$'\033[38;5;208m'
GREEN=$'\033[38;5;82m'
RED=$'\033[38;5;196m'
YELLOW=$'\033[38;5;220m'
CYAN=$'\033[38;5;45m'
MAGENTA=$'\033[38;5;141m'
BLUE=$'\033[38;5;39m'
PYTHON_YELLOW=$'\033[38;5;226m'
RUST_ORANGE=$'\033[38;5;208m'
GO_CYAN=$'\033[38;5;81m'
DIM=$'\033[2m'
RESET=$'\033[0m'

# ═══════════════════════════════════════════════════════════════
# Helper: Format duration (ms → human readable)
# ═══════════════════════════════════════════════════════════════
format_duration() {
    local ms=$1 sec=$((ms / 1000))
    if [ $sec -lt 60 ]; then
        echo "${sec}s"
    elif [ $sec -lt 3600 ]; then
        echo "$((sec / 60))m$((sec % 60))s"
    else
        echo "$((sec / 3600))h$((sec % 3600 / 60))m"
    fi
}

# ═══════════════════════════════════════════════════════════════
# Module: Context (dynamic color based on usage)
# ═══════════════════════════════════════════════════════════════
if [ "$(echo "$PERCENT > 80" | bc -l)" = "1" ]; then
    CTX_COLOR=$RED
elif [ "$(echo "$PERCENT > 50" | bc -l)" = "1" ]; then
    CTX_COLOR=$YELLOW
else
    CTX_COLOR=$GREEN
fi

# ═══════════════════════════════════════════════════════════════
# Module: Code changes (hidden if no changes)
# ═══════════════════════════════════════════════════════════════
CHANGES_MODULE=""
if [ "$LINES_ADD" -gt 0 ] || [ "$LINES_DEL" -gt 0 ]; then
    CHANGES_MODULE=" ${DIM}│${RESET} ${GREEN}+${LINES_ADD}${RESET} ${RED}-${LINES_DEL}${RESET}"
fi

# ═══════════════════════════════════════════════════════════════
# Module: Duration
# ═══════════════════════════════════════════════════════════════
DURATION=$(format_duration "$DURATION_MS")

# ═══════════════════════════════════════════════════════════════
# Module: Git (branch + status indicators)
# ═══════════════════════════════════════════════════════════════
GIT_MODULE=""
if [ -n "$CURRENT_DIR" ] && git -C "$CURRENT_DIR" rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git -C "$CURRENT_DIR" branch --show-current 2>/dev/null)
    [ -z "$BRANCH" ] && BRANCH=$(git -C "$CURRENT_DIR" rev-parse --short HEAD 2>/dev/null)
    BRANCH=$(sanitize "$BRANCH")

    if [ -n "$BRANCH" ]; then
        GIT_STATUS=""

        # Uncommitted changes (staged or unstaged)
        if ! git -C "$CURRENT_DIR" diff --quiet 2>/dev/null || \
           ! git -C "$CURRENT_DIR" diff --cached --quiet 2>/dev/null; then
            GIT_STATUS+="*"
        fi

        # Ahead/behind remote
        UPSTREAM=$(git -C "$CURRENT_DIR" rev-parse --abbrev-ref '@{upstream}' 2>/dev/null)
        if [ -n "$UPSTREAM" ]; then
            AHEAD=$(git -C "$CURRENT_DIR" rev-list --count '@{upstream}..HEAD' 2>/dev/null)
            BEHIND=$(git -C "$CURRENT_DIR" rev-list --count 'HEAD..@{upstream}' 2>/dev/null)
            [ "${AHEAD:-0}" -gt 0 ] && GIT_STATUS+="↑${AHEAD}"
            [ "${BEHIND:-0}" -gt 0 ] && GIT_STATUS+="↓${BEHIND}"
        fi

        # Rebase/merge state
        GIT_DIR=$(git -C "$CURRENT_DIR" rev-parse --git-dir 2>/dev/null)
        if [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
            GIT_STATUS+=""
        elif [ -f "$GIT_DIR/MERGE_HEAD" ]; then
            GIT_STATUS+=""
        fi

        [ -n "$GIT_STATUS" ] && GIT_STATUS=" ${GIT_STATUS}"
        GIT_MODULE=" ${DIM}│${RESET} ${MAGENTA}🌿 ${BRANCH}${GIT_STATUS}${RESET}"
    fi
fi

# ═══════════════════════════════════════════════════════════════
# Module: Language detection
# ═══════════════════════════════════════════════════════════════
LANG_MODULE=""
if [ -n "$CURRENT_DIR" ]; then
    # Node.js
    if [ -f "$CURRENT_DIR/package.json" ]; then
        NODE_VER=$(node -v 2>/dev/null | sed 's/v//')
        [ -n "$NODE_VER" ] && LANG_MODULE=" ${DIM}│${RESET} ${BLUE}📦 ${NODE_VER}${RESET}"
    # Python
    elif [ -f "$CURRENT_DIR/pyproject.toml" ] || [ -f "$CURRENT_DIR/requirements.txt" ] || [ -f "$CURRENT_DIR/setup.py" ]; then
        PY_VER=$(python3 --version 2>/dev/null | sed 's/Python //')
        [ -n "$PY_VER" ] && LANG_MODULE=" ${DIM}│${RESET} ${PYTHON_YELLOW}🐍 ${PY_VER}${RESET}"
    # Rust
    elif [ -f "$CURRENT_DIR/Cargo.toml" ]; then
        RUST_VER=$(rustc --version 2>/dev/null | awk '{print $2}')
        [ -n "$RUST_VER" ] && LANG_MODULE=" ${DIM}│${RESET} ${RUST_ORANGE}🦀 ${RUST_VER}${RESET}"
    # Go
    elif [ -f "$CURRENT_DIR/go.mod" ]; then
        GO_VER=$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')
        [ -n "$GO_VER" ] && LANG_MODULE=" ${DIM}│${RESET} ${GO_CYAN}🐹 ${GO_VER}${RESET}"
    # Deno
    elif [ -f "$CURRENT_DIR/deno.json" ] || [ -f "$CURRENT_DIR/deno.jsonc" ]; then
        DENO_VER=$(deno --version 2>/dev/null | head -1 | awk '{print $2}')
        [ -n "$DENO_VER" ] && LANG_MODULE=" ${DIM}│${RESET} ${CYAN}🦕 ${DENO_VER}${RESET}"
    fi
fi

# ═══════════════════════════════════════════════════════════════
# Output
# ═══════════════════════════════════════════════════════════════
printf "%s🧠 %s%s %s│%s %s💰 \$%.4f%s %s│%s %s📊 %.0f%%%s%s %s│%s %s⏱️ %s%s%s%s" \
    "$ORANGE" "$MODEL" "$RESET" \
    "$DIM" "$RESET" \
    "$GREEN" "$COST" "$RESET" \
    "$DIM" "$RESET" \
    "$CTX_COLOR" "$PERCENT" "$RESET" \
    "$CHANGES_MODULE" \
    "$DIM" "$RESET" \
    "$CYAN" "$DURATION" "$RESET" \
    "$GIT_MODULE" "$LANG_MODULE"
