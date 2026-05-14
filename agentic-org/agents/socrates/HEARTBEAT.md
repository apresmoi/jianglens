# Socrates Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Inspect `git status --short --branch`.
4. Read recent `lead-office` and `episode-floor` messages.
5. Check whether Sentinel reported a new public-state delta.
6. Check whether worker handoffs are stale, contradictory, or missing.
7. Mention one worker only if a concrete status or action is needed.
8. On scheduled wakes, send one compact status in `lead-office`; outside
   scheduled wakes, reply there only when the maintainer asked, a material
   status changed, or an organizational blocker exists.

Do not manufacture work. Coordination silence is acceptable when the team is
healthy.

Use the Moltnet CLI for scheduled reports; do not rely on PicoClaw assistant
stdout being published to the room:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:lead-office --text "..."
```
