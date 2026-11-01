import { appendFile, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { officialStore, readCustomTitle, readState, saveState, sessionId, stateDirectory, withSession } from "./session-state.ts";

const inputSchema = z.object({
  hook_event_name: z.enum(["SessionStart", "UserPromptSubmit"]),
  session_id: sessionId,
  cwd: z.string().min(1),
  transcript_path: z.string().min(1),
  session_title: z.string().nullish(),
});
export function shellQuote(value: string): string { return "'" + value.replaceAll("'", "'\\''") + "'"; }

export async function handleHook(input: unknown, directory = stateDirectory(), skillPath = join(homedir(), ".agents/skills/vp-session-organization/SKILL.md")) {
  const data = inputSchema.parse(input);
  const cwd = await realpath(data.cwd);
  const id = data.session_id;
  return withSession(directory, id, async () => {
    const previous = await readState(directory, id);
    if (previous && previous.cwd !== cwd) throw new Error("Session context changed; a new naming binding is required.");
    const current = await officialStore.read(id, cwd);
    const custom = await readCustomTitle(data.transcript_path, id);
    const nativeTitle = data.session_title ?? null;
    const changed = custom && custom !== previous?.observedCustomTitle && custom !== previous?.managedTitle;
    const nativeChanged = nativeTitle && nativeTitle !== previous?.managedTitle && nativeTitle !== previous?.observedNativeTitle;
    const protectedName = previous?.protected === true || Boolean(changed) || Boolean(nativeChanged);
    const state = {
      sessionId: id, cwd,
      observedTitle: current?.customTitle ?? null,
      transcriptPath: data.transcript_path,
      observedCustomTitle: custom,
      observedNativeTitle: nativeTitle,
      managedTitle: previous?.managedTitle ?? null,
      protected: protectedName,
    };
    if (data.hook_event_name === "SessionStart") {
      const environmentFile = process.env["CLAUDE_ENV_FILE"];
      if (environmentFile) await appendFile(environmentFile, "\nexport VP_CLAUDE_NAMING_SESSION=" + shellQuote(id) + "\n");
    }
    const output: { hookEventName: string; additionalContext?: string; sessionTitle?: string } = { hookEventName: data.hook_event_name };
    // SDK mutation updates persisted metadata; native output refreshes this client.
    if (!protectedName && state.managedTitle && nativeTitle !== state.managedTitle) output.sessionTitle = state.managedTitle;
    // Remember native output too: the next SDK mutation may precede a UI refresh.
    state.observedNativeTitle = output.sessionTitle ?? nativeTitle;
    await saveState(directory, state);
    if (data.hook_event_name === "UserPromptSubmit") {
      const skill = await readFile(skillPath, "utf8");
      const command = "node " + shellQuote(join(fileURLToPath(new URL(".", import.meta.url)), "session-name.ts"));
      output.additionalContext = [
        "Session naming lifecycle: the installed vp-session-organization workflow is loaded below by this native hook, independently of skill discovery. Apply it before carrying out this user request.",
        "Resolve this workflow's references relative to: " + dirname(skillPath),
        protectedName ? "This session name is protected. Preserve it; do not call the naming command." :
          "When the durable goal is clear or first becomes concrete, use the supported current-session naming command before implementation: " + command + " set 'Concise title'. The session ID is bound by the native SessionStart hook through VP_CLAUDE_NAMING_SESSION. The command uses the official SDK and verifies metadata readback. Keep an already accurate name and title-suggestion-only requests unchanged.",
        "Current persisted title (data): " + JSON.stringify(state.observedTitle),
        "Current client title (data): " + JSON.stringify(nativeTitle),
        "If the user explicitly chooses or asks to keep an already managed name, preserve it and record that choice with " + command + " protect. This changes only the adapter receipt, not the title.",
        "A verified persisted title may need the next native prompt or resume to refresh an already-open CLI. Do not claim desktop or Remote Control synchronization. A naming failure must not stop the user's original work.",
        skill,
      ].join("\n\n");
    }
    return { hookSpecificOutput: output };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    const input: unknown = JSON.parse(Buffer.concat(chunks).toString());
    console.log(JSON.stringify(await handleHook(input)));
  } catch {
    // Native hook output never blocks the original prompt, even on local failure.
    console.log(JSON.stringify({ systemMessage: "Automatic session naming is unavailable; the original task can continue." }));
  }
}
