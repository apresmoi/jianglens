---
name: jiang-source-ingest
description: Use this skill when importing synced Jiang Lens source artifacts, resolving YouTube metadata dates, creating canonical source transcripts, and preparing transcript packets for semantic agents.
---

# Jiang Source Ingest

Use this for the mechanical path from staged source artifacts into canonical source state.

This skill does not write public episode prose, public lens docs, glossary canon, or promotion records.

## Core Rule

Treat time as part of provenance. A claim is not just "what Jiang says"; it is what a dated artifact records him saying, in a specific context, with a stable source ref.

## Inputs

Synced Colab text artifacts:

```text
ops/staging/drive/youtube/<channel>/<video-id>/
  metadata.youtube.json
  dump.json
  grouped.json
  transcription.json
```

If artifacts are still only in Google Drive or Colab, use `colab-video-pipeline` first.

## Import Flow

Import:

```bash
node ops/scripts/import-colab-video.mjs \
  --video-id VIDEO_ID \
  --channel @PredictiveHistory
```

Inspect:

```bash
node ops/scripts/inspect-source.mjs \
  content/sources/videos/<source-slug>
```

Prepare packets:

```bash
node ops/scripts/prepare-agent-transcript-packets.mjs \
  --source content/sources/videos/<source-slug>
```

The E2E integration script can run these steps for one video:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

## Outputs

```text
content/sources/videos/<source-slug>/metadata.json
content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl
content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.md
content/workflow/tasks/<source-slug>/transcript-agent-packets.jsonl
```

Do not commit raw audio or video.

## Chronology Fields

Each source should include:

- `recorded_at`: when the statement was made, if known.
- `published_at`: when the artifact became public.
- `date_precision`: `day`, `month`, `year`, or `unknown`.
- `chronology_status`: `dated` or `needs-date`.

Prefer `recorded_at` when reasoning about what Jiang believed at a time. Use `published_at` when `recorded_at` is unknown, but label precision honestly.

The importer reads staged `metadata.youtube.json` when present. If it is missing, it may try `yt-dlp` by video ID, cache compact metadata into the staged folder, and use `published_at` for chronology.

## Transcript Timing

When `transcription.json` includes `turns[].words[]`, preserve phrase-level `timed_chunks` inside each clean segment. The transcript page uses those chunks for speech-following highlights.

After import, verify when needed:

```bash
node -e "const fs=require('fs');const lines=fs.readFileSync('content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl','utf8').trim().split('\n').map(JSON.parse);console.log(lines.reduce((s,x)=>s+(x.timed_chunks?.length||0),0))"
```

If this prints `0`, the transcript can still highlight whole segments, but not phrase-by-phrase. Do not fake phrase timing in the website layer.

## Source Refs

Use stable refs:

```text
video:<source-slug>@transcript:v1#seg-0001
```

The importer owns segment IDs and transcript text. It does not decide what is a real interaction, claim, model, glossary item, or public episode argument. Those belong to later skills.

## Boundary

After ingest, hand off to:

- `jiang-transcript-boundary-review` if boundary candidates require decisions,
- `jiang-agent-transcript-pass` for semantic packet outputs,
- `jiang-episode-read-writer` only after semantic bundle and transcript are ready,
- `jiang-canon-promotion` only after proposal and review records exist.
