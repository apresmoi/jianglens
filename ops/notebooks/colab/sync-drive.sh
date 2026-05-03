#!/usr/bin/env bash
# Sync Jiang Lens transcript artifacts from Google Drive to a local staging folder.
# Downloads text/JSON metadata only. Audio and video artifacts stay in Drive by default.
#
# Usage:
#   ./ops/notebooks/colab/sync-drive.sh
#   ./ops/notebooks/colab/sync-drive.sh --dry-run
#
# Optional overrides:
#   LENS_COMPRESSION_DRIVE_REMOTE="gdrive:/jianglens/youtube"
#   LENS_COMPRESSION_DRIVE_LOCAL="/absolute/local/path"

set -euo pipefail

REMOTE="${LENS_COMPRESSION_DRIVE_REMOTE:-gdrive:/jianglens/youtube}"
LOCAL="${LENS_COMPRESSION_DRIVE_LOCAL:-$(git rev-parse --show-toplevel)/ops/staging/drive/youtube}"

mkdir -p "$LOCAL"

rclone copy "$REMOTE" "$LOCAL" \
  --include "*.json" \
  --include "*.jsonl" \
  --include "*.vtt" \
  --include "*.md" \
  --include "*.yaml" \
  --include "*.yml" \
  --progress \
  --transfers 8 \
  --checkers 16 \
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
