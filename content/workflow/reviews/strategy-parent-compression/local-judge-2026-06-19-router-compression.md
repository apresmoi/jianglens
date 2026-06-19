# Local Judge: Strategy Parent Router Compression

Date: 2026-06-19
Reviewer: Plato local self-review
Target: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`

## Reader / World-Model Pass

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- concrete problem: No independent judge agents were used; this review is local only.
- why it matters for Jiang Lens: Public Strategy prose is visible lens surface, and compression can accidentally turn Jiang's hard material audit into generic routing language.
- suggested fix: Request Dante review before merge, measuring reader usefulness, boundary clarity, and whether the parent still teaches the material-test mechanism.

- severity: Low
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:12`
- concrete problem: The new opening router names child pages earlier than before.
- why it matters for Jiang Lens: Early routing can read like internal atlas management if it displaces the concept's pressure.
- suggested fix: Accept as a bounded usability tradeoff because the preceding paragraphs still define Jiang's material test through economics, organization, logistics, and story contact with the board.

## Grounding / Provenance Pass

- severity: Residual risk
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md`
- concrete problem: This patch preserves existing evidence marks and lens-point IDs but does not re-open every cited transcript segment.
- why it matters for Jiang Lens: The PR should be treated as compression and navigation repair, not new source interpretation.
- suggested fix: Run compile, validate-content, validate-corpus-impact --all, website build, and Dante review. Do not add new evidence claims or episode read JSON links in this PR.

- severity: Low
- file and line reference: `website/src/content/docs/lens/when-war-becomes-a-story-instead-of-a-material-test.md:56`
- concrete problem: Merging child-route material removes a standalone Imperial Retrenchment parent section.
- why it matters for Jiang Lens: The parent still needs to tell readers where cost-transfer material went.
- suggested fix: Accepted because the new Child Routes section names Imperial Retrenchment alongside Chokepoint and No-Exit War, preserving the route while reducing repeated parent prose.

## Corpus Anchor Pass

Checked against PR #1062's Strategy fan-in checkpoint and the current authored page surface. The live pressure is navigation/compression pressure, not a new child concept. The edit keeps Strategy as the material-test parent, preserves all stable lens-point IDs, leaves episode read JSON untouched, and routes the dense access-control, no-exit, and cost-transfer clusters to their existing child pages.
