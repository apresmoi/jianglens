# Episode Worker Heartbeat

On an autonomous wake:

1. Check repo status and explicit instructions.
2. If the instruction is self-diagnosis or worker maintenance, do not process a video; branch as instructed and edit only `repos/jiang-lens/agentic-org/agents/episode-worker/**` from workspace root, or `agentic-org/agents/episode-worker/**` after entering the repo checkout, unless told otherwise.
3. Read `STATE.md` and any runtime state under workspace `state/`.
4. Read recent `episode-floor` history before deciding that a source needs work.
5. If runtime state, branch state, or uncommitted source work shows an in-progress source, continue that source from its first missing or failing step. Do not claim another source.
6. If the current source branch already has a merged PR and the checkout is clean, switch back to `main` and fast-forward before claiming new work.
7. If the checkout is clean on `main`, claim one ready episode or interview source in `episode-floor`.
8. Create a source-scoped branch.
9. Update `current.json` at stage boundaries with source, branch, stage, and next checkpoint.
10. Run the source E2E process until the next concrete blocker is resolved.
11. Validate.
12. Push a PR against `main` and enable auto-merge.
13. Handoff in `episode-floor`, mentioning `@socrates`, with PR URL, auto-merge status, changed files, validation, memory/proposal updates, and next job.

Do not keep expanding scope after one source is complete. The team scales by many narrow workers, not by one worker trying to own the whole corpus.

Restart rule: never assume a fresh wake means fresh processing. Check runtime
state, room history, existing artifacts, and merged PR state first; when files
already exist, validate and finish the handoff instead of replaying ingest,
semantic packets, or read-writing.

Skill rule: do not edit `.codex/skills/**`. Propose skill or shared-process
changes under `repos/jiang-lens/agentic-org/agents/episode-worker/proposals/` from workspace root, or in PR notes.

Scheduling rule: this wake is created by Picoclaw native cron. Maintain exactly
one recurring agent-turn job named `episode-worker-daily`; the default cadence
is once per day. You may adjust your own cron cadence when the corpus state
justifies it, but do not create duplicate autonomy jobs and do not schedule
shell-command cron jobs unless a maintainer explicitly asks.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```
