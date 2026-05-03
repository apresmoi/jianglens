---
name: colab-video-pipeline
description: Use this skill when running or maintaining the Jiang Lens Google Colab video pipeline for YouTube download, diarization, transcription, Drive sync, or Playwright-based Colab automation. Requires the project Drive folder named jianglens and never commits cookies, browser profiles, tokens, or downloaded media.
---

# Colab Video Pipeline

Use this skill to process Jiang Lens video sources through the Colab notebooks in `ops/notebooks/colab/`.

## Safety Boundary

- Do not commit Google cookies, YouTube cookies, HuggingFace tokens, Colab browser profiles, audio, or video.
- Local browser auth belongs under `ops/secrets/browser-profiles/colab/`.
- YouTube `yt-dlp` cookies belong in Google Drive at `/content/drive/MyDrive/jianglens/cookies.txt`.
- HuggingFace auth should use Colab userdata key `HF_TOKEN` when possible.
- Stop and ask the maintainer on Google login, 2FA, CAPTCHA, account chooser ambiguity, quota exhaustion, or unexpected paid-credit prompts.

## Drive Layout

The canonical Drive root is:

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
        metadata.youtube.json   # optional; local import can create this by video id
        dump.json
        grouped.json
        transcription.json
```

Local text artifact sync uses:

```bash
./ops/notebooks/colab/sync-drive.sh --dry-run
./ops/notebooks/colab/sync-drive.sh
```

## Notebook Order

1. `YouTube_Manager.ipynb`: register channels, filter, download `audio.wav` into Drive.
2. `Pyannote_4_Pipeline-GPT-5.3.ipynb`: produce `dump.json` and `grouped.json`.
3. `Whisper_Transcription.ipynb`: produce `transcription.json`.
4. `sync-drive.sh`: copy text artifacts from Drive to `content/sources/raw/youtube`.

## Automation Contract

Before running browser automation:

1. Confirm the maintainer has created `MyDrive/jianglens`.
2. Confirm the target notebook is already saved in the maintainer's Colab account.
3. Use a persistent Playwright profile under `ops/secrets/browser-profiles/colab/`.
4. Run one notebook at a time. Do not start parallel Colab runtimes unless explicitly asked.
5. Capture screenshots and console/log evidence under `ops/staging/`.

Success means expected Drive artifacts exist:

- YouTube stage: `audio.wav`
- Metadata stage: `metadata.youtube.json` in synced raw source artifacts when YouTube metadata was resolvable. If the notebook did not write it, `ops/scripts/import-colab-video.mjs` can fetch and cache it by video id.
- Diarization stage: `dump.json` and `grouped.json`
- Transcription stage: `transcription.json` with `turns[].words[]` word timestamps when Whisper produced them.

The website transcript reader uses those word timestamps for phrase-level highlighting. If `transcription.json` has no `turns[].words[]`, do not silently proceed as if phrase tracking exists; rerun `Whisper_Transcription.ipynb` with `word_timestamps: True` or mark the import as block-timed only.

If a notebook has `RUN_BATCH = False`, do not assume it processed videos. Either the maintainer must set it in Colab, or the automation must intentionally set it before running the batch cell.

## Import Handoff

After syncing Drive artifacts into the repo, import a processed video with:

```bash
node ops/scripts/import-colab-video.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

The importer uses raw `metadata.youtube.json` when present. If it is missing, it tries `yt-dlp` by video id and caches compact metadata back into the raw source artifact folder. Publication dates are required for canon promotion; undated imports are review/search material only.
