---
name: jiang-video-e2e
description: Use this skill as the integration map for turning one already-transcribed Jiang Lens video from synced Drive artifacts into a website-visible episode or interview, delegating detailed work to the narrower ingest, transcript, read-writing, and publishing skills.
---

# Jiang Video E2E

Use this when testing or explaining the full path for one video:

```text
Google Drive Colab artifacts
-> committed raw source artifacts
-> canonical source transcript
-> semantic packet outputs
-> internal semantic bundle
-> public source read
-> generated website episode or interview
```

This is a pipeline map, not a future autonomous-agent persona. Autonomous agents should normally run the narrower skill for their job. This skill is useful when a maintainer asks for one video end-to-end or when we need to test whether the narrower skills compose correctly.

## Model Policy

When delegating video parsing or episode writing work, use `gpt-5.5` with `reasoning_effort: xhigh` by default. Use smaller models only when the maintainer explicitly asks for an experiment.

## Stage 0: Colab Has Produced Artifacts

Colab automation belongs to `colab-video-pipeline`. For normal content agents, assume artifacts already exist locally after Drive sync:

```text
content/sources/raw/youtube/<channel>/<video-id>/
  metadata.youtube.json
  dump.json
  grouped.json
  transcription.json

content/sources/raw/youtube/Interviews/<host-channel-id>/<video-id>/
  metadata.youtube.json
  dump.json
  grouped.json
  transcription.json
```

If these are missing, stop and hand off to `colab-video-pipeline`.

## Stage 1: Source Ingest

Use `jiang-source-ingest`.

Mechanical import creates:

```text
content/sources/videos/<source-slug>/
content/workflow/tasks/<source-slug>/transcript-agent-packets.jsonl
```

The integration entry point remains:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
# or, for interview-format sources:
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel Interviews/<host-channel-id>
```

If the orchestrator stops at source import, metadata, or packet preparation, resolve that under `jiang-source-ingest`.

## Stage 2: Boundary Review

If the orchestrator reports `pending-boundary-review`, use `jiang-transcript-boundary-review`.

Expected review file:

```text
content/workflow/reviews/<source-slug>/transcript-boundary-decisions.json
```

Then rerun:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
# or the same interview command used at ingest
```

## Stage 3: Semantic Transcript Pass

If the orchestrator reports `pending-agent-packets`, use `jiang-agent-transcript-pass`.

Expected outputs:

```text
content/workflow/proposals/<source-slug>/packet-*.semantic.json
```

Validate packet outputs:

```bash
node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/<source-slug>/*.semantic.json
```

Then rerun the orchestrator. When all packet outputs exist, it aggregates:

```text
content/lens/evidence/videos/<source-slug>.semantic.json
```

## Stage 4: Public Source Read

Use `jiang-episode-read-writer`.

Expected output:

```text
content/lens/episodes/<source-slug>/read.json
```

The public source is not complete with only transcript, claims, glossary candidates, or semantic bundles. It needs a readable Jiang-voice distillation. Interview reads should preserve interviewer pressure, questions, and conversational context where those shape Jiang's answer.

## Stage 5: Episode Publication

Use `jiang-episode-publisher`.

Expected generated output:

```text
website/src/data/lens/episodes/<source-slug>.json
website/src/data/lens/interviews/<source-slug>.json
```

Expected routes:

```text
/episodes/<source-slug>/
/episodes/<source-slug>/transcript/
/interviews/<source-slug>/
/interviews/<source-slug>/transcript/
```

## Stage 6: Optional Existing Lens Links

During E2E, do not create or rewrite public lens docs unless explicitly asked. If the episode directly invokes an existing lens point, use `jiang-provenance-linker` to attach the existing `lens-point:*` ID to the relevant episode mark.

## Required Validation

At the end of a successful E2E test:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

If website UI changed, inspect the rendered episode and transcript pages before handoff.

## Boundary

Do not update these as part of ordinary video E2E unless the maintainer explicitly asks:

- `website/src/content/docs/lens*.md`
- `content/lens/canon/`
- `content/lens/glossary/`
- `content/lens/ledger/`
- `content/workflow/proposals/<source-slug>/corpus-impact.json`
- cross-episode concept pages

Those belong to corpus impact, concept writing, atlas maintenance, provenance linking, or canon promotion.
