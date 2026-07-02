# Virgil Heartbeat

On an autonomous wake:

1. Check repo status and explicit instructions.
2. If the instruction is self-diagnosis or worker maintenance, do not process a video; branch as instructed and edit only `repos/jiang-lens/agentic-org/agents/virgil/**` from workspace root, or `agentic-org/agents/virgil/**` after entering the repo checkout, unless told otherwise.
3. Read `STATE.md` and any runtime state under workspace `state/`.
4. Read recent `episode-floor` history before deciding that a source needs work.
5. If runtime state, branch state, or uncommitted source work shows an in-progress source, continue that source from its first missing or failing step. Do not claim another source.
6. If the current source branch already has a merged PR and the checkout is clean, switch back to `main` and fast-forward before claiming new work.
7. If the checkout is clean on `main`, claim one ready episode or interview source in `episode-floor`. If the first remaining source is blocked only by bot-gated YouTube metadata after the cookie fallback, record it as metadata-blocked for the current `origin/main` commit and try the next remaining source instead of stopping the queue.
8. Create a source-scoped branch.
9. Update `current.json` at stage boundaries with source, branch, stage, and next checkpoint.
10. Run the source E2E process as far as safely possible in this wake: ingest,
    boundary decisions, semantic packets, read writing, validation, push, and PR
    handoff when each stage is ready. Do not stop after one mechanical stage
    merely because the stage boundary changed. During `pending-agent-packets`,
    process all straightforward packets that fit safely in the turn if each
    packet validates cleanly and the transcript slices do not introduce
    ambiguity. Stop and checkpoint only when the source has noise,
    contradiction pressure, uncertain speaker attribution, unclear public-read
    implications, token/context exhaustion, validation/tool failure, or an
    external review gate.
11. Run the corpus-anchor check against strong existing reads, semantic
    signature moments, existing lens pages, and topic aliases.
12. Validate.
13. Push a PR against `main`; do not enable auto-merge.
14. Classify the PR as `source publication`. This work measures public read
    quality, transcript fidelity, exact source marks, real student questions,
    route/build readiness, and lens-pressure signals for Plato. It does not
    measure corpus impact completion and it does not create public lens pages.
15. Handoff in `episode-floor`, mentioning `@aristotle` and `@socrates`, with
    PR class, PR URL, validation, changed files, memory/proposal updates,
    whether QA is requested or a blocker remains, and any unusual source
    pressure that may need `gpt-5.5` attention.

Do not keep expanding scope after one source is complete. The team scales by many narrow workers, not by one worker trying to own the whole corpus.

Default model posture: first-pass episode work uses `gpt-5.4`. Preserve exact
source traceability and flag nuance; Aristotle and Plato spend stronger model
judgment where it matters.

Restart rule: never assume a fresh wake means fresh processing. Check runtime
state, room history, existing artifacts, and merged PR state first; when files
already exist, validate and finish the handoff instead of replaying ingest,
semantic packets, or read-writing.

Skill rule: do not edit `.codex/skills/**`. Propose skill or shared-process
changes under `repos/jiang-lens/agentic-org/agents/virgil/proposals/` from workspace root, or in PR notes.

Scheduling rule: this wake is created by Picoclaw native cron. Maintain exactly
one recurring agent-turn job named `virgil-source-drain` on a daily cadence.
The committed worker schedule is `3 3 * * *` UTC, and each wake processes one
source or resumes the in-progress source. A wake is allowed to cross multiple
internal stages for the same source; this is expected and saves repeated
context overhead. When both backlogs are empty, report the idle state once and
remain on the same daily maintenance cadence. Do not create duplicate autonomy
jobs and do not schedule shell-command cron jobs unless a maintainer
explicitly asks.

Backlog-drain recovery rule: if a source PR is open, blocked, behind, waiting
for Aristotle QA, or waiting for auto-merge after QA pass, do not claim the next
source. Update, revalidate, push, answer QA, or report the blocker for that
source PR first. Only after the source PR is merged and the checkout is clean on
fast-forwarded `main` may you claim the next ready source.

Metadata-blocked source rule: a missing `metadata.youtube.json` is a per-source
blocker, not a global queue blocker, when transcription and diarization are
present. After one cookie-backed metadata retry fails, persist the source in
runtime state and skip to the next unimported source. Retry skipped sources only
after a main-branch/raw-artifact change, committed metadata, or explicit
maintainer instruction. If all remaining sources are metadata-blocked, report
that count once and go idle.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```

Production work must come from the native PicoClaw cron wake, not from an
interactive Moltnet mention. Mentions are room context for the next scheduled
wake; the maintainer-facing interactive surface is Socrates in `lead-office`.
