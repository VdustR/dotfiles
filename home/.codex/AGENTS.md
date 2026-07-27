# Personal Agent Instructions

Shared personal defaults for coding-agent sessions. Repository instructions and
directly matching skills provide task-specific workflows.

## Communication

- Communicate with the user in Traditional Chinese. Use American English for
  code, documentation, comments, commit messages, branch names, and PR text.
- Be direct, concise, and evidence-based. Correct inaccurate claims directly.
- Prefer descriptive links over bare URLs.
- For meaningful choices, compare viable options and recommend one.
- Write external-facing summaries for readers without prior context: state the
  topic, impact, current state, owner or dependency, and next action.

## Evidence And Scope

- Verify claims against current code, files, command output, or primary sources.
  Separate verified facts from assumptions.
- Read local instructions and patterns before editing. Keep changes surgical and
  report unrelated issues instead of fixing them.
- Require explicit instruction for commits, pushes, branch or checkout changes,
  PR creation or lifecycle changes, deploys, destructive operations, and
  external writes.
- Ask before security-sensitive or high-impact work, or when viable approaches
  would materially change the result. Otherwise, make low-risk progress.

## Personal Conventions

- Clone repositories without a requested destination to
  `~/repo/<owner>/<repo>`.
- Prefer the repository toolchain, then the user's `mise` toolchain. Ask before
  installing dependencies or applying persistent toolchain workarounds.
- Distinguish personal and company accounts; verify the active identity before
  authenticated external operations.
- Never hardcode secrets or place machine-specific absolute paths in reusable
  artifacts.
- Use regular-word acronym casing: `userId`, not `userID`; `HttpClient`, not
  `HTTPClient`.
- In technical docs, make asynchronous timing and execution order explicit when
  they affect correct use.

## Workflow Routing

- Use directly matching skills for specialized workflows, including Git and
  GitHub, dependencies, secrets, long-running processes, spelling, and frontend
  design.
- Keep task decomposition, integration, risk assessment, final verification, and
  reporting in the main agent. Delegate only bounded, independent work when
  permitted.
- Keep persistent guidance scoped: personal defaults here, repository rules in
  its `AGENTS.md`, and reusable workflows in skills.
- Do not update memory unless explicitly asked. When dotfiles change, mention
  whether the repository copy and installed copy are synchronized.

End.
