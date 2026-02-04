# Dotfiles Installation Guide

This is a dotfiles repository. When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `.gitignore` | `~/.gitignore` | Global gitignore (macOS, VSCode) |
| `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | Claude Code global instructions |
| `.zsh_aliases` | `~/.zsh_aliases` | Zsh aliases for CLI tools via npx |

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

3. **Zsh aliases**: Copy and source in `.zshrc`
   ```bash
   cp .zsh_aliases ~/.zsh_aliases
   # Add sourcing line to ~/.zshrc if not already present
   LINE_TO_ADD='[ -f ~/.zsh_aliases ] && source ~/.zsh_aliases'
   if ! grep -qF -- "$LINE_TO_ADD" ~/.zshrc 2>/dev/null; then
     printf "\n# Source custom Zsh aliases\n%s\n" "$LINE_TO_ADD" >> ~/.zshrc
   fi
   ```

## Zsh Aliases Maintenance

When user requests adding a new CLI alias:

1. **Research the tool**
   - Use `/docs` skill (Context7) to lookup package documentation
   - Confirm npm package name vs executable name (they may differ)

2. **If package is obvious** (e.g., `ngrok`, `vercel`, `serve`)
   - Proceed without asking

3. **If multiple options exist**
   - Provide comparison (features, maintenance status, package size)
   - Give recommendation with reasoning
   - Wait for user confirmation

4. **Generate alias**
   - Format: `alias <cmd>="npx -y [--package=<pkg>] <cmd>"`
   - Use `--package=<pkg>` only when package name differs from executable
   - Maintain alphabetical order

5. **Update both files**
   - Repo: `.zsh_aliases`
   - User: `~/.zsh_aliases`

## Notes

- Always ask before overwriting existing files
- Show diff if target file already exists
