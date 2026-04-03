# Dotfiles Installation Guide

This is a dotfiles repository. When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `.gitignore` | `~/.gitignore` | Global gitignore (macOS, VSCode) |
| `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | Claude Code global instructions |
| `.claude/rules/secrets.md` | `~/.claude/rules/secrets.md` | Claude Code secrets handling rules |
| `.config/mise/config.toml` | `~/.config/mise/config.toml` | mise global tool configuration |

## Installation Steps

1. **Global gitignore**: Copy and configure git
   ```bash
   cp .gitignore ~/.gitignore
   git config --global core.excludesfile ~/.gitignore
   ```

2. **Claude Code config**: Copy to user's Claude config
   ```bash
   mkdir -p ~/.claude/rules
   cp .claude/CLAUDE.md ~/.claude/CLAUDE.md
   cp .claude/rules/secrets.md ~/.claude/rules/secrets.md
   ```

3. **mise global tools**: Copy config and install
   ```bash
   mkdir -p ~/.config/mise
   cp .config/mise/config.toml ~/.config/mise/config.toml
   mise install
   ```

## mise Tool Maintenance

When user requests adding a new CLI tool:

1. **Research the tool**
   - Use `/docs` skill (Context7) to lookup package documentation
   - Confirm npm package name vs executable name (they may differ)

2. **If package is obvious** (e.g., `ngrok`, `vercel`, `serve`)
   - Proceed without asking

3. **If multiple options exist**
   - Provide comparison (features, maintenance status, package size)
   - Give recommendation with reasoning
   - Wait for user confirmation

4. **Install via mise**
   ```bash
   mise use --global npm:<package-name>
   ```
   mise auto-generates `~/.config/mise/config.toml` — do not hand-edit for ordering or formatting.

5. **Sync dotfiles**
   After any `mise use --global` change, ask the user whether to sync `~/.config/mise/config.toml` to `~/repo/VdustR/dotfiles` and create a PR.

## Notes

- Always ask before overwriting existing files
- Show diff if target file already exists
