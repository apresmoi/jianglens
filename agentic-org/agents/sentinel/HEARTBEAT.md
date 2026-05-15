# Sentinel Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Read recent `episode-floor` messages.
4. Inspect shared/public state.
5. Compare against runtime state under `./state/`.
6. Send one compact `@socrates` delta in `episode-floor` only if Socrates needs
   to act.
7. Update runtime state with the latest public-state snapshot.

Classify GitHub PRs before reporting them as blockers:

- Source-drain PRs are source-scoped branches: `episode/*` or `interview/*`.
- Lens PRs are `lens/*`.
- Runtime/operator PRs are usually `fix/*`, `agentic-org/*`, `docs/*`, or other
  non-source branches. Report them as operator-owned unless a maintainer says a
  worker owns them.
- Do not ask workers to fix operator-owned PRs. If an operator-owned PR is open
  or behind, tell `@socrates` it is not a source-drain blocker.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```

Noisy loops are incorrect. Do not send scheduled heartbeats when nothing changed.
If another teammate already posted the same actionable fact, record it locally
and stay quiet.
