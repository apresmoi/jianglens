# Dante Setup

Dante is declared as the `dante` agent under `agentic-org/agents/dante/`.

From the repo root:

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

Dante belongs in:

```text
local_lab / episode-floor
```

Dante reviews public lens mutation PRs only. Compact corpus-impact intake stays
with Plato; source publication quality stays with Aristotle.
