---
review_id: the-borderland-engine-local-judge-2026-05-05
target: website/src/content/docs/lens/the-borderland-engine.md
reviewed_at: 2026-05-05
reviewer: lens-steward
mode: local
independent: false
---

# Local Judge Review: The Borderland Engine

Independent judge agents were not used in this runtime. Plato performed both required judge modes locally.

## Reader / World-Model Judge

- **Status**: Pass after patch.
- **Finding applied**: The draft risked romanticizing poverty and marginality. The "Poverty Is Not Magic" section and lens point now explicitly separate deprivation from organized energy, openness, cohesion, learning, and strategic motion.
- **Residual risk**: The page synthesizes many civilizational cases. Future work could deepen the "leader, poet, prophet, school, or trade network" organizer problem as a separate positive mechanism once more source clusters are reviewed.

## Grounding / Provenance Judge

- **Medium**, `website/src/content/docs/lens/the-borderland-engine.md`: The "stable is stagnant" episode mark initially linked to a victory-reversal lens point. Patched by adding `lens-point:borderland-engine-stable-stagnant` and moving the episode link there.
- **Medium**, `website/src/content/docs/lens/the-borderland-engine.md`: The temple-equilibrium example named a specific Mesopotamian rule without a local inline mark. Patched with `video:predictive-history-z0awfin83lo@transcript:v1#seg-0012` and `#seg-0013`.
- **Medium**, `website/src/content/docs/lens/the-borderland-engine.md`: The after-victory paragraph compressed Athens and later Chinese imperial control without close enough evidence marks. Patched with Persian Wars refs for Athens and `predictive-history-a2lmjerhckm` refs for the death of open competition.

## Linkage Check

Episode `lens_points` links were added only to specific existing episode marks:

- `predictive-history-ybufqry77pq`: `energy, openness, and cohesion` -> `lens-point:borderland-engine-energy-openness-cohesion`
- `predictive-history-ybufqry77pq`: `poverty forces the qualities wealth destroys` and `poverty is not magic` -> `lens-point:borderland-engine-poverty-not-magic`
- `predictive-history-z0awfin83lo`: `Stable is stagnant.` -> `lens-point:borderland-engine-stable-stagnant`
- `predictive-history-z0awfin83lo`: `energy, openness, and cohesion against empire's mass, organization, and death` and `The borderland has energy, openness, and cohesion.` -> `lens-point:borderland-engine-energy-openness-cohesion`
- `predictive-history-7k5xolzwmls`: Viking borderland marks about poor/practical/opportunistic people and borderland strengths -> `lens-point:borderland-engine-energy-openness-cohesion`
