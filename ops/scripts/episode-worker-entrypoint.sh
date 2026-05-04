#!/usr/bin/env bash
set -euo pipefail

WORKER_HOME="/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw"
WORKSPACE_DIR="$WORKER_HOME/workspace"
REPO_URL="${JIANG_LENS_REPO_URL:-https://github.com/apresmoi/jianglens.git}"
REPO_BRANCH="${JIANG_LENS_REPO_BRANCH:-main}"
REPO_DIR="${JIANG_LENS_REPO_DIR:-$WORKSPACE_DIR/jiang-lens}"
MOLTNET_CLIENT_CONFIG_PATH="${MOLTNET_CLIENT_CONFIG:-$WORKSPACE_DIR/.moltnet/config.json}"
PICOCLAW_CONFIG_PATH="${PICOCLAW_CONFIG:-$WORKER_HOME/config.json}"
LOOP_INTERVAL_SECONDS="${EPISODE_WORKER_LOOP_INTERVAL_SECONDS:-60}"
LOOP_SESSION="${EPISODE_WORKER_LOOP_SESSION:-agent:episode-worker:autonomous-loop}"
LOOP_STATE_DIR="${EPISODE_WORKER_STATE_DIR:-$WORKER_HOME/state/episode-worker}"
LOOP_LEASE_FILE="$LOOP_STATE_DIR/lease.json"
LOOP_HEARTBEAT_FILE="$LOOP_STATE_DIR/heartbeat.json"
LOOP_CURRENT_FILE="$LOOP_STATE_DIR/current.json"
LOOP_JOURNAL_FILE="$LOOP_STATE_DIR/journal.md"
LOOP_FAILURES_FILE="$LOOP_STATE_DIR/failures.md"
LOOP_HEARTBEAT_INTERVAL_SECONDS="${EPISODE_WORKER_HEARTBEAT_INTERVAL_SECONDS:-30}"

# The generated Spawnfile entrypoint starts Moltnet, Picoclaw, and the bridge.
# Configure GitHub auth in the same HOME Picoclaw uses so agent exec calls can
# clone, push branches, and open PRs without extra bootstrapping.
export HOME="${HOME:-$WORKER_HOME}"
export PICOCLAW_HOME="${PICOCLAW_HOME:-$HOME}"
export JIANG_LENS_REPO_DIR="$REPO_DIR"
export MOLTNET_CLIENT_CONFIG="$MOLTNET_CLIENT_CONFIG_PATH"

configure-agent-github

if [ -f "$PICOCLAW_CONFIG_PATH" ]; then
  PICOCLAW_CONFIG_PATH="$PICOCLAW_CONFIG_PATH" node <<'NODE'
const fs = require("node:fs");

const configPath = process.env.PICOCLAW_CONFIG_PATH;
const enabled = process.env.PICOCLAW_AUTONOMY_ENABLED === "true";
const interval = Number(process.env.PICOCLAW_HEARTBEAT_INTERVAL_SECONDS || "900");
const safeInterval = Number.isFinite(interval) && interval > 0 ? interval : 900;

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.heartbeat = {
  ...(config.heartbeat && typeof config.heartbeat === "object" ? config.heartbeat : {}),
  enabled,
  interval: safeInterval
};

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
NODE
  if [ "${PICOCLAW_AUTONOMY_ENABLED:-false}" != "false" ]; then
    echo "Picoclaw heartbeat enabled every ${PICOCLAW_HEARTBEAT_INTERVAL_SECONDS:-900}s"
  else
    echo "Picoclaw heartbeat disabled; direct episode worker supervisor owns autonomy"
  fi
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

start_episode_worker_loop() {
  if [ "${EPISODE_WORKER_LOOP_ENABLED:-true}" = "false" ]; then
    echo "Episode worker loop disabled"
    return
  fi

  (
    set +e
    mkdir -p "$LOOP_STATE_DIR"
    touch "$LOOP_JOURNAL_FILE" "$LOOP_FAILURES_FILE"

    while true; do
      if ! [[ "$LOOP_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [ "$LOOP_INTERVAL_SECONDS" -lt 5 ]; then
        LOOP_INTERVAL_SECONDS=60
      fi
      if ! [[ "$LOOP_HEARTBEAT_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [ "$LOOP_HEARTBEAT_INTERVAL_SECONDS" -lt 5 ]; then
        LOOP_HEARTBEAT_INTERVAL_SECONDS=30
      fi

      until curl -sf "http://127.0.0.1:8787/healthz" >/dev/null 2>&1; do
        sleep 2
      done

      existing_pid=""
      if [ -f "$LOOP_LEASE_FILE" ]; then
        existing_pid="$(sed -n 's/.*"pid":[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$LOOP_LEASE_FILE" | head -n 1)"
      fi

      if [ -n "$existing_pid" ] && [ -d "/proc/$existing_pid" ]; then
        existing_cmd="$(tr '\0' ' ' <"/proc/$existing_pid/cmdline" 2>/dev/null)"
        case "$existing_cmd" in
          *"picoclaw agent --session $LOOP_SESSION"*|*"picoclaw agent"*)
            now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
            cat >"$LOOP_HEARTBEAT_FILE.tmp" <<JSON
{
  "agent": "episode-worker",
  "status": "running",
  "pid": $existing_pid,
  "session": "$LOOP_SESSION",
  "updated_at": "$now",
  "supervisor_note": "existing worker process is still alive"
}
JSON
            mv "$LOOP_HEARTBEAT_FILE.tmp" "$LOOP_HEARTBEAT_FILE"
            echo "[episode-worker-loop] previous iteration still running with pid $existing_pid"
            if [ "${EPISODE_WORKER_LOOP_ONCE:-false}" = "true" ]; then
              break
            fi
            sleep "$LOOP_INTERVAL_SECONDS"
            continue
            ;;
        esac
      fi

      if [ -f "$LOOP_LEASE_FILE" ]; then
        stale_at="$(date -u +%Y%m%dT%H%M%SZ)"
        mv "$LOOP_LEASE_FILE" "$LOOP_STATE_DIR/stale-lease-$stale_at.json"
        echo "[episode-worker-loop] recovered stale worker lease"
      fi

      started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      printf '[episode-worker-loop] starting iteration at %s\n' "$started_at"

      prompt="$(cat <<PROMPT
You are the Jiang Lens episode-worker running from the autonomous worker loop.

This is not a Moltnet auto-reply subprocess. You may run long enough to finish one concrete unit of work. You are still a Moltnet room participant: use the moltnet skill and the local Moltnet CLI to read local_lab/episode-floor, answer fresh direct mentions, discuss blockers, and post concise status updates. The launcher sets MOLTNET_CLIENT_CONFIG, so ordinary commands like moltnet read --target room:episode-floor --limit 20 and moltnet send --target room:episode-floor --text "..." work even after you cd jiang-lens.

You are a durable agent identity, not a disposable cron task. Your persisted runtime state lives at:

- current state: $LOOP_CURRENT_FILE
- heartbeat: $LOOP_HEARTBEAT_FILE
- journal: $LOOP_JOURNAL_FILE
- failures: $LOOP_FAILURES_FILE

At startup, read those files when they exist. During work, update current state at stage boundaries with the claimed source, branch, stage, and next checkpoint. Use the journal for concise reusable lessons and the failures file for concrete recovery notes. Do not treat memory as authority over source refs, validation, git state, or maintainer instructions.

Loop contract for this iteration:

1. Enter jiang-lens/ inside the Picoclaw workspace and inspect git status --short --branch.
2. Read recent episode-floor history. The newest maintainer instruction wins, but completed closeout/source-claim messages are history, not new work.
3. Read your persisted current state before deciding whether this is a fresh claim or a resume.
4. Before heavy episode work, post one concise reception/state message to episode-floor with current branch, claimed source if any, and the next stage.
5. If the checkout already has a source branch or uncommitted source-scoped work, continue that source from the first missing or failing stage. Do not claim a second source.
6. If the checkout is clean on main, fast-forward from origin/main, claim the next ready unprocessed @PredictiveHistory source from the deterministic backlog, create a source-scoped branch, and process exactly one source.
7. If there is no ready unprocessed source, post a concise no-ready-source status and exit this iteration.
8. Run the Jiang video E2E process using the repo skills. Use yt-dlp only through the metadata fallback path; do not download media.
9. At stage boundaries, update current state, read recent room messages, and answer fresh direct mentions before continuing. Post stage updates at claim, ingest/semantic/read/publish, validation, PR creation, CI/auto-merge, and blocker handoff.
10. Stop at a website-visible episode. Do not run corpus-impact, lens, canon, glossary, atlas, or ledger passes; note any broader follow-up briefly for a separate downstream agent.
11. Open a PR, enable auto-merge only after local validation is clean, wait for merge when practical, then return to clean synced main.
12. Exit after one source is processed, merged, blocked, or handed off. The outer supervisor will keep this identity alive and resume from state if the process dies.

Self-improvement rule: you may edit only agents/episode-worker/** for worker-local instructions, memory, or proposals. Do not edit .codex/skills/**, runtime/Spawnfile/ops scripts, global docs, website files, or content outside your episode write scope unless a maintainer explicitly expands scope. If a skill, runtime, or shared pipeline change seems necessary, write a proposal under agents/episode-worker/proposals/ or include it in the PR notes.
PROMPT
)"

      HOME="$WORKER_HOME" \
        CODEX_HOME="$WORKER_HOME/.codex" \
        PICOCLAW_HOME="$WORKER_HOME" \
        PICOCLAW_CONFIG="$PICOCLAW_CONFIG_PATH" \
        MOLTNET_CLIENT_CONFIG="$MOLTNET_CLIENT_CONFIG_PATH" \
        JIANG_LENS_REPO_DIR="$REPO_DIR" \
        EPISODE_WORKER_STATE_DIR="$LOOP_STATE_DIR" \
        picoclaw agent --session "$LOOP_SESSION" --message "$prompt" &
      agent_pid="$!"

      cat >"$LOOP_LEASE_FILE.tmp" <<JSON
{
  "agent": "episode-worker",
  "pid": $agent_pid,
  "session": "$LOOP_SESSION",
  "started_at": "$started_at",
  "repo_dir": "$REPO_DIR",
  "state_dir": "$LOOP_STATE_DIR"
}
JSON
      mv "$LOOP_LEASE_FILE.tmp" "$LOOP_LEASE_FILE"

      (
        while kill -0 "$agent_pid" >/dev/null 2>&1; do
          now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          cat >"$LOOP_HEARTBEAT_FILE.tmp" <<JSON
{
  "agent": "episode-worker",
  "status": "running",
  "pid": $agent_pid,
  "session": "$LOOP_SESSION",
  "started_at": "$started_at",
  "updated_at": "$now",
  "supervisor_note": "worker process is alive"
}
JSON
          mv "$LOOP_HEARTBEAT_FILE.tmp" "$LOOP_HEARTBEAT_FILE"
          sleep "$LOOP_HEARTBEAT_INTERVAL_SECONDS"
        done
      ) &
      heartbeat_pid="$!"

      wait "$agent_pid"
      status="$?"
      kill "$heartbeat_pid" >/dev/null 2>&1
      wait "$heartbeat_pid" >/dev/null 2>&1

      finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      cat >"$LOOP_HEARTBEAT_FILE.tmp" <<JSON
{
  "agent": "episode-worker",
  "status": "exited",
  "pid": $agent_pid,
  "session": "$LOOP_SESSION",
  "started_at": "$started_at",
  "updated_at": "$finished_at",
  "exit_status": $status,
  "supervisor_note": "worker process exited; next loop may resume from repo and current state"
}
JSON
      mv "$LOOP_HEARTBEAT_FILE.tmp" "$LOOP_HEARTBEAT_FILE"
      rm -f "$LOOP_LEASE_FILE"
      printf '[episode-worker-loop] iteration exited with status %s\n' "$status"

      if [ "${EPISODE_WORKER_LOOP_ONCE:-false}" = "true" ]; then
        break
      fi

      sleep "$LOOP_INTERVAL_SECONDS"
    done
  ) &
}

start_episode_worker_loop

exec /opt/spawnfile/entrypoint.sh
