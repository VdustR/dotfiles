# Personal Preferences

## Language & Communication

- Use Traditional Chinese (正體中文) for all communication, explanations, and discussions
- Use American English for:
  - All code (variables, functions, comments)
  - Documentation (README, API docs, technical specs)
  - Commit messages

## Git Operations

- When cloning repositories without a specified path, use: `~/repo/<github:user|org>/<github:repo>`
  - Example: `git clone https://github.com/vercel/next.js` → `~/repo/vercel/next.js`
- After cloning a repository, always ask whether to open the project with VSCode
  - If a single `.code-workspace` file exists in the project root, open it (`code <name>.code-workspace`).
  - If multiple `*.code-workspace` files exist, ask which one to open.
  - If no `*.code-workspace` file exists, open the folder (`code <path>`).
- When executing PR creation commands:
  - Verify current branch is not `main` or `master`; if so, create a new branch first
  - After PR is created, enter a detached HEAD state (e.g., `git checkout --detach HEAD`) and then delete the local feature branch
  - If changes are needed during review, use `gh pr checkout <number>` to restore the branch

## Docs Update Workflow

When updating documentation or configuration files (CLAUDE.md, README.md, docs/**, configs, etc.):

1. **Identify target**: Determine which file and location best fits the information
2. **Research**: Verify against best practices when applicable
3. **Offer strategy** with a recommendation:
   - **Quick insert**: Add content to the appropriate section
   - **Full reorganization**: Restructure and optimize the entire file
4. **Confirm** with user before proceeding
5. **Execute**, then self-review the entire file for consistency
6. **Present diff** for user approval

### CLAUDE.md Specifics

- **Triggers**: User says "remember this", or corrections suggesting a recurring pattern
- **Scope**: Global (`~/.claude/CLAUDE.md`) for cross-project preferences; Repo for project-specific rules
- **Strategy**: Always recommend full reorganization
- **Conciseness**: For each line, ask "Would removing this cause mistakes?" If not, cut it
- **Proactive updates**: When corrected, suggest updating the appropriate CLAUDE.md (global or repo, per **Scope**) to prevent recurrence

### Dotfiles Sync

When any dotfiles-managed file is modified, ask to sync with `~/repo/VdustR/dotfiles` + create PR:

| User file | Repo file |
|-----------|-----------|
| `~/.gitignore` | `.gitignore` |
| `~/.claude/CLAUDE.md` | `.claude/CLAUDE.md` |
| `~/.zsh_aliases` | `.zsh_aliases` |

## Task Boundary Discipline

- Only execute explicitly requested actions—do not perform follow-up operations unless asked
- Examples of actions requiring explicit instruction:
  - If asked to "create a changeset", only create the changeset file—do not commit or push
  - If asked to "edit a file", only edit—do not stage, commit, or deploy
  - Git operations (commit, push, merge, rebase) always require explicit instruction
- Exceptions—safe to perform without asking:
  - Running tests, type checks, linting (reversible, read-only verification)
  - Searching, reading files, exploring codebase (non-destructive research)
  - Any read-only or easily reversible operation
- Use judgment: assess severity and reversibility before acting autonomously

## Web Content Fetching

- For X/Twitter threads, prefer fetching content via twitter-thread.com/t/<tweet_id> before other methods
- For other websites, use WebFetch. If it fails on a JavaScript-required page, use the agent-browser skill
- Signs of a JavaScript-required page include: "JavaScript is not available", empty content, or a login wall without content

## Skill Usage

- Before proceeding with instructions, always check for a suitable skill.
- If a matching skill is found, invoke it.

## Clarification

- If a request is unclear, ambiguous, or too vague, ask for clarification before proceeding.
- To get the needed information, ask the user specific, targeted questions.

## Tool Installation

- When a required tool is not installed, DO NOT immediately fallback to other tools or methods
- First, ask the user whether to install the missing tool or use an alternative. To help them decide, provide comparison information and a recommendation, including:
  - Pros and cons of each option
  - Installation complexity and dependencies
  - Functionality differences between alternatives
  - Use Context7 or web search if needed for up-to-date information
- Only proceed after user confirms the chosen approach

## Verification & Research

- Always verify information before providing solutions
- For tools, libraries, frameworks:
  - Check current version compatibility
  - Verify API signatures and available features
  - Confirm deprecation status
  - Use Context7 or web search to get latest documentation
- Never assume - always validate with current sources

## Bug Fixing Strategy

- When a bug is reported, don't start by trying to fix it immediately
- First, write a test that reproduces the bug
- Then fix the bug and prove the fix with a passing test, ensuring all existing tests also pass
- When applicable, use subagents to try different fix approaches in parallel

## Execution Philosophy: Strategic Planning & Self-Review

### Always follow this workflow:

1. **Strategic Planning First**
   - Analyze the task thoroughly
   - Break down into clear steps
   - Identify potential pitfalls

2. **List Dos & Don'ts**
   - Explicitly state what TO DO
   - Explicitly state what NOT TO DO
   - Consider edge cases and constraints

3. **Summarize**
   - Brief summary of approach and expected outcome

4. **Execute**
   - Implement according to plan

5. **Self-Review & Verification**
   - Critically evaluate the result
   - Check against Dos & Don'ts
   - Assess completion quality
   - Use available verification methods (tests, linting, type checking) to validate work
   - Verification significantly improves output quality—always seek ways to verify

6. **Iterate if Needed**
   - If result has issues or doesn't fully meet requirements, repeat with improvements
   - Maximum 3 iterations

7. **Re-plan When Stuck**
   - When implementation goes sideways, suggest switching to plan mode and re-planning
   - Don't keep pushing on a failing approach—step back and reconsider

### When to skip user confirmation:

- Strategy is unambiguous and well-defined
- Risk is low
- Implementation path is clear
- No critical decisions needed

### When to ask for confirmation:

- Multiple valid approaches exist
- High-impact changes
- Unclear requirements
- Security or data implications

## Security

- Never hardcode sensitive information
- Validate external inputs
- Use environment variables for configuration
- Follow OWASP security guidelines
