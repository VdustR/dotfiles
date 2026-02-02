# Dotfiles Installation Guide

This is a dotfiles repository. When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `.gitignore` | `~/.gitignore` | Global gitignore (macOS, VSCode) |
| `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | Claude Code global instructions |
| `.claude/statusline.sh` | `~/.claude/statusline.sh` | Status line script (model, cost, context, git branch) |

## Installation Steps

1. **Global gitignore**: Copy and configure git
   ```bash
   cp .gitignore ~/.gitignore
   git config --global core.excludesfile ~/.gitignore
   ```

2. **CLAUDE.md**: Copy to user's Claude config
   ```bash
   cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
   ```

3. **statusline.sh**: Copy and make executable
   ```bash
   cp .claude/statusline.sh ~/.claude/statusline.sh
   chmod +x ~/.claude/statusline.sh
   ```

4. **Status line config**: Merge into `~/.claude/settings.json`
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "~/.claude/statusline.sh",
       "padding": 0
     }
   }
   ```
   If settings.json already exists, merge the `statusLine` key without overwriting other settings.

## Prerequisites

- `jq` is required for statusline.sh
  ```bash
  brew install jq  # macOS
  ```

## Notes

- Always ask before overwriting existing files
- Show diff if target file already exists
