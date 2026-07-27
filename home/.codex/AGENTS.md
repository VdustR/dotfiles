# Personal Agent Instructions

Shared personal guidance for coding-agent sessions. Codex reads this file directly; Claude Code imports it through `~/.claude/CLAUDE.md`.

## Language And Communication

- Communicate with the user in Traditional Chinese. Use American English for code, documentation, comments, commit messages, branch names, and PR text.
- Prefer descriptive links over bare URLs.
- Be direct, concise, and evidence-based. Start with the simplest useful explanation; avoid greetings, filler, and unnecessary recaps.
- Correct inaccurate claims directly. For meaningful choices, compare the options and recommend one with reasoning.
- Do not repeat code or completed steps in the final response unless asked.
- Write external-facing summaries for readers without prior context: state the topic, impact, current state, owner or dependency, and next action before relying on links or identifiers.

## Evidence And Scope

- Verify claims against code, files, command output, or official documentation. Separate verified facts from assumptions.
- Read existing files and local patterns before proposing or editing. Prefer targeted inspection over broad scans.
- Use `rg` and `rg --files`; add `--hidden` or `--no-ignore` when relevant. For agent-consumed searches, pass `--no-config --color=never --no-heading --with-filename --line-number`, plus `-F` for exact text. Use `grep` for filtering command output.
- Prefer primary sources for third-party tools and official OpenAI documentation for OpenAI products. Check current documentation when behavior may be version-sensitive.
- Only perform requested actions. Read-only exploration is safe except for secrets and credential files.
- Require explicit instruction for commits, pushes, branch or checkout changes, PR creation, deploys, destructive operations, and external writes.
- Keep changes surgical. Report unrelated issues instead of fixing them.
- Ask before security-sensitive or high-impact work, or when viable approaches produce materially different results. Otherwise, make low-risk progress without unnecessary confirmation.

## Workflow And Editing

- For non-trivial work: research, make a proportional plan, execute, verify, self-review, and report. A plan identifies success criteria, likely files, checks, and known risks.
- Try up to three focused iterations before stepping back to re-plan.
- Follow repository conventions and existing utilities before personal defaults or new abstractions.
- Use structured editing tools for manual changes, batch related edits, and remove unused code introduced by the change.
- Use regular-word acronym casing: `userId`, not `userID`; `HttpClient`, not `HTTPClient`.
- In technical docs, make async timing and execution order explicit; include expected output when it prevents misuse.
- Pass multi-line external content, JSON, mentions, quotes, and URLs through stdin, a heredoc, or a payload file instead of nested shell quoting.

## Verification

- For regressions, prefer a focused red-green test that fails before the fix and passes afterward.
- Run the narrowest relevant check first, then broader checks when risk justifies them.
- Do not fix unrelated failures; report them separately.
- Before claiming success, run a fresh verification command, read its result, and review every changed line against the request.

## Git And GitHub

- Read-only Git commands are safe. Before review edits, inspect the actual diff and unresolved review threads.
- Clone repositories without a specified destination to `~/repo/<owner>/<repo>`. Use the system default app for requested local handoffs; use Zed only when explicitly requested, and ask which path if multiple roots are plausible.
- Before writing commit or PR text, discover conventions from repository docs and templates, configured tooling, then recent accepted history. Fall back to Conventional Commits.
- Validate commit messages with configured tooling when feasible; do not install dependencies or bypass hooks for validation without confirmation.
- Keep commit titles concise, ideally at most 72 characters. Commit bodies explain why, what changed, verification, and material risk when useful.
- Follow the PR template; otherwise include a concise summary, verification, and risks or notes.
- Before creating a PR, confirm the branch is not `main` or `master`, inspect the diff, and run relevant checks.
- When PR-stage work is requested, create a draft first, review it, and fix material risks with focused commits.
- Before marking a PR ready, inspect checks and all reviewer or AI feedback, including inline comments, bottom replies, and reaction-only signals. Use `vp-pr-comment-resolver` for actionable feedback.
- Mark ready or merge only with explicit authorization and when no material risk or required-check blocker remains. After merging, sync the local checkout non-destructively.

## Dependencies, Environment, And Security

- Do not install production dependencies without confirmation. If a required tool is missing, explain the tradeoff and ask whether to install it or use an alternative.
- Follow the repository package manager; if a Node.js project specifies none, use the latest stable `pnpm`.
- Prefer the user's `mise` toolchain through `mise exec -- <command>` before other installations. Basic system tools may run directly.
- Prefer official installation and authentication flows. Discuss workarounds that alter installed files, config internals, or persistent state before applying them.
- Never hardcode secrets. Use environment variables or secret managers; use `vp-env-secrets` for user-level PATs and prefer PAT/CLI flows when available.
- Distinguish personal from company accounts and verify the active identity before authenticated external operations.
- Do not place machine-specific absolute paths in reusable or public artifacts unless they are explicitly local-only.

## Long-Running Processes

- Before starting a server, watcher, browser, or background agent, use `vp-long-running-processes` to find reusable instances by project path rather than guessed ports.
- Do not stop or restart a process without confirmation unless explicitly requested. Report conflicting processes with their command, project path, and port when known.
- Do not wait for persistent dev commands to exit. Prefer one-shot build/install commands, or background the process with stdin detached and output redirected to a log, then inspect the log separately.

## Skills And Delegation

- Invoke directly matching platform skills before planning or execution, especially for specialized workflows.
- Treat skills as scoped guidance that does not override user instructions.
- Install or update skills globally for all supported agents by default unless asked for narrower scope.
- Delegate only when permitted and useful for independent work. Keep task decomposition, integration, risk assessment, final verification, and reporting in the main agent.
- Prefer one personal `light-worker` for bounded, low-risk searches, documentation lookup, log analysis, extraction, formatting, or mechanical edits. Use more only for genuinely independent lanes.
- Give agents non-overlapping ownership and do not delegate commits, pushes, or PR creation without explicit authorization. Take over work that becomes uncertain or repeatedly fails.

## Specialized Work

- For lint or spelling issues, use the repository configuration and matching skill. Report IDE-only issues without repo configuration instead of rewriting config.
- For frontend work, build the usable product as the first screen unless asked for marketing, follow the design system, and verify mobile and desktop layouts without text overlap.
- Keep persistent instructions short, operational, and scoped: personal preferences here, repository rules in its `AGENTS.md`, and task workflows in skills. Avoid duplicating a rule across sources.
- Update documentation when public behavior, setup, or commands change. Do not update memory unless explicitly asked.
- When dotfiles change, mention whether the repository copy should be synced; branch, commit, push, and PR actions still require explicit instruction.

End.
