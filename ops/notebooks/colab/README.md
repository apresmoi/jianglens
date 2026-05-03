# Colab Pipeline Notebooks

These notebooks are local copies of prior pipeline work, vendored here so Jiang Lens is self-contained and does not depend on a sibling repository.

## Files
- `YouTube_Manager.ipynb` — YouTube download / source management workflow.
- `Whisper_Transcription.ipynb` — Whisper-based timestamped transcription workflow.
- `Pyannote_4_Pipeline-GPT-5.3.ipynb` — Pyannote diarization / speaker segmentation workflow.

## Intended Use
Use Colab for the expensive media steps:
- fetch or extract audio from a Predictive History video
- generate raw timestamped transcript output
- diarize only when multiple speakers or interview formats require it
- export artifacts that can be cleaned into `transcript.clean.jsonl`, `transcript.clean.md`, and `transcript.yaml`

## Data Flow

```text
YouTube video -> Drive audio.wav -> Drive dump.json/grouped.json -> Drive transcription.json -> committed raw source artifacts -> source import
```

Drive working root:

```text
/content/drive/MyDrive/jianglens/
  _colab_envs/
  _hf_home/
  cookies.txt
  youtube/
    _config.json
    <channel-or-handle>/
      _channel.json
      <video-id>/
        audio.wav
        metadata.youtube.json
        dump.json
        grouped.json
        transcription.json
```

The maintainer should create `MyDrive/jianglens` before running the notebooks. Browser login state for Colab automation belongs in ignored local profiles under `ops/secrets/browser-profiles/colab/`; YouTube download cookies belong in Drive as `cookies.txt`.

Expected eventual repo target:

```text
content/sources/videos/<manifestation-id>/
  source.yaml
  transcripts/v1/transcript.raw.vtt
  transcripts/v1/transcript.clean.jsonl
  transcripts/v1/transcript.clean.md
  transcripts/v1/transcript.yaml
```

## Runtime Dependencies
- Google Colab with GPU, usually T4 or L4.
- `yt-dlp` and `ffmpeg` for source download / audio extraction.
- `faster-whisper` for transcription.
- `pyannote.audio` and a HuggingFace token for diarization.
- Google Drive for persistent media, model cache, and outputs.
- `rclone` locally for syncing Drive outputs back into this workspace.

## Drive Sync Back To Repo
Use `sync-drive.sh` after Colab has produced `dump.json`, `grouped.json`, or `transcription.json`.

```bash
./ops/notebooks/colab/sync-drive.sh --dry-run
./ops/notebooks/colab/sync-drive.sh
```

The script expects an `rclone` remote named `gdrive` and syncs from:

```text
gdrive:/jianglens/youtube
```

It writes text artifacts to:

```text
content/sources/raw/youtube
```

Only text-like artifacts are synced by default: `.json`, `.jsonl`, `.vtt`, `.md`, `.yaml`, `.yml`. These files are committed so autonomous workers can process videos from a fresh clone. Audio/video files stay in Drive unless explicitly pulled for debugging.

After syncing, import a processed video into `content/sources`:

```bash
node ops/scripts/import-colab-video.mjs --video-id VIDEO_ID --channel @PredictiveHistory
node ops/scripts/inspect-source.mjs content/sources/videos/<manifestation-id>
```

The importer uses `metadata.youtube.json` when present. If it is missing, it tries `yt-dlp` by video id and caches compact metadata in the raw source artifact folder so `published_at` can be recorded.

Override paths if needed:

```bash
LENS_COMPRESSION_DRIVE_REMOTE="gdrive:/jianglens/youtube" \
LENS_COMPRESSION_DRIVE_LOCAL="/tmp/jianglens/youtube" \
./ops/notebooks/colab/sync-drive.sh
```

## Adaptation Notes
These notebooks are copied as reference pipeline artifacts and partially normalized for Jiang Lens / Predictive History.

Before using them as canonical ingest tooling:
- parameterize channel/video inputs
- define export paths matching the proposed repo shape
- record model versions, runtime settings, and transcript checksums
- keep API keys and tokens out of committed notebooks
