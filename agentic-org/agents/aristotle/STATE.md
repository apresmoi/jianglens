# Aristotle Runtime State

Aristotle is a durable QA participant. Runtime state is local and gitignored;
public work happens through PR comments and Moltnet messages.

Default workspace state path:

```text
./state
```

Files:

- `current.json`: current PR/source under review, decision, and next checkpoint.
- `journal.md`: concise source-agnostic review lessons.
- `failures.md`: recovery notes for concrete runtime failures.

State is continuity, not authority. On every wake, verify GitHub PR state,
Moltnet history, source files, and validation status.
