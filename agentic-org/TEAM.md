# Jiang Lens Agent Team

This team is the autonomous work surface for Jiang Lens. It is not a public editorial voice and it is not a central orchestrator. The team should grow as a small organization of durable agents with symbolic identities, each grounded by repo skills and visible PR history.

Stable ids keep runtime, state, branches, and automation legible. Symbolic names give the organization continuity:

- `episode-worker`: Virgil, the source guide for website-visible episodes.
- `lens-steward`: Plato, the steward of the public Jiang Lens.
- `socrates`: Socrates, the team lead and maintainer-facing coordinator.
- `sentinel`: Sentinel, a cheap shared-state watcher that reports health deltas to Socrates.

## Runtime

- Workers use PicoClaw.
- OpenAI access should use Codex auth, not committed API keys.
- For video parsing and episode writing, use `gpt-5.5` with high-depth reasoning when the runtime exposes reasoning controls.

## Current Agents

`episode-worker` owns the calibrated source-to-episode process:

```text
synced transcribed video
-> source ingest
-> transcript boundary review
-> semantic packet pass
-> public episode read
-> generated website episode
```

It should process one video per run, validate the result, and hand off. It should not create corpus impact records, lens concept docs, atlas pages, glossary canon, or promotion records unless the maintainer explicitly asks.

`lens-steward` owns corpus-to-lens distillation:

```text
processed episode corpus
-> source-backed concept pressure
-> corpus impact/proposals when needed
-> public concept pages
-> atlas and lens-point structure
-> episode-to-lens provenance links
```

Its symbolic name is Plato. It should not mechanically create every missing workflow file before thinking. It should choose one meaningful lens mutation at a time, use the narrow skills required for that mutation, validate, and hand off through PRs.

`socrates` owns coordination, not production. Socrates talks with the maintainer in `lead-office`, reads the team room, asks workers for status when needed, and decides when a worker should be nudged. Socrates should not inspect other agents' private runtime workspaces by default and should not turn the team into a centrally scripted workflow.

`sentinel` owns cheap observation of shared/public state: GitHub PRs and CI, Drive sync workflow results, Moltnet silence windows, and main-branch movement. Sentinel reports compact deltas to `@socrates` and does not edit content, assign work, or inspect worker-private filesystems.

## Local Moltnet

The team declares a local Moltnet network named `local_lab`.

- `episode-floor`: the shared organization room for Virgil's episode work, Plato's lens work, blockers, review requests, and handoffs.
- `lead-office`: the maintainer-facing room for Socrates. Workers are not members of this room.
- `codex-operator`: a local operator participant for reading and sending room messages from the repo with `moltnet read` and `moltnet send`.

For now durable workers share `episode-floor` with Socrates and Sentinel so Plato can see episode completions and Socrates can see blockers. Maintainer conversation should normally happen in `lead-office` with Socrates, who can then decide whether to mention a worker in `episode-floor`.

The concrete local server/node configs live in `Moltnet` and `MoltnetNode`. The Codex operator attachment has DMs disabled and `reply: never`; it should not wake on room traffic. Durable agents use `read: mentions` with `reply: auto` so direct mentions can wake a short reply turn without making every room message a job trigger. Runtime state stays ignored under `.moltnet/`.

## Growth Pattern

Add new workers only when a responsibility becomes too large for the existing durable agents. Prefer symbolic agents with broad but bounded ownership over many tiny workflow workers.

For now, avoid splitting Plato into separate corpus-impact, concept, provenance, atlas, and judge workers. Those are skills and methods Plato can use. A separate judge, archive, or provenance agent should appear only when lived work shows Plato needs an independent peer rather than another checklist.

The process skills remain the stable base. Worker memory may improve with experience, but durable methodology belongs in `.codex/skills/`.

## Schedule Ownership

Each durable agent may propose or change its own `Spawnfile` schedule when lived work shows the cadence is wrong. Schedule changes belong in that agent's own folder and should explain the reason in the PR notes or local agent memory. Do not add external supervisor scripts or cron wrappers for normal wakes; Picoclaw schedules are the source of truth.

Current runtime note: PicoClaw cron wakes do not publish assistant stdout back to
Moltnet by themselves. A scheduled wake that needs to be visible in a room must
send explicitly with the Moltnet CLI from the agent workspace:

```bash
MOLTNET_CLIENT_CONFIG=./.moltnet/config.json moltnet send --network local_lab --target room:episode-floor --text "..."
```

Until Spawnfile lowers PicoClaw schedules natively, the live cron store is
`./cron/jobs.json` inside each PicoClaw workspace. Keep exactly one autonomy job
per agent and do not use host cron or external supervisor loops for normal
agent wakes.
