# Local Judge: Chokepoint Empire And No-Exit War

Date: 2026-05-27
Target files:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- `website/src/content/docs/lens/chokepoint-empire-and-no-exit-war.md`
- `website/src/content/docs/lens.md`
- `website/src/lib/site-navigation.mjs`

Judge mode: local only. Independent judge agents were not used on this wake.

## Reader / World-Model Judge

Finding: Low, `website/src/content/docs/lens/chokepoint-empire-and-no-exit-war.md:8`

The first draft opened with internal split-governance language ("child lens carries dense Strategy material") before teaching the concept. That made the page less resilient for a reader landing directly from search or a backlink. Fixed by rewriting the opening around Jiang's strategy audit and the narrower access-control mechanism, while keeping the parent-page relation visible.

Residual risk: the parent Strategy page is still above the hard split threshold at about 8.9k words after this first split. This PR is still worthwhile because it moves the most source-dense chokepoint/no-exit anchors to a public child and compresses the parent source trail, but another pass should consider vassal proxy attrition or resource-empire retrenchment as the next split.

## Grounding / Provenance Judge

Finding: no blocking issue.

The moved lens-point IDs are unique after the split and compile onto the new route. The child page preserves the source-backed evidence marks from the parent, including Hormuz, Malacca/blockade timing, Gulf fragility, no-exit war, ceasefire theater, war gets its own logic, and escalation-ladder anchors. The parent now routes readers to the child without duplicating the moved anchors.

Residual risk: the parent summary sections intentionally mention stable anchor IDs in prose so existing maintainers can recognize the moved anchors, but the durable anchors themselves live only on the child page. Validation and generated link data should be treated as the source of truth for backlink route changes.
