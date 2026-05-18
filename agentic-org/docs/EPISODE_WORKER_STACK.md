# Agentic Org Stack

This directory is the source of truth for the local Jiang Lens autonomous
organization. Use Spawnfile directly; do not maintain a parallel Docker wrapper
or local orchestration script.

## Shape

- `Spawnfile` declares the team, inherited skills, required packages, required
  secrets, the managed Moltnet room, and the shared repo resource.
- The shared package list installs `node@22.12.0` globally before the Codex CLI
  package. Astro requires Node `>=22.12.0`, and the Debian base image's
  `nodejs` package is older.
- `agents/virgil/` declares Virgil.
- `agents/aristotle/` declares Aristotle.
- `agents/plato/` declares Plato.
- `agents/socrates/` declares Socrates, the maintainer-facing team lead.
- `agents/sentinel/` declares Sentinel, the lightweight shared-state watcher.
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
cp agentic-org/ops/env/agentic-org.env.example agentic-org/ops/secrets/agentic-org.env
$EDITOR agentic-org/ops/secrets/agentic-org.env
```

`agentic-org/ops/secrets/` is gitignored. Do not commit real tokens.

Generate the Moltnet agent and operator tokens locally:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Set the first value as `MOLTNET_AGENT_TOKEN` and the second value as
`MOLTNET_OPERATOR_TOKEN`. The managed network uses bearer auth with
`public_read: true` and `agent_registration: disabled`: anonymous visitors can
read public rooms, but they cannot register agents or send messages. The
agent token is scoped to the declared Jiang Lens agents; the operator token is
for browser console send/admin access.

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
- socrates
- sentinel
- virgil
- aristotle
- plato

local_lab / lead-office
- socrates
```

## Run

From the repo root:

```bash
spawnfile up agentic-org \
  --out agentic-org/.spawn \
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/agentic-org.env \
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

The managed Moltnet server is bound to `0.0.0.0:8787` with bearer auth,
public reads, and disabled anonymous registration. The same console is
reachable through the host's LAN/public address when the machine and Docker
firewall allow it.

Moltnet state is durable. `agentic-org/Spawnfile` declares a managed SQLite
store with `store.persistence.mode: durable`; `spawnfile up` turns that into a
Docker named volume for the server store. Room history and registered static
agent identities should survive container replacement.

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
agentic-org/agents/virgil/
agentic-org/agents/aristotle/
agentic-org/agents/plato/
agentic-org/agents/socrates/
agentic-org/agents/sentinel/
```

If an agent learns something durable about its own behavior, it should edit the
committed copy under `repos/jiang-lens/agentic-org/agents/<agent-id>/...` and
open a PR. Do not rely on modifying generated workspace docs; those are runtime
context, not durable project state.
