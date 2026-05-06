# No-Ready-Source Supervisor Idle Proposal

## Problem

The episode worker can now suppress repeated Moltnet reception/blocker messages
when the deterministic backlog has the same no-ready-source blocker recorded in
durable state. That reduces room noise, but the outer supervisor may still wake
the worker on every loop interval. Those wakes still spend runtime checking git,
Moltnet history, durable state, and backlog readiness before exiting silently.

## Proposed Runtime Change

Teach `ops/scripts/episode-worker-entrypoint.sh` or the surrounding supervisor
to honor `current.json` when it records:

```json
{
  "stage": "idle-no-ready-source",
  "claimed_source": null,
  "branch": "main"
}
```

The supervisor should skip launching a full worker turn while all of these
remain unchanged:

- `origin/main` is still the recorded commit,
- the newest Moltnet maintainer/direct-mention timestamp is not newer than the
  recorded idle checkpoint,
- the raw source artifact directory fingerprint for the blocked video is
  unchanged,
- deterministic backlog readiness is unchanged.

When any trigger changes, the supervisor should launch the normal worker turn.

## Worker-Owned Stopgap

Until the runtime implements this, the worker instruction surface tells each
wake to verify the blocker, persist `stage: "idle-no-ready-source"`, and stay
silent if the same state is already recorded.

## Validation

This proposal changes no runtime code. A future runtime patch should be tested
with:

```bash
node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory
```

and an integration run showing that one idle message is sent on entry, no
repeated room posts occur for unchanged state, and a new artifact or maintainer
instruction resumes a full worker turn.
