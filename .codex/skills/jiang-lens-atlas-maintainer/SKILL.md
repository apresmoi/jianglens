---
name: jiang-lens-atlas-maintainer
description: Use this skill when maintaining the public Jiang Lens atlas page, adding or revising lens families, concept clusters, relationships, and stable lens-point anchors from already-published source-grounded material.
---

# Jiang Lens Atlas Maintainer

Use this for the high-level public map of the lens, usually:

```text
website/src/content/docs/lens.md
```

The atlas is a map, not the full encyclopedia. Concept depth belongs in concept pages.

## Inputs

- finished episode reads,
- concept pages,
- lens signal proposals,
- existing lens points from compiled `link-index.json`,
- dated source refs.

## Duties

- Maintain lens families and relationships.
- Add stable `lens-point:*` anchors for reusable ideas.
- Link to concept pages when they exist.
- Keep the page readable and navigable.
- Update progressively after new evidence, not by rewriting the whole atlas every time.

## Atlas Style

The atlas should answer:

- What is Jiang Lens, and what Jiang source material is being mapped?
- What are the major parts of Jiang's world model?
- Which concepts belong together?
- Which concepts are still provisional?
- Where can a reader go deeper?
- Which source-backed lens points can episodes cite?

Keep prose compressed. Do not dump raw source refs or internal workflow notes. Use inline evidence marks and lens point anchors where the map makes a durable claim.

The atlas must be entry-point resilient. A reader who lands here from search or a shared link should not need `/introduction` to know that the corpus means Jiang Xueqin's Predictive History lectures, Great Books lectures, interviews, and writing processed by this project.

## Lens Point Rules

Use lens points only for addressable ideas other pages may cite:

- definitions,
- reusable mechanisms,
- diagnostics,
- chronology/evolution points,
- core claims.

Do not tag decorative prose. Preserve IDs when rewriting a point unless the idea itself changes.

## Validation

Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```

If an episode references a lens point that no longer exists, validation should fail. Fix the atlas or the episode link; do not leave stale IDs.
