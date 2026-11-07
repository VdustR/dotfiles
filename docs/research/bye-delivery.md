# BYE delivery and preservation

## Decision

A completion reminder needs both the requested delivery state and evidence that
the result remains findable and usable after the session's temporary worktree
is unavailable. Neither requirement substitutes for the other. The operative
rule lives in [BYE Intent](../../home/.agents/AGENTS.md#bye-intent).

The reported failure was a completion reminder after local testing, followed by
the discovery that the changes had not been committed, pushed, or submitted as
a PR. The user's correction also covers local commits that remain stranded in
a session worktree. This does not establish that any particular client's
archive operation always deletes its worktree; the relevant risk is dependence
on a session that the user is being encouraged to stop retaining or revisiting.

The previous rule at `f3994b2` required verification and delivery but did not
define preservation or retrieval. A local-only task could therefore appear
complete while its only result remained in the temporary worktree. A clean
Git status could reinforce that mistake after a local commit. Those are the
discriminating cases; adding only another instruction to verify completion
would leave the same ambiguity.

| Option | Effect | Decision |
| --- | --- | --- |
| Remove proactive reminders | Avoids premature prompts, but loses the requested completion cue and does not fix an explicit closeout verdict | Reject |
| Require delivery and independent preservation evidence | Protects reminders and closeout verdicts while retaining task-specific delivery endpoints | Choose |
| Require every change to merge | Protects some repository work but adds unauthorized delivery steps to local-only and non-code tasks | Reject |

The guard applies before reminders and readiness claims. Explicit requests to
discuss the workflow are not goodbye requests. A condition such as merge is
checked before conditional closeout, while risk and TODO conditions are
evaluated by closeout. An explicit instruction to stop despite unfinished work
is honored without claiming successful completion. The wrap-up skill itself
is outside this change.

## Manual decision walkthroughs

Performed twice on 2026-11-07, Asia/Taipei. Pass A considered whether to end a
task report with a bye reminder. Pass B restated the same task states as explicit
or conditional closeout requests, with the workflow-discussion case left as a
discussion. These are manual walkthroughs by the implementing agent, not blind
independent agent trials or measured model-compliance results.

Score the outcome and mechanism separately. An outcome passes when the action
matches the task's authority and completion state. The mechanism passes only
when preservation and the delivery endpoint are established separately, or
when the request is correctly excluded from closeout. Merely omitting the word
"bye" does not demonstrate the preservation guard.

| Case | Evidence and task state | Pass A: outcome | Pass B: outcome | Mechanism in both passes |
| --- | --- | --- | --- | --- |
| Uncommitted result | Tested change exists only in a temporary worktree; delivery not authorized | No reminder; state location and request the missing delivery decision | Do not claim ready; state the same missing decision | Unique work has no independent destination; lack of authority is not completion |
| Local commit | Local-only task; clean status and commit exist only in the temporary worktree | No reminder; establish an authorized persistent destination | Do not claim ready from clean status | Commit preserves history locally, not availability beyond the worktree |
| Remote backup only | Branch can be fetched independently; user authorized AUTO through merge | Continue through PR and merge | Complete the authorized work before conditional closeout | Preservation passes; delivery does not |
| Persistent local result | User requested local-only delivery; result verified in an agreed stable directory and its path reported | Reminder permitted | Closeout may report ready after its remaining checks | Both preservation and the requested local endpoint pass; no PR is required |
| Missing retrieval route | A purported backup exists but cannot be located or read by the recipient | No reminder; obtain retrieval evidence | Cannot confirm readiness | A claimed backup without usable retrieval does not establish preservation |
| Note in the worktree | A README names the unfinished change; both note and result are only in the temporary worktree | No reminder | Do not claim ready | Recording a location inside the same lifecycle does not preserve it independently |
| Merge complete, sync pending | User requested merge and device sync; remote merge is verified | Perform authorized sync | Do not claim ready until sync is verified | Remote preservation passes; the requested delivery endpoint is still incomplete |
| Conditional merge absent | User says "If merged, bye"; no merge and no merge authority | Report the actual state without a reminder | Do not start the conditional closeout or merge | False prerequisite and missing authority remain explicit |
| Conditional risk check | Delivery and preservation verified; user says "bye if no risk or TODO" | Reminder permitted, without asserting closeout checks passed | Run closeout and evaluate its conditions | Intent authorizes checking, not assuming a passing verdict |
| Related work elsewhere | This task's delivery is preserved and complete; independent optional work has another owner | Reminder permitted | Related work alone does not block closeout | Task ownership bounds the guard; it does not absorb unrelated work |
| Workflow discussion | User requests a redesign of bye rules | Discuss the design; do not start closeout | Same result | Mentioning the workflow is not an instruction to end the session |
| Conversational answer | User requested an explanation, with no saved artifact | Deliver the answer; no additional file is required | Answer-only delivery can pass closeout without an external copy | Preservation applies to file and artifact results; it does not manufacture a storage task |
| Explicit stop | User says to stop now and leave the work unfinished | Honor the stop and report result location and open items | Same result; do not claim task completion | Preservation checks do not authorize continuing against a stop instruction |

Both passes matched the expected outcomes and identified the separate mechanism
in every row. This demonstrates consistency of the proposed decision model,
not reliable instruction selection or execution by another agent. In
particular, the baseline text could already produce some correct outcomes by
general caution; those outcomes alone would not demonstrate the new guard.

## Executed filesystem and Git check

A disposable local fixture established these observable states:

1. An untracked result existed only in the simulated session directory.
2. Committing it made `git status --short` empty; there was still no remote or
   independent result copy.
3. Pushing to a local bare repository created a retrievable `result` branch
   with the same commit; no `main` branch existed there. Preservation did not
   establish integration.
4. After copying the result to a separate destination and renaming the session
   directory, both the separate file and bare-repository branch remained
   readable. A second retrieval returned the same content and commit.

The following check reruns those distinctions without external services,
credentials, a model API, or changes to global Git configuration. Its
"persistent" directory models independence from the simulated session, not
long-term durability of the operating system's temporary directory.

```bash
python3 - <<'PY'
from pathlib import Path
from tempfile import mkdtemp
import subprocess

root = Path(mkdtemp(prefix="bye-delivery-"))
session = root / "session"
remote = root / "remote.git"
destination = root / "persistent"

def git(*args, cwd=None):
    return subprocess.check_output(
        ["git", *args], cwd=cwd, text=True, stderr=subprocess.STDOUT
    ).strip()

git("init", "-q", "-b", "main", str(session))
(session / "result.txt").write_text("Session result\n")
assert git("status", "--short", cwd=session) == "?? result.txt"
assert not destination.exists()
git("add", "result.txt", cwd=session)
git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
    "commit", "-qm", "Fixture result", cwd=session)
head = git("rev-parse", "HEAD", cwd=session)
assert not git("status", "--short", cwd=session)
assert not git("remote", cwd=session)
assert not destination.exists()

git("init", "--bare", "-q", str(remote))
git("remote", "add", "origin", str(remote), cwd=session)
git("push", "-q", "origin", "HEAD:refs/heads/result", cwd=session)
assert git("ls-remote", "origin", "refs/heads/result", cwd=session).split()[0] == head
assert not git("ls-remote", "origin", "refs/heads/main", cwd=session)
destination.mkdir()
(destination / "result.txt").write_bytes((session / "result.txt").read_bytes())
session.rename(root / "unavailable-session")
assert not session.exists()
for _ in range(2):
    assert (destination / "result.txt").read_text() == "Session result\n"
    assert git("--git-dir=" + str(remote), "show",
               "refs/heads/result:result.txt") == "Session result"
    assert git("--git-dir=" + str(remote), "rev-parse", "refs/heads/result") == head
print("PASS: local commit, independent retrieval, and integration are distinct")
print("Disposable fixture retained at", root)
PY
```

This executable check establishes the Git and file-state premises. It does not
test whether a language model follows the prose, predict a client's archive
behavior, or prove recovery after actual disk loss. No independent agent trial
was run; cross-client instruction adherence remains unverified.
