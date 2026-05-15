---
name: jiang-lens-concept-writer
description: Use this skill when creating or improving one public Jiang Lens concept page from dated source refs, episode reads, semantic bundles, proposals, and existing atlas links.
---

# Jiang Lens Concept Writer

Use this to build one serious public concept page. Examples: poetry as virus, guide as trap, eschatology, game theory, sacred machine, false authority, free will, reciprocity, attention capture.

## Inputs

- processed episode reads,
- semantic bundles,
- transcript refs,
- proposals from `jiang-corpus-impact-pass`,
- existing docs under `website/src/content/docs/lens*.md`,
- compiled lens points from `website/src/data/lens/link-index.json`.

## Output

Usually:

```text
website/src/content/docs/lens/<concept-slug>.md
```

Concept pages are public reader-facing pages. They should not read like internal documentation.

Every concept page should be entry-point resilient. Do not assume the reader already read `/introduction` or the atlas. If you use words such as corpus, lens, episode, source trail, or agent, define them in local context or write around them.

## Shape

Write as a compact chapter:

1. Open as if the reader landed directly on this page. Name the concept, the Jiang Lens context, and the kind of Jiang source material carrying it.
2. Define the key nouns and verbs.
3. Explain the mechanism: how the thing works.
4. Move through source clusters chronologically when chronology matters.
5. Preserve vivid Jiang formulations and concrete scenes.
6. Keep ambivalence: how the same mechanism can reveal, save, trap, dominate, erase, or create hell.
7. Add diagnostics that help a reader apply the lens.
8. Link related concepts.

Important concept pages can be 2,000-4,000 words if the evidence supports it. Do not pad. Do not leave them skeletal.

## Corpus Anchor

Before writing or expanding a concept, check whether the corpus already has a
better home for the mechanism:

- search existing lens pages for neighboring language and lens points,
- inspect topic aliases so spelling/plural variants do not create fake concepts,
- compare against strong episode reads and semantic signature moments,
- preserve older and newer dated formulations instead of privileging processing
  order.

Create a new page only when the idea is a reusable mechanism that cannot be
absorbed into an existing concept without losing force. If the idea is really an
alias, relation, chronology note, or example, update the existing page instead.

## Evidence

Use Markdown inline evidence marks:

```md
[visible source-grounded phrase]{evidence="video:<source-slug>@transcript:v1#seg-0001"}
```

Mark the phrase that depends on the source, not the whole paragraph. The first ref should visibly support the marked phrase.

Use lens points for durable, reusable anchors:

```md
<!-- lens-point id="guide-trap-necessary-guide" concept="guide-becomes-trap" evidence="video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0014" -->
<span id="guide-trap-necessary-guide" class="lens-point-anchor"></span>
The guide becomes a trap exactly there...
```

Keep lens point blocks compact enough to make a useful hover.

## Chronology

Dates matter when Jiang changes, intensifies, contradicts, or tests a position. Older sources remain historical evidence. Newer sources can define the latest visible position only when exact dated refs support that.

Use dates in prose, chronology sections, source-cluster notes, or popovers. Do not make every section title a date unless the page is explicitly a timeline.

## Judge Gate

Before handoff, use `jiang-lens-judge`. Patch actionable findings, then run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```
