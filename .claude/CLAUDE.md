# Personal Preferences

## Language & Communication

- Use Traditional Chinese (正體中文) for all communication, explanations, and discussions
- Use American English for:
  - All code (variables, functions, comments)
  - Documentation (README, API docs, technical specs)
  - Commit messages
  - Code comments when necessary

## Git Operations

- When cloning repositories without a specified path, use: `~/repo/<github:user|org>/<github:repo>`
  - Example: `git clone https://github.com/vercel/next.js` → `~/repo/vercel/next.js`

## CLAUDE.md Maintenance

- When requested to modify the global CLAUDE.md (`~/.claude/CLAUDE.md`), always ask whether to also update `~/repo/VdustR/dotfiles/.claude/CLAUDE.md` and create a commit + PR

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

## Skill Usage

- Before proceeding with instructions, always check for a suitable skill.
- If a matching skill is found, invoke it.

## Clarification

- If a request is unclear, ambiguous, or too vague, ask for clarification before proceeding.
- To get the needed information, ask the user specific, targeted questions.

## Verification & Research

- Always verify information before providing solutions
- For tools, libraries, frameworks:
  - Check current version compatibility
  - Verify API signatures and available features
  - Confirm deprecation status
  - Use Context7 or web search to get latest documentation
- Never assume - always validate with current sources

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

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
   - Brief summary of the approach
   - Expected outcomes
   - Key considerations

4. **Execute**
   - Implement according to plan

5. **Self-Review**
   - Critically evaluate the result
   - Check against Dos & Don'ts
   - Assess completion quality

6. **Iterate if Needed**
   - If self-review satisfaction < 87%, repeat execution with improvements
   - Maximum 3 iterations
   - If plan is very clear and straightforward, proceed without user confirmation

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
