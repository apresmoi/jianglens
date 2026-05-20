# Local Judge: Vassal Proxy Attrition

Date: 2026-05-20

Artifact reviewed:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- `content/lens/episodes/interview-qsxkdk4mzgk/read.json`

Scope:

- Added Strategy Material Test section `Vassals As Proxy Attrition`.
- Added `lens-point:strategy-vassal-proxy-attrition`.
- Linked four exact marks in `interview-qsxkdk4mzgk`.

Judge mode:

- Local reader/world-model judge.
- Local grounding/provenance judge.
- Independent judges were not used in this wake.

## Reader / World-Model Judge

Finding: pass with residual risk.

The section teaches a usable Strategy mechanism rather than merely summarizing the interview. The boundary is clear: Game Theory owns player-positioning and payoff naming; Strategy owns the material audit of whose bodies, resources, territory, wealth, and legitimacy are being spent. The page placement is appropriate because the passage extends existing imperial-muscle and replacement-capacity themes rather than requiring a new concept page.

Residual risk: the source is undated, so the section should not be used to make chronology claims beyond the local source trail. Current prose calls it the undated Russia Today interview and avoids chronology escalation.

## Grounding / Provenance Judge

Finding: pass.

The inline evidence marks are locally falsifiable:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:200` uses `seg-0023` for the divide-and-rule tactic.
- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:202` uses `seg-0023` for Japan's resources and wealth being treated as America's.
- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:208` uses `seg-0024` for the Peloponnesian cannon-fodder/proxy analogy.

The lens point at `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:204` has a stable ID, compact hover text, and refs that support the mechanism. Episode links at `content/lens/episodes/interview-qsxkdk4mzgk/read.json:243`, `:263`, `:272`, and `:281` point to exact marks rather than loose paragraph-level topic language.

Validation note: `node ops/scripts/compile-content.mjs` and `node ops/scripts/validate-content.mjs` passed after the patch, and generated link data contains the new lens point plus four episode backlinks.
