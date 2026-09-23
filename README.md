# dotfiles

> There's no place like ~/ 🏠

Personal configuration files.

## Quick Start with a Coding Agent

The easiest way to apply these dotfiles is using a coding agent in this repository:

```bash
cd ~/repo/VdustR/dotfiles  # or wherever you cloned this repo
```

Then start Claude Code or Codex from that directory:

```bash
claude
# or
codex
```

Then ask:

> Apply these dotfiles to my system

## Contents

| Path | Description |
|------|-------------|
| `AGENTS.md` | Shared repository instructions for coding agents |
| `CLAUDE.md` | Claude Code wrapper that imports root `AGENTS.md` |
| `.gitignore` | Repo-only ignores (worktrees, runtime artifacts) |
| `home/.gitignore` | Global gitignore (macOS, local files) |
| `home/.agents/AGENTS.md` | Shared personal agent instructions, installed once and linked into each agent client |
| `home/.codex/agents/light-worker.toml` | Personal Codex light-work subagent using Luna |
| `home/.claude/agents/light-worker.md` | Personal Claude Code light-work subagent using Sonnet |
| `home/.claude/agents/convention-warden.md` | Personal Claude Code read-only verifier for repository conventions and evidence discipline |
| `home/.claude/agents/slop-warden.md` | Personal Claude Code read-only verifier for prose against the writing standard |
| `home/.config/mise/config.toml` | mise global tool configuration |

## Manual Installation

See [AGENTS.md](AGENTS.md) for detailed installation steps.

## License

[MIT](LICENSE)
