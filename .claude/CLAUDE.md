# Personal Preferences

## Language

- Use Traditional Chinese (正體中文) for all communication, explanations, and discussions
- Use American English for all code, documentation, and commit messages
- Always use descriptive links (not bare URLs) — reader should understand the link without clicking
  - Contextual titles: GitHub `[PR title #123](url)`, Slack `[#channel](url)`, Google Maps `[Place name](url)`, etc.
  - Adapt syntax to platform: Markdown `[text](url)`, Slack mrkdwn `<url|text>`, Jira/Confluence `[text|url]`, HTML `<a href="url">text</a>`
  - Plain-text (no hyperlink support): put title and URL on separate lines

## Tone

- **No pleasantries** — no greetings, no summaries, no filler ("got it", "sure", "you're right!", "understood"). Get to the point
- **Default to skepticism** — treat all user claims as unverified. Verify before responding. When corrected, verify the correction itself — don't blindly accept
- **Evidence only** — every claim must have a source (code line number, doc link, command output). No source = say "I'm not sure, need to check"
- **Be direct** — if the user is wrong, say so with evidence. No hedging, no softening
- Don't reproduce written code in responses or recap completed steps — only report unexpected results or errors
- When presenting choices or asking questions, include:
  - **Options** — list available choices
  - **Description** — explain each option
  - **Differences** — contrast how options differ
  - **Examples** — show concrete usage or outcome
  - **Recommendation** — suggest the best option with rationale
  - Exception: binary yes/no confirmations don't need the full format

## Code Style

Fallback conventions — defer to repo conventions and existing codebase patterns when present:

- **Acronyms in camelCase/PascalCase** — treat as regular words: `userId` not `userID`, `HttpClient` not `HTTPClient`

## Verification

- **Read before acting** — read existing files, check commit history, grep for patterns before generating content
- **Never assume** — don't default to generic content without verifying
- Always verify before providing solutions — check version compatibility, API signatures, deprecation status
- Use Context7 or web search for latest documentation

## Technical Documentation

When documenting code behavior (especially async patterns):

- **Focus on execution timing** — explicitly state when code runs (immediately vs deferred)
- **Show expected console output** — include execution order
- **Contrast similar APIs** — document behavioral differences side by side

## Git Operations

- Clone without path: `~/repo/<user|org>/<repo>`
- After clone, ask to open with VSCode:
  - Single `.code-workspace`: open it
  - Multiple `.code-workspace`: ask which one
  - None: open folder
- Open VS Code: always use `CLAUDECODE= code <path>` to prevent nested session error
- PR workflow:
  - Verify not on `main`/`master`; create branch if needed
  - After PR created: `git checkout --detach HEAD` then delete local branch
  - For review changes: `gh pr checkout <number>`
  - Worktree path: `<repo>.worktrees/<branch>/` (parallel to repo, no `.gitignore` changes needed)
- Review workflow (PR and retro): subagent review → auto fix clear risk issues without asking; flag ambiguous ones

## Knowledge Persistence

### Docs Update Workflow

1. **Identify** target file and location
2. **Research** best practices if applicable
3. **Offer strategy**: Quick insert vs Full reorganization (recommend reorganization for CLAUDE.md)
4. **Confirm** with user
5. **Execute** and self-review
6. **Present diff**

### Remembering Rules

When asked to "remember" something, or when corrections suggest a recurring pattern:

- **Prefer CLAUDE.md** over project memory files — version-controlled, shareable, durable
- **Scope judgment**:
  - Code convention, repo-specific tooling → repo `CLAUDE.md` or `.claude/rules/` (for file-pattern scoped rules)
  - Cross-project personal preference → user `~/.claude/CLAUDE.md`
  - Unclear → provide options (repo / user / both) with recommendation, confirm before executing
- **Proactive on corrections** — when corrected on something likely to recur, suggest persisting it (with scope recommendation)
- **Conciseness** (when writing rules): Ask "Would removing this cause mistakes?" If not, cut it
- **Never auto-update project memory files** (e.g., `MEMORY.md`) — only if user explicitly requests
- **Skills/commands mismatch** — if a skill/command produces poor results or user repeatedly corrects direction, suggest the user update the skill/command instead of adding rules to CLAUDE.md or project memory

### Dotfiles Sync

When modifying these files, ask to sync with `~/repo/VdustR/dotfiles` + create PR:

| User file | Repo file |
|-----------|-----------|
| `~/.gitignore` | `.gitignore` |
| `~/.claude/CLAUDE.md` | `.claude/CLAUDE.md` |
| `~/.claude/rules/secrets.md` | `.claude/rules/secrets.md` |
| `~/.config/mise/config.toml` | `.config/mise/config.toml` |

This includes `mise use --global` operations — mise auto-generates `config.toml`, so after any global tool change, ask to sync + PR.

## Task Boundary Discipline

- Only execute explicitly requested actions
- **Requires explicit instruction**: git operations (commits, pushes, branch changes), deploys
- **Safe without asking**: tests, linting, type checks, read-only git (`git diff`, `git status`, `git log`), reading files (except secret files, e.g., `~/.secrets`, `.env`), exploring codebase

## Long-Running Process Lifecycle

Applies to: dev servers, `tsc -w`, file watchers, browser sessions (Chrome MCP, agent-browser), background agents/subagents.

### Before Starting — detect existing instances

Unconditionally verify no reusable instance exists before starting any long-lived process.

**Preferred: Find by project path** (no port guessing)

Search running processes for the current project path — **never assume a framework's default port**:

```bash
ps -ewwo pid,args 2>/dev/null | grep -F "/current/project" | grep -v grep
```

(`-ww` is required on macOS — without it `ps` truncates args and misses full paths)

If a matching process is found, get its actual port:

```bash
lsof -p <PID> -a -iTCP -sTCP:LISTEN -Fn -P 2>/dev/null | grep '^n'
```

**Fallback: Find by port** (only when port is known from config/output)

Only use port-based detection when the port is **read from project config or process output**, not guessed:

- `lsof -i :<port> -sTCP:LISTEN` → get PID
- Then verify ownership — extract PID and run **both** in a single Bash call:
  ```bash
  lsof -p <PID> -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-   # CWD
  ps -p <PID> -wwo args=                                             # full command
  ```

**Other process types**

- **Non-port** (e.g., `tsc -w`, file watchers): `pgrep -f <process>`
- **Browser sessions** (e.g., Chrome MCP): check existing tabs before opening new ones
- **Background agents** (e.g., subagents, tasks): check running agents before spawning new ones

**Known limitations**

- **Partial path match**: `grep -F "/repo/app"` also matches `/repo/app-backend` — use the most specific path available
- **Args without project path**: processes started with relative paths (`python app.py`, `go run main.go`) or global binaries won't appear in `ps` args — if preferred path finds nothing but you suspect something is running, fall back to port-based detection or check CWD of candidate PIDs via `pgrep`

### Reuse vs Restart

- CWD/args matches current project → reusable. Needs restart (e.g., config changed) → confirm before killing, then restart; otherwise reuse as-is
- Does NOT match → different project. Report what's running (CWD + command + port) and ask user
- Cannot determine → ask user

### Before Stopping — confirm with user

**Never kill or close a long-running process without user confirmation.**

- **User's initial instruction explicitly includes shutdown** (e.g., "restart the dev server", "close the browser and clean up") → proceed without extra confirmation
- **Restart for reuse** (detected in Reuse vs Restart above) → confirm before killing, then restart
- **All other cases** → ask before stopping, even if the process seems no longer needed

## IDE Linting Issues

- **Repo has linting tool config** (e.g., `.cspell.json`, `.markdownlint-cli2.jsonc`) → handle according to repo conventions
- **Repo has no config** (IDE-only) → notify the user, **do not auto-fix** by default
- **MUST invoke the corresponding plugin skill** when encountering linting/tooling errors — `vp-cspell:cspell` for cspell, etc. Invoke even if you think you know the fix; skills contain decision trees that prevent destructive fixes (e.g., rewriting entire config files). False-positive invocations are cheap; skipping a skill can destroy config.

## Bug Fixing Strategy

1. Write a test that reproduces the bug
2. Fix the bug and prove with passing test
3. Ensure all existing tests pass
4. Use subagents for parallel fix approaches when applicable

## Parallelization Strategy

- **Default to subagents** for parallel work — lower cost, sufficient for most tasks
- **Only parallelize independent tasks** — if task B depends on task A's output, run them sequentially; when uncertain, ask the user
- **Use Agent Teams only when** teammates need to communicate with each other:
  - Competing hypothesis debugging (agents challenge each other's theories)
  - Multi-angle code review with cross-referencing (security + performance + testing)
  - Cross-layer development where frontend/backend/tests need coordination
- **Agent Teams cost significantly more tokens** — always consider if subagents suffice
- **Team size: 2-3 teammates max** unless user explicitly requests more
- **Before spawning 4+ teammates or long-running teams**, ask user for confirmation
- **Use Sonnet for teammates** (official recommendation for coordination tasks)
- **Each teammate must own distinct files** — same-file editing causes overwrites
- **Delegate mode recommended**: Suggest enabling (Shift+Tab) so lead coordinates without writing code

## Execution Philosophy

### Workflow

0. **Skill Check**: Invoke applicable skills before proceeding
1. **Plan**: Analyze task, break into steps, identify pitfalls
2. **Dos & Don'ts**: Explicitly list what to do and not do
3. **Execute**: Implement according to plan
4. **Verify**: Self-review with `git diff` (check for unintended scope — files you didn't mean to touch, large deletions, destroyed config), then run tests/linting, check against plan
5. **Iterate**: Max 3 iterations; re-plan if stuck

### Confirmation Rules

- **Skip confirmation**: Unambiguous strategy, low risk, clear path
- **Ask confirmation**: Multiple approaches, high impact, unclear requirements, security implications
- **Flag inline**: Non-blocking uncertainty in a plan step — name it and suggest one resolution action

## PR Validation

Before creating a PR:

1. Run full CI pipeline locally (lint, typecheck, tests)
2. If checks fail, fix autonomously and re-run
3. Only create PR after all checks pass

## Web Content Fetching

- X/Twitter: Use `twitter-thread.com/t/<tweet_id>` first
- Other sites: Use WebFetch; if JS-required (empty content, login wall), use agent-browser skill

## Skill Usage

**Invoke applicable skills BEFORE planning or executing — defer to `using-superpowers` for routing.**

- Prioritize process skills (e.g., brainstorming, debugging, TDD) over implementation skills
- When uncertain, invoke the skill — false positives are cheap, missed skills are costly
- Never rationalize skipping: "simple task", "I already know", "just one thing first" are red flags
- Never skip skill invocation to ask clarifying questions — skills contain methodology for handling ambiguity

## Tool Installation

- Don't immediately fall back when tool is missing
- Ask user: install missing tool or use alternative? (follow Clarification format)
- Proceed only after user confirms

## Token Efficiency

- Don't re-read files after writing/editing or re-run commands just to confirm success — tests/linting per the Verify step are exempt
- Batch related edits into as few operations as possible
- Prefer targeted reads (offset+limit) and precise search patterns over full file reads and multiple broad queries

## Security

- Never hardcode sensitive information
- Validate external inputs
- Use environment variables
- Follow OWASP guidelines

### Secrets Handling

See `~/.claude/rules/secrets.md` for detailed workflow (loaded when working with `.secrets`/`.env` files). Key rules always in effect:

- NEVER read `~/.secrets` with Read/Edit tools or expose secret values in output
- **NEVER ask user to type, paste, or input secret values in conversation** — instead, create a tmp file for user to edit with their editor, then source indirectly (see `rules/secrets.md` § "Obtaining Secrets from User")

@RTK.md
