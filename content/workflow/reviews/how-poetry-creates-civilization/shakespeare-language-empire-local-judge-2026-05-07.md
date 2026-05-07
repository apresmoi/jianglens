# Local Judge: Shakespeare Language As Empire

Target files:

- `website/src/content/docs/lens/how-poetry-creates-civilization.md`
- `content/lens/episodes/predictive-history-qms7trnkwqq/read.json`

Reviewer: Plato / lens-steward  
Mode: local reader/world-model and grounding/provenance review. Independent judge agents were not used in this runtime.

## Reader / World-Model Pass

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/how-poetry-creates-civilization.md:164`
- concrete problem: The new section follows the modernism negative case even though the Shakespeare source is dated earlier.
- why it matters for Jiang Lens: Chronology carries meaning, and readers could assume the page's section order is strict chronology.
- suggested fix: Accept for this mutation because the chronology list now gives the May 14, 2025 date explicitly and the section is organized by mechanism: shared world, access, private priesthood, then imperial platform. Future larger page polish could reorder the whole page by source chronology if it improves flow.

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/how-poetry-creates-civilization.md:180`
- concrete problem: The boundary sentence says generic British imperial power may belong on "empire pages," but there is no public page with that exact title.
- why it matters for Jiang Lens: Public readers should not be pointed toward a non-existent concept surface.
- suggested fix: Applied. The sentence now names nation, strategy, and material-empire mechanisms rather than implying a missing public page.

## Grounding / Provenance Pass

- severity: Low
- file and line reference: `website/src/content/docs/lens/how-poetry-creates-civilization.md:166`
- concrete problem: The first draft cited `seg-0009` before the segment that directly supports "culture, philosophy, identity, and a way of seeing."
- why it matters for Jiang Lens: Inline marks should be locally falsifiable, with the strongest direct ref first.
- suggested fix: Applied before this review was recorded. The mark now cites `seg-0010` first, with `seg-0009` as setup.

- severity: Low
- file and line reference: `website/src/content/docs/lens/how-poetry-creates-civilization.md:172`
- concrete problem: The first draft's lens-point evidence did not include the segment that supports the "filtering through Britain and America" layer.
- why it matters for Jiang Lens: The hover text says both "opens the world" and "filtering it through its own assumptions"; both sides need source support.
- suggested fix: Applied before this review was recorded. The lens-point evidence now includes `seg-0048`.

- severity: Residual risk
- file and line reference: `content/lens/episodes/predictive-history-qms7trnkwqq/read.json:233`
- concrete problem: The backlink "Poetry creates a world you can enter" supports the platform anchor only as the world-entry/opening side, not the imperial-filter side.
- why it matters for Jiang Lens: A single backlink should not be mistaken for complete evidence for every word in the lens point.
- suggested fix: Accept because the generated hover for the anchor carries the full lens-point evidence, and the episode mark is one of three exact links. Do not use this mark alone for a future language-imperialism claim.

## Decision

Pass with residual risks. The mutation advances the poetry-civilization map by adding Shakespeare as the language-platform and imperial-afterlife case, while preserving boundaries against generic British empire, standalone literary psychology, and education critique.
