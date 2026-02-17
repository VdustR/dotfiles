# Personal Preferences

## Language & Communication

- Use Traditional Chinese (正體中文) for all communication, explanations, and discussions
- Use American English for all code, documentation, and commit messages
- Always use descriptive links (`[title](url)` not bare URLs) — reader should understand the link without clicking
  - Contextual titles: GitHub `[PR title #123](url)`, Slack `[#channel](url)`, Google Maps `[Place name](url)`, etc.
  - Plain-text (no hyperlink support): put title and URL on separate lines

## Context-First Approach

Before generating user-facing content (docs, descriptions), understand the project first:

- **Read existing files** to understand style, naming conventions, and context
- **Check commit history** for voice/priorities; grep for branding patterns if relevant
- **Never assume** - don't default to generic content without verifying

## Technical Documentation

When documenting code behavior (especially async patterns):

- **Focus on execution timing** - explicitly state when code runs (immediately vs deferred)
- **Show expected console output** with execution order
- **Contrast similar APIs** - document behavioral differences side by side

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

## Docs Update Workflow

1. **Identify** target file and location
2. **Research** best practices if applicable
3. **Offer strategy**: Quick insert vs Full reorganization (recommend reorganization for CLAUDE.md)
4. **Confirm** with user
5. **Execute** and self-review
6. **Present diff**

### CLAUDE.md Specifics

- **Triggers**: "remember this" or corrections suggesting recurring patterns
- **Scope**: Global for cross-project; Repo for project-specific
- **Conciseness**: Ask "Would removing this cause mistakes?" If not, cut it
- **Proactive**: When corrected, suggest updating CLAUDE.md to prevent recurrence

### Dotfiles Sync

When modifying these files, ask to sync with `~/repo/VdustR/dotfiles` + create PR:

| User file | Repo file |
|-----------|-----------|
| `~/.gitignore` | `.gitignore` |
| `~/.claude/CLAUDE.md` | `.claude/CLAUDE.md` |
| `~/.zsh_aliases` | `.zsh_aliases` |

## Task Boundary Discipline

- Only execute explicitly requested actions
- **Requires explicit instruction**: git operations, commits, pushes, deploys
- **Safe without asking**: tests, linting, type checks, reading files (except `~/.secrets`), exploring codebase

## Verification & Research

- Always verify before providing solutions
- Check version compatibility, API signatures, deprecation status
- Use Context7 or web search for latest documentation

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
4. **Verify**: Self-review, run tests/linting, check against plan
5. **Iterate**: Max 3 iterations; re-plan if stuck

### Confirmation Rules

- **Skip confirmation**: Unambiguous strategy, low risk, clear path
- **Ask confirmation**: Multiple approaches, high impact, unclear requirements, security implications

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

## Clarification

- If request is unclear or ambiguous, ask specific, targeted questions before proceeding

## Tool Installation

- Don't immediately fallback when tool is missing
- Ask user: install missing tool or use alternative?
- Provide comparison (pros/cons, complexity, functionality)
- Proceed only after user confirms

## Security

- Never hardcode sensitive information
- Validate external inputs
- Use environment variables
- Follow OWASP guidelines
- **Secrets handling**: Never read, write, or modify `~/.secrets` directly. When sensitive information needs to be confirmed or updated (API keys, tokens, credentials), ask the user to open `~/.secrets` in their editor, make changes manually, then restart their shell and Claude Code
