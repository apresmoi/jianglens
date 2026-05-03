#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SPAWNFILE_BIN="${SPAWNFILE_BIN:-spawnfile}"
SPAWN_OUT="${SPAWN_OUT:-$ROOT/.spawn/episode-worker-build}"
BASE_TAG="${BASE_TAG:-jiang-lens-agents:spawnfile}"
FINAL_TAG="${FINAL_TAG:-jiang-lens-episode-worker:latest}"
CODEX_VERSION="${CODEX_VERSION:-0.128.0}"

node "$ROOT/ops/scripts/check-spawnfile-version.mjs" "$SPAWNFILE_BIN"

"$SPAWNFILE_BIN" build "$ROOT" -o "$SPAWN_OUT" -t "$BASE_TAG"
docker build \
  -f "$ROOT/ops/docker/episode-worker.Dockerfile" \
  --build-arg "BASE_IMAGE=$BASE_TAG" \
  --build-arg "CODEX_VERSION=$CODEX_VERSION" \
  -t "$FINAL_TAG" \
  "$ROOT"

echo "Built $FINAL_TAG from $BASE_TAG"
