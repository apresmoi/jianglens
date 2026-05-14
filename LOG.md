# Jiang Lens Operating Log

This file records setup and migration notes that should inform fixes to
Spawnfile, Moltnet, or this repo's agentic organization. Keep entries factual
and dated.

## 2026-05-14 - Spawnfile/Moltnet Team Migration

- `spawnfile add agent <id> agentic-org --runtime picoclaw` successfully created
  the Socrates and Sentinel agent directories and updated the team manifest.
  It also rewrote `agentic-org/Spawnfile` and temporarily dropped
  `server.auth.tokens[0].secret`, which made `spawnfile validate` fail until
  `secret: MOLTNET_OPERATOR_TOKEN` was restored manually.
- `spawnfile model set openai <model> <agent-path> --auth codex` worked for
  moving the agents to the intended models, but it also normalized YAML and
  removed at least one authored description from `episode-worker/Spawnfile`.
  That made a small manual cleanup necessary.
- `spawnfile validate agentic-org` and
  `spawnfile view agentic-org --mode networks` correctly showed the intended
  topology:
  `episode-floor = socrates, sentinel, episode-worker, lens-steward` and
  `lead-office = socrates`.
- `spawnfile up agentic-org --auth-profile jiang-lens --env-file
  agentic-org/ops/secrets/episode-worker.env --name jiang-lens-agentic-org -d`
  rebuilt and started the org. The resulting image had Moltnet `0.1.9`, Node
  `v22.12.0`, Codex CLI `0.128.0`, and `yt-dlp 2026.03.17`.
- Durable Moltnet SQLite state preserved the old `episode-floor` membership.
  After the new manifest was running, the live server still had
  `episode-floor = episode-worker, lens-steward`; Socrates and Sentinel were
  connected but not room members. The fix was an admin API reconciliation:
  `PATCH /v1/rooms/episode-floor/members` adding `socrates`, `sentinel`, and
  `codex-operator`; and `PATCH /v1/rooms/lead-office/members` adding
  `codex-operator`.
- The ignored local operator config at `agentic-org/.moltnet/config.json` also
  had to be updated to include `lead-office`. Until then, `moltnet participants
  --target room:lead-office` failed locally even though the server room existed.
- Moltnet emitted `agent.wake.delivered` for Socrates and Sentinel after direct
  mentions, but no room replies appeared. Manual runtime testing with
  `picoclaw agent --session smoke-test --message ...` worked, proving Codex and
  PicoClaw were usable. The missing behavior was transport semantics: Moltnet
  wake delivery does not publish assistant stdout back to the room. Agents must
  explicitly run `moltnet send`; their operating docs now state this bluntly.
- The Spawnfile-generated Debian image does not include `ps`; checking live
  runtime processes required reading `/proc`. Adding `procps` would make runtime
  diagnosis easier.
- PicoClaw `/health` returned `200`, while `/ready` returned `503` for all four
  gateways even though a manual `picoclaw agent` call succeeded. The readiness
  semantics need either clearer docs or a more actionable failure body.
- Post-merge smoke tests proved all four agents could reply through Moltnet, but
  Socrates initially mirrored several non-material smoke acknowledgements into
  `lead-office`. The Socrates room contract now treats worker mentions in
  `episode-floor` as inputs, not automatic maintainer-facing reports.
