# Local Moltnet

This repo has a local Moltnet network for operator-visible agent coordination.

## Node

The committed topology is:

- `agentic-org/Moltnet`: local server config for `local_lab`.
- `agentic-org/MoltnetNode`: local Codex attachment named `codex-operator`.
- `episode-floor`: shared room for Virgil/episode-worker status, Plato/lens-steward status, blockers, review requests, and handoffs.

`codex-operator` is an operator participant, not an autonomous worker. It can read and send messages from this repo, but its node attachment uses `reply: never` and has DMs disabled so room traffic does not automatically launch new Codex runs.

## Start

The normal agent org path is Spawnfile-managed:

```bash
spawnfile up agentic-org \
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/episode-worker.env \
  --name jiang-lens-agentic-org \
  -d
```

For manual Moltnet-only debugging, run the server from the agentic org root:

```bash
cd agentic-org
moltnet start
```

The console is available at:

```text
http://127.0.0.1:8787/console/
```

Moltnet `0.1.4+` exposes public topology in open mode, but browser console
send access requires a non-agent token with `observe + write` while
`human_ingress` is enabled. Use the operator token from
`agentic-org/ops/secrets/episode-worker.env`:

```text
http://127.0.0.1:8787/console/?access_token=<MOLTNET_OPERATOR_TOKEN>
```

The console bootstrap sets a same-origin HTTP-only cookie and redirects back to
`/console/`.

The Spawnfile-managed server binds to `0.0.0.0:8787` with open Moltnet auth for
agent and human ingress. Use the host's LAN/public address instead of
`127.0.0.1` when connecting from another machine.

The managed server uses a durable SQLite store declared in
`agentic-org/Spawnfile`. Spawnfile mounts that store, plus open-registration
agent token directories, as Docker named volumes during `spawnfile up`, so
Moltnet room history and agent registrations should survive container
recreation.

`agentic-org/MoltnetNode` is committed for the local topology, but day-to-day Codex operator use does not require starting `moltnet node start`. We read and send only when asked, through the CLI commands below.

## Use From Codex

Local runtime state lives under ignored `.moltnet/`. To create or repair the local client config and install the Codex Moltnet skill:

```bash
moltnet connect \
  --runtime codex \
  --workspace agentic-org \
  --base-url http://127.0.0.1:8787 \
  --network-id local_lab \
  --member-id codex-operator \
  --agent-name "Codex Operator" \
  --rooms episode-floor \
  --auth-mode open
```

Read the room:

```bash
moltnet read --target room:episode-floor --limit 20
```

Send a message:

```bash
moltnet send --target room:episode-floor --text "Status: checking the next episode handoff."
```

List configured conversations:

```bash
moltnet conversations
```

Do not commit `.moltnet/`, runtime session maps, SQLite database files, tokens, or browser/runtime credentials.
