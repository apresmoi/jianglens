# Raw Source Artifacts

This folder stores committed text artifacts exported from the Colab and Drive video pipeline.

Workers use these files as the first cloneable input for source import:

```text
content/sources/raw/youtube/<channel>/<video-id>/
  metadata.youtube.json
  dump.json
  grouped.json
  transcription.json
```

Commit text-like source artifacts here so autonomous agents can process videos without Google Drive access. Do not commit audio, video, cookies, browser profiles, tokens, or Colab runtime caches.

`ops/staging/` remains a local ignored cache for screenshots, experiments, and temporary sync work. It is not the source of truth for autonomous episode workers.
