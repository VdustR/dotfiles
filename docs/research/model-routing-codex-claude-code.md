# Model Routing in Codex and Claude Code

Research date: 2026-07-17

Scope: official OpenAI and Anthropic documentation and repositories only. This note separates defaults, routing hints, and enforceable controls because they do not provide the same guarantee.

## Executive summary

Both products can run a cheaper model by default and define named agents that use different models for different jobs. Neither product provides a general deterministic rules engine such as “if task complexity is X, spawn exactly N agents on model Y.” The practical native pattern is:

1. Set a default model for the main session.
2. Define a small set of role-specific agents with explicit model and effort settings.
3. Give each role a precise activation description and, when exact behavior matters, request that role and agent count explicitly.
4. Keep nesting shallow and parallelism bounded.

Codex exposes first-class per-agent TOML configuration plus a configurable concurrent thread cap. Claude Code exposes richer per-agent model precedence and organization-level model allowlists, but its normal user configuration does not expose a subagent concurrency cap.

Hooks are not the right mechanism for choosing a model. In both products, `SubagentStart` is too late and cannot block creation; it can only inject context. Use agent definitions and model configuration for routing, and use permissions or managed policy only to constrain what may run.

## Capability matrix

| Capability | Codex CLI / desktop | Claude Code |
| --- | --- | --- |
| Default main model | `model` in `~/.codex/config.toml`; CLI `--model` and interactive `/model` can override it | `model` in settings; `--model`, `ANTHROPIC_MODEL`, and `/model` can override it |
| Per-agent model | `model` in each custom agent TOML | `model` in subagent frontmatter; per-invocation override is also supported |
| Per-agent reasoning | `model_reasoning_effort` in each custom agent TOML | `effort` in subagent frontmatter |
| Global subagent model | No separate global subagent-model key is documented; omitted agent fields inherit the parent | `CLAUDE_CODE_SUBAGENT_MODEL` overrides all subagent, teammate, workflow, per-invocation, and frontmatter model choices |
| Context-based routing | Agent `description`, instructions, skills, and explicit prompts guide the orchestrator; exact routing is not guaranteed unless the user explicitly requests the agent | Agent `description`, natural-language request, or `@` mention; an `@` mention guarantees that named subagent runs for the task |
| Concurrency control | `[agents].max_threads`, default `6` | No documented user setting for subagent concurrency; agent teams have no hard teammate limit, with `3-5` recommended |
| Nesting control | `[agents].max_depth`, default `1` | Nested subagents are limited to five levels; the limit is fixed and not configurable |
| Prevent selected agent types | No model-routing-specific permission rule is documented; multi-agent can be disabled through managed requirements | Agent tool allowlists or permission deny rules can prevent selected subagent types; omitting `Agent` prevents spawning |
| Enforce model availability | Managed model settings are defaults, not enforcement; explicit launch choices can override them | Managed `availableModels` plus `enforceAvailableModels` can enforce an allowlist across main sessions and subagents |

## Codex

### Default model and local surfaces

Codex reads personal defaults from `~/.codex/config.toml` and trusted project overrides from `.codex/config.toml`. The documented default model configuration is:

```toml
model = "gpt-5.6"
model_reasoning_effort = "medium"
```

OpenAI documents `model` as the default for the CLI and IDE. The same local Codex configuration system and custom-agent workflow are used by local clients, and subagent activity is surfaced in the ChatGPT desktop app, CLI, and IDE. In Work mode, the desktop composer controls the current model and intelligence level. See [Config basics](https://developers.openai.com/codex/config-basic), [CLI model override](https://developers.openai.com/codex/cli/reference), and [Subagents](https://developers.openai.com/codex/multi-agent).

The effective model is not permanently locked by `model`: `codex --model <model>` overrides configuration for a launch, and `/model` changes the active model interactively. For managed deployments, `[models.new_thread]` in `requirements.toml` supplies managed defaults, but OpenAI explicitly states that dedicated CLI flags or `--config` overrides take precedence. Therefore Codex currently documents a managed model default, not a strict model allowlist. See the [`requirements.toml` model section](https://developers.openai.com/codex/config-reference).

### Per-agent model routing

Personal custom agents live in `~/.codex/agents/*.toml`; project agents live in `.codex/agents/*.toml`. Each file requires `name`, `description`, and `developer_instructions`, and may set normal session keys including `model`, `model_reasoning_effort`, and `sandbox_mode`:

```toml
name = "fast_explorer"
description = "Read-heavy repository exploration and evidence collection."
model = "gpt-5.6-terra"
model_reasoning_effort = "low"
sandbox_mode = "read-only"
developer_instructions = """
Trace the real code path and return concise evidence with file references.
Do not edit files.
"""
```

OpenAI recommends `gpt-5.6` for demanding, ambiguous, multi-step agents and `gpt-5.6-terra` for faster, lower-cost exploration, read-heavy scans, large-file review, and parallel supporting work. If `model` or `model_reasoning_effort` is omitted, Codex may select a cost/speed/quality balance or inherit the parent settings. See [Choosing models and reasoning for subagents](https://developers.openai.com/codex/multi-agent).

Routing is model-mediated. Codex uses the custom agent’s `description`, project or skill instructions, and the current request to decide whether to delegate. For predictable routing, explicitly name the agent and desired count in the request or put the delegation requirement in an applicable `AGENTS.md` or skill. Current local releases spawn agents after a direct request or an applicable project/skill instruction; they do not promise a user-configurable condition evaluator. See [Subagent orchestration and thread controls](https://developers.openai.com/codex/multi-agent).

### Agent count and nesting

Codex has explicit global controls:

```toml
[agents]
max_threads = 4
max_depth = 1
```

`agents.max_threads` caps concurrently open agent threads and defaults to `6`. `agents.max_depth` defaults to `1`, allowing the root to spawn direct children while preventing children from recursively spawning more. OpenAI recommends keeping the default depth unless recursive delegation is specifically needed because deeper fan-out increases token usage, latency, and local resource consumption. See [Codex subagent global settings](https://developers.openai.com/codex/multi-agent) and the [configuration reference](https://developers.openai.com/codex/config-reference).

The cap controls how many threads may stay open, not how many a prompt must spawn. Ask for an exact count when that matters, for example: “Spawn three agents: one explorer, one reviewer, and one test analyst; wait for all three.”

### Hooks and enforcement boundaries

Codex hooks receive the active model slug and support `SubagentStart` / `SubagentStop`. However, a `SubagentStart` hook can only add developer context; `continue: false` does not stop the subagent from starting. It therefore cannot enforce the model or prevent excess fan-out. A `SubagentStop` hook can request another focused pass, but that happens after the agent has already run. See the [Codex Hooks reference](https://developers.openai.com/codex/hooks).

`PreToolUse` hooks can deny supported Bash, `apply_patch`, and MCP calls, but OpenAI describes them as guardrails rather than a complete enforcement boundary because interception is incomplete and equivalent work may use another path. Permissions govern tool execution and sandbox access, not model selection. Managed requirements can pin `features.multi_agent` on or off and can restrict hooks to administrator-managed hooks, but managed model fields remain overridable defaults. See [Hooks](https://developers.openai.com/codex/hooks) and [`requirements.toml`](https://developers.openai.com/codex/config-reference).

## Claude Code

### Default main model

Set the initial model in `~/.claude/settings.json` or `.claude/settings.json`:

```json
{
  "model": "sonnet"
}
```

The `--model` flag, `ANTHROPIC_MODEL`, and `/model` can override normal user or project settings. Anthropic describes `haiku` as fast and efficient for simple tasks, `sonnet` as the daily coding model, and `opus` as the complex-reasoning model. `opusplan` uses Opus during plan mode and Sonnet for execution. Aliases update over time; use a full model ID when version pinning matters. See [Model configuration](https://code.claude.com/docs/en/model-config), [Settings](https://code.claude.com/docs/en/configuration), and the [CLI reference](https://code.claude.com/docs/en/cli-usage).

### Per-agent model routing and precedence

Personal custom subagents live in `~/.claude/agents/*.md`; project subagents live in `.claude/agents/*.md`. Their YAML frontmatter can set `model`, `effort`, tools, permissions, and `maxTurns`:

```markdown
---
name: fast-explorer
description: Use proactively for read-only repository exploration and evidence gathering
model: haiku
tools: Read, Glob, Grep
---

Trace the implementation and report concise evidence with file references.
```

Claude Code resolves a subagent model in this order:

1. `CLAUDE_CODE_SUBAGENT_MODEL`
2. The Agent tool’s per-invocation `model`
3. The subagent definition’s `model`
4. The main conversation model

Omitting `model` defaults to `inherit`. `CLAUDE_CODE_SUBAGENT_MODEL` applies to all subagents, agent-team teammates, and workflow agents, so setting it to `haiku` is a simple global cost control but disables role-specific model routing. Use per-agent frontmatter instead when different roles need different models. See [Choose a subagent model](https://code.claude.com/docs/en/sub-agents) and [model environment variables](https://code.claude.com/docs/en/model-config).

Claude automatically delegates based on the request, an agent’s `description`, and current context. A natural-language request generally delegates but remains a model decision; `@`-mentioning a custom agent guarantees that specific agent runs for the task. `claude --agent <name>` or the `agent` setting runs the entire session under that agent definition. See [Invoke subagents explicitly](https://code.claude.com/docs/en/sub-agents).

Agent-team teammates support an exact natural-language count and model, for example “Spawn 4 teammates … Use Sonnet for each teammate.” Teammates do not inherit the lead’s `/model` selection by default; the Default teammate model can be configured, and reusable subagent definitions carry their `model` and tool allowlist into teammates. See [Agent teams](https://code.claude.com/docs/en/agent-teams).

### Agent count and nesting

Anthropic documents no hard limit on agent-team teammates, but recommends starting with `3-5`; cost scales linearly, coordination overhead rises, and returns diminish. The team count can be requested explicitly in the prompt. See [Choose an appropriate team size](https://code.claude.com/docs/en/agent-teams).

The official settings and subagent references do not document a user-configurable concurrency cap equivalent to Codex `agents.max_threads`. Nested subagents are allowed up to five levels, and that depth limit is fixed and not configurable. Prevent a specific agent from nesting by omitting `Agent` from its tools or adding `Agent` to `disallowedTools`. See [Spawn nested subagents](https://code.claude.com/docs/en/sub-agents).

### Permissions, hooks, and hard enforcement

Permissions can strictly constrain which subagents an agent may spawn. An agent running as the main thread can use `tools: Agent(worker, researcher), Read, Bash` as an allowlist. Omitting `Agent` prevents spawning, and permission deny rules can block selected agent types. This controls agent type, not the count or model. See [Restrict which subagents can be spawned](https://code.claude.com/docs/en/sub-agents).

`SubagentStart` hooks cannot block subagent creation; they can only inject context. Hook input does not provide a general mechanism to rewrite the selected model. Therefore hooks can audit or remind, but should not be treated as the model router. See the [Hooks reference](https://code.claude.com/docs/en/hooks).

For organization-level model enforcement, use managed settings:

```json
{
  "model": "haiku",
  "availableModels": ["haiku", "sonnet"],
  "enforceAvailableModels": true,
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "<pinned-haiku-model-id>",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "<pinned-sonnet-model-id>"
  }
}
```

`availableModels` applies to main sessions, aliases, subagent frontmatter, per-invocation models, `CLAUDE_CODE_SUBAGENT_MODEL`, skills, commands, and background agents. `enforceAvailableModels: true` is necessary to make the Default picker option obey a non-empty allowlist. Managed settings have the highest precedence and cannot be overridden even by command-line arguments. Normal user/project settings are preferences, not hard policy. See [Restrict model selection](https://code.claude.com/docs/en/model-config) and [settings precedence](https://code.claude.com/docs/en/configuration).

## General native setup

For a personal setup that favors small-model workers without sacrificing difficult reasoning:

- Keep the orchestrator capable enough to decompose and validate work. Use a balanced main model rather than forcing the smallest model everywhere.
- Define `fast_explorer`, `fast_implementer`, and `deep_reviewer` roles. Route the first two to the efficient model at low or medium effort; reserve the stronger model and high effort for ambiguity, security, architecture, and final verification.
- Default to one agent for small tasks, two or three for independent research/review lanes, and three to five only when the work is genuinely parallel.
- Keep recursive spawning off: Codex `max_depth = 1`; Claude agents omit the `Agent` tool unless they are intentionally coordinators.
- Request exact roles and counts when reproducibility matters. Treat agent descriptions and general instructions as routing guidance, not a scheduler.
- Only set Claude Code `effort` when the selected model supports it. The current Haiku model does not support the effort parameter, so omit the field for Haiku agents rather than writing an ineffective override. See Anthropic's [Effort model support](https://platform.claude.com/docs/en/build-with-claude/effort).
- Do not set `CLAUDE_CODE_SUBAGENT_MODEL` if role-specific routing is desired. Set it only when the requirement is “all delegated work must use this one model.”
- Use hooks for deterministic validation and auditing, not model choice. Use managed allowlists only when policy enforcement is actually required.

This gives a cost-conscious default while preserving a deliberate escalation path. A “small model everywhere” configuration is simpler, but it also makes the smallest model responsible for decomposition, conflict resolution, and judging when escalation is needed—the work most likely to benefit from a stronger orchestrator.

## Selected dotfiles configuration

The personal dotfiles use one permissive light-work role per product rather than a multi-tier router:

- Shared instructions prefer the light agent for bounded, independent, low-risk work, start with one agent, and allow two or three only for genuinely independent lanes.
- Codex uses `light-worker` with `gpt-5.6-luna` at `max` reasoning effort.
- Claude Code uses `light-worker` with the rolling `haiku` alias and no effort override because the current Haiku model does not support the effort parameter.
- The main agent remains responsible for decomposition, integration, risk assessment, and final verification.
