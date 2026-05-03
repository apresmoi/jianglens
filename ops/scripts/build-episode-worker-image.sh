#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SPAWN_OUT="${SPAWN_OUT:-$ROOT/.spawn/episode-worker-build}"
BASE_TAG="${BASE_TAG:-jiang-lens-agents:spawnfile}"
FINAL_TAG="${FINAL_TAG:-jiang-lens-episode-worker:latest}"

spawnfile build "$ROOT" -o "$SPAWN_OUT" -t "$BASE_TAG"
docker build \
  -f "$ROOT/ops/docker/episode-worker.Dockerfile" \
  --build-arg "BASE_IMAGE=$BASE_TAG" \
  -t "$FINAL_TAG" \
  "$ROOT"

echo "Built $FINAL_TAG from $BASE_TAG"
