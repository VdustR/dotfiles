# Claude Session Naming

This integration binds the current local Claude Code session, loads the installed
`vp-session-organization` workflow on each user prompt, and exposes a scoped
official-SDK rename with readback. The existing conversation model chooses the
name; there is no extra model request or nested Claude process.

## Install

Requires Node.js 22.18 or later, Claude Code, and the installed
[`vp-session-organization` skill](https://github.com/VdustR/skills/tree/main/skills/vp-session-organization).
From the dotfiles repository root, copy this directory to
`~/.claude/session-naming/`, excluding `node_modules/` and `state/`. Inspect
existing destination changes before replacing them. Then run:

```sh
npm --prefix ~/.claude/session-naming ci --ignore-scripts --omit=optional
node ~/.claude/session-naming/install.ts
```

The installer adds only this integration's `SessionStart` and `UserPromptSubmit`
commands to `~/.claude/settings.json`, retains unrelated hooks and permission
rules, and saves a private settings backup before changing anything. Start a new
session so its session binding is exported to subsequent Bash calls.

## Behavior and ownership

- `SessionStart` binds the exact session ID and directory using the documented
  `CLAUDE_ENV_FILE` mechanism. `UserPromptSubmit` reads the installed skill and
  supplies its content and the supported command to the main conversation.
  Description matching and a main-agent `Skill` call are not prerequisites.
- `session-name.ts set 'Title'` uses the official SDK for that bound session,
  refuses protected names and observed intervening changes, and reads the title
  back before recording success. It does not start or resume another conversation
  or implement its own transcript writer.
- Explicit native names are protected. The main agent can also run
  `session-name.ts protect` when the user asks to retain a name previously managed
  by this integration. Names, target bindings, and ownership receipts live under
  `state/`; raw prompts and conversation content are not stored there.
- The SDK's `customTitle` field can contain an AI-generated title. To preserve
  manual edits without mistaking that background update for a user action, the
  adapter reads only `custom-title` provenance records from the exact transcript
  path supplied by the native hook. This reader is version-sensitive and does
  not write transcript records. Invalid provenance leaves the operation
  unavailable; supported metadata writes and readback still use the SDK.
- A per-session lock serializes local adapter operations; an exited owner's lock
  can be recovered. Other sessions use different files. A changed execution
  directory invalidates the binding instead of silently widening its scope.
- A missing dependency, missing skill, invalid input, or busy state produces a
  warning and lets the original prompt proceed. Rename errors remain observable.
  The integration neither changes permissions nor overrides another hook's denial.

SDK readback proves persisted metadata. Native hook output refreshes a previously
managed title on the next prompt or resume. Verify the active CLI separately;
desktop-sidebar and Remote Control propagation are not established by this
integration. Existing upstream reports describe different propagation behavior
on those surfaces; do not substitute a terminal title for a session title.

## Validate and remove

From this directory after installation, run `npm run check`. In the repository,
run from its root to avoid activating the mirrored, untrusted mise configuration:

```sh
node home/.claude/session-naming/node_modules/typescript/bin/tsc \
  -p home/.claude/session-naming/tsconfig.json --noEmit
node --test home/.claude/session-naming/tests/*.test.ts
```

Tests cover native-name protection, intervening changes, verified/no-op mutation,
unconfirmed readback, isolated locks, hook failure, literal command quoting, and
idempotent settings merging. They use the SDK's observed metadata contract for
fakes; a real CLI trial is still required to claim automatic naming behavior.
See [the diagnosis and real-interface evidence](https://github.com/VdustR/dotfiles/blob/main/docs/research/claude-session-naming.md)
in the source repository; that research file is not required at runtime.
The TypeScript project covers the integration, installer, tests, and its
application-owned ts-reset declaration; it uses strictest with Node-only globals.

To remove the integration, remove only hook entries whose command is
`node "$HOME/.claude/session-naming/hook.ts"`. Leave unrelated settings and hooks
intact, then remove this directory only when its receipts are no longer needed.

## Sources

- [Native hook contract](https://code.claude.com/docs/en/hooks)
- [Official SDK metadata operations](https://code.claude.com/docs/en/agent-sdk/typescript#renamesession)
- [Skill discovery and lifecycle limitations](https://code.claude.com/docs/en/skills#claude-stops-following-a-skill)
