import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { basename } from "node:path";
import { getSessionInfo, renameSession } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

export const sessionId = z.uuid();
export const titleSchema = z.string().trim().min(1).max(120).regex(/^[^\p{Cc}\p{Cf}]+$/u);
export const stateSchema = z.strictObject({
  sessionId,
  cwd: z.string().min(1),
  observedTitle: z.string().nullable(),
  transcriptPath: z.string().min(1),
  observedCustomTitle: z.string().nullable(),
  observedNativeTitle: z.string().nullable(),
  managedTitle: z.string().nullable(),
  protected: z.boolean(),
});
export type SessionState = z.infer<typeof stateSchema>;
export type SessionStore = {
  read: (id: string, cwd: string) => Promise<{ customTitle?: string } | undefined>;
  rename: (id: string, title: string, cwd: string) => Promise<void>;
};
export const officialStore: SessionStore = {
  read: (id, cwd) => getSessionInfo(id, { dir: cwd }),
  rename: (id, title, cwd) => renameSession(id, title, { dir: cwd }),
};

export function stateDirectory(): string {
  return process.env["VP_SESSION_NAMING_STATE_DIR"] ?? join(homedir(), ".claude/session-naming/state");
}

// getSessionInfo.customTitle also falls back to ai-title. Read provenance only;
// all mutations remain with the official SDK. The path comes from the native hook.
export async function readCustomTitle(path: string, id: string): Promise<string | null> {
  if (basename(path) !== sessionId.parse(id) + ".jsonl") throw new Error("Transcript does not match the bound session.");
  let title: string | null = null;
  const stream = createReadStream(path, { encoding: "utf8" });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      if (!/"type"\s*:\s*"custom-title"/.test(line)) continue;
      const value: unknown = JSON.parse(line);
      const record = z.object({ type: z.literal("custom-title"), sessionId, customTitle: z.string() }).parse(value);
      if (record.sessionId === id) title = record.customTitle;
    }
  } catch (error) {
    if (!isMissing(error)) throw error;
  } finally { lines.close(); stream.destroy(); }
  return title;
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export async function readState(directory: string, id: string): Promise<SessionState | undefined> {
  try {
    const input: unknown = JSON.parse(await readFile(join(directory, sessionId.parse(id) + ".json"), "utf8"));
    return stateSchema.parse(input);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

export async function saveState(directory: string, state: SessionState): Promise<void> {
  const path = join(directory, state.sessionId + ".json");
  const temporary = path + "." + randomUUID();
  try {
    await writeFile(temporary, JSON.stringify(state) + "\n", { mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error: unknown) => { if (!isMissing(error)) throw error; });
  }
}

// Hooks and the command share only this session's receipt, serialized per ID.
export async function withSession<T>(directory: string, id: string, action: () => Promise<T>): Promise<T> {
  sessionId.parse(id);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, id + ".lock");
  let lock;
  try {
    lock = await open(path, "wx", 0o600);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
    const owner = z.object({ pid: z.number().int().positive() }).parse(JSON.parse(await readFile(path, "utf8")));
    try { process.kill(owner.pid, 0); }
    catch (ownerError) {
      if (!(ownerError instanceof Error && "code" in ownerError && ownerError.code === "ESRCH")) throw ownerError;
      await unlink(path);
      return withSession(directory, id, action);
    }
    throw new Error("Session naming is already active for this session.");
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid }));
    return await action();
  } finally {
    await lock.close();
    await unlink(path);
  }
}

export async function applyTitle(directory: string, id: string, input: string, store: SessionStore = officialStore) {
  const title = titleSchema.parse(input);
  return withSession(directory, id, async () => {
    const state = await readState(directory, id);
    if (!state || state.protected) throw new Error("The current session name is protected or has no native hook binding.");
    const current = await store.read(id, state.cwd);
    if (!current) throw new Error("The bound session was not found.");
    const actual = current.customTitle ?? null;
    const custom = await readCustomTitle(state.transcriptPath, id);
    if (custom !== state.observedCustomTitle && custom !== state.managedTitle) {
      await saveState(directory, { ...state, protected: true });
      throw new Error("The name changed after the hook ran; preserving that change.");
    }
    if (actual !== title) await store.rename(id, title, state.cwd);
    const result = await store.read(id, state.cwd);
    if (result?.customTitle !== title) throw new Error("Session title readback did not confirm the requested name.");
    await saveState(directory, { ...state, managedTitle: title, observedTitle: title, observedCustomTitle: title });
    return { status: "verified", title };
  });
}

export async function protectName(directory: string, id: string): Promise<void> {
  await withSession(directory, id, async () => {
    const state = await readState(directory, id);
    if (!state) throw new Error("No native hook binding exists for this session.");
    await saveState(directory, { ...state, protected: true });
  });
}
