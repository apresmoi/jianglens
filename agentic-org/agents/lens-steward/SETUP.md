# Plato Setup

Plato is declared as the `lens-steward` agent under `agentic-org/agents/lens-steward/`.

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
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/episode-worker.env \
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

The room attachment is configured with `read: mentions` and `reply: auto`.
Direct `@lens-steward` mentions can wake a short reply turn; ordinary room
traffic should not. Scheduled lens work still runs through Picoclaw cron.

## First Useful Task

A good first Plato assignment is:

```text
Survey the processed corpus for one concept area, create or revise one public lens page, add stable lens points, link a small number of strong episode moments back to those lens points, run the judge gate, validate, and open a PR.
```

Do not begin by trying to produce every missing corpus-impact file.
