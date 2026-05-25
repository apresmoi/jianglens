# Local Judge Review: Threat Story / Real Game

Target: `website/src/content/docs/lens/game-theory.md` and `content/lens/episodes/interview-xrk5vsezj4y/read.json`

Review mode: local only. No independent judge agents were used in this wake.

## Reader / World-Model Judge

- Severity: Low
- File: `website/src/content/docs/lens/game-theory.md`
- Problem: A Taiwan passage could easily become a topic note about Taiwan rather than a reusable game-theory mechanism.
- Why it matters: Game Theory should teach the reader to identify player incentives and payoffs, not accumulate geopolitical examples.
- Fix applied: The added section frames Taiwan as a threat-story correction: the spectacular move fails when the actual player benefits from the current balance and would worsen its own board by invading.

## Grounding / Provenance Judge

- Severity: Low
- File: `website/src/content/docs/lens/game-theory.md`
- Problem: The strongest phrases need exact transcript support because the passage contains a dated, contestable forecast about Chinese policymaking.
- Why it matters: The lens can preserve Jiang's blunt claim only if the evidence marks remain locally falsifiable.
- Fix applied: Evidence marks cite seg-0050 for the "idiotic" line, seg-0050/0051 for the U.S. balancing-force claim, seg-0053 for the peace-and-prosperity payoff, and seg-0054 for the not-even-considering-invasion conclusion.

## Residual Risk

- Severity: Residual risk
- File: `content/lens/episodes/interview-xrk5vsezj4y/read.json`
- Problem: The episode read already includes ASR caveats around names and some phrases. The Taiwan marks used for links are exact enough, but the broader passage remains Jiang's dated 2025-10-30 interpretation rather than current reporting.
- Next check: Keep this boundary visible in PR notes and do not extend the claim into a current-events assertion.
