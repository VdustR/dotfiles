import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyTitle, protectName, readCustomTitle, readState, saveState, withSession } from "../session-state.ts";
import type { SessionState, SessionStore } from "../session-state.ts";
import { mergeHooks } from "../install.ts";
import { handleHook, shellQuote } from "../hook.ts";
import { desktopSession } from "../desktop-session.ts";
import type { DesktopSession, DesktopTitle } from "../desktop-session.ts";

async function scratch(action: (directory: string, state: SessionState) => Promise<void>) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "session-naming-")));
  const id = randomUUID();
  const state = { sessionId: id, cwd: directory, observedTitle: "Checkout options", observedCustomTitle: "Checkout options", observedNativeTitle: "Checkout options", transcriptPath: join(directory, id + ".jsonl"), managedTitle: "Checkout options", surface: "cli", protectedBy: null } satisfies SessionState;
  await writeFile(state.transcriptPath, JSON.stringify({ type: "custom-title", sessionId: id, customTitle: "Checkout options" }) + "\n");
  await saveState(directory, state);
  try { await action(directory, state); } finally { await rm(directory, { recursive: true, force: true }); }
}

test("rename uses exact bound identity and confirms the persisted title", async () => {
  await scratch(async (directory, state) => {
    let title = "Checkout options";
    const store: SessionStore = {
      read: async (id, cwd) => { assert.equal(id, state.sessionId); assert.equal(cwd, state.cwd); return { customTitle: title }; },
      rename: async (_id, next) => { title = next; },
    };
    assert.deepEqual(await applyTitle(directory, state.sessionId, "Implement checkout retries", store), { status: "verified", title: "Implement checkout retries" });
    assert.equal((await readState(directory, state.sessionId))?.managedTitle, title);
  });
});

test("a protected name cannot reach the mutation boundary", async () => {
  await scratch(async (directory, state) => {
    await saveState(directory, { ...state, protectedBy: "observed" });
    const store: SessionStore = { read: async () => { throw new Error("Unexpected access"); }, rename: async () => { throw new Error("Unexpected mutation"); } };
    await assert.rejects(applyTitle(directory, state.sessionId, "Other", store), /protected/);
  });
});

test("an explicit keep request protects a previously managed name without a title write", async () => {
  await scratch(async (directory, state) => {
    await protectName(directory, state.sessionId);
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "request");
    assert.equal(await readCustomTitle(state.transcriptPath, state.sessionId), "Checkout options");
  });
});

test("intervening user changes remain observable and become protected", async () => {
  await scratch(async (directory, state) => {
    await writeFile(state.transcriptPath, JSON.stringify({ type: "custom-title", sessionId: state.sessionId, customTitle: "My notebook" }) + "\n");
    const store: SessionStore = { read: async () => ({ customTitle: "My notebook" }), rename: async () => { assert.fail("Must not overwrite user edit"); } };
    await assert.rejects(applyTitle(directory, state.sessionId, "Other", store), /name changed/);
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "observed");
  });
});

test("a background AI title is not mistaken for an intervening user rename", async () => {
  await scratch(async (directory, state) => {
    await writeFile(state.transcriptPath, JSON.stringify({ type: "ai-title", sessionId: state.sessionId, aiTitle: "AI opening title" }) + "\n");
    await saveState(directory, { ...state, observedTitle: null, observedCustomTitle: null, managedTitle: null });
    let title = "AI opening title";
    const store: SessionStore = { read: async () => ({ customTitle: title }), rename: async (_id, next) => { title = next; } };
    await applyTitle(directory, state.sessionId, "Implement checkout retries", store);
    assert.equal(title, "Implement checkout retries");
  });
});

test("malformed provenance and an unrelated transcript fail instead of suppressing errors", async () => {
  await scratch(async (_directory, state) => {
    await writeFile(state.transcriptPath, '{"type":"custom-title","customTitle":');
    await assert.rejects(readCustomTitle(state.transcriptPath, state.sessionId));
    await assert.rejects(readCustomTitle(state.transcriptPath, randomUUID()), /does not match/);
  });
});

test("a successful dispatch without matching readback is not recorded as verified", async () => {
  await scratch(async (directory, state) => {
    const store: SessionStore = { read: async () => ({ customTitle: "Checkout options" }), rename: async () => {} };
    await assert.rejects(applyTitle(directory, state.sessionId, "New goal", store), /readback/);
    assert.equal((await readState(directory, state.sessionId))?.managedTitle, "Checkout options");
  });
});

test("valid names survive no-op writes while invalid IDs and control characters fail", async () => {
  await scratch(async (directory, state) => {
    const store: SessionStore = { read: async () => ({ customTitle: "Checkout options" }), rename: async () => { assert.fail("Already correct"); } };
    await applyTitle(directory, state.sessionId, "Checkout options", store);
    await assert.rejects(applyTitle(directory, "../other", "Title", store));
    await assert.rejects(applyTitle(directory, state.sessionId, "Title\nOther", store));
  });
});

test("same-session operations serialize and release ownership after failure", async () => {
  await scratch(async (directory, state) => {
    await withSession(directory, state.sessionId, async () => {
      await assert.rejects(withSession(directory, state.sessionId, async () => {}), /already active/);
    });
    await assert.rejects(withSession(directory, state.sessionId, async () => { throw new Error("Failure"); }), /Failure/);
    await withSession(directory, state.sessionId, async () => {});
  });
});

test("an exited process's lock can be recovered", async () => {
  await scratch(async (directory, state) => {
    const child = spawnSync(process.execPath, ["-e", ""]);
    await writeFile(join(directory, state.sessionId + ".lock"), JSON.stringify({ pid: child.pid }));
    await withSession(directory, state.sessionId, async () => {});
  });
});

test("installer preserves existing controls and unrelated hooks and is idempotent", () => {
  const before = { permissions: { deny: ["Bash(rm *)"] }, env: { EXAMPLE: "value" }, hooks: { Stop: [{ hooks: [{ type: "command", command: "existing-control" }] }] } };
  const after = mergeHooks(before);
  assert.deepEqual(after["permissions"], before.permissions);
  assert.deepEqual(after["env"], before.env);
  assert.deepEqual(mergeHooks(after), after);
  const hooks = after["hooks"];
  assert.ok(hooks && typeof hooks === "object" && "Stop" in hooks);
  assert.deepEqual(hooks.Stop, before.hooks.Stop);
});

test("native explicit names are protected without a metadata write", async () => {
  await scratch(async (directory) => {
    const id = randomUUID();
    const skill = join(directory, "SKILL.md");
    await writeFile(skill, "# Naming workflow\nPreserve explicit names.");
    const result = await handleHook({ hook_event_name: "UserPromptSubmit", session_id: id, cwd: directory, transcript_path: join(directory, id + ".jsonl"), session_title: "User notebook" }, directory, skill, null);
    assert.equal(result.hookSpecificOutput.sessionTitle, undefined);
    assert.match(result.hookSpecificOutput.additionalContext ?? "", /name is protected/);
    assert.equal((await readState(directory, id))?.protectedBy, "observed");
  });
});

test("a stale native title refreshes an SDK-managed name instead of protecting the stale value", async () => {
  await scratch(async (directory, state) => {
    await saveState(directory, { ...state, managedTitle: "Implement retries", observedTitle: "Implement retries", observedCustomTitle: "Implement retries" });
    await writeFile(state.transcriptPath, JSON.stringify({ type: "custom-title", sessionId: state.sessionId, customTitle: "Implement retries" }) + "\n");
    const skill = join(directory, "SKILL.md");
    await writeFile(skill, "# Naming workflow");
    const result = await handleHook({ hook_event_name: "UserPromptSubmit", session_id: state.sessionId, cwd: directory, transcript_path: state.transcriptPath, session_title: "Checkout options" }, directory, skill, null);
    assert.equal(result.hookSpecificOutput.sessionTitle, "Implement retries");
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, null);
  });
});

test("a new native user choice stays protected even before its transcript record arrives", async () => {
  await scratch(async (directory, state) => {
    const skill = join(directory, "SKILL.md");
    await writeFile(skill, "# Naming workflow");
    const result = await handleHook({ hook_event_name: "UserPromptSubmit", session_id: state.sessionId, cwd: directory, transcript_path: state.transcriptPath, session_title: "User-selected notebook" }, directory, skill, null);
    assert.equal(result.hookSpecificOutput.sessionTitle, undefined);
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "observed");
  });
});

test("malformed hook input cannot block the original prompt", () => {
  const path = fileURLToPath(new URL("../hook.ts", import.meta.url));
  const run = spawnSync(process.execPath, [path], { input: "{invalid", encoding: "utf8" });
  assert.equal(run.status, 0);
  const result: unknown = JSON.parse(run.stdout);
  assert.ok(result && typeof result === "object" && "systemMessage" in result);
  assert.equal("decision" in result, false);
});

test("shell quoting preserves literal dollar signs, backticks, and apostrophes", () => {
  const input = "a'b$(touch nope)`value`";
  const run = spawnSync("sh", ["-c", "printf %s " + shellQuote(input)], { encoding: "utf8" });
  assert.equal(run.stdout, input);
});

function fakeDesktop(title: DesktopTitle | undefined): DesktopSession {
  return { readTitle: async () => title };
}

async function desktopPrompt(directory: string, state: SessionState, desktop: DesktopSession) {
  const skill = join(directory, "SKILL.md");
  await writeFile(skill, "# Naming workflow");
  return handleHook({ hook_event_name: "UserPromptSubmit", session_id: state.sessionId, cwd: directory, transcript_path: state.transcriptPath }, directory, skill, desktop);
}

test("legacy receipts migrate without inventing keep requests", async () => {
  await scratch(async (directory, state) => {
    const { surface: _surface, protectedBy: _protectedBy, ...legacy } = state;
    const path = join(directory, state.sessionId + ".json");
    await writeFile(path, JSON.stringify({ ...legacy, managedTitle: null, protected: true }));
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "observed");
    await writeFile(path, JSON.stringify({ ...legacy, protected: true }));
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "request");
    await writeFile(path, JSON.stringify({ ...legacy, protected: false }));
    assert.deepEqual(await readState(directory, state.sessionId), { ...state });
  });
});

test("a desktop app title does not protect the session and routes renames to the app tool", async () => {
  await scratch(async (directory, state) => {
    // The app writes its generated title as a custom-title record after the first prompt.
    await saveState(directory, { ...state, managedTitle: null, observedCustomTitle: null, protectedBy: null });
    await writeFile(state.transcriptPath, JSON.stringify({ type: "custom-title", sessionId: state.sessionId, customTitle: "Auto dev" }) + "\n");
    const result = await desktopPrompt(directory, state, fakeDesktop({ title: "Auto dev", source: "auto" }));
    const context = result.hookSpecificOutput.additionalContext ?? "";
    assert.match(context, /mcp__ccd_session_mgmt__set_session_title with session_id "self"/);
    assert.match(context, /Never replace a title the user chose/);
    assert.match(context, /Current app title source \(data\): "auto"/);
    assert.doesNotMatch(context, /session-name\.ts' set/);
    assert.equal(result.hookSpecificOutput.sessionTitle, undefined);
    const saved = await readState(directory, state.sessionId);
    assert.equal(saved?.surface, "desktop");
    assert.equal(saved?.protectedBy, null);
  });
});

test("a false legacy protection clears in the desktop app but a keep request survives", async () => {
  await scratch(async (directory, state) => {
    const { surface: _surface, protectedBy: _protectedBy, ...legacy } = state;
    const path = join(directory, state.sessionId + ".json");
    await writeFile(path, JSON.stringify({ ...legacy, managedTitle: null, protected: true }));
    await desktopPrompt(directory, state, fakeDesktop({ title: "Auto dev", source: "auto" }));
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, null);
    await protectName(directory, state.sessionId);
    const result = await desktopPrompt(directory, state, fakeDesktop({ title: "Auto dev", source: "tool" }));
    assert.match(result.hookSpecificOutput.additionalContext ?? "", /name is protected/);
    assert.equal((await readState(directory, state.sessionId))?.protectedBy, "request");
  });
});

test("a user-set or unattributed desktop title is preserved", async () => {
  await scratch(async (directory, state) => {
    // The transcript still holds a title when the app record is unreadable or has lost its fields.
    for (const title of [{ title: "My notebook", source: "user" }, { title: "Nightly patrol", source: null }, { title: null, source: null }, undefined] satisfies (DesktopTitle | undefined)[]) {
      await saveState(directory, state);
      const result = await desktopPrompt(directory, state, fakeDesktop(title));
      assert.match(result.hookSpecificOutput.additionalContext ?? "", /name is protected/);
      assert.equal((await readState(directory, state.sessionId))?.protectedBy, "observed");
    }
  });
});

test("an untitled desktop session can be named even when the app record is unavailable", async () => {
  await scratch(async (directory, state) => {
    await writeFile(state.transcriptPath, "");
    for (const title of [{ title: null, source: null }, undefined] satisfies (DesktopTitle | undefined)[]) {
      const result = await desktopPrompt(directory, state, fakeDesktop(title));
      assert.match(result.hookSpecificOutput.additionalContext ?? "", /set_session_title/);
      assert.equal((await readState(directory, state.sessionId))?.protectedBy, null);
    }
  });
});

test("the SDK command refuses desktop sessions", async () => {
  await scratch(async (directory, state) => {
    await saveState(directory, { ...state, surface: "desktop" });
    const store: SessionStore = { read: async () => { throw new Error("Unexpected access"); }, rename: async () => { throw new Error("Unexpected mutation"); } };
    await assert.rejects(applyTitle(directory, state.sessionId, "Other", store), /set_session_title/);
  });
});

test("desktop title provenance is read only from the matching app record", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "session-naming-app-")));
  try {
    const id = randomUUID();
    const environment = { CLAUDE_CODE_ENTRYPOINT: "claude-desktop", CLAUDE_CODE_ACCOUNT_UUID: randomUUID(), CLAUDE_CODE_ORGANIZATION_UUID: randomUUID(), CLAUDE_CODE_HOST_SESSION_ID: "local_" + randomUUID() };
    const folder = join(root, "claude-code-sessions", environment.CLAUDE_CODE_ACCOUNT_UUID, environment.CLAUDE_CODE_ORGANIZATION_UUID);
    const path = join(folder, environment.CLAUDE_CODE_HOST_SESSION_ID + ".json");
    await mkdir(folder, { recursive: true });
    assert.equal(desktopSession({ ...environment, CLAUDE_CODE_ENTRYPOINT: "cli" }, root), null);
    const desktop = desktopSession(environment, root);
    assert.ok(desktop);
    assert.equal(await desktop.readTitle(id), undefined);
    await writeFile(path, JSON.stringify({ cliSessionId: id, title: "Auto dev", titleSource: "auto", model: "any" }));
    assert.deepEqual(await desktop.readTitle(id), { title: "Auto dev", source: "auto" });
    assert.equal(await desktop.readTitle(randomUUID()), undefined);
    await writeFile(path, JSON.stringify({ cliSessionId: id, title: "Auto dev", titleSource: "renamed" }));
    assert.equal(await desktop.readTitle(id), undefined);
    await writeFile(path, "{");
    assert.equal(await desktop.readTitle(id), undefined);
    await rm(path);
    await mkdir(path);
    assert.equal(await desktop.readTitle(id), undefined);
    const traversal = desktopSession({ ...environment, CLAUDE_CODE_HOST_SESSION_ID: "../../escape" }, root);
    assert.equal(await traversal?.readTitle(id), undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});
