#!/usr/bin/env bash
set -euo pipefail

WORKER_HOME="/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw"
WORKSPACE_DIR="$WORKER_HOME/workspace"
REPO_URL="${JIANG_LENS_REPO_URL:-https://github.com/apresmoi/jianglens.git}"
REPO_BRANCH="${JIANG_LENS_REPO_BRANCH:-main}"
REPO_DIR="${JIANG_LENS_REPO_DIR:-$WORKSPACE_DIR/jiang-lens}"
PICOCLAW_CONFIG_PATH="${PICOCLAW_CONFIG:-$WORKER_HOME/config.json}"

# The generated Spawnfile entrypoint starts Moltnet, Picoclaw, and the bridge.
# Configure GitHub auth in the same HOME Picoclaw uses so agent exec calls can
# clone, push branches, and open PRs without extra bootstrapping.
export HOME="${HOME:-$WORKER_HOME}"
export PICOCLAW_HOME="${PICOCLAW_HOME:-$HOME}"
export JIANG_LENS_REPO_DIR="$REPO_DIR"

configure-agent-github

if [ "${PICOCLAW_AUTONOMY_ENABLED:-true}" != "false" ] && [ -f "$PICOCLAW_CONFIG_PATH" ]; then
  PICOCLAW_CONFIG_PATH="$PICOCLAW_CONFIG_PATH" node <<'NODE'
const fs = require("node:fs");

const configPath = process.env.PICOCLAW_CONFIG_PATH;
const interval = Number(process.env.PICOCLAW_HEARTBEAT_INTERVAL_SECONDS || "900");
const safeInterval = Number.isFinite(interval) && interval > 0 ? interval : 900;

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.heartbeat = {
  ...(config.heartbeat && typeof config.heartbeat === "object" ? config.heartbeat : {}),
  enabled: true,
  interval: safeInterval
};

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
NODE
  echo "Picoclaw heartbeat enabled every ${PICOCLAW_HEARTBEAT_INTERVAL_SECONDS:-900}s"
fi

mkdir -p "$WORKSPACE_DIR"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Cloning Jiang Lens repo into $REPO_DIR"
  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$REPO_DIR"
else
  current_branch="$(git -C "$REPO_DIR" branch --show-current || true)"
  if [ "$current_branch" = "$REPO_BRANCH" ] && git -C "$REPO_DIR" diff --quiet && git -C "$REPO_DIR" diff --cached --quiet; then
    echo "Updating clean Jiang Lens checkout in $REPO_DIR"
    git -C "$REPO_DIR" fetch origin "$REPO_BRANCH"
    git -C "$REPO_DIR" pull --ff-only origin "$REPO_BRANCH"
  else
    echo "Leaving existing Jiang Lens checkout unchanged in $REPO_DIR"
    git -C "$REPO_DIR" status --short --branch || true
  fi
fi

exec /opt/spawnfile/entrypoint.sh
