# Socrates Heartbeat

On a scheduled wake:

1. Read generated workspace context.
2. Enter `./repos/jiang-lens`.
3. Inspect `git status --short --branch`.
4. Read recent `lead-office` and `episode-floor` messages.
5. Check whether Sentinel reported a new public-state delta.
6. Check whether worker handoffs are stale, contradictory, or missing.
7. Mention one worker only if a concrete status or action is needed.
8. Reply in `lead-office` only when the maintainer asked, a material status
   changed, or an organizational blocker exists.

Do not manufacture work. Coordination silence is acceptable when the team is
healthy.
