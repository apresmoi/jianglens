# Local Judge Review: Game Theory Optimal Terror

Date: 2026-05-07
Target: `website/src/content/docs/lens/game-theory.md`
Episode linkage: `content/lens/episodes/predictive-history-mpqzapnjykm/read.json`
Review mode: local reader/world-model and grounding/provenance review. Independent judge agents were not used in this runtime.

## Reader / World-Model Judge

- Severity: Low
  File: `website/src/content/docs/lens/game-theory.md:86`
  Problem: The draft initially risked making a general claim that terror is rational "only" under one set of conditions.
  Why it matters: Jiang Lens should preserve the source's frightening logic without turning one Mongol case into a universal doctrine about terror.
  Applied fix: Rephrased the sentence as source-scoped: "In this source, terror becomes rational inside..." The page now keeps the method boundary: constraint changes payoff structure.

- Severity: Residual risk
  File: `website/src/content/docs/lens/game-theory.md:74`
  Problem: The section is necessarily morally severe and may be misread as endorsement if isolated from the surrounding caveats.
  Why it matters: The page must teach diagnosis without admiring coercion.
  Disposition: No further patch. The section explicitly says the answer is not moral approval, names the mechanism as constraint analysis, and keeps the boundary note at the end.

## Grounding / Provenance Judge

- Severity: Low
  File: `content/lens/episodes/predictive-history-mpqzapnjykm/read.json:319`
  Problem: A broad paragraph-level `lens_points` link would have been less precise and less reliable for generated backlinks.
  Why it matters: Episode-to-lens links should point to exact marks that carry the mechanism.
  Applied fix: Moved the first link onto the existing "You basically have to cheat in order to win" mark, then compile-confirmed four generated backlinks.

- Severity: Residual risk
  File: `website/src/content/docs/lens/game-theory.md:80`
  Problem: The lens point combines several transcript spans into one compact reusable statement.
  Why it matters: A durable lens point should remain hoverable and source-backed.
  Disposition: Accepted. The supporting refs directly cover optimal strategy under constraints, weaker-actor cheating, escalation/terror, and reputation making surrender rational.

## Result

The draft passes local judge after one reader-scope patch and one provenance-link precision patch. Remaining risk is interpretive tone, not a blocking grounding issue.
