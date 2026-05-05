# Jiang Lens

Jiang Lens is an independent research and reading project built from Jiang Xueqin's lectures, interviews, and writing.

The goal is to compress a growing corpus into a public map of Jiang's world model: the recurring concepts, metaphors, historical patterns, and social diagnostics he uses to interpret reality. Episodes preserve individual sources in readable form. Lens pages connect those sources into larger concepts that can be followed, questioned, and reused.

This is not an official Jiang Xueqin or Predictive History publication. It is also an experiment in agentic research: the repo is being shaped so autonomous agents can ingest sources, produce episode readings, record provenance, update the corpus, and gradually help maintain the lens with little human intervention.

## What The Site Should Become

The public site should make the corpus easy to read without hiding where ideas came from.

- **Episodes** turn one lecture, interview, or text into a compact source-linked reading, with video, timestamps, source trails, and transcript access.
- **Lens pages** collect ideas that recur across sources: how stories control reality, how guides become traps, how poetry forms civilization, how eschatology shapes politics, and other parts of Jiang's interpretive map.
- **Agent artifacts** such as `skill.md`, `llms.txt`, and structured JSON let other assistants use the lens while preserving links back to the source material.

The standard is not a transcript dump and not a shallow summary. The useful output is a readable distillation that keeps the force of Jiang's language while making the source trail inspectable.

## Project Shape

The repo has three main layers:

- `content/` is the canonical project state: sources, episode reads, evidence, proposals, reviews, promotions, glossary/canon material, and corpus-impact records.
- `ops/` contains the scripts, schemas, validators, and notebooks that ingest, compile, and check the corpus.
- `website/` renders the public Astro site from the content layer.

There is also an `agents/` folder for Spawnfile worker definitions. The current durable agents are:

- `episode-worker` / Virgil: processes one already-transcribed video into a public website-visible episode.
- `lens-steward` / Plato: turns the processed episode corpus into source-grounded public lens concepts, atlas structure, lens points, and provenance links.

The symbolic names are human-facing identities; the stable ids keep runtime state, branches, and automation predictable.

Docker episode workers use a small overlay image so GitHub operations are available:

```bash
ops/scripts/build-episode-worker-image.sh
ops/scripts/run-episode-worker-stack.sh
```

The worker stack requires `spawnfile@0.1.4` or newer and reads `GH_TOKEN` from
`ops/secrets/episode-worker.env`. Do not bake GitHub tokens into images. See
[Episode Worker Stack](docs/EPISODE_WORKER_STACK.md) for the full build, auth,
environment, and Moltnet runbook.

## Working Model

The website is not the source of truth. It is generated from content and structured indexes so that public pages, hovers, backlinks, `llms.txt`, and agent-readable data stay tied to the same corpus.

Autonomous workers should eventually operate git-first: clone the repo, create a scoped branch, process one bounded task, validate it, and push for review. That gives the project an auditable history as the lens changes.

## Local Commands

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs

cd website
npm install
npm run dev
npm run build
```

For detailed repo rules, source refs, validation expectations, and skill selection, read [AGENTS.md](AGENTS.md).
