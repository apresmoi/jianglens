---
name: jiang-provenance-linker
description: Use this skill when adding, repairing, or validating Jiang Lens evidence marks, source refs, lens-point anchors, episode-to-lens links, hover payloads, and backlink surfaces across Markdown and episode read JSON.
---

# Jiang Provenance Linker

Use this when the main task is linkage: source spans, evidence hovers, lens points, backlinks, transcript jumps, or validation of those surfaces.

## Source Refs

Use versioned refs:

```text
video:<source-slug>@transcript:v1#seg-0001
article:<article-id>@text:v1#p-0001
interview:<interview-id>@transcript:v1#seg-0001
```

Do not invent refs. Verify target segments exist.

## Markdown Evidence Marks

Use:

```md
[visible phrase]{evidence="video:<source-slug>@transcript:v1#seg-0001"}
```

Rules:

- Mark the phrase or clause that the source supports.
- Keep refs minimal but sufficient.
- Put the strongest direct ref first.
- Do not mark unsupported synthesis.
- Do not leave raw ref dumps in public reader pages.

## Lens Points

Lens point syntax:

```md
<!-- lens-point id="stable-id" concept="concept-family" evidence="video:<source-slug>@transcript:v1#seg-0001" -->
<span id="stable-id" class="lens-point-anchor"></span>
Compact reusable idea text...
```

Rules:

- IDs are lowercase, hyphenated, stable, and unique.
- Evidence must support the point, not only the general topic.
- The visible block should be compact enough for a hover card.
- Preserve IDs when moving or improving the same idea.

## Episode To Lens Links

Episode marks can cite existing lens points:

```json
{
  "text": "The guide is part of the trap.",
  "lens_points": ["lens-point:guide-trap-necessary-guide"],
  "refs": [
    "video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0014"
  ]
}
```

Only link a phrase to a lens point when both are specific enough. The episode phrase needs source refs, and the lens point must already exist in generated link data.

## Validation

Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
```

Inspect generated link data when needed:

```bash
node -e "const i=require('./website/src/data/lens/link-index.json'); console.log((i.lens_points||[]).map(p=>p.id+' -> '+p.url).join('\n'))"
```

For website-visible changes, run:

```bash
cd website && npm run build
```
