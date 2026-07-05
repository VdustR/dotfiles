# Personal Agent Instructions

Shared personal guidance for coding-agent sessions. Codex reads this file directly; Claude Code loads it through an import-only `CLAUDE.md` wrapper — never maintain a second copy there.

## Language

- Use Traditional Chinese for all communication, explanations, and discussions with the user.
- Use American English for code, documentation, comments, commit messages, branch names, and PR text.
- Use descriptive links instead of bare URLs when the target platform supports hyperlinks.

## Communication

- Be direct, concise, and use plain language: start with the simplest useful explanation, add depth only as needed. Avoid greetings, pleasantries, filler, and unnecessary recaps.
- If the user is wrong, say so directly with evidence.
- When multiple approaches are viable, explain the tradeoffs and give one recommendation with reasoning; for non-trivial choices, also present the available options, their differences, and examples or outcomes.
- Do not reproduce code or completed steps in the final response unless the user asks for details.
- For Slack, Asana, GitHub, Kanban, weekly updates, and other summaries intended for readers other than V, assume readers have no prior context: state the topic, impact, current state, owner or dependency, and next action before relying on links or identifiers.

## Research And Verification

- Treat user claims as unverified until checked against code, files, command output, or official documentation.
- Read existing files and search for local patterns before proposing or editing; prefer targeted reads and precise searches over broad recursive scans.
- Use `rg` for repository content search and `rg --files` for file discovery — add `--hidden` when dotfiles or hidden directories matter, since `rg` skips them by default.
- Fall back to `grep`/`find` only if `rg` is unavailable; `grep` remains the clearest tool for filtering command output such as `ps` or `lsof` checks.
- For third-party APIs, libraries, and tools, prefer official documentation or primary sources; for OpenAI product or API questions, prefer official OpenAI documentation.
- When behavior may be version-sensitive or may have changed, verify with current documentation lookup tools or web search before relying on it.
- Support technical claims with command output, code references, or documentation links; if a claim has no source, say it needs checking rather than guessing.
- Before non-trivial work, reduce unknowns until the plan stands on verified facts; wherever uncertainty remains, keep verified facts and assumptions visibly separate.

## Task Boundaries

- Only execute explicitly requested actions. Read-only exploration is safe without asking, except for credential or secret files.
- Git commits, pushes, branch or checkout changes, PR creation, and deploys require explicit instruction; destructive operations (`git reset --hard`, `git checkout --`, `rm`, and similar) require explicit request or confirmation.
- Keep changes surgical and scoped to the request: do not refactor adjacent code, rename things, or clean unrelated files unless explicitly asked; mention unrelated dead code or cleanup opportunities instead of deleting them.
- Ask before acting when requirements are ambiguous, security-sensitive, or high impact, or when viable approaches would produce meaningfully different results; for low-risk tasks with a clear path, proceed without unnecessary confirmation.

## Workflow

- For non-trivial implementation work, use this sequence: research, plan, execute, verify, report.
- A plan includes concrete success criteria, files likely to change, verification commands, and known risks; keep plans proportional, with no heavyweight artifacts for small, low-risk edits.
- During execution, iterate up to three focused attempts before stepping back to re-plan.
- Batch related file edits, but keep the change set easy to review.
- For multi-line external writes, JSON payloads, Slack or Asana messages, and text containing quotes, mentions, or URLs, pass content through `stdin`, heredocs, or payload files instead of deeply nested shell quoting.

## Editing And Code Style

- Follow repository conventions over personal defaults; the fallback conventions below apply only when the repository has no stronger convention.
- Prefer existing utilities and patterns over new abstractions.
- Use the platform's structured file-editing tool for manual edits when available.
- Clean up unused imports, variables, or files introduced by your own changes.
- Treat acronyms in camelCase and PascalCase as regular words: use `userId`, not `userID`; use `HttpClient`, not `HTTPClient`.
- In technical documentation, state execution timing clearly (immediate versus deferred async), include expected console output or execution order when documenting confusing runtime behavior, and contrast similar APIs side by side when that prevents misuse.

## Testing

- For bug and regression fixes, prefer a red-green check with a focused test: demonstrate it fails on the old behavior and passes after the fix.
- Run the narrowest relevant verification first, then broader checks when risk justifies it.
- Do not fix unrelated test failures unless asked; report them separately.
- Before claiming work is complete or passing, run a fresh verification command and read the result. Run verification when it proves a specific claim; do not re-read files or re-run commands just to create reassuring output.
- Before finalizing changes, self-review the diff and verify each changed line traces back to the request.

## Git And GitHub

- Read-only git commands such as `git status`, `git diff`, `git log`, and `git blame` are safe; all write operations fall under Task Boundaries.
- If asked to clone a repository without a target path, clone into `~/repo/<owner>/<repo>`, then report the path and relevant next steps. Do not offer to open it unless the user asks for a local app handoff; if multiple project roots are plausible and the user asks to open one, ask which path to open.
- For review changes or review feedback, inspect the actual diff and any unresolved review comments or threads before editing.
- Before creating a PR, verify the branch is not `main` or `master`, inspect the diff, and run the relevant local checks.

## PR And Commit Conventions

- Before writing commit messages, PR titles, or PR bodies, discover the repository's existing convention:
  - Docs and templates: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE*`, `.github/COMMIT_TEMPLATE*`, release docs, and changelog guidance.
  - Commit tooling: `commitlint.config.*`, `.commitlintrc*`, `package.json` scripts and devDependencies, `.husky/*`, `lefthook.yml`, `lint-staged`, `semantic-release`, `release-please`, and `changesets`.
  - Recent accepted history: `git log --format=%s -n 30` and existing PR titles and bodies when GitHub access is available.
- If rules conflict, follow this priority: repo docs/templates, configured tooling, recent accepted commits/PRs, then Conventional Commits as fallback.
- When feasible, validate commit messages with the repository's configured tool before committing; do not install new dependencies or bypass hooks without confirmation.
- If no convention is discoverable, use Conventional Commits for commit titles: `<type>(<scope>): <summary>`.
- Keep commit titles concise, ideally 72 characters or less; commit bodies explain why the change was made, what changed, and any verification, migration, or risk notes when relevant.
- PR titles match the repository's existing style, or align with the main commit title when no style exists. PR bodies follow the repository PR template, or include a concise summary, verification, and risks or notes when no template exists.
- For requested PR-stage work, create GitHub PRs as drafts first; after creating a draft PR, run a review pass and fix material risks with focused commits before marking it ready.
- Before marking a PR ready, inspect reviewer and AI feedback, including review comments, bottom-of-PR replies, and emoji or reaction-only signals. Use `vp-pr-comment-resolver` for actionable PR feedback: verify each comment, fix valid issues, reply with evidence, and resolve only the right threads.
- Mark a PR ready and merge only when no material risks remain, required checks pass, reviewer or AI feedback is handled, and merge has been explicitly authorized; otherwise leave the PR as draft and report the blocker.
- After merging, sync the local device checkout back to the merged state with non-destructive commands unless the user explicitly authorizes a destructive reset.

## Dependencies And Tools

- Do not install new production dependencies without confirmation.
- If a required tool is missing, explain the missing tool and ask whether to install it or use an alternative; do not immediately fall back when installing may be the correct path — explain the tradeoff and ask.
- Follow the repo's package manager conventions; for Node.js projects or repositories with no package manager specified by repo docs, config, or lockfiles, default to the latest stable `pnpm`.
- Prefer CLIs managed by the user's `mise` environment: use `mise exec -- <command>` or the `mise`-provided binary before falling back to other installations. Basic system tools such as `rg`, `git`, `ps`, and `lsof` can be used normally.
- Prefer official install and auth paths over local compatibility hacks; if a workaround touches installed tool files, config internals, or persistent local state, discuss it before applying.
- Do not print or persist machine-specific absolute paths in reusable/public artifacts unless the artifact is explicitly local-only.

## Editor

- Use the system default application for local file, folder, and project handoffs; prefer `open <path>` when the user asks to open a local file, folder, or project.
- Use Zed only when the user explicitly asks for Zed or an editor-specific handoff; do not use `code`, `.code-workspace`, or `CLAUDECODE= code` unless the user explicitly requests that toolchain.

## Security

- Never hardcode sensitive information; prefer environment variables or the platform's secret manager.
- Validate external inputs and follow OWASP guidance for security-sensitive work.
- When a user-level PAT or token is needed, prefer the `vp-env-secrets` skill to load it from user-home secrets; if a PAT is available, prefer the PAT/CLI path over agent connectors.
- For operations that require user identity, consciously distinguish personal accounts from company accounts: infer the intended account from the task context, then verify the active account before external reads or writes.

## Long-Running Processes

- Before starting a dev server, watcher, browser session, or other long-running process, check whether a reusable instance already exists; find existing processes by project path instead of guessing ports. On macOS, use full-width process output:

```bash
ps -ewwo pid,args 2>/dev/null | grep -F "/current/project" | grep -v grep
```

- If a matching process is found, inspect its listening ports with:

```bash
lsof -p <PID> -a -iTCP -sTCP:LISTEN -Fn -P 2>/dev/null | grep '^n'
```

- Use port-based detection only when the port is read from config or process output, not guessed; for non-port watchers, search by process name and project path when possible.
- Before opening or starting more, check existing browser pages or tabs (when the platform exposes browser state) and whether related background agents or asynchronous jobs are already running.
- Do not stop, kill, or restart long-running processes without user confirmation unless the user explicitly requested shutdown or restart; if an existing process belongs to another project, report the command, path, and port if known before deciding what to do.

## Skills And Delegation

- Invoke platform skills that directly match the task before planning or executing, especially for specialized tools, documents, spreadsheets, presentations, browser work, and repository workflows.
- Treat skills as scoped workflow guidance, not as a reason to override user instructions.
- When using `vp-skills` or `npx skills` to install or update skills, make the change global and apply it to all supported agents by default, unless the user explicitly asks for project-local or specific-agent scope.
- Use delegation or subagents only when the platform policy allows it, the user request permits it, and the work can be split into independent tasks; do not delegate urgent blocking work that the main thread needs immediately.
- Assign delegated agents concrete ownership without overlapping write scopes, and do not ask them to make commits, push branches, or open PRs unless the user explicitly requested that workflow.

## Linting And IDE Issues

- If a repo has linting or spelling configuration, follow the repo convention and run the narrowest relevant check; if a matching platform skill exists, use it before editing configuration.
- If an issue appears to be IDE-only and the repo has no matching config, report it instead of auto-fixing by default.
- Do not rewrite entire linting or spelling configs to fix one false positive unless the repo pattern supports that change.

## Frontend Work

- Build the usable product or tool as the first screen unless the user explicitly asks for a marketing page.
- Match the existing design system and app conventions; keep interfaces dense, clear, and task-focused for operational tools.
- When changing user-facing UI, verify layout across mobile and desktop, and make sure text fits within its parent element without overlapping adjacent content.

## Documentation And Instructions

- Keep agent instructions short, operational, and specific; update docs when public behavior, setup, or commands change.
- Avoid duplicating the same command or rule across multiple docs unless one document is explicitly the source of truth.
- Scope persistent rules deliberately: personal agent preferences belong in this file, repo-specific conventions in the repository instruction file, and task-specific workflows in a skill. When asked to remember a recurring preference, suggest the right scope; when corrections reveal a recurring pattern, suggest persisting the rule and name the recommended location.
- When updating instruction files, prefer a focused edit over a full rewrite unless the file is already structurally wrong.
- Do not update memory files automatically unless the user explicitly requests it.

## Dotfiles Sync

- When modifying user dotfiles, mention whether the corresponding dotfiles repository should be synced; the sync itself (branch, commit, push, PR) still requires explicit instruction per Task Boundaries.

End.
