---
name: jiang-transcript-boundary-review
description: Use this skill when reviewing Jiang Lens transcript boundary candidates from ops/scripts/repair-transcript-boundaries.mjs and producing approve/reject decisions without rewriting the transcript or loading the full transcript into context.
---

# Jiang Transcript Boundary Review

Use this after `ops/scripts/repair-transcript-boundaries.mjs` creates:

```text
content/workflow/tasks/<source-slug>/transcript-boundary-candidates.jsonl
```

The goal is only to decide whether adjacent transcript segments should exchange a few words. Do not rewrite Jiang's prose. Do not edit transcript files directly.

## Workflow

1. Read candidates with shell tools, not by loading the whole transcript:

```bash
wc -l content/workflow/tasks/<source-slug>/transcript-boundary-candidates.jsonl
jq -c '{candidate_id,boundary,type,text,prev:{id,tail_text},next:{id,head_text}}' content/workflow/tasks/<source-slug>/transcript-boundary-candidates.jsonl
```

2. For each candidate, decide from the provided `prev.tail_text`, `next.head_text`, and chunk texts.
3. Write decisions to:

```text
content/workflow/reviews/<source-slug>/transcript-boundary-decisions.json
```

Use this shape:

```json
{
  "source_slug": "<source-slug>",
  "decisions": [
    {
      "candidate_id": "seg-0006->seg-0007:move-trailing-starter-to-next:b344d80e24a3",
      "decision": "approve",
      "reason": "Moves 'The' before 'simplest way...' to complete the sentence."
    }
  ]
}
```

Allowed decisions are `approve` and `reject`.

4. Apply approved decisions:

```bash
node ops/scripts/repair-transcript-boundaries.mjs \
  --source content/sources/videos/<source-slug> \
  --decisions content/workflow/reviews/<source-slug>/transcript-boundary-decisions.json \
  --write
```

5. Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
```

## Approval Rules

Approve when:

- A segment ends mid-sentence and the next segment begins with the sentence completion.
- A segment ends with a sentence starter such as `The`, `And this`, or `But then`, and the next segment begins with lowercase continuation text.
- The move improves reading while preserving exact words and chronology.

Reject when:

- The proposed text is a useful new sentence rather than a completion.
- The move would hide an actual topic break, speaker change, or quoted reading boundary.
- The candidate appears to be ASR noise, punctuation damage, or abbreviation damage such as `.S.`.
- You cannot tell from the provided two-segment window.

Prefer rejection when uncertain. This pass only fixes obvious boundary splits.
