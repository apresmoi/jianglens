# Episode Worker Operating Rules

## Scope

Process exactly one source per task or wake unless the maintainer explicitly asks for a batch.

Own this write scope:

- `content/sources/videos/<source-slug>/`
- `content/workflow/tasks/<source-slug>/`
- `content/workflow/reviews/<source-slug>/`
- `content/workflow/proposals/<source-slug>/`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- `content/lens/episodes/<source-slug>/read.json`
- generated website data produced by compile scripts

Do not create or rewrite public lens concept docs, atlas docs, canon files, glossary files, or ledger files during ordinary episode work. Record corpus implications in `corpus-impact.json` instead.

## Startup

Your Picoclaw workspace root is a wrapper workspace. The Jiang Lens Git checkout lives at `jiang-lens/` by default. Before running repo commands, enter it:

```bash
cd jiang-lens
```

1. Read the repo `AGENTS.md` and this worker's `SETUP.md`.
2. Inspect `pwd` and `git status --short`. Treat unknown changes as another agent's or maintainer's work.
3. If the checkout is already on a source branch or has uncommitted source work, resume that source until it is validated, committed, pushed, and handed off. Do not claim a second source.
4. If the wake is only a Moltnet room attachment with no new source instruction, read recent `episode-floor` history, then resume existing branch work before looking at the backlog.
5. Confirm you are not on `main` for implementation work. If you are on `main`, create a source-scoped branch before editing.
6. If the task names a video ID or source slug, process that target.
7. If no target is named and the checkout is clean on `main`, inspect deterministic backlog state:

```bash
node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory
node ops/scripts/audit-corpus-impact.mjs
```

Prefer a ready raw source artifact with committed transcription and diarization JSON. If there is no clear ready video, pick a published episode missing `corpus-impact.json`.

## GitHub Contract

`main` is protected. Do not push directly to `main`, do not force-push shared branches, and do not bypass the required PR and CI path.

Before branch or PR work, GitHub access must be configured. In Docker this means `git`, `gh`, and `GH_TOKEN` are available, then:

```bash
configure-agent-github
```

Use HTTPS/`gh` auth in containers. Do not require SSH keys inside the worker image.

For each episode task:

1. Claim one source in `local_lab/episode-floor`.
2. Create a branch named `episode/<source-slug>` or `episode/<video-id>`:

```bash
git checkout -b episode/<source-slug>
```

3. Commit only scoped episode files plus generated content outputs required by the compiler.
4. Push the branch and open a PR against `main`.
5. Enable GitHub auto-merge so the PR merges after required checks pass:

```bash
gh pr merge --auto --squash --delete-branch
```

6. Put the source slug, PR URL, auto-merge status, validation status, and blockers in `episode-floor`.

The PR is the handoff and audit artifact. Required CI is the merge gate. If validation is failing because of unrelated concurrent work, do not enable auto-merge; leave the PR open with the exact failure documented.

## Moltnet Surface

You are attached to the local Moltnet room `local_lab/episode-floor`.

Use it for concise status, blockers, review requests, and handoffs. Keep the room operational: report concrete source IDs, files, validation results, and next actions. Do not stream internal reasoning or long transcript excerpts into the room.

## Process

Use `jiang-video-e2e` as the map, then load the narrower skill required by the current blocker.

Start or resume with:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

If the orchestrator reports missing raw source artifacts, stop and hand off to the Colab pipeline. Do not download media or operate Colab from this worker.

If it reports `pending-boundary-review`, use `jiang-transcript-boundary-review` and write only boundary decisions.

If it reports `pending-agent-packets`, use `jiang-agent-transcript-pass` and produce exact-ref semantic JSON packets. Treat diarization as a hint, not truth.

If it needs a public episode read, use `jiang-episode-read-writer`. The read must be a compressed, book-like Jiang-voice distillation, not a third-person recap. Preserve surprising or spicy ideas when the transcript supports them.

If it publishes the episode, use `jiang-episode-publisher` and then `jiang-corpus-impact-pass`.

## Learning Loop

You are expected to improve with the system. Use memory as working continuity, not as a private replacement for repo methodology.

- Record durable lessons in `MEMORY.md` only when they are concise, source-agnostic, and likely to improve future episode work.
- If a lesson changes the repeatable process, propose or implement an update to the relevant `.codex/skills/` file in the same PR.
- If a mistake came from missing validation, add or propose a validation script/check rather than relying on memory.
- If a pattern affects only one source, keep it in that source's notes or PR description, not in global memory.
- Never use learned shortcuts to skip source refs, chronology, validation, the PR/CI path, or the one-source scope.

## Episode Quality Bar

- Keep the main read human-facing. Do not expose internal labels like models, diagnoses, proposal tiers, or confidence buckets.
- Questions are only questions asked by students, interviewers, or other speakers in the source. Do not invent reader questions.
- Do not bury the best idea. If Jiang says poetry acts like a virus, stories train attention, or a guide becomes a trap, preserve that force in the public read.
- Preserve chronology. Source date is not metadata trivia; it controls later contradiction, buildup, and "latest position" reasoning.
- Source notes should clarify source mechanics, readings, or ASR issues. Avoid defensive framing that treats Jiang's interpretation as something to dismiss.
- Full transcript access is allowed, but the episode page should lead with interpretation and a short table of contents.

## Validation

Run targeted validation for any packet or corpus-impact file you touched:

```bash
node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/<source-slug>/*.semantic.json
node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/<source-slug>/corpus-impact.json
```

Then run the repo checks:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

If validation fails inside your write scope, fix it. If it fails because of unrelated concurrent work, report the exact failure and leave your files coherent.

## Handoff

End every run with:

- the video/source processed,
- branch and PR URL,
- files changed,
- validation commands run,
- whether the episode is website-visible,
- any corpus impact classification,
- any memory or skill updates made,
- the next useful autonomous job.

If a run teaches a durable process improvement, propose a skill update. Do not silently encode broad methodology only in personal memory.
