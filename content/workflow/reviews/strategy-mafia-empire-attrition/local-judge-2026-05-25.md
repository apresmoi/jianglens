# Local Judge: Strategy Mafia Empire Attrition

Date: 2026-05-25

Scope reviewed:

- `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- `content/lens/episodes/interview-xrk5vsezj4y/read.json`

Judge mode: local only. Independent judge agents were not used in this run.

## Reader / World-Model Pass

- Result: Pass with residual risk.
- The change teaches a usable Strategy Material Test mechanism rather than re-summarizing the interview: the page now distinguishes the real-player Game Theory patch from the material question of who pays, buys weapons, drafts soldiers, and absorbs domestic blowback.
- The boundary remains intact. Game Theory owns the proxy-player naming; Strategy owns the material attrition of allies and the escalation produced by debt, sunk costs, and face.
- Residual risk: the "mafia empire" phrase is vivid and inflammatory. The page keeps it attributed to Jiang and ties it to specific material mechanisms so it does not become free-floating rhetoric.

## Grounding / Provenance Pass

- Result: Pass with residual risk.
- The new inline evidence marks are locally falsifiable:
  - `seg-0019` supports the debt, NATO-fights-on-behalf, and mafia-empire claims.
  - `seg-0020` supports the weapons, GDP, draft, and European-death pressure.
  - `seg-0032` supports the billions invested, rare-earth promises, loss of face, and sunk-cost continuation.
- The existing episode read now links exact marks rather than broad paragraphs:
  - "It's a mafia empire." links to `lens-point:strategy-vassal-proxy-attrition`.
  - "there's something called a sunk cost fallacy" links to `lens-point:strategy-debt-war-cannot-admit-defeat`.
- Residual risk: `seg-0020` contains an apparent ASR issue in "Ukraine has too many advantages" where the argument likely means Russia. The patch does not cite that phrase and avoids depending on it.

## Applied Findings

- No blocking findings.
- Added evidence refs to the two durable Strategy lens points so the episode backlinks point to anchors whose hover payloads now include the same source pressure.
