import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export type DesktopTitle = { title: string | null; source: "auto" | "tool" | "user" | null };
export type DesktopSession = { readTitle: (id: string) => Promise<DesktopTitle | undefined> };

const environmentSchema = z.object({
  CLAUDE_CODE_ACCOUNT_UUID: z.uuid(),
  CLAUDE_CODE_ORGANIZATION_UUID: z.uuid(),
  CLAUDE_CODE_HOST_SESSION_ID: z.string().regex(/^local_[0-9a-f-]{36}$/),
});
// The app's own record, read as untrusted data. Unknown sources fail closed.
const recordSchema = z.object({
  cliSessionId: z.string(),
  title: z.string().nullish(),
  titleSource: z.enum(["auto", "tool", "user"]).nullish(),
});

// The desktop app launches the CLI with this entrypoint; hooks inherit its environment.
export function desktopSession(environment = process.env, root = join(homedir(), "Library/Application Support/Claude")): DesktopSession | null {
  if (environment["CLAUDE_CODE_ENTRYPOINT"] !== "claude-desktop") return null;
  return { readTitle: (id) => readDesktopTitle(environment, root, id) };
}

// Title provenance lives only in the app's session record, which is not a
// documented interface. Any missing or unrecognized record is unavailable.
async function readDesktopTitle(environment: NodeJS.ProcessEnv, root: string, id: string): Promise<DesktopTitle | undefined> {
  const ids = environmentSchema.safeParse(environment);
  if (!ids.success) return undefined;
  const path = join(root, "claude-code-sessions", ids.data.CLAUDE_CODE_ACCOUNT_UUID, ids.data.CLAUDE_CODE_ORGANIZATION_UUID, ids.data.CLAUDE_CODE_HOST_SESSION_ID + ".json");
  let text;
  try { text = await readFile(path, "utf8"); }
  catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
  let value: unknown;
  try { value = JSON.parse(text); } catch { return undefined; }
  const record = recordSchema.safeParse(value);
  if (!record.success || record.data.cliSessionId !== id) return undefined;
  return { title: record.data.title ?? null, source: record.data.titleSource ?? null };
}
