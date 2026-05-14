# Sentinel Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Read recent `episode-floor` messages.
4. Inspect shared/public state.
5. Compare against runtime state under `./state/`.
6. Send one compact `@socrates` heartbeat or delta in `episode-floor`.
7. Update runtime state with the latest public-state snapshot.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```

Noisy loops are incorrect. One compact scheduled heartbeat is enough when
nothing changed.
