# Jiang Lens Agent Team

This team is the autonomous work surface for Jiang Lens. It is not a public editorial voice and it is not a central orchestrator. The team should grow as a set of narrow workers, each grounded by repo skills that describe one durable process.

## Runtime

- Workers use PicoClaw.
- OpenAI access should use Codex auth, not committed API keys.
- For video parsing and episode writing, use `gpt-5.5` with high-depth reasoning when the runtime exposes reasoning controls.

## Current Worker

`episode-worker` owns the first calibrated process:

```text
synced transcribed video
-> source ingest
-> transcript boundary review
-> semantic packet pass
-> public episode read
-> generated website episode
```

It should process one video per run, validate the result, and hand off. It should not create corpus impact records, lens concept docs, atlas pages, glossary canon, or promotion records unless the maintainer explicitly asks.

## Local Moltnet

The team declares a local Moltnet network named `local_lab`.

- `episode-floor`: the room for episode-processing status, blockers, review requests, and handoffs.
- `codex-operator`: a local operator participant for reading and sending room messages from the repo with `moltnet read` and `moltnet send`.

Each worker should expose only the rooms it actually needs. As the team grows, add rooms for distinct processes instead of using one noisy general channel for everything.

The concrete local server/node configs live in `Moltnet` and `MoltnetNode`. The Codex operator attachment has DMs disabled and `reply: never`; it should not wake on room traffic. Runtime state stays ignored under `.moltnet/`.

## Growth Pattern

Add new workers only when a process becomes repeatable enough to deserve its own operating loop. Likely next workers:

- `corpus-impact-worker`: records how one merged episode should affect the corpus map.
- `lens-concept-worker`: turns corpus impact records and source-grounded episode reads into one public lens concept page.
- `provenance-worker`: repairs evidence marks, source hovers, episode-to-lens links, and backlink payloads.
- `judge-worker`: reviews episode reads and lens docs with reader/world-model and provenance passes.

The process skills remain the stable base. Worker memory may improve with experience, but durable methodology belongs in `.codex/skills/`.
