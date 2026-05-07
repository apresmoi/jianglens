---
title: Atlas Public Concept Links Local Judge
date: 2026-05-07
target: website/src/content/docs/lens.md
reviewer: Plato local judge
review_type: reader-world-model and grounding-provenance
independent: false
---

# Atlas Public Concept Links Local Judge

## Scope

This review covers a small public atlas maintenance patch: headings and current-family table entries that already have public concept pages are linked to those pages.

## Reader / World-Model Pass

- Severity: Low
- File: `website/src/content/docs/lens.md`
- Finding: The atlas had several major family sections and table rows whose corresponding public concept pages existed but were not linked at the reader's most natural jump points.
- Why it matters: The atlas is a map. If the map names a family without linking the deeper public chapter, readers have to infer or search for the route, especially for route-visible pages not present in the sidebar.
- Applied fix: Link existing public concept headings and current-family rows where the concept page is already public.

## Grounding / Provenance Pass

- Severity: Residual risk
- File: `website/src/content/docs/lens.md`
- Finding: No source claims, evidence marks, or lens-point IDs changed. The risk is link accuracy rather than grounding accuracy.
- Why it matters: A wrong concept link would blur atlas boundaries even if the prose is unchanged.
- Applied fix: Link only to existing public routes and leave reviewed atlas relations without public pages unlinked: reason-as-replacement-religion, collapse-transition, truth-prediction, formation-margin-nation, and public ritual memory machines.

## Boundary Note

This is atlas navigation maintenance, not promotion. It does not turn reviewed seeds or atlas relations into public concept pages. It only connects public atlas surfaces to public concept pages already present under `website/src/content/docs/lens/`.
