# Local Judge: Poetry Modernism Private Priesthood

Date: 2026-05-07

Target:

- `website/src/content/docs/lens/how-poetry-creates-civilization.md`
- `content/lens/episodes/predictive-history-cylkqpsffry/read.json`

Scope: local reader/world-model judge and local grounding/provenance judge. Independent judge agents were not used in this runtime.

## Reader/World-Model Judge

Finding: Low, `website/src/content/docs/lens/how-poetry-creates-civilization.md` line 162 before patch.

Problem: The sentence saying the modernism case belongs on the poetry page rather than a "future cult-of-self page" sounded like internal page-routing language in public prose.

Why it matters: Public lens pages should teach the mechanism directly, not expose planning language.

Applied fix: Reworded the boundary as "rather than only in a broader cult-of-self diagnosis."

Residual risk: The phrase "private priesthood" is interpretive, but it is constrained by Jiang's explicit Dante/Joyce contrast, artist-as-god language, elite allusion, and self-salvation sequence.

## Grounding/Provenance Judge

Finding: Low, `website/src/content/docs/lens/how-poetry-creates-civilization.md` line 185 before patch.

Problem: The chronology bullet marked Joyce's mind-of-God claim but left the "elite, self-referential, inward, and tempted by self-salvation" phrase outside a direct evidence mark.

Why it matters: The chronology bullet compresses the concept's dated negative case, so each compressed mechanism should remain locally falsifiable.

Applied fix: Added a second evidence mark for the modern literature/self-salvation clause using `seg-0046` and `seg-0048`.

Backlink check: After compile, `lens-point:poetry-modernism-private-priesthood` resolved to `/lens/how-poetry-creates-civilization/#poetry-modernism-private-priesthood` and produced two episode backlinks from the existing marks "The artist becomes the god" and "the self can become its own salvation."

Residual risk: The episode read's "Joyce Makes Himself God" beat includes quoted literary passages with ASR fragility, but the linked marks use Jiang's own interpretive sentences and direct transcript refs, not the distorted Joyce quotation.
