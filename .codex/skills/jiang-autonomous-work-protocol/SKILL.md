---
name: jiang-autonomous-work-protocol
description: Use this skill when a Jiang Lens autonomous agent needs to discover, claim, perform, validate, and hand off repo work without overwriting other agents or confusing authored, generated, and staged artifacts.
---

# Jiang Autonomous Work Protocol

Use this as shared operating hygiene for autonomous Jiang Lens agents. This is not an orchestrator and not a persona. It is the minimum protocol for doing independent repo work safely.

## Authority

- `content/` is canonical project state.
- `ops/` contains tooling, schemas, scripts, notebooks, and staging.
- `website/` renders the public site.
- Generated files under `website/src/content/docs/generated/`, `website/src/data/lens/`, and `content/_generated/` are compiler outputs.
- Never commit cookies, browser profiles, tokens, raw audio, or raw video.

## Work Discovery

Prefer explicit user instructions. If none exist, discover work from deterministic repo state:

- Ready staged videos: `node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory`
- Existing source tasks: `content/workflow/tasks/<source-slug>/`
- Existing proposals: `content/workflow/proposals/`
- Existing public episode reads: `content/lens/episodes/<source-slug>/read.json`
- Existing lens docs: `website/src/content/docs/lens*.md`

Before editing, inspect `git status --short`. Treat unknown changes as another agent's or maintainer's work. Do not revert them.

## Claiming Work

If the repo has a task file for the work type, write or update only the task state expected by that process. If no claim mechanism exists yet, keep the write set narrow and announce it in the handoff.

Good write scopes:

- one source folder plus its matching workflow/proposal folders,
- one episode `read.json`,
- one public lens concept doc,
- one validation/provenance patch across files that already reference each other.

Avoid broad edits across unrelated pages. Do not rewrite a whole atlas or concept family when the task asks for one delta.

## Execution

Load the specific process skill for the job:

- staged video import: `jiang-source-ingest`
- transcript packet semantics: `jiang-agent-transcript-pass`
- boundary decisions: `jiang-transcript-boundary-review`
- public episode read: `jiang-episode-read-writer`
- episode publication: `jiang-episode-publisher`
- per-episode corpus impact: `jiang-corpus-impact-pass`
- concept page writing: `jiang-lens-concept-writer`
- atlas maintenance: `jiang-lens-atlas-maintainer`
- provenance linking: `jiang-provenance-linker`
- canon promotion: `jiang-canon-promotion`
- review: `jiang-lens-judge`

Use generated files as outputs, not as source-of-truth editing targets unless the relevant compiler script owns them.

## Validation

For content or tooling changes, run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
```

For website-visible changes, also run:

```bash
cd website && npm run build
```

If validation fails, fix the failure inside your write scope when possible. If it fails because of unrelated concurrent work, report the exact failure and leave your files coherent.

## Handoff

End with:

- what artifact you produced,
- which files you changed,
- what validation ran,
- any blocked or deferred work,
- the next useful autonomous job.

Do not claim canon status unless a canon promotion record exists.
