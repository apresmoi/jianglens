# Strategy Source-Pressure Reconciliation Local Judge

Scope: local reader/world-model, grounding/provenance, and corpus-anchor review of `content/workflow/proposals/strategy-source-pressure-reconciliation/proposal.md`. No independent judge agents were used.

## Findings

- Severity: Residual risk
- File: `content/workflow/proposals/strategy-source-pressure-reconciliation/proposal.md`
- Concrete problem: The proposal depends on current generated diagnostics and current authored Markdown counts; another compile or future Strategy edit can change the exact numbers.
- Why it matters: Strategy is already a watched parent page, so stale size numbers could either postpone a necessary split or trigger another unnecessary compression cycle.
- Suggested fix: Handoff should state the exact commit measured (`c6082d27`) and preserve the operating rule: remeasure authored words, distinct local slugs, anchors, and generated row expansion before taking future split action.

## Reader/World-Model Pass

The proposal answers the fresh Cassandra warning without turning Strategy into a permanent no-split zone. It preserves the reader-facing concept boundary: Strategy remains the material-audit parent, while access-control, no-exit escalation, resource-fortress retreat, screen-world belief, and dated scoring stay on their existing pages.

The strongest point is the distinction between generated source-ref rows and distinct authored Jiang sources. That distinction matters because the Strategy page can legitimately carry many exact transcript segment rows while still being under the ordinary authored page pressure line.

## Grounding/Provenance Pass

The proposal does not introduce public evidence marks or lens points. Its numeric claims are locally reproducible from the current Markdown page and `website/src/data/lens/link-index.json`:

- authored Markdown body word count;
- raw `evidence="..."` attributes;
- generated doc evidence marks;
- stable lens-point IDs;
- raw video ref occurrences;
- distinct local video slugs;
- generated source-ref rows mentioning the doc.

After a fresh `compile-content` on this branch, the generated source-ref row count is 64, not the earlier 81 measured before the branch resumed. The boundary judgment does not depend on the exact row count: the operational point remains that generated row expansion is not the same as distinct authored Jiang sources.

No source-grounded public claim is being promoted. The main grounding risk is operational rather than textual: future agents should not reuse the counts without remeasurement.

## Corpus-Anchor Pass

The proposal is consistent with the recent Strategy split-review and compression records. It does not create a fake child concept from a metric warning, and it keeps the same held candidates: Spectacle/Optics, War Form, and Dominance/Control. The child thresholds are explicit enough for the next worker to decide whether new evidence has changed the boundary.
