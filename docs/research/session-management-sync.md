# Session management integration verification

Observed November 13, 2026 (Asia/Taipei). Scope: personal instructions and the
Claude native naming hook, against the installed `vp-session-management` entry
point and its coordination and metadata references. No skill installation or
other repository changes are part of this delivery.

## Executed checks

The new native-prompt regression test runs the real hook subprocess twice with
a temporary home containing only the new skill path. Before the patch it failed:
the hook emitted its unavailable warning instead of workflow context. After the
patch both invocations returned the fixture workflow content through
`hookSpecificOutput.additionalContext`. This verifies the default filesystem
wiring separately from whether an agent follows the loaded instructions.

The subprocess can write naming receipts only in its temporary state directory;
its fixture has no Git repository or remote and invokes no agent. The test
removes its temporary directory afterward. It does not rename a live session.
Existing tests cover protected names, intervening edits, unavailable metadata,
CLI/desktop routing, and preservation of unrelated installer settings. Local
TypeScript checking and all 24 tests passed.

## Manual decision walkthroughs

Two passes used the following inputs. These are manual instruction reviews,
not independent agent trials or measurements of automatic skill selection.
For each pass, the mechanism was checked separately from the expected outcome:
the revised policy must state the relevant boundary, even if another instruction
could also produce the right outcome.

| Decision | First input / second input | Old policy gap or retained protection | Revised mechanism | Expected outcome in both passes |
| --- | --- | --- | --- | --- |
| Independent task | Open a separate documentation task / open a same-repository tool investigation outside current delivery | Shared ancestry did not explicitly classify responsibility | Classify by promised deliverables and completion conditions | Receiver owns acceptance and direct reporting; originator can finish its own delivery |
| Necessary subtask | Delegate a required regression fix / delegate required integration verification | Existing delivery rule already retained integration | Necessary subtasks remain coordinator obligations | Coordinator cannot close while required acceptance is pending |
| Failed bookkeeping | Rename tool times out / grouping readback is inconclusive | No explicit general skip rule; unavailable operations could become blockers | Preserve verified state, allow cheap read-only clarification, skip affected operation | Continue substantive work; no invented success or bookkeeping BYE TODO |
| Uncertain dispatch | Creation response is lost / acceptance message cannot be confirmed | Existing transfer rule required acceptance but did not explicitly prevent conflicting retries | Preserve ownership and avoid duplicate work | Do independent work; no assumed transfer or duplicate receiver |
| Context lookup | Receiver needs one hook contract / receiver needs one responsibility decision | No compact-context or next-decision retrieval rule | Give precise lookup locations and retrieve the smallest useful section | Read the relevant source and governing instructions, without front-loading all history |
| Denied substantive action | Production mutation is denied / sensitive disclosure needs approval | Existing authorization and control rules already stop these actions | Skip applies to bookkeeping; substantive obligations and controls remain | Stop affected action and retain the real delivery blocker |

The first, third, and fifth cases distinguish the newly explicit mechanisms
from the old policy. The second and sixth are regression boundaries. The fourth
checks both retained acceptance requirements and the new duplicate-work rule.
No external writes were made by these walkthroughs. Live automatic selection,
actual agent compliance with selective retrieval, and live cross-client naming
propagation remain unverified; neither the unit tests nor these walkthroughs
establish them.
