# Local Judge Review: Aeneid Robot Formation

Date: 2026-05-07
Reviewer: Plato local judge
Target: `website/src/content/docs/lens/how-stories-control-reality.md`
Review mode: reader/world-model plus grounding/provenance
Independence: local only; independent judge agents were not used in this runtime

## Reader / World-Model Pass

No blocking findings after patch.

The edit advances the story-control page rather than merely summarizing another Virgil lecture. The existing page already had the Trojan-horse inversion: power enters Homer's inherited world and reverses its moral charge. Great Books #8 adds the missing completion layer: the story does not only make love look dangerous from outside; it trains a reader to inhabit Aeneas until love, pity, decency, and human hesitation feel like weakness. That is a durable story-control mechanism because the command becomes internal.

The concept boundary is clear enough. The new section belongs to **How Stories Control Reality** because narrative education remakes conscience and command. **How Poetry Creates Civilization** still owns language, rhythm, memory, and poetic world-making. **The Guide Who Becomes A Trap** still owns Virgil as a necessary mediator whose world Dante must release. **Legitimacy Fiction** still owns imperial authorization and Rome's political inheritance. The new boundary note in the room and the section's placement after Trojan-horse inversion keep those neighboring pages from being blurred.

Residual risk:

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/how-stories-control-reality.md:60`
- concrete problem: The section title says "soldier" while the lens point says "imperial robot."
- why it matters for Jiang Lens: "Robot" is Jiang's sharpest formulation, but a title using only "robot" might read gimmicky without context.
- suggested fix: Keep the current title. The section body preserves Jiang's robot formulation in the lens point and source evidence while the heading gives a reader a concrete military formation frame.

## Grounding / Provenance Pass

No blocking findings after patch.

The evidence marks are locally falsifiable:

- `predictive-history-yxtrlvfirt8@seg-0001` and `seg-0002` support the love-versus-piety and obedience-to-mission contrast.
- `seg-0046` supports the political-propaganda claim and Rome/Carthage justification frame.
- `seg-0047` supports Dido's Carthaginian founder memory and the Aeneid's poison/revenge inversion.
- `seg-0062` supports the internal-command moment where mercy is rejected and pity/emotion/soul are abandoned.
- `seg-0063` supports the lens point's repeated-inhabitation mechanism: propaganda, brainwashing, memorized poetry, becoming Aeneas, and becoming a robot.
- `seg-0067` and `seg-0068` support the education-in-utility/compliance rather than love bridge.

The generated backlink inspection confirmed four exact links to `lens-point:stories-aeneid-trains-imperial-robot` from the Great Books #8 episode. The links are attached to paragraph marks, not top-level signature marks, because the compiler indexes paragraph/opening/question marks for `episode_lens_links`.

Residual risk:

- severity: Low
- file and line reference: `content/lens/episodes/predictive-history-yxtrlvfirt8/read.json:151`
- concrete problem: The source transcript uses noisy ASR names such as "Ditto" and "Tarnas," while public episode prose normalizes Dido and Turnus.
- why it matters for Jiang Lens: This is acceptable because the episode source notes already document the ASR issue and the paragraph refs point to the right segments, but future grounding reviews should remember that the exact transcript text is noisy.
- suggested fix: No patch needed. Keep public prose normalized and cite the existing source note when questions arise.

## Applied Findings

- Reordered the lens-point evidence so `seg-0063`, the strongest direct support for repeated-inhabitation and robot formation, appears first.
- Reordered the public evidence mark for education in utility/compliance so `seg-0067`, the direct source span, appears first.
