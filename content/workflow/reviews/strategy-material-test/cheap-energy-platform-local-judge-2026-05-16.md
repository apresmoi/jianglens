# Cheap Energy Platform Local Judge - 2026-05-16

Target: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md` and `content/lens/episodes/interview-obqsun0g0u4/read.json`

Judge mode: local, not independent. Reviewed in both reader/world-model and grounding/provenance modes.

## Reader / World-Model

- Severity: Low
- File and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`, new cheap-energy lens point
- Problem: The first draft said security guarantees "depend on" the energy order, which slightly overclaimed the causal direction. Jiang's cited move couples Gulf energy, food, tourism, desalination, and American protection in one exposed imperial system, but the security guarantee also underwrites the platform.
- Fix applied: Reworded the lens point to say these elements are "coupled inside the same imperial order."

Residual risk: The source has ASR noise around "Strait of Hormuz" and "GCC," but the public read and clean transcript both preserve enough local support for the mechanism. The new text avoids unsupported correction of names beyond the already normalized public context.

## Grounding / Provenance

- Severity: Low
- File and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`, new source-trail entry
- Problem: The source trail named desalination and American security guarantees but initially listed refs 0055, 0056, 0058, and 0059, omitting 0057 where Piers states the food, water, desalination, expat, and U.S. security setup.
- Fix applied: Added `video:interview-obqsun0g0u4@transcript:v1#seg-0057` to the source-trail entry.

Residual risk: The lens point has six episode backlinks. They are concept-scoped rather than decorative: each linked mark names either cheap energy as platform, de-industrialization as shock response, GCC structural exposure, Dubai glamour, or shattered imperial aura.

## Boundary

This belongs in Strategy Material Test because the active mechanism is a material audit of war and empire: a chokepoint tests whether oil, food, fertilizer, semiconductors, AI infrastructure, desalination, tourism, and security guarantees can keep functioning. Power As Alchemy owns dollar belief, Nation As God-Machine owns population-war machinery, and Eschatology As Script owns the sacred role layer that appears later in the interview.
