# Plato Setup

Plato is declared as the `plato` agent under `agentic-org/agents/plato/`.

This file defines the runtime shape. Spawnfile declares Plato, and the local Docker stack wakes Plato through Picoclaw's native cron service alongside Virgil.

## Validate The Agent Definition

From the repo root:

```bash
spawnfile validate .
spawnfile view .
```

## Stack Run

Use the shared Jiang Lens agent stack from the repo root:

```bash
spawnfile validate agentic-org
spawnfile up agentic-org \
  --deployment local \
  --out agentic-org/.spawn \
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/agentic-org.env \
  --name jiang-lens-agentic-org \
  -d
```

Spawnfile gives Plato a workspace-local repo checkout and durable state:

```text
repos/jiang-lens
state
cron
```

## Moltnet

Plato belongs in:

```text
local_lab / episode-floor
```

From inside `repos/jiang-lens`, use:

```bash
export MOLTNET_CLIENT_CONFIG="$PWD/../../.moltnet/config.json"
moltnet read --network local_lab --target room:episode-floor --limit 20
moltnet send --network local_lab --target room:episode-floor --text "Status: <short factual update>."
```

Virgil, the episode worker, also uses `episode-floor`. For now this is intentional: Plato should see source handoffs, episode blockers, and lens follow-up hints directly. This is a trial. If repeated status traffic makes fresh maintainer instructions or useful handoffs hard to detect, Plato should report the concrete failure mode and propose either a room split or a stricter room message convention.

The room attachment is configured with `wake: mentions`. Direct `@plato`
mentions become context for the next runtime turn; ordinary room traffic should
not start a concurrent long-running turn. Plato speaks publicly only when the
prompt chooses to call `moltnet send`. Scheduled lens work runs through
Picoclaw cron.

## First Useful Task

A good first Plato assignment is:

```text
Survey the processed corpus for one concept area, create or revise one public lens page, add stable lens points, link a small number of strong episode moments back to those lens points, run the judge gate, validate, and open a PR.
```

Do not begin by trying to produce every missing corpus-impact file. When fresh
source pressure is clear, Plato should take one bounded impact decision. When
several compact impact decisions have accumulated, Plato should switch back to
public lens synthesis instead of continuing one-source accounting forever. The
goal is source-to-lens accounting that makes synthesis possible, then synthesis
that makes the public lens better.

## PR Classes

Plato owns two production PR classes:

- `corpus-impact intake`: one source or a tight source cluster is digested into
  `content/workflow/proposals/<source-slug>/corpus-impact.json`. This measures
  whether the merged source reinforced, contradicted, extended, or failed to
  affect the current lens map.
- `public lens mutation`: public lens/atlas prose, lens-point anchors,
  splits/merges, or episode-to-lens links. This measures concept boundary,
  source fan-in, chronology, page-size governance, reader usefulness, and exact
  provenance.

Compact corpus-impact intake does not need Aristotle. If targeted/all
corpus-impact validation, compile-content, validate-content, website build, and
GitHub CI are green, and no public lens prose or episode/interview read JSON was
changed, Plato should enable auto-merge or tell Socrates the exact remaining
decision.

Public lens mutation needs Dante review before merge. If a page is crossing the
split threshold, merging a source-light concept, or changing the atlas
structure, name the boundary decision in the PR notes and ask `@dante` for a
PASS/FAIL.
