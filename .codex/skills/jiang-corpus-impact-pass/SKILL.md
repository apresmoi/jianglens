---
name: jiang-corpus-impact-pass
description: Use this skill after every published Jiang Lens episode, or when reassessing an existing episode, to decide and record how that source mutates the corpus, existing lens pages, lens points, atlas structure, chronology, and canon candidates.
---

# Jiang Corpus Impact Pass

Use this after every episode is published. Do not wait for fixed batches. Every video applies to the corpus; the question is what level of mutation it justifies.

This skill records the impact decision. Downstream public edits belong to `jiang-provenance-linker`, `jiang-lens-concept-writer`, `jiang-lens-atlas-maintainer`, or `jiang-canon-promotion`.

## Inputs

- `content/lens/episodes/<source-slug>/read.json`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- `content/sources/videos/<source-slug>/metadata.json`
- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl`
- existing lens docs under `website/src/content/docs/lens*.md`
- generated link data from `website/src/data/lens/link-index.json`
- existing proposals, reviews, promotions, glossary, canon, and ledger files under `content/`

## Output

Write one impact proposal:

```text
content/workflow/proposals/<source-slug>/corpus-impact.json
```

Use this shape:

```json
{
  "source_slug": "<source-slug>",
  "source_title": "<episode title>",
  "source_date": "YYYY-MM-DD",
  "source_ref_base": "video:<source-slug>@transcript:v1",
  "impact_level": "evidence-only",
  "summary": "One sentence on how this episode changes or confirms the corpus.",
  "existing_lens_links": [],
  "concept_extensions": [],
  "new_lens_seeds": [],
  "atlas_mutations": [],
  "chronology_notes": [],
  "canon_candidates": [],
  "next_actions": []
}
```

`impact_level` is the highest justified level:

- `evidence-only`
- `link-existing-lens`
- `extend-existing-concept`
- `create-new-lens-seed`
- `morph-atlas-structure`
- `canon-candidate`

Multiple arrays may be non-empty. The highest level says how strong the source impact is, not the only action allowed.

## Mutation Ladder

### 1. Evidence Only

Use when the episode adds useful refs or examples but does not change any public structure.

Record:

- which existing concepts it supports,
- exact refs,
- why no public mutation is needed.

### 2. Link Existing Lens

Use when the episode directly invokes an existing `lens-point:*`.

Record:

- target lens point,
- episode phrase or beat that should link,
- exact source refs.

Then use `jiang-provenance-linker` if the link should be applied immediately.

### 3. Extend Existing Concept

Use when the episode adds a distinct mechanism, example, contradiction, chronology note, or strong Jiang formulation to an existing concept page.

Record:

- target concept page,
- proposed addition,
- source refs,
- whether the addition is evidence, mechanism, example, contradiction, or chronology.

Then use `jiang-lens-concept-writer` for the actual page edit.

### 4. Create New Lens Seed

A single video can create a new lens seed if it introduces a reusable mechanism, not just a topic.

Threshold:

- the idea explains more than the episode itself,
- future episodes would naturally link back to it,
- the source includes a strong Jiang phrase, scene, definition, reversal, or causal model,
- it does not fit cleanly inside an existing concept without losing force.

Record:

- proposed slug and title,
- core mechanism,
- why it is reusable,
- what existing concepts it touches,
- exact refs,
- whether it should be public now as an early seed.

Then use `jiang-lens-concept-writer` if the seed should become a public page immediately.

### 5. Morph Atlas Structure

Use when the source shows that the current atlas nesting is misleading.

Examples:

- a new concept does not belong under any current family,
- two families should merge,
- one family should split,
- a concept belongs under a different chapter,
- an older source processed later changes the apparent foundation of a family.

Record:

- current atlas structure,
- proposed mutation,
- reason,
- exact refs,
- affected concept pages and lens points.

Then use `jiang-lens-atlas-maintainer`. For structural changes, run `jiang-lens-judge` before handoff.

### 6. Canon Candidate

Use when the source adds material that may belong in canon, glossary, or ledger.

Record the candidate, but do not promote it directly. Promotion requires `jiang-canon-promotion` with review and dated grounding.

## Bias Control

Processing order is not intellectual order. Always reason from source date and source context, not from when the episode was processed.

If an older lecture is processed late, it may:

- become the earliest known formulation of a concept,
- change a concept chronology,
- reveal that a later source was an extension rather than an origin,
- force atlas language to become less biased toward newer processed episodes.

Do not protect the current atlas just because it already exists. Do not rewrite it casually either. Mutation should be justified by source-backed pressure.

## Do Not

- Treat one episode topic as one lens by default.
- Wait for arbitrary batches before recording impact.
- Promote agent interpretation into canon.
- Create a public lens page for a mere topic label.
- Erase older positions when newer ones exist.
- Treat quoted literary material as Jiang's own claim unless Jiang's gloss supports it.

## Validation

Run:

```bash
node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/<source-slug>/corpus-impact.json
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
```

To audit which published episodes still need impact files:

```bash
node ops/scripts/audit-corpus-impact.mjs
```

For downstream website-visible mutations, the downstream skill should also run:

```bash
cd website && npm run build
```
