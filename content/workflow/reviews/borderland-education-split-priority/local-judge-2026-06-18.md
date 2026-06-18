# Local Judge: Borderland Education Split Priority

Date: 2026-06-18
Target: `content/workflow/proposals/borderland-education-split-priority/proposal.md`
Mode: local reader/world-model and grounding/provenance review; no independent judge agents used

## Reader / World-Model

No blocking findings.

The proposal answers Socrates' bounded question after PR #1056 without turning Cassandra's generated source-row counts into an automatic split queue. It selects Education first only as the next governance target, not as an immediate child extraction, and it keeps Borderland's June 14 split review intact.

The decision is useful because it distinguishes generated navigation pressure from authored-page pressure. Borderland's generated count is higher, but its exact 135-source signal already has a current review; Education is the larger and denser authored page between the two.

## Grounding / Provenance

No blocking findings.

The proposal grounds the choice in directly measured page state after PR #1056: Borderland at about 3,972 visible/authored words by the recent Plato page-review convention, 52 evidence attributes, 14 local video slugs, 10 anchors, and about 4,806 raw Markdown words including evidence metadata; Education at about 4,713 visible/authored words by the same convention, 69 evidence attributes, 14 local video slugs, 10 anchors, and about 5,539 raw Markdown words including evidence metadata. It also cites the relevant prior governance: the June 14 Borderland split review and the recent Education compression/split history.

Residual risk: this is a workflow-only priority judgment. If Education becomes the next public mutation, that later PR must recompute metrics, preserve stable anchors, run a fresh reader/provenance judge, and request Dante review before merge.
