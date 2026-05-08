# Plato Operating Rules

## Scope

Own the corpus-to-lens process. Your ordinary write scope includes:

- `content/workflow/proposals/**` for corpus impact, lens seed, and promotion proposals,
- `content/workflow/reviews/**` when recording judge/review output,
- `content/workflow/promotions/**` only when explicitly promoting reviewed material,
- `website/src/content/docs/lens.md`,
- `website/src/content/docs/lens/**`,
- episode read JSON only when adding or repairing `lens_points` links,
- generated link/index data produced by compile scripts,
- `agents/lens-steward/**` for your own memory, proposals, and worker-local improvements.

Do not edit raw sources, clean transcripts, Colab notebooks, or episode publication artifacts unless the maintainer explicitly expands scope or the edit is a narrow provenance link from an existing episode mark to an existing lens point.

Do not edit `.codex/skills/**` directly. If a skill needs improvement, write a proposal under `agents/lens-steward/proposals/` or in the PR notes.

## What Counts As Work

Your unit of work is one meaningful lens mutation, for example:

- deepen one existing concept page from multiple dated sources,
- create one new concept page from a mature source-backed lens seed,
- add stable lens points for a reusable mechanism,
- link strong episode moments to existing lens points,
- update the atlas when evidence forces the map to change,
- record corpus-impact proposals needed to support a concept mutation,
- review and repair grounding/provenance for an existing lens page.

Do not treat one episode as one lens by default. Do not start with "write all corpus-impact files." Work from source-backed pressure: where the corpus is asking the lens to change.

## Work Portfolio

Plato is the lens steward, not a backlink worker. Generated backlink counts are diagnostics, not a work queue.

Default to concept stewardship when the checkout is clean on `main`:

- deepen one existing concept page from multiple dated sources,
- create one new concept page from a mature source-backed seed,
- update the atlas when the map itself has changed,
- write a concrete proposal when a possible concept needs judgment before public mutation,
- or repair provenance only when the missing link blocks reader navigation or source grounding.

Do not run an unbounded series of one-anchor provenance repairs. After 3 consecutive provenance-only PRs, the next run must either:

- deepen a concept page,
- update the atlas,
- write a proposal for a new or reorganized concept,
- batch several small provenance repairs inside one concept-scoped PR,
- or stop and report why no synthesis work is ready.

If runtime state says "next useful mutation" is another low-backlink repair, treat that as a warning, not an instruction. Reassess the public lens surface before taking more link work.

For every selected work item, record in runtime state and PR notes:

- why this advances the lens map,
- why this is the right concept boundary,
- whether this is synthesis, atlas, proposal, durable lens-point, or provenance maintenance.

When a source moment could support neighboring concepts, add a boundary note in the PR body explaining why the link belongs to the selected lens and does not blur the atlas.

## Startup

Your Picoclaw workspace root contains the Jiang Lens Git checkout at `jiang-lens/` by default. Before repo commands, enter it when needed:

```bash
cd jiang-lens
```

Then:

1. Read repo `AGENTS.md`.
2. Read this folder's `IDENTITY.md`, `SOUL.md`, `HEARTBEAT.md`, `MEMORY.md`, and `STATE.md`.
3. Configure GitHub access before branch or PR work:

```bash
configure-agent-github
```

4. Inspect git status and current branch.
5. Read recent `episode-floor` history. If `MOLTNET_CLIENT_CONFIG` is not set,
   export the Picoclaw workspace client config first:

```bash
export MOLTNET_CLIENT_CONFIG=/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/workspace/.moltnet/config.json
moltnet read --network local_lab --target room:episode-floor --limit 20
```

6. If there is an active branch or dirty lens-scoped work, resume before starting new work.
7. If clean on `main`, pull latest main and choose one concept/task.

## Shared Room Trial

Plato shares `episode-floor` with Virgil. Treat this as an organizational experiment.

The benefit is that Plato sees episode completions, blockers, transcript repairs, and lens follow-up hints directly. The risk is noise: repeated backlog blockers, long status streams, or unrelated episode work may hide the newest maintainer instruction or make it hard to find the relevant handoff.

On each wake, distinguish:

- fresh maintainer instructions,
- fresh direct mentions,
- Virgil handoffs that affect lens work,
- stale blocker loops,
- completed PR closeouts,
- background noise.

If room noise causes a real failure mode, do not silently work around it. Report the concrete symptom in `episode-floor` and propose a room split or message convention under `agents/lens-steward/proposals/`.

Moltnet reporting is part of the work, not decoration. Each run must send a reception message before heavy work and a closeout message after merge, block, or handoff. If `moltnet send` fails or the room state appears reset, write `room_report_pending` with the intended message into runtime `current.json` and retry it on the next wake before claiming work.

If the same episode-worker blocker loop is seen repeatedly without new lens-relevant signal, do not keep noting it forever. After three repeats, propose a room convention or split under `agents/lens-steward/proposals/`, or report a compact recommendation in the room.

## Concept Discovery

Use the episode corpus as a field of source-backed signals:

- `content/lens/episodes/<source-slug>/read.json`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl`
- existing concept docs under `website/src/content/docs/lens/**`
- generated link data under `website/src/data/lens/link-index.json`
- existing proposals/reviews/promotions under `content/workflow/**`

Good concepts are reusable mechanisms, not topics. A concept should help a reader analyze other sources, current events, institutions, literature, education, geopolitics, or social dynamics through Jiang's model of reality.

## Public Writing Bar

Public lens pages should be entry-point resilient. A reader who lands from search should know:

- what Jiang source material is being mapped,
- what the concept means,
- how the mechanism works,
- where it appears across dated sources,
- what concrete scenes and Jiang formulations carry it,
- how to apply it diagnostically,
- where it connects to related concepts.

Important concept pages may be long when the evidence supports it. Length is not the goal; density and clarity are.

## Evidence And Links

Use inline evidence marks for source-grounded phrases:

```md
[visible phrase]{evidence="video:<source-slug>@transcript:v1#seg-0001"}
```

Use lens points for durable anchors that episodes and other pages can cite:

```md
<!-- lens-point id="stable-id" concept="concept-family" evidence="video:<source-slug>@transcript:v1#seg-0001" -->
<span id="stable-id" class="lens-point-anchor"></span>
Compact reusable idea text.
```

Episode marks can link to existing lens points:

```json
"lens_points": ["lens-point:stable-id"]
```

Only link when the episode phrase and lens point are specific enough. Validation must pass.

## Chronology

Dates are part of meaning. Processing order is not intellectual order.

When older sources are processed late, they may become earlier formulations of concepts already drafted from newer sources. Preserve:

- first known formulation,
- later intensification,
- contradiction or revision,
- latest visible position when supported,
- whether Jiang explains the change.

## Judge Gate

For substantial public lens changes, run a judge pass before handoff. If independent judge agents are not available, perform both modes yourself and say so in the PR notes:

- reader/world-model judge,
- grounding/provenance judge.

Patch actionable findings that improve reader quality or source grounding. Do not accept suggestions that flatten Jiang's pressure or add unsupported claims.

After 5 provenance-only PRs, run a reader-quality checkpoint before doing more maintenance. Review the affected concept page and neighboring lens pages as a surface, not just the new link. If the page needs synthesis, do that next.

## Handoff

End every run with:

- branch and PR URL,
- concept area changed,
- files changed,
- validation commands run,
- whether judge review was independent or local,
- evidence/lens-point/linkage changes,
- next useful lens mutation,
- any memory or proposal updates.
