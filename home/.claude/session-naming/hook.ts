import { appendFile, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { desktopSession } from "./desktop-session.ts";
import type { DesktopSession, DesktopTitle } from "./desktop-session.ts";
import { officialStore, readCustomTitle, readState, saveState, sessionId, stateDirectory, withSession } from "./session-state.ts";
import type { SessionState } from "./session-state.ts";

const inputSchema = z.object({
  hook_event_name: z.enum(["SessionStart", "UserPromptSubmit"]),
  session_id: sessionId,
  cwd: z.string().min(1),
  transcript_path: z.string().min(1),
  session_title: z.string().nullish(),
});
export function shellQuote(value: string): string { return "'" + value.replaceAll("'", "'\\''") + "'"; }

// The app writes every title, including its own generated one, as a custom-title
// record, so only the app's title source can identify a user-set name.
function desktopProtection(previous: SessionState | undefined, app: DesktopTitle | undefined, custom: string | null): SessionState["protectedBy"] {
  if (previous?.protectedBy === "request") return "request";
  if (app?.source === "auto" || app?.source === "tool") return null;
  // A user source, or a title of unknown origin, fails closed.
  if (app?.source === "user" || (app?.title ?? custom) !== null) return "observed";
  return null;
}

export async function handleHook(input: unknown, directory = stateDirectory(), skillPath = join(homedir(), ".agents/skills/vp-session-organization/SKILL.md"), desktop: DesktopSession | null = desktopSession()) {
  const data = inputSchema.parse(input);
  const cwd = await realpath(data.cwd);
  const id = data.session_id;
  return withSession(directory, id, async () => {
    const previous = await readState(directory, id);
    if (previous && previous.cwd !== cwd) throw new Error("Session context changed; a new naming binding is required.");
    const current = await officialStore.read(id, cwd);
    const custom = await readCustomTitle(data.transcript_path, id);
    const nativeTitle = data.session_title ?? null;
    const app = desktop ? await desktop.readTitle(id) : undefined;
    let protectedBy: SessionState["protectedBy"];
    if (desktop) protectedBy = desktopProtection(previous, app, custom);
    else {
      const changed = custom && custom !== previous?.observedCustomTitle && custom !== previous?.managedTitle;
      const nativeChanged = nativeTitle && nativeTitle !== previous?.managedTitle && nativeTitle !== previous?.observedNativeTitle;
      protectedBy = previous?.protectedBy ?? (changed || nativeChanged ? "observed" : null);
    }
    const state: SessionState = {
      sessionId: id, cwd,
      surface: desktop ? "desktop" : "cli",
      observedTitle: current?.customTitle ?? null,
      transcriptPath: data.transcript_path,
      observedCustomTitle: custom,
      observedNativeTitle: nativeTitle,
      managedTitle: previous?.managedTitle ?? null,
      protectedBy,
    };
    if (data.hook_event_name === "SessionStart") {
      const environmentFile = process.env["CLAUDE_ENV_FILE"];
      if (environmentFile) await appendFile(environmentFile, "\nexport VP_CLAUDE_NAMING_SESSION=" + shellQuote(id) + "\n");
    }
    const output: { hookEventName: string; additionalContext?: string; sessionTitle?: string } = { hookEventName: data.hook_event_name };
    // SDK mutation updates persisted metadata; native output refreshes this CLI.
    // The desktop app owns its own title, so it gets no native title output.
    if (!desktop && !protectedBy && state.managedTitle && nativeTitle !== state.managedTitle) output.sessionTitle = state.managedTitle;
    // Remember native output too: the next SDK mutation may precede a UI refresh.
    state.observedNativeTitle = output.sessionTitle ?? nativeTitle;
    await saveState(directory, state);
    if (data.hook_event_name === "UserPromptSubmit") {
      const skill = await readFile(skillPath, "utf8");
      const command = "node " + shellQuote(join(fileURLToPath(new URL(".", import.meta.url)), "session-name.ts"));
      const naming = desktop ? [
        protectedBy ? "This Claude desktop app session name is protected. Preserve it; do not rename it." :
          "This is a Claude desktop app session. When the durable goal is clear or first becomes concrete, rename it with the app's own tool before implementation. Load the deferred tools with ToolSearch query \"select:mcp__ccd_session_mgmt__set_session_title,mcp__ccd_session_mgmt__get_session\". First call mcp__ccd_session_mgmt__get_session with session_id \"self\". If the current app title below is not null and the returned title differs from it, someone renamed the session after this prompt began, so keep it; a title that first appears after this prompt began is the app's generated one. Otherwise call mcp__ccd_session_mgmt__set_session_title with session_id \"self\" and the concise title, then call mcp__ccd_session_mgmt__get_session with session_id \"self\" again and confirm the returned title matches; the rename tool's own success message is not readback. Do not use the session-name.ts set command here; it does not update the app. Keep an already accurate name and title-suggestion-only requests unchanged. Never replace a title the user chose, in this conversation or another one: in bypass permissions mode the app replaces it without asking.",
        "Current app title (data): " + JSON.stringify(app ? app.title : nativeTitle ?? custom),
        "Current app title source (data): " + JSON.stringify(app ? app.source : "unavailable"),
        "If the user explicitly chooses a name or asks to keep the current one, preserve it and record that choice with " + command + " protect. This changes only the adapter receipt, not the title.",
        "A naming failure must not stop the user's original work.",
      ] : [
        protectedBy ? "This session name is protected. Preserve it; do not call the naming command." :
          "When the durable goal is clear or first becomes concrete, use the supported current-session naming command before implementation: " + command + " set 'Concise title'. The session ID is bound by the native SessionStart hook through VP_CLAUDE_NAMING_SESSION. The command uses the official SDK and verifies metadata readback. Keep an already accurate name and title-suggestion-only requests unchanged.",
        "Current persisted title (data): " + JSON.stringify(state.observedTitle),
        "Current client title (data): " + JSON.stringify(nativeTitle),
        "If the user explicitly chooses or asks to keep an already managed name, preserve it and record that choice with " + command + " protect. This changes only the adapter receipt, not the title.",
        "A verified persisted title may need the next native prompt or resume to refresh an already-open CLI. Do not claim desktop or Remote Control synchronization. A naming failure must not stop the user's original work.",
      ];
      output.additionalContext = [
        "Session naming lifecycle: the installed vp-session-organization workflow is loaded below by this native hook, independently of skill discovery. Apply it before carrying out this user request.",
        "Resolve this workflow's references relative to: " + dirname(skillPath),
        ...naming,
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
