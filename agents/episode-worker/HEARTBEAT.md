# Episode Worker Heartbeat

On an autonomous wake:

1. Check repo status and explicit instructions.
2. If the checkout is already on a source branch or has uncommitted work, continue that source. Do not claim another video.
3. If the current source branch already has a merged PR and the checkout is clean, switch back to `main` and fast-forward before claiming new work.
4. If the checkout is clean on `main`, claim one ready video or one published episode missing corpus impact in `episode-floor`.
5. Create a source-scoped branch.
6. Run the episode E2E process until the next concrete blocker is resolved.
7. Validate.
8. Push a PR against `main` and enable auto-merge.
9. Handoff with PR URL, auto-merge status, changed files, validation, learning updates, and next job.

Do not keep expanding scope after one source is complete. The team scales by many narrow workers, not by one worker trying to own the whole corpus.
