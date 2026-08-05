# Dotfiles Agent Guide

This is the shared repository instruction source for coding agents. Claude Code loads this file through the root `CLAUDE.md`; Codex reads this file directly.

When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `home/.gitignore` | `~/.gitignore` | Global gitignore (macOS, local files) |
| `home/.codex/AGENTS.md` | `~/.codex/AGENTS.md` | Shared personal agent instructions for Codex and Claude Code |
| `home/.codex/agents/light-worker.toml` | `~/.codex/agents/light-worker.toml` | Personal Codex light-work subagent using Luna |
| (generated at install) | `~/.claude/CLAUDE.md` | Claude Code wrapper that imports `~/.codex/AGENTS.md` |
| `home/.claude/agents/light-worker.md` | `~/.claude/agents/light-worker.md` | Personal Claude Code light-work subagent using Haiku |
| `home/.config/mise/config.toml` | `~/.config/mise/config.toml` | mise global tool configuration |

## Installation Steps

1. **Global gitignore**: Copy and configure git
   ```bash
   cp home/.gitignore ~/.gitignore
   git config --global core.excludesfile ~/.gitignore
   ```

2. **Codex config**: Copy the shared instructions and personal agents to user's Codex config
   ```bash
   mkdir -p ~/.codex/agents
   cp home/.codex/AGENTS.md ~/.codex/AGENTS.md
   cp home/.codex/agents/light-worker.toml ~/.codex/agents/light-worker.toml
   ```

3. **Claude Code config**: Generate the wrapper and copy personal agents
   ```bash
   mkdir -p ~/.claude/agents
   printf '@~/.codex/AGENTS.md\n' > ~/.claude/CLAUDE.md
   cp home/.claude/agents/light-worker.md ~/.claude/agents/light-worker.md
   ```

4. **mise global tools**: Copy config, then install from the home directory — running near the in-repo copy would hit mise's trust gate
   ```bash
   mkdir -p ~/.config/mise
   cp home/.config/mise/config.toml ~/.config/mise/config.toml
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
   mise writes tool entries into `~/.config/mise/config.toml`; do not hand-edit versions, providers, or options. Reordering `[tools]` alphabetically is allowed: mise appends some new tools out of order and `mise fmt` does not sort them (checked 2026-08-05, mise 2026.6.14). Verify a reorder with `mise ls --global`.

5. **Sync dotfiles**
   After any `mise use --global` change, ask the user whether to sync `~/.config/mise/config.toml` to `home/.config/mise/config.toml` in `~/repo/VdustR/dotfiles` and create a PR.

## Notes

- If a target file already exists with different content, show the diff and ask before overwriting; if it is identical, skip it and report no change
- Installable dotfiles live under `home/`, mirroring their `~` targets. Files tracked at repo-root mirror paths get auto-loaded as live config by tools running inside this repo — a tracked `.claude/CLAUDE.md` once duplicated the personal instructions in every Claude Code session, and a root-level mise config trips mise's trust gate — so keep the repo root for repo documentation and repo-only files
- The Claude Code wrapper is generated at install instead of being shipped as a file: it is a single import line, see step 3. Claude Code agent definitions under `home/.claude/agents/` are normal installable dotfiles.
