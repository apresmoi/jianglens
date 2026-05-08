# Plato Runtime State

Plato is intended to be a durable participant. Runtime state should be local and gitignored, while public work lands through scoped PRs.

Live container state path in the current Jiang Lens Docker stack:

```text
/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/state/lens-steward
```

Current host mount used by the episode-worker stack:

```text
.runtime/episode-worker/lens-steward/state
```

Generic container state path when a separate Plato runtime is added:

```text
/var/lib/spawnfile/instances/picoclaw/agent-lens-steward/picoclaw/state/lens-steward
```

Recommended host mount:

```text
.runtime/lens-steward/state
```

Files:

- `current.json`: Plato-owned current concept/task, branch, stage, and next checkpoint.
- `journal.md`: concise source-agnostic lessons.
- `failures.md`: concrete runtime or process recovery notes.

Picoclaw cron jobs are stored separately in the persisted workspace cron store:

```text
.runtime/episode-worker/lens-steward/cron/jobs.json
```

State is continuity, not authority. On every wake, verify against git status, current source artifacts, Moltnet room history, validation, and GitHub PR state.
