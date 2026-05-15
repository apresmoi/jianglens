# Virgil Runtime State

Virgil is a durable participant. His runtime state is local and
gitignored, while its public work still lands through source-scoped PRs.

Default workspace state path:

```text
./state
```

Default host persistence:

```text
.runtime/virgil/resources
```

Files:

- `current.json`: worker-owned current source, branch, stage, and next checkpoint.
- `journal.md`: worker-owned concise source-agnostic lessons.
- `failures.md`: worker-owned recovery notes for concrete runtime failures.

Picoclaw cron jobs are stored separately in the persisted workspace cron store:

```text
./cron/jobs.json
```

The worker should update `current.json`, `journal.md`, and `failures.md` at
stage boundaries.

State is not authority. On every wake, the worker still checks repo status,
Moltnet history, existing source artifacts, validation, and GitHub PR state.
