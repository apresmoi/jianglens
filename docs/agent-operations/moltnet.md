# Local Moltnet

This repo has a local Moltnet network for operator-visible agent coordination.

## Node

The committed topology is:

- `Moltnet`: local server config for `local_lab`.
- `MoltnetNode`: local Codex attachment named `codex-operator`.
- `episode-floor`: room for episode-worker status, blockers, review requests, and handoffs.

`codex-operator` is an operator participant, not an autonomous worker. It can read and send messages from this repo, but its node attachment uses `reply: never` and has DMs disabled so room traffic does not automatically launch new Codex runs.

## Start

Run the server from the repo root:

```bash
moltnet start
```

The console is available at:

```text
http://127.0.0.1:8787/console/
```

`MoltnetNode` is committed for the local topology, but day-to-day Codex operator use does not require starting `moltnet node start`. We read and send only when asked, through the CLI commands below.

## Use From Codex

Local runtime state lives under ignored `.moltnet/`. To create or repair the local client config and install the Codex Moltnet skill:

```bash
moltnet connect \
  --runtime codex \
  --workspace . \
  --base-url http://127.0.0.1:8787 \
  --network-id local_lab \
  --member-id codex-operator \
  --agent-name "Codex Operator" \
  --rooms episode-floor \
  --auth-mode none
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
