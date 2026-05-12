#!/usr/bin/env bash
# Sync Jiang Lens transcript artifacts from Google Drive to committed raw source artifacts.
# Downloads text/JSON metadata only. Audio and video artifacts stay in Drive by default.
#
# Usage:
#   ./ops/notebooks/colab/sync-drive.sh
#   ./ops/notebooks/colab/sync-drive.sh --dry-run
#
# Optional overrides:
#   LENS_COMPRESSION_DRIVE_REMOTE="gdrive:/jianglens/youtube"
#   LENS_COMPRESSION_DRIVE_LOCAL="/absolute/local/path"
#   LENS_COMPRESSION_RCLONE_TRANSFERS=2
#   LENS_COMPRESSION_RCLONE_CHECKERS=4
#   LENS_COMPRESSION_DRIVE_PACER_MIN_SLEEP=200ms
#   LENS_COMPRESSION_DRIVE_PACER_BURST=50

set -euo pipefail

REMOTE="${LENS_COMPRESSION_DRIVE_REMOTE:-gdrive:/jianglens/youtube}"
LOCAL="${LENS_COMPRESSION_DRIVE_LOCAL:-$(git rev-parse --show-toplevel)/content/sources/raw/youtube}"
RCLONE_TRANSFERS="${LENS_COMPRESSION_RCLONE_TRANSFERS:-2}"
RCLONE_CHECKERS="${LENS_COMPRESSION_RCLONE_CHECKERS:-4}"
DRIVE_PACER_MIN_SLEEP="${LENS_COMPRESSION_DRIVE_PACER_MIN_SLEEP:-200ms}"
DRIVE_PACER_BURST="${LENS_COMPRESSION_DRIVE_PACER_BURST:-50}"

mkdir -p "$LOCAL"

rclone copy "$REMOTE" "$LOCAL" \
  --include "*.json" \
  --include "*.jsonl" \
  --include "*.vtt" \
  --include "*.md" \
  --include "*.yaml" \
  --include "*.yml" \
  --progress \
  --transfers "$RCLONE_TRANSFERS" \
  --checkers "$RCLONE_CHECKERS" \
  --drive-pacer-min-sleep "$DRIVE_PACER_MIN_SLEEP" \
  --drive-pacer-burst "$DRIVE_PACER_BURST" \
  "$@"

echo ""
echo "Done. Synced text artifacts from:"
echo "  $REMOTE"
echo "to:"
echo "  $LOCAL"

if compgen -G "$LOCAL/*/" > /dev/null; then
  echo ""
  echo "Channels synced:"
  for channel in "$LOCAL"/*/; do
    count=$(find "$channel" -mindepth 1 -maxdepth 1 -type d | wc -l | xargs)
    echo "  $(basename "$channel"): $count videos"
  done
fi
