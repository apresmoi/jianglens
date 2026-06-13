# Local Judge: Strategy Parent Compression

Date: 2026-06-13
Reviewer: Plato local self-review
Target: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`

## Reader / World-Model Pass

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- concrete problem: No independent judge agents were used; this review is local only.
- why it matters for Jiang Lens: Public Strategy prose is visible lens surface, and compression can accidentally flatten Jiang's pressure.
- suggested fix: Request Dante review before merge. Keep the PR framed as parent compression and ask Dante to measure reader usefulness, boundary clarity, and whether the page still teaches the mechanism.

- severity: Low
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:223`
- concrete problem: The compressed chronology/source trail is less granular than the prior list.
- why it matters for Jiang Lens: Readers lose one-sentence summaries for each source.
- suggested fix: Accepted as the intended tradeoff. The page was already carrying source-row pressure; the dense clusters are routed to child pages, while core source links remain visible.

## Grounding / Provenance Pass

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- concrete problem: This compression preserves existing evidence marks and lens-point IDs but does not re-open every transcript segment.
- why it matters for Jiang Lens: The PR should not be treated as new source interpretation.
- suggested fix: Run compile/validate/build and Dante review. Do not add new claims or refs in this PR.

- severity: Low
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- concrete problem: Some boundary prose is shorter and depends more on already-linked concept names.
- why it matters for Jiang Lens: Over-compression can make atlas routing feel like shorthand.
- suggested fix: Keep the main boundary claims where they protect concept borders: Stories vs Strategy, Strategy vs Game Theory, Strategy vs Mass Society/Nation/Eschatology, and Strategy vs child pages.

## Corpus Anchor Pass

Checked against the immediately preceding Strategy split-review record and current page surface. The active pressure is not a new child concept; it is page usability after generated source-row growth. Compression before append remains the right public mutation. Stable anchors remain in place; no episode read JSON, public child pages, or source refs were moved.
