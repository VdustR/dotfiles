import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const settingsSchema = z.record(z.string(), z.unknown());
const hookGroup = z.object({ hooks: z.array(z.object({ type: z.string(), command: z.string().optional() }).passthrough()) }).passthrough();
export const command = 'node "$HOME/.claude/session-naming/hook.ts"';

export function mergeHooks(value: unknown): Record<string, unknown> {
  const settings = settingsSchema.parse(value);
  const hooks = settingsSchema.parse(settings["hooks"] ?? {});
  for (const event of ["SessionStart", "UserPromptSubmit"]) {
    const groups = z.array(z.unknown()).parse(hooks[event] ?? []);
    const found = groups.some((value) => {
      const group = hookGroup.safeParse(value);
      return group.success && group.data.hooks.some((hook) => hook.type === "command" && hook.command === command);
    });
    hooks[event] = found ? groups : [...groups, { hooks: [{ type: "command", command, timeout: 10 }] }];
  }
  return { ...settings, hooks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = join(homedir(), ".claude");
  const path = join(directory, "settings.json");
  await mkdir(directory, { recursive: true });
  let before = "{}";
  try { before = await readFile(path, "utf8"); }
  catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
  const after = JSON.stringify(mergeHooks(JSON.parse(before)), null, 2) + "\n";
  if (JSON.stringify(JSON.parse(before)) !== JSON.stringify(JSON.parse(after))) {
    const current = await readFile(path, "utf8").catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return "{}";
      throw error;
    });
    if (current !== before) throw new Error("Settings changed during installation; preserving the newer file.");
    await writeFile(path + ".session-naming-backup-" + randomUUID(), before, { mode: 0o600 });
    const temporary = path + "." + randomUUID();
    try {
      await writeFile(temporary, after, { mode: 0o600 });
      await rename(temporary, path);
    } finally {
      await unlink(temporary).catch((error: unknown) => {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      });
    }
  }
  console.log("Session naming hooks installed; existing settings and permissions preserved.");
}
