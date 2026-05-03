# Sources

Sources are what Jiang wrote, said, published, or what the project uses for provenance. Downstream claims should cite stable source refs rather than page-level URLs.

## Expected Shapes

```text
videos/<manifestation-id>/
  source.yaml
  transcripts/v1/transcript.clean.jsonl
  transcripts/v1/transcript.clean.md
  transcripts/v1/transcript.yaml

articles/<article-id>/
  source.yaml
  article.clean.jsonl
  article.clean.md

interviews/<interview-id>/
  source.yaml
  transcripts/v1/transcript.clean.jsonl
```

Channel-level metadata belongs in `channels/`. Channel metadata is provenance, not conceptual evidence by itself.

## Chronology

Every source should carry the strongest known date metadata before it can influence canon:

- `recorded_at`: when the statement was made, if known.
- `published_at`: when the artifact became public.
- `date_precision`: `day`, `month`, `year`, or `unknown`.
- `chronology_status`: `dated` or `needs-date`.

Undated sources can be transcribed and searched, but they are not eligible for latest-position logic. If two sources disagree, preserve both dated refs and model the disagreement as a timeline delta rather than overwriting the older position.

Colab video outputs can be imported from `ops/staging/drive/youtube` with:

```bash
node ops/scripts/import-colab-video.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

The importer tries to resolve YouTube metadata by video id with `yt-dlp`, caches compact metadata as `metadata.youtube.json`, and uses `published_at` for chronology unless `recorded_at` is provided.

After import, prepare semantic packets for agents:

```bash
node ops/scripts/prepare-agent-transcript-packets.mjs --source content/sources/videos/<manifestation-id>
```

Agents, not importer heuristics, decide questions, answers, speaker uncertainty, claims, glossary terms, and chronology notes.
