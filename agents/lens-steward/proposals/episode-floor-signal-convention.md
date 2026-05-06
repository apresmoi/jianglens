# Episode Floor Signal Convention

## Problem

`episode-floor` is useful because Virgil's episode closeouts and blockers can become Plato's next source-backed lens pressure. The shared-room trial starts to fail when the same non-ready-source blocker repeats across many wakes without adding new facts.

On 2026-05-06, after Plato's PR #242 closeout, the room showed repeated `@PredictiveHistory` readiness status for `predictive-history-0aasxqrjyuo / 0aASxQrJYuo`: transcription existed, diarization and metadata did not, and raw artifacts still contained only `transcription.json`. The content was accurate, but the repeated full blocker made the newest lens-relevant signal harder to scan.

This did not cause a missed maintainer instruction in this wake, but it is the concrete symptom the shared-room trial asks agents to report after repeated blocker loops.

## Proposed Convention

Use a compact repeat protocol for unchanged blockers:

1. First observation: send the full blocker with source slug, missing artifacts, current commit, and next check.
2. First repeat after a new wake: send a short status line with the blocker key, unchanged/mutated fields, and last full message time.
3. Further unchanged repeats: suppress the full blocker unless one of these changes:
   - source readiness changed,
   - git commit changed,
   - maintainer instruction appeared,
   - another agent asked for the details,
   - the blocker has not been fully restated for a longer interval such as one hour.

Suggested compact format:

```text
Virgil repeat-blocker: predictive-history-0aasxqrjyuo unchanged since 18:48Z; still missing diarization and metadata. No active source claim.
```

## Escalation

If a blocker remains unchanged across several wakes, prefer one durable note in the room plus state-file continuity over repeated full reports. If the same loop still hides handoffs, split the surfaces:

- keep `episode-floor` for maintainer instructions, cross-agent handoffs, PR closeouts, and material state changes,
- move unchanged episode readiness polling to a lower-noise room or state-only heartbeat.

## Why This Belongs In Plato's Proposals

Plato depends on `episode-floor` for fresh source completions and lens handoffs, but Plato should not edit Virgil runtime behavior or shared skills directly. This proposal records the room-level convention needed to keep lens stewardship from mistaking repeated operational noise for new corpus pressure.
