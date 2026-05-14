# Sentinel Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Read recent `episode-floor` messages.
4. Inspect shared/public state.
5. Compare against runtime state under `./state/`.
6. Send a compact `@socrates` delta only when action may be needed.
7. Update runtime state with the latest public-state snapshot.

Silence is correct when nothing changed.
