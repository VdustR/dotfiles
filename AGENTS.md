# Dotfiles Agent Guide

This is the shared repository instruction source for coding agents. Claude Code loads this file through the root `CLAUDE.md`; Codex reads this file directly.

When asked to apply or install these dotfiles, follow the instructions below.

## Available Dotfiles

| Source | Target | Description |
|--------|--------|-------------|
| `home/.gitignore` | `~/.gitignore` | Global gitignore (macOS, local files) |
| `home/.agents/AGENTS.md` | `~/.agents/AGENTS.md` | Shared personal agent instructions; the one real file every client below points at |
| (symlink created at install) | `~/.codex/AGENTS.md` | Codex global instructions, linked to `~/.agents/AGENTS.md` |
| (symlink created at install) | `~/.gemini/GEMINI.md` | Gemini CLI and Antigravity global context, linked to `~/.agents/AGENTS.md` |
| (symlink created at install) | `~/.config/opencode/AGENTS.md` | opencode global rules, linked to `~/.agents/AGENTS.md` |
| (symlink created at install) | `~/.kimi-code/AGENTS.md` | Kimi Code CLI global instructions, linked to `~/.agents/AGENTS.md` |
| (generated at install) | `~/.claude/CLAUDE.md` | Claude Code wrapper that imports `~/.agents/AGENTS.md` |
| `home/.codex/agents/light-worker.toml` | `~/.codex/agents/light-worker.toml` | Personal Codex light-work subagent using Luna |
| `home/.claude/agents/light-worker.md` | `~/.claude/agents/light-worker.md` | Personal Claude Code light-work subagent using Haiku |
| `home/.config/mise/config.toml` | `~/.config/mise/config.toml` | mise global tool configuration |

## Installation Steps

1. **Global gitignore**: Copy and configure git
   ```bash
   cp home/.gitignore ~/.gitignore
   git config --global core.excludesfile ~/.gitignore
   ```

2. **Shared agent instructions**: Copy the one real file, then link every client at it
   ```bash
   mkdir -p ~/.agents ~/.codex ~/.gemini ~/.config/opencode ~/.kimi-code
   cp home/.agents/AGENTS.md ~/.agents/AGENTS.md
   ln -sfn ../.agents/AGENTS.md ~/.codex/AGENTS.md
   ln -sfn ../.agents/AGENTS.md ~/.gemini/GEMINI.md
   ln -sfn ../../.agents/AGENTS.md ~/.config/opencode/AGENTS.md
   ln -sfn ../.agents/AGENTS.md ~/.kimi-code/AGENTS.md
   ```
   `~/.agents/AGENTS.md` holds the file because it is the tool-neutral cross-tool location rather than one client's directory; Kimi Code documents it directly, and a client that adopts the same convention needs no new link. Every link target is relative, so it survives a home directory at a different path. Each linked path is the documented user-level default for its client: `~/.codex/AGENTS.md` for Codex, `~/.gemini/GEMINI.md` for Gemini CLI and for Antigravity, `~/.config/opencode/AGENTS.md` for opencode, and `~/.kimi-code/AGENTS.md` for Kimi Code CLI under the default `KIMI_CODE_HOME`.

3. **Codex config**: Copy personal agents to user's Codex config
   ```bash
   mkdir -p ~/.codex/agents
   cp home/.codex/agents/light-worker.toml ~/.codex/agents/light-worker.toml
   ```

4. **Claude Code config**: Generate the wrapper and copy personal agents
   ```bash
   mkdir -p ~/.claude/agents
   printf '@~/.agents/AGENTS.md\n' > ~/.claude/CLAUDE.md
   cp home/.claude/agents/light-worker.md ~/.claude/agents/light-worker.md
   ```

5. **mise global tools**: Copy config, then install from the home directory — running near the in-repo copy would hit mise's trust gate
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
- The Claude Code wrapper is generated at install instead of being shipped as a file: it is a single import line, see step 4. Claude Code agent definitions under `home/.claude/agents/` are normal installable dotfiles.
- The step 2 client paths are symlinks rather than copies because none of those files has content of its own; each one is an alias for `~/.agents/AGENTS.md`, so one edit reaches every client without a re-install. Every other installable dotfile is a distinct file and stays a copy.
- A client that writes to its own memory file writes through those symlinks into `~/.agents/AGENTS.md`. Gemini CLI can edit a memory file to persist an instruction, and its Auto Memory feature drafts patches for review, though that feature is off by default. Read an unexpected `diff home/.agents/AGENTS.md ~/.agents/AGENTS.md` as such a write, then either move the addition into this repository or revert it.
- Clients deliberately left out of step 2, rechecked when one of them is installed: MiMo Code (Xiaomi) documents only JSONC config under `~/.config/mimocode/` and an AGENTS.md at project level, with no global markdown instruction file; the MiniMax CLI `mmx-cli` generates media rather than acting as a coding agent, so it reads no instruction file; DeepSeek publishes no first-party coding CLI with a documented global instruction path.
