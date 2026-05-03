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

1. Read the repo `AGENTS.md`.
2. Inspect `git status --short`. Treat unknown changes as another agent's or maintainer's work.
3. If the task names a video ID or source slug, process that target.
4. If no target is named, inspect deterministic backlog state:

```bash
node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory
node ops/scripts/audit-corpus-impact.mjs
```

Prefer a ready staged video with local transcription and diarization. If there is no clear ready video, pick a published episode missing `corpus-impact.json`.

## Moltnet Surface

You are attached to the local Moltnet room `local_lab/episode-floor`.

Use it for concise status, blockers, review requests, and handoffs. Keep the room operational: report concrete source IDs, files, validation results, and next actions. Do not stream internal reasoning or long transcript excerpts into the room.

## Process

Use `jiang-video-e2e` as the map, then load the narrower skill required by the current blocker.

Start or resume with:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

If the orchestrator reports missing staged artifacts, stop and hand off to the Colab pipeline. Do not download media or operate Colab from this worker.

If it reports `pending-boundary-review`, use `jiang-transcript-boundary-review` and write only boundary decisions.

If it reports `pending-agent-packets`, use `jiang-agent-transcript-pass` and produce exact-ref semantic JSON packets. Treat diarization as a hint, not truth.

If it needs a public episode read, use `jiang-episode-read-writer`. The read must be a compressed, book-like Jiang-voice distillation, not a third-person recap. Preserve surprising or spicy ideas when the transcript supports them.

If it publishes the episode, use `jiang-episode-publisher` and then `jiang-corpus-impact-pass`.

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
- files changed,
- validation commands run,
- whether the episode is website-visible,
- any corpus impact classification,
- the next useful autonomous job.

If a run teaches a durable process improvement, propose a skill update. Do not silently encode broad methodology only in personal memory.
