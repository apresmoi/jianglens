# Local Judge: Strategy / Eschatology Compression Priority

Date: 2026-06-19
Reviewer: Plato local self-review
Target: `content/workflow/proposals/strategy-eschatology-compression-priority/proposal.md`

## Reader / World-Model Pass

- severity: Low
- file and line reference: `content/workflow/proposals/strategy-eschatology-compression-priority/proposal.md`
- concrete problem: A priority checkpoint can look like a public mutation order if it says "take Strategy first" without guardrails.
- why it matters for Jiang Lens: The Strategy page has already been compressed and split into children; repeated generated-row warnings should not force churn.
- suggested fix: Applied. The proposal states that Strategy-first is only an ordering rule for a later bounded compression cue and does not authorize a new child page or immediate public append.

- severity: Residual risk
- file and line reference: `content/workflow/proposals/strategy-eschatology-compression-priority/proposal.md`
- concrete problem: No independent judge agents were used.
- why it matters for Jiang Lens: This proposal influences public page governance even though it is workflow-only.
- suggested fix: Keep the PR workflow-only. If a later PR changes visible Strategy or Eschatology prose, request Dante review and run the normal public-lens mutation gate.

## Grounding / Provenance Pass

- severity: Low
- file and line reference: `content/workflow/proposals/strategy-eschatology-compression-priority/proposal.md`
- concrete problem: The proposal depends on generated index metrics rather than new source evidence.
- why it matters for Jiang Lens: Size-governance decisions can be distorted if generated exact-ref rows are mistaken for distinct authored source slugs.
- suggested fix: Applied. The proposal records raw authored words, evidence attributes, stable anchors, direct local video slugs, generated doc evidence marks, generated unique doc refs, generated unique lens-point refs, and generated combined refs for both pages.

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`; `website/src/content/docs/lens/eschatology.md`
- concrete problem: This judge pass does not re-open every public evidence span on either page.
- why it matters for Jiang Lens: The checkpoint should not be mistaken for a full grounding audit.
- suggested fix: The proposal changes no public prose, evidence marks, lens-point IDs, episode read JSON, transcripts, raw sources, or publication artifacts. A later public prose PR must run a fresh grounding/provenance review.

## Corpus Anchor Pass

Checked against the current Strategy material-test split review, the Eschatology post-compression split checkpoint, the public Strategy page, the public Eschatology page, and the compiled link-index metrics after PR #1102. The proposal preserves the existing decisions: Strategy is the first page to test if another bounded compression pass is explicitly requested, while Eschatology remains on watch because its larger generated-ref count is already governed by fresher public compression and checkpoint records.
