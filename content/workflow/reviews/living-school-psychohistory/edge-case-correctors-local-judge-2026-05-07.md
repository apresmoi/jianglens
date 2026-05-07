# Living School Edge-Case Correctors Local Judge

Date: 2026-05-07

Target:

- `website/src/content/docs/lens/living-school-for-psychohistory.md`
- `content/lens/episodes/predictive-history-s-k6eswheqa/read.json`

Review mode: local reader/world-model and grounding/provenance judge. Independent judge agents were not used in this runtime.

## Reader / World-Model Pass

Finding: no blocking issue.

The added section improves the public page because the prior version moved from human-heart variables directly to democratic governance. The 2024 source has a middle layer: psychohistory must survive failed predictions, historical reconstruction, and great-person edge cases. The new section keeps that as a school problem rather than a standalone great-man page or generic AI-governance point.

Residual risk: Jiang's "great men" language is sharp and can easily become hero cataloging. The current wording keeps the boundary on model humility and trained observers, which is the right concept boundary for Living School.

## Grounding / Provenance Pass

Finding: Low, patched before handoff.

Problem: the draft named the people behind the machine without direct inline evidence, relying mainly on the nearby lens-point refs. Because this is the new section's institutional mechanism, the reader should be able to inspect it directly.

Fix applied: added an inline evidence mark for "scholars, experts, historians, mathematicians, programmers, and readers of literature" with refs to the collaboration, second-foundation, and literature-truth segments.

Remaining provenance check:

- The new lens point `psychohistory-needs-edge-case-correctors` has a stable ID, compact hover text, and evidence refs `seg-0038`, `seg-0039`, and `seg-0040`.
- The episode mark "Great men are beyond history because they can step outside of history and control it." now links to the lens point and carries refs through `seg-0040`, so the generated backlink includes the second-foundation correction layer in the same source paragraph.
- No public claim presents the second foundation as canon or as a secret priesthood; the prose treats it as Jiang's Asimov-derived corrective institution for model humility.
