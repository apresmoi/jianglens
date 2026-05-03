# Ops

`ops/` contains tooling for turning authored content into validated, deployable site data.

- `schemas/` stores reference schemas and validation rules.
- `scripts/` stores content compilers and validators.
- `notebooks/` stores Colab-friendly ingest and transcription workflows.

The compiler should produce deterministic outputs in `content/_generated/`, website-ready generated data in `website/src/data/lens/`, and generated documentation indexes under `website/src/content/docs/generated/`.

## One Video End To End

```bash
node ops/scripts/process-video-e2e.mjs --video-id 0HYET47Cc-E --channel @PredictiveHistory
```

The command imports the staged Colab transcript, prepares agent packets, detects missing semantic outputs, validates completed passes, aggregates an internal semantic evidence bundle, and compiles public episode data once all packets are present.
