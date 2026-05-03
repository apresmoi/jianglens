# Agent Operating Rules

This repo is a markdown-first Jiang Lens project. Preserve the boundary between authored content, generated views, and deployment code.

## Directory Authority

- `content/` is canonical project state.
- `ops/` is tooling for compiling, validating, and ingesting content.
- `website/` is a renderer. Treat generated files under `website/src/content/docs/generated/` and `website/src/data/lens/` as compiler outputs.
- `docs/research/` is archived research context, not operational state.

## Canon Rules

- Canonical Jiang lens material must cite Jiang-authored or Jiang-spoken source spans.
- Do not promote agent interpretation directly into `content/lens/canon/`.
- Draft interpretive work in `content/workflow/proposals/`.
- Record grounding and consistency checks in `content/workflow/reviews/`.
- Record accepted changes in `content/workflow/promotions/`.
- Keep external commentary in `content/lens/commentary/`; it does not rewrite canon.

## Source Refs

Use versioned source refs:

```text
video:<manifestation-id>@transcript:v<version>#seg-0001
article:<article-id>@text:v<version>#p-0001
interview:<interview-id>@transcript:v<version>#seg-0001
```

Target refs use deterministic paths:

```text
canon:model/<slug>        -> content/lens/canon/models/<slug>.md
glossary:<slug>           -> content/lens/glossary/<slug>.md
ledger:prediction/<slug>  -> content/lens/ledger/predictions/<slug>.md
```

## Website Linkage

When adding canon prose that should expose provenance in the website, prefer claim blocks:

```md
:::claim{id="world-model-example-001" evidence="evidence:example"}
Claim text that should display source provenance in a rich popover.
:::
```

The compiler indexes these blocks for generated site data. Claims without evidence can exist in drafts, but canonical pages should not rely on unsupported claims.

Public docs also support inline evidence marks:

```md
[visible phrase]{evidence="video:<manifestation-id>@transcript:v1#seg-0001"}
```

`node ops/scripts/compile-content.mjs` compiles these marks into `website/src/data/lens/link-index.json` and `content/_generated/link-index.json`. The JSON maps docs to exact video transcript segments and maps source refs back to the docs that cite them. `node ops/scripts/validate-content.mjs` validates that generated JSON against the authored docs and episode JSON, so stale or dangling lens references should fail validation.

Durable concepts that episodes should be able to cite must be tagged as Markdown-first lens points:

```md
<!-- lens-point id="guide-trap-necessary-guide" concept="guide-becomes-trap" evidence="video:<manifestation-id>@transcript:v1#seg-0001" -->
<span id="guide-trap-necessary-guide" class="lens-point-anchor"></span>
The reusable lens point text goes here.
```

Episode read marks can point to those IDs:

```json
{
  "text": "The guide is part of the trap.",
  "lens_points": ["lens-point:guide-trap-necessary-guide"],
  "refs": ["video:<manifestation-id>@transcript:v1#seg-0001"]
}
```

Do not create JSON-first lens documents by default. Author public lens pages in Markdown, then let the compiler emit JSON indexes for hovers, backlinks, validation, and agent consumption.

## Validation

Run both commands before handing off meaningful content or tooling changes:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
```

For website changes, also run:

```bash
cd website && npm run build
```

When adding or changing corpus impact files, also run:

```bash
node ops/scripts/validate-corpus-impact.mjs --all
```

## Colab Video Pipeline

When working on YouTube download, diarization, transcription, Drive sync, or Colab automation, read `.codex/skills/colab-video-pipeline/SKILL.md` first. The Drive root is `MyDrive/jianglens`. Do not commit cookies, tokens, browser profiles, audio, or video.

## Skill Selection

Skills are process contracts, not agent personas. Use the narrowest skill that matches the artifact being produced:

- safe autonomous repo work: `.codex/skills/jiang-autonomous-work-protocol/SKILL.md`
- staged source artifacts into canonical source transcripts: `.codex/skills/jiang-source-ingest/SKILL.md`
- transcript packet semantics: `.codex/skills/jiang-agent-transcript-pass/SKILL.md`
- transcript boundary decisions: `.codex/skills/jiang-transcript-boundary-review/SKILL.md`
- one public episode read: `.codex/skills/jiang-episode-read-writer/SKILL.md`
- generated episode data and route/build validation: `.codex/skills/jiang-episode-publisher/SKILL.md`
- one-video source-to-site integration test: `.codex/skills/jiang-video-e2e/SKILL.md`
- per-episode corpus impact and mutation level: `.codex/skills/jiang-corpus-impact-pass/SKILL.md`
- one public concept page: `.codex/skills/jiang-lens-concept-writer/SKILL.md`
- public lens atlas maintenance: `.codex/skills/jiang-lens-atlas-maintainer/SKILL.md`
- evidence marks, hovers, backlinks, and lens-point links: `.codex/skills/jiang-provenance-linker/SKILL.md`
- canon/glossary/ledger promotion: `.codex/skills/jiang-canon-promotion/SKILL.md`
- adversarial review: `.codex/skills/jiang-lens-judge/SKILL.md`

## Source Ingest

When importing synced source artifacts, resolving YouTube dates, creating canonical transcripts, or preparing transcript packets, read `.codex/skills/jiang-source-ingest/SKILL.md` first. Preserve dated source refs; do not collapse older and newer Jiang positions into an undated summary.

## Agent Transcript Pass

When processing transcript packets into interactions, claims, signature moments, glossary candidates, or chronology notes, read `.codex/skills/jiang-agent-transcript-pass/SKILL.md` first. Treat diarization as a hint and return schema-shaped JSON with exact refs. Signature moments preserve Jiang-specific metaphors, reversals, images, and provocative causal chains that should survive public episode compression.

Use `gpt-5.5` with `reasoning_effort: xhigh` for normal video parsing agents. Smaller or lower-reasoning models are only for explicit maintainer-requested experiments, benchmarks, or bounded mechanical review.

## Transcript Boundary Review

When reviewing candidate moves between adjacent transcript segments, read `.codex/skills/jiang-transcript-boundary-review/SKILL.md` first. Do not rewrite transcripts directly; write approve/reject decisions under `content/workflow/reviews/<source-slug>/transcript-boundary-decisions.json`.

## Video E2E

When asked to process a video end to end, read `.codex/skills/jiang-video-e2e/SKILL.md` first. The orchestrator is `ops/scripts/process-video-e2e.mjs`; agents fill missing semantic packet outputs, write the public episode read, and publish generated episode data through the narrower process skills.

When delegating semantic packet processing, signature-moment extraction, or episode-read drafting/revision during Video E2E, spawn agents with `model: gpt-5.5` and `reasoning_effort: xhigh`.

## Lens Distillation

When asked to use processed episodes to build the Jiang Lens, update concept documentation, draft glossary/canon material, or compare Jiang positions across multiple sources, read `.codex/skills/jiang-lens-distillation/SKILL.md` first, then use the narrow process skill it points to. This is separate from video E2E: publishing a readable episode is one job; corpus impact and cross-episode lens synthesis are follow-on jobs.

Before handing off substantial lens documentation or canon/glossary drafts, run the judge gate in `.codex/skills/jiang-lens-judge/SKILL.md`. Prefer two read-only xhigh judge agents when the user has authorized agent review: one reader/world-model judge and one grounding/provenance judge. If judges are not run independently, say so explicitly.
