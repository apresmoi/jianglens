# Plato Runtime State

Plato is intended to be a durable participant. Runtime state should be local and gitignored, while public work lands through scoped PRs.

Default workspace state path:

```text
./state
```

Default host persistence:

```text
.runtime/episode-worker/resources
```

Files:

- `current.json`: Plato-owned current concept/task, branch, stage, and next checkpoint.
- `journal.md`: concise source-agnostic lessons.
- `failures.md`: concrete runtime or process recovery notes.

Picoclaw cron jobs are stored separately in the persisted workspace cron store:

```text
./cron/jobs.json
```

State is continuity, not authority. On every wake, verify against git status, current source artifacts, Moltnet room history, validation, and GitHub PR state.
