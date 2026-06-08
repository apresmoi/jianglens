#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-jiang-lens-agentic-org}"
PRIVATE_REPO_ROOT="${PRIVATE_REPO_ROOT:-/opt/jianglens-private}"
PRIVATE_REPO_URL="${PRIVATE_REPO_URL:-git@github.com-jianglens-private:apresmoi/jianglens-private.git}"
PRIVATE_REPO_BRANCH="${PRIVATE_REPO_BRANCH:-main}"
PRIVATE_WORKSPACE_MOUNT="${PRIVATE_WORKSPACE_MOUNT:-repos/jianglens-private}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

case "$PRIVATE_WORKSPACE_MOUNT" in
  ""|/*|*"'"*)
    echo "PRIVATE_WORKSPACE_MOUNT must be a relative path without single quotes" >&2
    exit 1
    ;;
esac

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "container is not running: $CONTAINER_NAME" >&2
  exit 1
fi

if [ -d "$PRIVATE_REPO_ROOT/.git" ]; then
  existing_remote="$(git -C "$PRIVATE_REPO_ROOT" config --get remote.origin.url || true)"
  if [ "$existing_remote" != "$PRIVATE_REPO_URL" ]; then
    echo "private repo remote mismatch: $existing_remote" >&2
    echo "expected: $PRIVATE_REPO_URL" >&2
    exit 1
  fi
  git -C "$PRIVATE_REPO_ROOT" fetch origin "$PRIVATE_REPO_BRANCH"
  git -C "$PRIVATE_REPO_ROOT" checkout "$PRIVATE_REPO_BRANCH"
  git -C "$PRIVATE_REPO_ROOT" pull --ff-only origin "$PRIVATE_REPO_BRANCH"
else
  mkdir -p "$(dirname "$PRIVATE_REPO_ROOT")"
  git clone --branch "$PRIVATE_REPO_BRANCH" "$PRIVATE_REPO_URL" "$PRIVATE_REPO_ROOT"
fi

workspace_roots="$(
  docker exec "$CONTAINER_NAME" sh -lc \
    "find /var/lib/spawnfile/instances/picoclaw -type d -path '*/workspace' -print | sort"
)"

if [ -z "$workspace_roots" ]; then
  echo "no Picoclaw workspaces found in $CONTAINER_NAME" >&2
  exit 1
fi

while IFS= read -r workspace; do
  [ -n "$workspace" ] || continue
  target="$workspace/$PRIVATE_WORKSPACE_MOUNT"
  target_parent="${target%/*}"
  target_tmp="$target.tmp.$$"
  echo "syncing private corpus to $target"
  docker exec "$CONTAINER_NAME" sh -lc "rm -rf '$target_tmp' && mkdir -p '$target_parent' '$target_tmp'"
  tar -C "$PRIVATE_REPO_ROOT" -cf - . | docker exec -i "$CONTAINER_NAME" sh -lc "tar -C '$target_tmp' -xf - && rm -rf '$target' && mv '$target_tmp' '$target'"
done <<EOF
$workspace_roots
EOF

docker exec "$CONTAINER_NAME" sh -lc \
  "find /var/lib/spawnfile/instances/picoclaw -path '*/workspace/$PRIVATE_WORKSPACE_MOUNT/corpora/substack/predictivehistory/export/export-summary.json' -print | sort"
