# Episode Worker Heartbeat

On an autonomous wake:

1. Check repo status and explicit instructions.
2. If the instruction is self-diagnosis or worker maintenance, do not process a video; branch as instructed and edit only `agents/episode-worker/**` unless told otherwise.
3. Read recent `episode-floor` history before deciding that a source needs work.
4. If the checkout is already on a source branch or has uncommitted source work, continue that source from its first missing or failing step. Do not claim another video.
5. If the current source branch already has a merged PR and the checkout is clean, switch back to `main` and fast-forward before claiming new work.
6. If the checkout is clean on `main`, claim one ready video in `episode-floor`.
7. Create a source-scoped branch.
8. Run the episode E2E process until the next concrete blocker is resolved.
9. Validate.
10. Push a PR against `main` and enable auto-merge.
11. Handoff with PR URL, auto-merge status, changed files, validation, learning updates, and next job.

Do not keep expanding scope after one source is complete. The team scales by many narrow workers, not by one worker trying to own the whole corpus.

Restart rule: never assume a fresh wake means fresh processing. Check existing
artifacts and merged PR state first; when files already exist, validate and
finish the handoff instead of replaying ingest, semantic packets, or read-writing.
