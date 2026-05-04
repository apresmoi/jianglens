# Episode Worker Runtime State

The episode worker is a durable participant. Its runtime state is local and
gitignored, while its public work still lands through source-scoped PRs.

Default container state path:

```text
/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/state/episode-worker
```

Default host mount:

```text
.runtime/episode-worker/state
```

Files:

- `lease.json`: supervisor-owned process lease for the currently running worker process.
- `heartbeat.json`: supervisor-owned liveness record, updated while the process is alive.
- `current.json`: worker-owned current source, branch, stage, and next checkpoint.
- `journal.md`: worker-owned concise source-agnostic lessons.
- `failures.md`: worker-owned recovery notes for concrete runtime failures.

The supervisor may create, update, archive, or remove `lease.json` and
`heartbeat.json`. The worker should update `current.json`, `journal.md`, and
`failures.md` at stage boundaries.

State is not authority. On every wake, the worker still checks repo status,
Moltnet history, existing source artifacts, validation, and GitHub PR state.

