# Strategy Material Test: Society Cannon Local Judge

Date: 2026-05-07

Target:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- `content/lens/episodes/predictive-history-dirjyy-8v54/read.json`

Review mode: local reader/world-model and grounding/provenance review. Independent judge agents were not used in this runtime.

## Reader / World-Model Judge

Decision: pass after one chronology-order patch.

The new section improves the page because it gives the strategy material-test concept an older structural primitive: a war form is not just a battlefield choice but a demand placed on society. The section teaches the mechanism rather than summarizing the gunpowder lecture: hoplites, rowers, cavalry, knights, and cannons each require a different political and economic world, and gunpowder becomes a whole-society test.

The boundary is clear. Strategy owns whether a military form is materially executable. Nation owns the later population/school/welfare/industry war machine once scaled. Education owns what schooling does to the soul. Bureaucracy owns institutional monopoly and hierarchy preservation. Borderland owns hunger, openness, and margin motion.

Finding patched:

- severity: Low
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`, Chronology section
- concrete problem: The new April 2025 chronology line originally appeared after August 2025.
- why it matters for Jiang Lens: Chronology is part of meaning; this source is an earlier structural formulation and should appear before later Iran-war updates.
- fix applied: Moved the April 2025 line between November 2024 and June 2025.

## Grounding / Provenance Judge

Decision: pass.

The inline evidence marks are locally falsifiable:

- `seg-0001` and `seg-0003` support the military-form/political-form rule.
- `seg-0010` supports the gunpowder/organization contrast between borderlands and empires.
- `seg-0043` supports the whole-society approach and all-resources-directed-to-battle phrase.

The new lens point `lens-point:strategy-war-form-demands-society` is compact, unique, and supported by the cited cluster: `seg-0001`, `seg-0010`, `seg-0014`, `seg-0041`, `seg-0042`, `seg-0043`, and `seg-0045`.

The four episode links are exact and generated successfully:

- `The nature of the military determines the nature of the political system`
- `all resources are directed to the use of gunpowder in battle`
- `if you are really to integrate gunpowder into your military effectively, you need to change the structure of your society`
- `a radical social transformation that overturns the entire social hierarchy`

Residual risk: the new section sits near the top of a page whose opening still uses the Hollywood-Pentagon lecture as the explicit modern formula. That is acceptable because the section is framed as the deeper historical rule, and the existing source trail/chronology keeps later formulations visible.
