---
name: jiang-lens-distillation
description: Use this skill as the integration map for Jiang Lens work after episode publication, selecting the narrower corpus impact, concept writing, atlas maintenance, provenance linking, judging, or canon promotion skill needed for the task.
---

# Jiang Lens Distillation

Use this as the map for turning processed episodes into the Jiang Lens. It is not a single autonomous job. Agents should normally use the narrower skill that matches the artifact they are producing.

## Source Boundary

Start from published or processed artifacts:

- `content/lens/episodes/<source-slug>/read.json`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl`
- proposals, reviews, promotions, glossary, canon, and ledger files under `content/`
- public docs under `website/src/content/docs/`

Do not use this for raw Colab work or single-video episode publication. Use `colab-video-pipeline` and `jiang-video-e2e` for that path.

## Choose The Narrow Skill

- Per-episode corpus impact and mutation level: `jiang-corpus-impact-pass`
- One serious public concept page: `jiang-lens-concept-writer`
- High-level atlas and `lens-point:*` anchors: `jiang-lens-atlas-maintainer`
- Evidence marks, source refs, hovers, backlinks, and episode-to-lens links: `jiang-provenance-linker`
- Promotion into canon/glossary/ledger: `jiang-canon-promotion`
- Independent criticism before handoff or promotion: `jiang-lens-judge`

## Distillation Principles

Write for readers, not pipeline operators. Explain the thing itself: what Jiang's world model sees, how the mechanism works, where it appears, why it matters, and how it changes across the corpus.

Do not say "what belongs here" in public pages unless the page is explicitly about method.

Do not promote agent interpretation directly into canon. Draft interpretive work in `content/workflow/proposals/`, review it, then promote with `jiang-canon-promotion` when appropriate.

Every published episode should run through `jiang-corpus-impact-pass`. The pass may decide that the episode only adds evidence, or it may justify immediate lens links, concept extension, a new lens seed, atlas morphing, or canon-candidate review. There is no fixed batch threshold.

## Chronology

Dates are part of meaning. Older and newer positions should remain visible instead of being flattened. When Jiang changes, intensifies, contradicts, or tests a position, preserve:

- older formulation,
- newer formulation,
- what changed,
- whether Jiang explains the change,
- latest dated position when supported.

## Evidence

Use `jiang-provenance-linker` for exact syntax, but the rule is simple: public lens prose may synthesize, yet important mechanisms, vivid formulations, chronology claims, and bridges need local dated source support.

Great Books lectures can supply deep primitives for the lens, but bridge them into politics, media, education, state mythology, or geopolitics only when exact source refs support both sides.

## Validation

For lens-visible changes:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```
