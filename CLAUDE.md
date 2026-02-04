# Dotfiles Installation Guide

This is a dotfiles repository. When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `.gitignore` | `~/.gitignore` | Global gitignore (macOS, VSCode) |
| `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | Claude Code global instructions |

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

## Notes

- Always ask before overwriting existing files
- Show diff if target file already exists
