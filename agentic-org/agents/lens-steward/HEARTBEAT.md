# Plato Heartbeat

On an autonomous wake:

1. Enter the Jiang Lens checkout, read repo `AGENTS.md`, and inspect `git status --short --branch`.
2. Read `STATE.md`, `MEMORY.md`, and any runtime state under workspace `state/`.
3. Read recent `episode-floor` history. The newest maintainer instruction wins.
4. Diagnose the shared-room signal before acting: separate fresh maintainer instructions and direct mentions from stale episode blocker loops, PR closeouts, and background noise.
5. If the checkout has an in-progress lens branch or uncommitted lens-scoped work, resume that work before claiming anything new.
6. If the checkout is clean on `main`, fast-forward from `origin/main`.
7. Choose one meaningful lens mutation. Do not process the whole corpus mechanically in one run, and do not treat generated low-backlink counts as the default queue.
8. Check the recent work portfolio before choosing:
   - if the last 3 Plato PRs were provenance-only, choose concept deepening, atlas structure, a proposal, or a concept-scoped batch of several small repairs;
   - if you still choose provenance maintenance, record why it advances the lens map and why it belongs to that concept boundary;
   - if no synthesis work is ready, stop and report that instead of doing another tiny link PR.
9. Post one concise reception/status message to `episode-floor` in first person. Treat the room like a small office team room: say what you are checking, blocked on, validating, or handing off; avoid rigid dashboard labels unless they clarify the update. If the send fails, persist `room_report_pending` in runtime state before continuing.
10. Create a scoped branch:

```bash
git checkout -b lens/<concept-or-task-slug>
```

11. Use the narrow skills required by the work:
   - `jiang-lens-distillation` as the map,
   - `jiang-corpus-impact-pass` when recording how specific episodes mutate the corpus,
   - `jiang-lens-concept-writer` for one public concept page,
   - `jiang-lens-atlas-maintainer` for the public atlas,
   - `jiang-provenance-linker` for evidence marks, lens points, backlinks, and episode-to-lens links,
   - `jiang-lens-judge` before handoff for substantial public changes,
   - `jiang-canon-promotion` only when explicitly promoting reviewed material.
12. Validate before PR:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

Also run corpus-impact validation when impact files changed:

```bash
node ops/scripts/validate-corpus-impact.mjs --all
```

13. Before opening a PR for any new or renamed public lens page, verify the Starlight sidebar in `website/astro.config.mjs` includes the public navigation surface or record the intended curation boundary in the PR notes. Public concept pages should not silently become route-only pages.
14. Open a PR against `main`, enable auto-merge only when validation is clean, and report the PR URL, changed concept area, work type, validation, boundary note, room-noise observations if relevant, and next useful lens mutation to `episode-floor`, mentioning `@socrates`.
15. After merge, return to clean synced `main`.
16. Send a closeout message to `episode-floor`. If the send fails, persist `room_report_pending` in runtime state and retry it on the next wake before claiming new work.

Do not create bureaucracy for its own sake. Impact files, proposals, atlas edits, and concept pages are tools for better public lens construction, not an end in themselves.

Scheduling rule: this wake is created by Picoclaw native cron. Maintain exactly
one recurring agent-turn job named with the prefix
`jiang-lens-autonomy:lens-steward`; the default cadence is every two hours. You
may adjust your own cron cadence when corpus pressure changes, but do not create
duplicate autonomy jobs and do not schedule shell-command cron jobs unless a
maintainer explicitly asks.
