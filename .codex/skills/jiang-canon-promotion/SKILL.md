---
name: jiang-canon-promotion
description: Use this skill when promoting Jiang Lens proposals, glossary entries, model claims, ledger items, or chronology-sensitive material into canonical content after source grounding and review records exist.
---

# Jiang Canon Promotion

Use this only when material is ready to move from draft/proposal/review into canonical project state.

This skill protects the project from turning agent interpretation into canon too early.

## Inputs

- source refs with dates,
- processed transcripts or article text,
- semantic proposals,
- reviews from `content/workflow/reviews/`,
- existing canon/glossary/ledger material,
- public docs that may need links to promoted entries.

## Canon Rule

Canonical Jiang lens material must cite Jiang-authored or Jiang-spoken source spans.

Do not promote:

- unsupported synthesis,
- undated latest-position claims,
- external commentary as Jiang canon,
- an averaged summary that erases chronological change,
- quoted literary/source material as Jiang's own position unless Jiang's gloss supports it.

## Promotion Flow

1. Identify the proposal and exact target:

```text
canon:model/<slug>
glossary:<slug>
ledger:prediction/<slug>
```

2. Verify source refs exist and are dated enough for the claim.
3. Compare older and newer source positions when chronology matters.
4. Confirm review records address grounding and consistency.
5. Write or update canonical files under `content/lens/canon/`, `content/lens/glossary/`, or `content/lens/ledger/`.
6. Record the accepted change in `content/workflow/promotions/`.
7. Update public docs only where useful for readers.

## Chronology

If Jiang said A in 2020 and B in 2022, do not collapse that into "Jiang believes B" unless B is explicitly the latest dated position and the old position remains visible as historical evidence.

Promotion should preserve:

- older formulation,
- newer formulation,
- what changed,
- whether Jiang explains the change,
- latest dated position.

## Validation

Run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```
