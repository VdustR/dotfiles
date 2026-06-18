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
| `.gitignore` | Global gitignore (macOS, local files) |
| `.codex/AGENTS.md` | Shared personal agent instructions and preferences |
| `.claude/CLAUDE.md` | Claude Code global wrapper that imports `.codex/AGENTS.md` |

## Manual Installation

See [AGENTS.md](AGENTS.md) for detailed installation steps.

## License

[MIT](LICENSE)
