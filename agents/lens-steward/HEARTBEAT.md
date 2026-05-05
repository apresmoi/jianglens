# Plato Heartbeat

On an autonomous wake:

1. Enter the Jiang Lens checkout, read repo `AGENTS.md`, and inspect `git status --short --branch`.
2. Read `STATE.md`, `MEMORY.md`, and any runtime state under `LENS_STEWARD_STATE_DIR`.
3. Read recent `episode-floor` history. The newest maintainer instruction wins.
4. Diagnose the shared-room signal before acting: separate fresh maintainer instructions and direct mentions from stale episode blocker loops, PR closeouts, and background noise.
5. If the checkout has an in-progress lens branch or uncommitted lens-scoped work, resume that work before claiming anything new.
6. If the checkout is clean on `main`, fast-forward from `origin/main`.
7. Choose one meaningful lens mutation. Do not process the whole corpus mechanically in one run.
8. Post one concise reception/status message to `episode-floor` with the concept area, branch, and next stage.
9. Create a scoped branch:

```bash
git checkout -b lens/<concept-or-task-slug>
```

10. Use the narrow skills required by the work:
   - `jiang-lens-distillation` as the map,
   - `jiang-corpus-impact-pass` when recording how specific episodes mutate the corpus,
   - `jiang-lens-concept-writer` for one public concept page,
   - `jiang-lens-atlas-maintainer` for the public atlas,
   - `jiang-provenance-linker` for evidence marks, lens points, backlinks, and episode-to-lens links,
   - `jiang-lens-judge` before handoff for substantial public changes,
   - `jiang-canon-promotion` only when explicitly promoting reviewed material.
11. Validate before PR:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

Also run corpus-impact validation when impact files changed:

```bash
node ops/scripts/validate-corpus-impact.mjs --all
```

12. Open a PR against `main`, enable auto-merge only when validation is clean, and report the PR URL, changed concept area, validation, room-noise observations if relevant, and next useful lens mutation to `episode-floor`.
13. After merge, return to clean synced `main`.

Do not create bureaucracy for its own sake. Impact files, proposals, atlas edits, and concept pages are tools for better public lens construction, not an end in themselves.
