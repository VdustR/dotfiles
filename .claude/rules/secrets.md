---
globs:
  - "**/.secrets"
  - "**/.secrets.*"
  - "**/.env"
  - "**/.env.*"
description: Rules for handling secrets and sensitive environment variables
alwaysApply: false
---

# Secrets Handling (`~/.secrets`)

Assumed format: `export KEY=value` (one per line).

**Exemptions**: `.env.example`, `.env.sample`, `.env.template` and similar template files with placeholder values are NOT secrets — Read/Edit freely.

## Verifying Env Vars (minimal value exposure)

- **Existence + length**: `[ -n "${KEY+x}" ] && echo "set:${#KEY}" || echo "unset"` (length 0 = set but empty, not unset)
- **Safe partial inspection** (head/tail with masking — never prints full value):
  ```bash
  v="$(printenv "$k")"
  len=${#v}
  if [ "$len" -le 16 ]; then echo "$k: ${len} chars | ${v:0:3}…"
  else echo "$k: ${len} chars | ${v:0:4}…${v: -4}"; fi
  ```
  Use to diagnose: unexpected whitespace/newlines/quotes, wrong prefix (`sk-`, `ghp_`, `gho_`, `whsec_`), auth scheme leaked into value (`Bearer `, `Basic ` — should not be stored in env var), or value clearly from wrong source.
- **Pattern search (keys only)**: `env | cut -d= -f1 | grep -iE '<PATTERN>'` (e.g., `'_PAT$|_TOKEN$'`)
- **Pattern with length**:
  ```bash
  env | cut -d= -f1 | grep -iE '<PATTERN>' | while IFS= read -r k; do
    v="$(printenv "$k")"; echo "$k: ${#v} chars"
  done
  ```

## Writing / Updating

- **Add** (verify key absent first): `grep -q '^export KEY=' ~/.secrets || echo 'export KEY=value' >> ~/.secrets`
- **Update** (in-place, macOS only): `sed -i '' 's|^export KEY=.*|export KEY=new_value|' ~/.secrets`
- If value contains the delimiter, pick one absent from the value (`/`, `@`, `#`)
- Use Bash tool only — never Read or Edit tools on `~/.secrets` (see PROHIBITED)

## Obtaining Secrets from User

**NEVER ask the user to type, paste, or input secret values (tokens, API keys, passwords, credentials) in the conversation.**

Instead, create a tmp file for the user to fill in with their editor:

1. Create input file with instructions:
   ```bash
   (umask 077; mkdir -p "${TMPDIR:-/tmp}/.claude-secrets")
   cat > "${TMPDIR:-/tmp}/.claude-secrets/.secrets.input" <<'TEMPLATE'
   # Paste your <KEY_NAME> below this line, then save and close:
   TEMPLATE
   ```
2. Tell user to edit (suggest one):
   - `$EDITOR "${TMPDIR:-/tmp}/.claude-secrets/.secrets.input"`
   - `open -t "${TMPDIR:-/tmp}/.claude-secrets/.secrets.input"` (macOS TextEdit)
3. After user confirms saved, transfer to staging in a subshell (value doesn't leak to parent):
   ```bash
   (val=$(sed -n '/^[^#]/p' "${TMPDIR:-/tmp}/.claude-secrets/.secrets.input"); printf 'export %s=%q\n' "KEY_NAME" "$val") >> "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged" && rm -f "${TMPDIR:-/tmp}/.claude-secrets/.secrets.input"
   ```
4. Continue with staging workflow below (source, verify, persist)

**Diagnosis only** — after sourcing, only inspect via length or safe partial (see "Verifying Env Vars"). Never output the full value.

## AI-Generated Secrets (Staging Workflow)

**Staging directory & file:**
- Location: `${TMPDIR:-/tmp}/.claude-secrets/` (falls back to `/tmp` if `$TMPDIR` unset)
- File: `.secrets.staged` (same `export KEY=value` format as `~/.secrets`)
- Create with atomic permissions: `(umask 077; mkdir -p "${TMPDIR:-/tmp}/.claude-secrets")`
- Auto-cleaned on reboot (system tmpdir); may be manually cleaned: `rm -f "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged"`

**When AI obtains/generates a secret:**
1. Ensure staging dir exists: `(umask 077; mkdir -p "${TMPDIR:-/tmp}/.claude-secrets")`
2. Write to staging: `printf 'export %s=%q\n' "KEY" "value" >> "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged"`
3. Source with error check: `source "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged" || echo "staging source failed"` — if source fails, stop workflow and report error to user
4. Verify (length only): `[ -n "${KEY+x}" ] && echo "set:${#KEY}" || echo "unset"`
5. Ask user whether to persist into `~/.secrets`

**Conflict detection — before persisting, check if key exists:**
- Check: `grep -q '^export KEY=' ~/.secrets`
- If key does NOT exist → append directly (with comment)
- If key EXISTS → present 4 options, recommend the most appropriate one based on context (default: Override):

| Option | Description |
|--------|-------------|
| **Override** (default) | Keep old (commented out), add new below — safest, preserves old |
| **Add prefix** | Rename new key: `export PREFIX_KEY=value` |
| **Add suffix** | Rename new key: `export KEY_V2=value` |
| **Replace** | Overwrite old value in-place (needs extra confirmation: "old value will be lost") |

**Persist format with comment:**
```bash
# Added by Claude — <context: e.g., "GitHub CLI auth">
export KEY=value
```

For Override:
```bash
# Replaced by Claude — <context>
# export KEY=old_value
export KEY=new_value
```

Note: no timestamp needed — the comment is the only record since `~/.secrets` is not git-tracked.

**After persisting (or if user declines):**
- Reload (if persisted): `source ~/.secrets`
- Clean staging (always): `rm -f "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged"`

**Staging file rules:**
- Staging file may be read/written by AI (unlike `~/.secrets`)
- Still PROHIBITED to output values to user — staging is internal only
- Use Bash tool for all staging file operations (not Read/Edit tools)
- Note: `source` commands for staging file will appear in shell history — this is acceptable as only the file path (not values) is visible

## Browser-Extracted Values (Capture Functions)

When obtaining values from browser tools (agent-browser, Playwright, Chrome MCP, etc.), **never use values as raw literals** in commands or conversation. Use a capture-and-store pattern:

**Capture pattern — inline convention (not a separate file):**
```bash
# Declare and call in single Bash command — value never appears in output
_capture() { local k="$1" v="$2"; (umask 077; mkdir -p "${TMPDIR:-/tmp}/.claude-secrets"); printf 'export %s=%q\n' "$k" "$v" >> "${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged"; }; _capture "KEY" "extracted_value"
```

**Key principle:**
- Value must travel from browser tool → staging file in a single Bash command
- Never assign to a variable that might be printed, never echo, never split across multiple commands
- Same PROHIBITED rules apply: no `echo "$val"`, no `declare -p`, no value in output
- Assumes no `set -x` or shell debug mode active during the command

**After capture:** source and verify as per the staging workflow above, then ask user whether to persist.

**Applies to all browser-sourced values, not just secrets** — when in doubt about sensitivity, use the capture pattern.

## Reloading After Changes

- `source ~/.secrets` — no shell/Claude Code restart needed
- **One-shot** (subshell, doesn't pollute parent): `(source ~/.secrets && command)`

## PROHIBITED

- **Ask for secrets in conversation**: asking user to type, paste, or input secret values — use tmp file workflow (see "Obtaining Secrets from User")
- **Output values**: `echo "$SECRET"`, `printenv SECRET`, `printf '%s' "$SECRET"`, `declare -p SECRET` (exceptions: `printenv` inside `$()` for length check, e.g., `v="$(printenv "$k")"; echo "${#v}"`; safe partial inspection per "Verifying Env Vars" section above)
- **Read secrets file**: `cat`/`head`/`tail`/`less` or Read/Edit tool on `~/.secrets`
- **Unfiltered dump**: bare `env`, `printenv`, `export -p` (exposes all values)
- **Debug mode**: `set -x`, `bash -x` (prints variable expansions to stderr)
- **Values in output**: secret values in logs, commits, files, or non-write command arguments
- **Cross-file leak**: copying secrets to `.env`, config files, or any tracked file
  - Exception: `${TMPDIR:-/tmp}/.claude-secrets/.secrets.staged` is the only allowed intermediate file
