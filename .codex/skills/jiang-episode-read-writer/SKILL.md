---
name: jiang-episode-read-writer
description: Use this skill when writing or revising the public Jiang Lens episode/interview read JSON for one already-ingested video, using its clean transcript and semantic bundle to create a compressed reader-facing public page.
---

# Jiang Episode Read Writer

Use this after a source transcript and semantic outputs exist. The output is the public episode read:

```text
content/lens/episodes/<source-slug>/read.json
```

This skill is editorial. It does not import Colab files, process transcript packets, rewrite lens docs, or promote canon.

## Inputs

- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- existing strong reads, especially `content/lens/episodes/predictive-history-0hyet47cc-e/read.json`
- existing lens point IDs from compiled link index when adding lens links

## Reading Pass

Before writing:

1. Read the full clean transcript, not only extracted claims.
2. Inspect semantic outputs for signature moments, real questions, quoted material, speaker uncertainty, and chronology notes.
3. Identify the episode's argumentative movement in one sentence.
4. Identify the sharpest Jiang formulations that must survive compression.
5. Check whether the episode directly invokes existing lens points.

## Public Read Contract

The page should read like a compact book chapter in Jiang's voice, not like a report about Jiang. For interviews, keep the question pressure and exchange context when that is what makes Jiang's answer intelligible.

Write:

- title naming the central argument,
- dek and thesis that state what is at stake,
- an opening core reading,
- 5-8 chapter beats with timestamp ranges,
- compact paragraphs carrying the argument,
- paragraph-level refs and selective inline `marks`,
- real student/interviewer/audience questions only,
- optional source note only when it improves reader trust.

The episode or interview must be entry-point resilient. A reader who lands from search, a source link, or an evidence hover should understand what source this is, who Jiang is in this context, why it matters for the lens, and where to go for transcript/source inspection without needing to read `/introduction` first.

Do not write:

- invented FAQ questions,
- labels such as models, diagnoses, predictions, or source dossiers in the public read,
- "Jiang discusses..." as the default sentence shape,
- a transcript dump,
- a skeletal summary that erases the lecture's strange pressure.

## Signature Moment Rule

Preserve the memorable machinery of the lecture. If Jiang says poetry behaves like a virus, a guide becomes part of the trap, obedience becomes desire, memory resurrects what authority erased, or a story trains people into hell, keep that force visible.

At least three strong signature moments should appear in the title, dek, thesis, opening, beat headings, or paragraph prose when the source supports them. Tightening is allowed. Bureaucratizing is not.

## Questions

`questions` means questions actually asked in the source transcript by a student, interviewer, audience member, or commenter.

If no real source question is captured:

```json
"questions": []
```

Do not invent reader-facing prompts.

## Marks And Lens Links

Use `marks` for exact phrases that should show source provenance or jump the video. Keep marked text narrow and meaningful.

Link to `lens_points` only when the phrase directly uses an existing public lens point:

```json
{
  "text": "The guide is part of the trap.",
  "lens_points": ["lens-point:guide-trap-necessary-guide"],
  "refs": [
    "video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0014"
  ]
}
```

Do not invent lens point IDs in an episode read.

## Review Gate

Before handoff, check:

- Would a reader understand the core model without opening the transcript?
- Does the prose preserve Jiang's voice and pressure?
- Are timestamp ranges useful?
- Are refs attached to the claims they support?
- Are quoted readings distinguished from Jiang's interpretation?
- Are questions real source questions?

Then run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

If available, run:

```bash
node ops/scripts/audit-episode-heat.mjs --source-slug <source-slug> --strict --min 3
```
