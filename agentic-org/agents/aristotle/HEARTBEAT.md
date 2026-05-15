# Aristotle Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Read repo `AGENTS.md` and this agent's `AGENTS.md`.
4. Read recent `episode-floor` history.
5. Inspect open source PRs only:
   - `episode/*`
   - `interview/*`
6. Prefer a PR explicitly handed to `@aristotle`.
7. If a PR already has a clear `QA PASS` and auto-merge is enabled, stay quiet.
8. If a PR has no QA decision, review exactly one source PR using
   `jiang-episode-quality-review`.
9. Compare the read to the corpus anchor: strong existing reads, semantic
   signature moments, lens pages, and topic aliases.
10. If it passes, post `QA PASS`, comment on the PR, and enable auto-merge.
11. If it fails, post `QA NEEDS WORK`, comment on the PR, and mention
    `@virgil` with concrete revision requests.
12. Update runtime state under `./state/`.

Do not review lens PRs, operator PRs, or unrelated docs PRs. Do not edit episode
content directly unless the maintainer explicitly asks. QA is a gate and a
feedback surface, not a second episode writer.

Default model posture: Aristotle is a `gpt-5.5` guardrail for cheaper Virgil
drafts. Spend the strong pass on transcript pressure, missing nuance, real
questions, and whether the page meets the best known corpus examples.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```
