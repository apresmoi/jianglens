# Agentic Org Stack

This directory is the source of truth for the local Jiang Lens autonomous
organization. Use Spawnfile directly; do not maintain a parallel Docker wrapper
or local orchestration script.

## Shape

- `Spawnfile` declares the team, inherited skills, required packages, required
  secrets, the managed Moltnet room, and the shared repo resource.
- `agents/episode-worker/` declares Virgil.
- `agents/lens-steward/` declares Plato.
- Each agent runtime receives its own workspace and its own repo checkout at
  `./repos/jiang-lens`.

The important boundary is simple:

- Runtime workspace docs are context.
- Durable repo work happens inside `./repos/jiang-lens`.
- Self-improvement PR edits happen inside
  `./repos/jiang-lens/agentic-org/agents/<agent-id>/...`.

## Prerequisites

Install the current Spawnfile CLI:

```bash
npm install -g spawnfile@latest
```

Log in to Codex on the host account that will run the org:

```bash
codex login --device-auth
```

Create a fine-grained GitHub token for `apresmoi/jianglens` with:

- Contents: read/write
- Pull requests: read/write
- Metadata: read

Store it locally:

```bash
mkdir -p agentic-org/ops/secrets
cp agentic-org/ops/env/episode-worker.env.example agentic-org/ops/secrets/episode-worker.env
$EDITOR agentic-org/ops/secrets/episode-worker.env
```

`agentic-org/ops/secrets/` is gitignored. Do not commit real tokens.

Generate the Moltnet operator token locally:

```bash
openssl rand -hex 32
```

Set that value as `MOLTNET_OPERATOR_TOKEN`. Moltnet `0.1.4+` requires an
`observe + write` non-agent token for browser console send access when
`auth.mode: open` is enabled.

## Validate

From the repo root:

```bash
spawnfile validate agentic-org
spawnfile view agentic-org
spawnfile view agentic-org --mode networks
```

Expected network shape:

```text
local_lab / episode-floor
- episode-worker
- lens-steward
```

## Run

From the repo root:

```bash
spawnfile up agentic-org \
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/episode-worker.env \
  --name jiang-lens-agentic-org \
  -d
```

The Moltnet console should be available at:

```text
http://127.0.0.1:8787/console/
```

For human send access, open it once with the operator token:

```text
http://127.0.0.1:8787/console/?access_token=<MOLTNET_OPERATOR_TOKEN>
```

Moltnet stores the token in a same-origin HTTP-only cookie and redirects back to
`/console/`.

The managed Moltnet server is bound to `0.0.0.0:8787` with `auth: open`, so
the same console is reachable through the host's LAN/public address when the
machine and Docker firewall allow it.

Moltnet state is durable. `agentic-org/Spawnfile` declares a managed SQLite
store with `store.persistence.mode: durable`; `spawnfile up` turns that into a
Docker named volume for the server store and durable per-agent open-auth token
mounts. Room history, registrations, and generated open-mode agent tokens
should survive container replacement.

Stop the org with Docker when needed:

```bash
docker stop jiang-lens-agentic-org
```

## Agent Workspaces

Inside each agent workspace:

```text
repos/jiang-lens
```

Before project work:

```bash
cd repos/jiang-lens
```

From there, normal project paths apply:

```text
AGENTS.md
content/
ops/
website/
agentic-org/agents/episode-worker/
agentic-org/agents/lens-steward/
```

If an agent learns something durable about its own behavior, it should edit the
committed copy under `repos/jiang-lens/agentic-org/agents/<agent-id>/...` and
open a PR. Do not rely on modifying generated workspace docs; those are runtime
context, not durable project state.
