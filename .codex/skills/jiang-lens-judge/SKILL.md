---
name: jiang-lens-judge
description: Use this skill to review Jiang Lens concept docs, episode reads, glossary drafts, canon proposals, or source-grounded public pages with adversarial reader/world-model and grounding/provenance passes before handoff or promotion.
---

# Jiang Lens Judge

Use this after a draft exists and before handoff, promotion, or public-site validation. The job is independent criticism, not rewriting.

## Review Modes

Run both modes unless the user asks for only one.

### Reader/World-Model Judge

Check whether the draft:

- teaches a usable Jiang lens rather than only summarizing a lecture
- preserves Jiang's vivid pressure and morally uncomfortable claims
- defines key nouns and verbs, especially terms such as consciousness, material, attention, imagination, soul, free will, love, eudaimonia, empire, reciprocity, or eschatology
- carries ambivalence instead of smoothing the idea into respectable commentary
- avoids default modern ideology, generic media criticism, or bland academic paraphrase
- gives readers concrete scenes, mechanisms, diagnostics, and related lens connections
- uses lens points only for durable reusable ideas, not decorative tagging

### Grounding/Provenance Judge

Check whether:

- every major mechanism, bridge, chronology claim, and vivid formulation has a local dated source ref
- each inline evidence mark is locally falsifiable and the first cited span visibly supports the marked phrase
- each lens point has a stable unique ID, compact hoverable text, and evidence refs that support the point
- episode `lens_points` links point to the specific place in the lens that grounds the episode phrase
- no source ref is used as topic decoration for a claim it does not actually support
- cross-domain bridges carry both sides of the bridge, or are written as future tests
- quoted literary/source material is distinguished from Jiang's own gloss
- dates remain visible where chronology or contradiction matters

## Subagent Use

If subagents are available and the user has authorized judge agents, delegate the two modes to separate read-only agents. Give each judge only the target file, this skill, and the source artifacts needed for its mode. Judges must not edit files.

If subagents are unavailable or not authorized, perform both judge modes locally and explicitly say the review was not independent.

## Judge Output

Require findings in this shape:

- severity: `High`, `Medium`, `Low`, or `Residual risk`
- file and line reference
- concrete problem
- why it matters for Jiang Lens
- suggested fix

No finding is needed for generic preference. If the draft is strong, say so and name the remaining risk.

## Integrator Duties

The main agent or editor owns the final patch. After judges return:

1. Patch only actionable findings that improve reader quality or source grounding.
2. Do not accept judge suggestions that add unsupported claims or flatten Jiang's pressure.
3. Re-run evidence-ref checks when inline evidence changed.
4. Run the required repo validation for the changed surface.
5. In the handoff, state whether independent judges were used and which findings were applied.
