# Claude Code Automatic Session Naming

Observed November 1, 2026, Asia/Taipei (UTC+08:00). Baseline sources were skills
`85eeb35` and dotfiles `0043b29`. Native CLI probes began on Claude Code 2.1.212;
its existing automatic updater moved the client to 2.1.316 during testing.
Current-version baseline and integration trials were repeated separately.

## Diagnosis and decision

The shared instructions and installed skill were present. A normal two-turn
Sonnet conversation, first discussing checkout retries and then implementing the
chosen policy, completed the file write without loading the naming skill or
performing any name operation. This also reproduced on 2.1.316. Skill discovery
and standing prose are not an execution subscription at a lifecycle event.

A skill-listing budget warning was observed on 2.1.212, but its causal role was
not established. Increasing that budget was not used as a speculative fix.

The earlier capability assessment missed two supported routes: native hook title
output, and the official SDK's session metadata functions. A constant
`UserPromptSubmit` `sessionTitle` updated metadata on 2.1.212. The pinned SDK
0.3.316 successfully read and renamed a dedicated session without launching a
conversation. An absent built-in rename tool therefore does not establish that
no supported mutation is possible.

The selected integration uses native session/prompt hooks to load the existing
workflow and bind its supported SDK command. The main conversation model still
chooses a meaningful title. This removes discovery as a prerequisite and avoids
an extra model request per prompt. A separate classifier-process prototype was
not retained: it added latency and failed in the nested invocation trials.
No nested-session guard or permission control was changed to make it work.

Claude-specific code belongs in dotfiles; the reusable skill retains naming,
authorization, relationships, and cross-harness methodology. No plugin manifest
or harness adapter was added to the skills repository.

## Observed cases

All agent trials used ordinary synthetic tasks in dedicated directories without
evaluation files, expected answers, comparison instructions, or naming requests
except the explicit title-only case. Tool calls and SDK readback were examined;
agent self-reports alone were not acceptance evidence.
See the [sanitized tool and readback receipts](claude-session-naming-receipts.json).

| Case | Evidence and result |
| --- | --- |
| 2.1.212 installed-prose baseline | The main agent wrote the policy without naming calls. Previously recorded in the session-organization investigation. |
| 2.1.212 native integration | After ordinary discussion and a direct implementation request, `Bash` called the scoped `set` command before `Write`; readback returned `verified` and `Checkout retry policy design`. |
| 2.1.212 explicit `Payment notebook` | The hook protected the explicit name; implementation completed without a naming call. |
| 2.1.212 title-only request | Returned one title without a naming command. |
| 2.1.316 no-hook control | Ordinary discussion and implementation completed with a `Write` call and no naming operation. |
| 2.1.316 native integration | The discussion called `set 'Checkout API retry strategy'`; the subsequent implementation retained that suitable title and wrote the policy. |
| 2.1.316 interactive CLI | The agent named the scoping conversation, then renamed persisted metadata to `Checkout retry policy` before writing the concrete implementation decision. Both SDK readbacks succeeded. The client still rendered its previous title until a later native event. |

The integration is not claimed to guarantee perfect semantic decisions for every
model or request. A native hook proves workflow delivery; actual command calls
and readback establish the tested naming result. The source workflow is loaded
directly, so absence of a main-agent `Skill` call is not a failure by itself.

## Regressions found during implementation

`getSessionInfo().customTitle` falls back to an AI title. In an interactive trial,
the background AI title appeared after the prompt hook; an initial guard mistook
it for a manual edit and refused the naming command. A focused regression failed
with that guard, passed after separating custom-title provenance, and failed
again when the old condition was restored in an isolated copy.

The adapter reads only custom-title provenance from the exact native transcript
path and checks its session ID. This is a read-only, version-sensitive boundary:
the public SDK collapses the two title sources, so it cannot supply the origin
needed for this guard. All metadata mutations and persisted readback remain with
the official SDK; no manual transcript writer is implemented.

A second regression caught a stale live-client title being mistaken for a new
manual name after SDK mutation. The receipt now tracks the title last observed
or supplied through the native hook separately from persisted metadata. The
paired test still protects a new native user choice even before it reaches the
transcript. Missing, malformed, busy, or changed-context state stays observable
and does not block the original prompt.

## Validation and limits

The application-owned TypeScript project uses strictest, erasable syntax,
Node-only globals, and ts-reset. Unit tests exercise state ownership, exact-target
renames, no-op behavior, manual protection, both races, unconfirmed readback,
invalid provenance, hook failure, lock recovery, command quoting, and idempotent
settings merging. Fakes use the SDK boundary established by the live probes.

Native hook output can refresh a managed name at the next prompt or resume.
Persisted SDK readback does not prove immediate rendering in an already-open
CLI, desktop sidebar, or Remote Control. Desktop and remote propagation were not
tested. Existing upstream reports also distinguish those surfaces.

The integration adds no permission allow rules, disables no other hook, and does
not override a denial. It requires existing permission to invoke its scoped
command. Its installer changes only its two hook registrations and retains
unrelated settings. Runtime receipts hold no raw prompts or source content.

Recheck the native payload, provenance reader, SDK functions, and live rendering
after client or SDK changes. Real model trials are bounded observations, not a
statistical reliability estimate.

## Desktop app follow-up

Observed November 2, 2026, Asia/Taipei (UTC+08:00), on Claude desktop app
4.4212.0 with Claude Code 2.1.309. Of 25 receipts outside the CLI trial
directories under `/private/tmp/`, 20 were protected and none had a managed
title. The app writes its generated title, such as `Auto dev`, as a
`custom-title` transcript record after the first prompt. Those records carry no
timestamp or source, so the adapter read the app's title as an intervening user
rename and protected it. The session that wrote this fix reproduced it: its
receipt flipped to protected at a later prompt while its title source was `tool`.

The app's own session record holds `titleSource`: `auto`, `tool`, `user`, or no
source (seen on scheduled-task sessions). The CLI process the app launches has
`CLAUDE_CODE_ENTRYPOINT=claude-desktop` and the account, organization, and host
session IDs in its environment, observed with `ps -E` on that process. A scan
of all 1,704 transcripts under `~/.claude/projects/` parsed every `tool_use`
input containing `session-name.ts`; none ran `protect`, so the legacy migration
discards no keep request on this device. The app's `set_session_title` tool
replaced an app-generated title and read back correctly in a desktop session.
Its tool description states that the app asks before replacing a user-set title,
except in bypass permissions mode; that exception was not exercised. The integration now routes desktop renames to
that tool; see [the integration guide](../../home/.claude/session-naming/README.md#claude-desktop-app-sessions).

## Primary sources

- [Official native hook contract](https://code.claude.com/docs/en/hooks)
- [Official session metadata SDK](https://code.claude.com/docs/en/agent-sdk/typescript#renamesession)
- [Official lifecycle guidance for skills](https://code.claude.com/docs/en/skills#claude-stops-following-a-skill)
- [Desktop and remote title propagation report](https://github.com/anthropics/claude-code/issues/67755)
