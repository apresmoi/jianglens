# Strategy Source-Pressure Reconciliation

Date: 2026-06-13

## Trigger

After PR #948 compressed the public Strategy parent, Cassandra reported that `when-war-becomes-a-story-instead-of-a-material-test.md` still appeared above the split-review threshold at about 7.5k words and 52 distinct sources. This proposal reconciles that warning against the current authored Markdown and generated link index before another Strategy split or compression pass is claimed.

## Current Measurement

Current main at `c6082d27` gives a different picture:

- Authored Markdown body: about 5,907 words.
- Raw Markdown `evidence="..."` attributes: 57, including lens-point evidence attributes.
- Public doc evidence marks in `website/src/data/lens/link-index.json`: 45.
- Stable lens-point anchors: 12.
- Raw `video:*@transcript:v1` occurrences in the Markdown: 122.
- Distinct local video slugs directly cited by the authored page: 15.
- Generated `source_refs` rows mentioning this doc: 64 exact segment rows.

The generated row count remains high because one authored evidence mark can cite multiple transcript segments, and the source-ref table expands those refs into exact segment rows. That is useful provenance pressure, but it is not the same as 52 distinct Jiang sources or an automatic public split mandate.

## Boundary Decision

Do not immediately create another Strategy child or run another public compression from the generated-count warning alone.

Keep Strategy as the material-audit parent for the mechanisms that still need to be read together:

- economics, organization, logistics, and replacement capacity;
- world theory before tactics;
- military form making political form;
- spectacle versus resilience;
- shock-and-awe fantasy;
- hybrid-war attack surfaces;
- dominance/control and escalation discipline.

The existing child routing still holds:

- [Chokepoint Empire](/lens/chokepoint-empire-and-no-exit-war/) owns access-control gates, straits, blockades, Hormuz/Malacca pressure, and route permission.
- [No-Exit War And Escalation Ladder](/lens/no-exit-war-and-escalation-ladder/) owns war momentum, no-exit compulsion, and escalation-ladder anchors.
- [Imperial Retrenchment And Proxy Attrition](/lens/imperial-retrenchment-and-proxy-attrition/) owns resource-fortress retreat, protection-to-extraction, and imperial cost transfer.
- [How Stories Control Reality](/lens/how-stories-control-reality/) and [Screen-World Governance](/lens/screen-world-governance/) own upstream image-world belief when the story grammar is primary.
- [Prediction As Falsifiable Prophecy](/lens/prediction-as-falsifiable-prophecy/) owns dated forecast scoring, status, and revision.

## What Would Justify The Next Split

The next Strategy-family split should come from an authored mechanism that cannot stay folded after replacement/compression, not from generated row pressure by itself.

Strongest held candidates:

1. **Spectacle And Optics Sacrificing The Board**: reopen if the quick-victory / Maduro / Iran optics cluster reaches at least four strong dated sources that need their own reader surface, or if episode-to-lens links begin clustering around `strategy-optics-sacrifices-the-board` and `strategy-spectacle-exploits-fragility` enough that parent hovers become too dense.
2. **War Form Makes Political Form**: reopen if the gunpowder / mass-army / political-form sequence gathers additional dated sources beyond the current foundational section and becomes a reusable page about military form remaking society rather than a Strategy parent premise.
3. **Dominance Versus Control**: reopen if escalation-control material grows beyond the current anchor pair and cannot be routed cleanly to No-Exit War, Game Theory, or Strategy without blurring the material-audit parent.

## Next Operating Rule

Future Strategy-family work should remain replacement/compression-first. Do not append ordinary examples to the parent unless a new source changes chronology, boundary, stable-anchor needs, or reader navigation. If generated link-index diagnostics keep reporting high "distinct source" pressure, first check authored word count, distinct local video slugs, stable anchors, and exact generated source-ref row expansion before treating the warning as a split trigger.
