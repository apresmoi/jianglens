# Local Judge Review: Strategy Four-Dimensional War

Target:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- `content/lens/episodes/predictive-history-mk4vchtawso/read.json`

Review mode: local only. Independent judge agents were not used in this runtime.

## Reader / World-Model Judge

Finding: pass with one low wording issue applied during review.

The new section teaches a usable strategy lens rather than summarizing the whole Pax Judaica lecture. It defines the four dimensions, preserves Jiang's harsh contrast between brittle imperial military hierarchy and adaptive Iranian ordering, and keeps the boundary clear: this is operational feedback and material-test strategy, not a new Nation, Eschatology, Game Theory, or Power Alchemy page.

Applied fix:

- Low: the first draft said the American plan was "decapitation and forced surrender." The cited transcript span more directly supports forced surrender and making other spheres conform to the military strategy. The prose was tightened to "aims at forced surrender."

Residual risk:

- The Pax Judaica lecture contains larger speculative claims about Israel replacing America. This patch uses only the four-dimensional-war mechanism and avoids promoting the replacement-empire forecast into a public lens claim.

## Grounding / Provenance Judge

Finding: pass after the wording fix above.

Evidence checks:

- `seg-0017` directly supports war having narrative, political, economic, and military dimensions.
- `seg-0018` directly supports the American model of forcing narrative, political, and economic spheres to conform to the military strategy.
- `seg-0019` directly supports the Iranian reversal: using military action to affect economic, political, and narrative spheres.
- `seg-0020` supports narrative shaping and the reflection contrast.
- `seg-0021` supports flexibility/adaptation and U.S. double-down risk.
- `seg-0022` supports resilience, replenishment, and support differences.

Lens point check:

- `lens-point:strategy-four-dimensional-war-orders-the-board` is compact, durable, and specific to the Strategy Material Test page.
- The episode read links are attached to exact paragraph-level marks inside the Four-Dimensional War beat, not to broad geopolitical speculation.

Validation expectation:

- Re-run compile after this review record, then full content validation and website build before PR.
