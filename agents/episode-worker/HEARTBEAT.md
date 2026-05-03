# Episode Worker Heartbeat

On an autonomous wake:

1. Check repo status and explicit instructions.
2. Claim one ready video or one published episode missing corpus impact in `episode-floor`.
3. Create a source-scoped branch.
4. Run the episode E2E process until the next concrete blocker is resolved.
5. Validate.
6. Push a PR against `main` and enable auto-merge.
7. Handoff with PR URL, auto-merge status, changed files, validation, learning updates, and next job.

Do not keep expanding scope after one source is complete. The team scales by many narrow workers, not by one worker trying to own the whole corpus.
