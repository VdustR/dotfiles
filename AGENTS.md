# Dotfiles Agent Guide

This is the shared repository instruction source for coding agents. Claude Code loads this file through the root `CLAUDE.md`; Codex reads this file directly.

When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `.gitignore` | `~/.gitignore` | Global gitignore (macOS, local files) |
| `.codex/AGENTS.md` | `~/.codex/AGENTS.md` | Shared personal agent instructions for Codex and Claude Code |
| (generated at install) | `~/.claude/CLAUDE.md` | Claude Code wrapper that imports `~/.codex/AGENTS.md` |
| `.config/mise/config.toml` | `~/.config/mise/config.toml` | mise global tool configuration |

## Installation Steps

1. **Global gitignore**: Copy and configure git
   ```bash
   cp .gitignore ~/.gitignore
   git config --global core.excludesfile ~/.gitignore
   ```

2. **Codex config**: Copy the shared instructions to user's Codex config
   ```bash
   mkdir -p ~/.codex
   cp .codex/AGENTS.md ~/.codex/AGENTS.md
   ```

3. **Claude Code config**: Generate the wrapper that imports the instructions installed in step 2
   ```bash
   mkdir -p ~/.claude
   printf '@../.codex/AGENTS.md\n' > ~/.claude/CLAUDE.md
   ```

4. **mise global tools**: Copy config, then install from the home directory — running inside the repo would hit mise's trust gate on the repo-local copy
   ```bash
   mkdir -p ~/.config/mise
   cp .config/mise/config.toml ~/.config/mise/config.toml
   (cd ~ && mise install)
   ```

## mise Tool Maintenance

When user requests adding a new CLI tool:

1. **Research the tool**
   - Use the available documentation lookup tool or skill to look up package documentation
   - Confirm the mise provider/tool ID vs executable name; they may differ

2. **If package is obvious** (e.g., `ngrok`, `vercel`, `serve`)
   - Proceed without asking

3. **If multiple options exist**
   - Provide comparison (features, maintenance status, package size)
   - Give recommendation with reasoning
   - Wait for user confirmation

4. **Install via mise**
   ```bash
   mise use --global <tool@version>
   ```
   mise auto-generates `~/.config/mise/config.toml` — do not hand-edit for ordering or formatting.

5. **Sync dotfiles**
   After any `mise use --global` change, ask the user whether to sync `~/.config/mise/config.toml` to `~/repo/VdustR/dotfiles` and create a PR.

## Notes

- If a target file already exists with different content, show the diff and ask before overwriting; if it is identical, skip it and report no change
- The Claude Code wrapper is generated at install instead of being checked in: tracked files at `~`-mirror paths can be auto-loaded as live config by tools running inside this repo (a tracked `.claude/CLAUDE.md` duplicated the personal instructions in every session). Only add mirror-path dotfiles that are harmless when auto-loaded in-repo; generate or relocate config that would self-apply
