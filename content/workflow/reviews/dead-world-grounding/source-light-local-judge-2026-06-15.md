# Dead World Grounding Review - 2026-06-15

Review target: `website/src/content/docs/lens/the-dead-world-and-the-cave.md`

Prompting signal: Cassandra flagged the public page as heavily referenced but source-light: generated refs/backlinks made it visible across the lens while the authored page cited only two local video slugs.

Review mode: local Plato reader/world-model judge plus grounding/provenance judge. No independent judge agents were used.

## Measurements

- Authored page before patch: about 4,323 words, 67 evidence attributes, 6 stable lens-point anchors, and 2 local source slugs (`predictive-history-9murgjjg4aa`, `predictive-history-tsd-8fga84a`).
- Authored page after patch: about 4,382 words, 70 evidence attributes, 6 stable lens-point anchors, and 3 local source slugs after adding `interview-vslrlvctwra`.
- Size pressure: no split pressure yet. The page is under the 6,000-word watch threshold and the mechanism is still one parent concept: false material ontology, cave-wall mediation, attention/imagination capture, death-fear enforcement, and escape practice.
- Navigation pressure: high incoming conceptual pressure, but much of it is legitimate boundary routing from neighboring pages rather than evidence that the page itself needs splitting.

## Reader/World-Model Judge

- Severity: Low
- File and line reference: `website/src/content/docs/lens/the-dead-world-and-the-cave.md:8`
- Concrete problem: The page is entry-point strong and teaches a usable Jiang lens, but it previously opened as if the source trail began with the October 15 classroom formulation.
- Why it matters: The 2025-10-02 Stoa interview shows the same mechanism publicly before the Secret History lecture: power teaches that matter is all there is, death is final, and obedience is survival. Leaving that out made the page look more classroom-derived than the corpus supports.
- Fix applied: Added the October 2 interview to the opening chronology and the `Chronology So Far` section.

- Severity: Residual risk
- File and line reference: `website/src/content/docs/lens/the-dead-world-and-the-cave.md:128`
- Concrete problem: The Great Books escape-practice section is strong but rests mainly on `predictive-history-tsd-8fga84a`.
- Why it matters: Later sources already pressure a broader escape-practice cluster: Jesus/Thomas as inner kingdom and spark, Talese as memory/light creation, and possible altered-perception practice. Appending all of that now would overgrow the page without a split decision.
- Suggested fix: Do not append ordinary examples. If future work expands this area, run a concept-scoped replacement/compression that compares `interview-vslrlvctwra`, `predictive-history-pp0e1gb80wq`, and `predictive-history-vwmphhnzuiw` against this page, Free Will, Human Heart, Poetry, and Attention.

## Grounding/Provenance Judge

- Severity: Medium
- File and line reference: `website/src/content/docs/lens/the-dead-world-and-the-cave.md:10`
- Concrete problem: The phrase "earliest current source trail" was inaccurate after `interview-vslrlvctwra` corpus-impact accounting identified an earlier public recurrence.
- Why it matters: Chronology is meaning in Jiang Lens. The October 2 interview makes the concept a public power diagnosis before it becomes an October 15 classroom cosmology and a January 7 Great Books foundation.
- Fix applied: Replaced the sentence with an October 2 evidence mark and changed the October 15 clause to a later classroom formulation.

- Severity: Low
- File and line reference: `website/src/content/docs/lens/the-dead-world-and-the-cave.md:104`
- Concrete problem: The `dead-world-death-fear-enforces-machine` lens point was adequately supported by Secret History #9, but it did not cite the earlier interview recurrence even though the existing impact file says the interview directly links to that anchor.
- Why it matters: Episode-to-lens navigation will be clearer if the durable anchor itself carries the earlier public interview evidence, not only a later classroom source.
- Fix applied: Added `interview-vslrlvctwra` segments 0016 and 0018 to the lens-point evidence.

- Severity: Residual risk
- File and line reference: `content/lens/episodes/interview-vslrlvctwra/read.json`
- Concrete problem: The Stoa interview public read has a candidate link to `lens-point:dead-world-death-fear-enforces-machine`, but this pass did not edit episode read JSON.
- Why it matters: The requested work was page grounding/review, not a provenance-link batch. A one-link episode edit would risk turning the run into backlink maintenance.
- Suggested fix: If provenance follows, batch the Stoa interview's Dead World, Taboo, Secret Society, Mass Society, Human Heart, and Living School candidate links concept-scope or source-scope rather than making a one-anchor PR.

## Boundary Decision

Keep `the-dead-world-and-the-cave.md` whole. The page is source-light but not weakly grounded: `predictive-history-tsd-8fga84a` is the founding Great Books cave lecture, `predictive-history-9murgjjg4aa` supplies the death-fear and inversion layer, and `interview-vslrlvctwra` now gives the earlier public recurrence.

Do not create standalone Materialism As Governance, Death Fear, Corpse World, Divine Spark, Inner Kingdom, Transhumanist Trap, Great Books Escape, or Sparks Of Light pages from this review. Route neighboring pressure by active mechanism:

- Dead World owns material-only ontology, cave-wall mediation, death-fear enforcement, chosen false reality, and escape practice.
- Free Will owns chosen slavery, self-refusal, and the burden of noncoercive truth.
- Human Heart owns forgiveness, love, shame-facing, and concrete recognition.
- Poetry owns public memory, language, and living author-worlds.
- Attention owns focused consciousness as extractable energy.
- Eschatology owns heaven/hell role scripts and final-order choreography when those scripts coordinate actors.

## Next Useful Mutation

The best next Dead World move is not more one-source append work. Use this review as a checkpoint for either:

1. a concept-scoped replacement/compression that integrates the October 2 interview, Jesus/Thomas corpse-world material, and Talese sparks-of-light material without exceeding parent size, or
2. a source-scoped provenance-link batch for `interview-vslrlvctwra` if navigation pressure makes the episode-to-lens links more urgent than public prose.
