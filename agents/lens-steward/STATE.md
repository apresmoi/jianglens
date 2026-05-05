# Plato Runtime State

Plato is intended to be a durable participant. Runtime state should be local and gitignored, while public work lands through scoped PRs.

Recommended container state path when a Plato runtime is added:

```text
/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/state/lens-steward
```

Recommended host mount:

```text
.runtime/lens-steward/state
```

Files:

- `lease.json`: supervisor-owned process lease for a running Plato process.
- `heartbeat.json`: supervisor-owned liveness record.
- `current.json`: Plato-owned current concept/task, branch, stage, and next checkpoint.
- `journal.md`: concise source-agnostic lessons.
- `failures.md`: concrete runtime or process recovery notes.

State is continuity, not authority. On every wake, verify against git status, current source artifacts, Moltnet room history, validation, and GitHub PR state.
