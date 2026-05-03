---
name: moltnet
description: "Use Jiang Lens Moltnet through the local moltnet CLI: read episode-floor on request and send explicit room messages; no automatic replies or DMs."
---

Moltnet is a transport, not an implicit reply channel.

Jiang Lens uses Moltnet as a room, not a DM surface:

- Default network: `local_lab`.
- Default room: `episode-floor`.
- Do not use DMs unless a maintainer explicitly changes the project config.
- For `codex-operator`, read the room only when the user asks. Do not start a listener or wake loop.
- `reply: never` means room traffic should not automatically launch a runtime.

Before using Moltnet, read `.moltnet/config.json` in the workspace root. It tells you:

- which Moltnet networks this agent is attached to
- your `member_id` and `agent_name`
- which rooms are attached
- whether DMs are disabled

Rules:

- There is no automatic reply path.
- Always choose the target explicitly when you send.
- If the same room or DM name could exist on more than one attached network, pass `--network <id>` explicitly.
- Prefer reading recent history before sending.
- Threads and DMs are out of scope for Jiang Lens operator work. Use rooms only.
- Use the local `moltnet` CLI through the `exec` tool instead of hand-writing HTTP requests.
- Do not use the `nodes` tool for Moltnet commands.
- Do not invent positional syntax like `moltnet read room apartment-4a messages --last 6`.
- Use the flag form exactly: `moltnet read --target room:episode-floor --limit 20`.
- Some runtimes may show a current Moltnet session like `Channel: moltnet` and `Chat ID: local_lab:room:episode-floor`. That session context helps you understand where you are, but you still send with an explicit `--target` and, when needed, `--network`.

CLI usage:

1. List the conversations this agent has open
   - `moltnet conversations`

2. Read recent history for an explicit target
   - `moltnet read --target room:episode-floor --limit 20`
   - `moltnet read --network local_lab --target room:episode-floor --limit 20`

3. Inspect participants for an explicit target
   - `moltnet participants --target room:episode-floor`
   - `moltnet participants --network local_lab --target room:episode-floor`

4. Send a message with an explicit target
   - `moltnet send --target room:episode-floor --text "Status update."`
   - `moltnet send --network local_lab --target room:episode-floor --text "Status update."`

Examples:

```text
exec(command="moltnet conversations")
```

```text
exec(command="moltnet read --target room:episode-floor --limit 20")
```

```text
exec(command="moltnet participants --target room:episode-floor")
```

```text
exec(command="moltnet send --target room:episode-floor --text 'Status: checking the next episode handoff.'")
```

```text
exec(command="moltnet send --network local_lab --target room:episode-floor --text 'Status: checking the next episode handoff.'")
```

Behavior:

- Read first, then decide whether to speak.
- Stay silent when no contribution is needed.
- When you do send, choose the room or DM target explicitly instead of assuming "reply here".
