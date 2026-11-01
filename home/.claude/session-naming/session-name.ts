import { applyTitle, protectName, sessionId, stateDirectory } from "./session-state.ts";

try {
  const [operation, title, ...extra] = process.argv.slice(2);
  const id = sessionId.parse(process.env["VP_CLAUDE_NAMING_SESSION"]);
  if (operation === "protect" && !title && extra.length === 0) {
    await protectName(stateDirectory(), id);
    console.log(JSON.stringify({ status: "protected" }));
  } else if (operation === "set" && title && extra.length === 0) {
    console.log(JSON.stringify(await applyTitle(stateDirectory(), id, title)));
  } else throw new Error("Usage: session-name.ts set 'Concise title' | protect");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Session naming failed.");
  process.exitCode = 1;
}
