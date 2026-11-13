# Claude Session Naming

This integration binds the current local Claude Code session, loads the installed
`vp-session-management` entry point on each user prompt, and tells the agent how
to rename this session with readback: a scoped official-SDK command in the CLI,
or the app's own session tool in the Claude desktop app. The existing
conversation model chooses the name; there is no extra model request or nested
Claude process. Read coordination or metadata references only when the next
decision needs them; the hook does not preload the full workflow background.

## Install

Requires Node.js 22.18 or later, Claude Code, and the installed
[`vp-session-management` skill](https://github.com/VdustR/skills/tree/main/skills/vp-session-management).
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
  `session-name.ts protect` when the user chooses a name or asks to retain the
  current one. Receipts record why a name is protected: `request` for that
  command, which is never re-derived, and `observed` for a surface signal. The
  CLI hook keeps `observed`; the desktop hook recomputes it on each prompt.
  Names, target bindings, and ownership
  receipts live under `state/`; raw prompts and conversation content are not
  stored there. Receipts from before the desktop change migrate on read: a
  protected name with no managed title becomes `observed`, any other protected
  name becomes `request`.
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
Remote Control propagation is not established by this integration. Existing
upstream reports describe different propagation behavior on those surfaces; do
not substitute a terminal title for a session title.

## Claude desktop app sessions

The desktop app launches Claude Code with `CLAUDE_CODE_ENTRYPOINT=claude-desktop`
in the process environment, which the hooks inherit. In that surface:

- The app writes every title, including the one it generates from the opening
  prompt, as a `custom-title` transcript record. That record therefore says
  nothing about who chose the name, and the hook no longer treats it as a user
  rename.
- The hook reads the title source from the app's own session record under
  `~/Library/Application Support/Claude/claude-code-sessions/`, located by the
  account, organization, and host session IDs in the environment and matched to
  the hook's session ID. `auto` (app-generated) and `tool` (set by an agent) are
  replaceable. `user`, or any title without one of those sources, is protected.
  This record is not a documented interface, and only its macOS location was
  observed. A record that cannot be read or recognized is reported as
  `unavailable`, and the transcript title, if any, is then protected.
- The injected text tells the agent to load the app's session tools, read the
  title with `mcp__ccd_session_mgmt__get_session` and keep it if it changed
  since the prompt began, rename with `mcp__ccd_session_mgmt__set_session_title`
  and `session_id: "self"`, then read the title back. The tool's own description
  (app 4.4212.0) says it asks before replacing a user-set title except in bypass
  permissions mode, so the text also forbids replacing a title the user chose.
  A title set by an agent at the user's request is `tool`, not `user`; the agent
  records that choice with `session-name.ts protect`.
- `session-name.ts set` refuses desktop sessions: an SDK rename does not update
  the app's title. `session-name.ts protect` still records a keep request.
- The hook emits no native `sessionTitle`; the app owns its title.

Two fresh desktop sessions started on November 2, 2026 took this route: one
kept an already accurate title, the other replaced a vague one through
`set_session_title`. The second skipped the final `get_session` readback and
relied on the tool's success message, so the injected text now says that
message is not readback; agent compliance with that wording is not yet
observed. In three earlier sessions the app wrote its generated title before
the agent's first reply, so a rename made during the first prompt lands after
it. See [the research note](https://github.com/VdustR/dotfiles/blob/main/docs/research/claude-session-naming.md#desktop-app-follow-up).

## Validate and remove

From this directory after installation, run `npm run check`. In the repository,
run from its root to avoid activating the mirrored, untrusted mise configuration:

```sh
node home/.claude/session-naming/node_modules/typescript/bin/tsc \
  -p home/.claude/session-naming/tsconfig.json --noEmit
node --test home/.claude/session-naming/tests/*.test.ts
```

Tests cover native-name protection, intervening changes, verified/no-op mutation,
unconfirmed readback, isolated locks, hook failure, literal command quoting,
idempotent settings merging, legacy receipt migration, desktop title-source
protection, and the desktop app record reader. They use the SDK's observed metadata contract for
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
