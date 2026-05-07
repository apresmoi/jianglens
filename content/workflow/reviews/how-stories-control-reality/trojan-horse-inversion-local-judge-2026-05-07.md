# Local Judge: Trojan-Horse Story Inversion

Date: 2026-05-07
Target: `website/src/content/docs/lens/how-stories-control-reality.md`
Scope: Aeneid anti-Homer addition and `lens-point:stories-trojan-horse-inverts-inherited-world`
Review mode: local reader/world-model and grounding/provenance review
Independence: local only; independent judge agents were not used in this runtime

## Reader / World-Model Pass

Pass. The mutation advances the Stories Control page by adding a distinct inversion mechanism: a story can control reality by entering an already memorized cultural world and reversing what its inherited scenes teach. The section does not turn the Aeneid material into a general anti-Roman or anti-literature claim. It keeps the active mechanism on story-world infiltration: Homer cannot simply be burned because he already lives in memory, so the counter-story imitates and inverts him until love, mercy, Greek culture, and freedom feel dangerous.

The boundary note is useful. Poetry owns language, rhythm, performance, and civilizational formation. Guide Trap owns Virgil as the necessary guide whose world Dante must release. Legitimacy Fiction owns imperial authorization. Stories Control owns the inversion layer: an existing world is inhabited, recoded, and made to train desire and judgment differently.

Residual risk: "Trojan horse" can become a generic keyword for infiltration. Future links should require both halves of the mechanism: an inherited or rival story-world that cannot be erased, and a counter-story that enters through familiar beauty, trust, education, or cultural prestige before reversing the moral charge.

## Grounding / Provenance Pass

No blocking grounding findings.

- `website/src/content/docs/lens/how-stories-control-reality.md:48` is supported by `video:predictive-history-rkpgrrugjnk@transcript:v1#seg-0039`, which explicitly says Greek culture is like a Trojan horse and will corrupt/destroy the city if admitted.
- `website/src/content/docs/lens/how-stories-control-reality.md:50` is supported by `video:predictive-history-ebwtrvjz1dw@transcript:v1#seg-0003`, where Jiang says people have memorized Homer, so Rome needs to corrupt Homer through the Aeneid as anti-Homer and inversion.
- `website/src/content/docs/lens/how-stories-control-reality.md:52` uses a compact durable lens point. Its evidence spans carry the point: the 2024 lecture names Greek culture as Trojan horse; the 2026 lecture names anti-Homer/inversion, love and Homeric values as evil, and Greek theater/philosophy/rhetoric as deceptive craft.
- `website/src/content/docs/lens/how-stories-control-reality.md:56` is locally falsifiable. `seg-0005` supports the claim that the story teaches Homer's values and love as evil; `seg-0012` supports theater/philosophy/rhetoric being recoded as deception.
- Episode links are exact marks, not loose paragraph tags: `content/lens/episodes/predictive-history-ebwtrvjz1dw/read.json:65`, `content/lens/episodes/predictive-history-ebwtrvjz1dw/read.json:113`, and `content/lens/episodes/predictive-history-rkpgrrugjnk/read.json:268`.

## Findings Applied

- Low - episode backlink surface. The first pass added `lens_points` only to top-level episode marks in the anti-Homer read, which did not generate reverse episode links. The links were moved into paragraph mark objects, and compile confirmed three generated backlinks to `lens-point:stories-trojan-horse-inverts-inherited-world`.

## Decision

Pass for public concept deepening. Validate with compile, content validation, diff check, and website build before PR.
