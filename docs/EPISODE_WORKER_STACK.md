# Episode Worker Stack

This runbook starts the local autonomous episode worker stack:

- Spawnfile compiles the Jiang Lens team.
- Docker runs the generated PicoClaw worker image.
- The worker keeps a persisted Git checkout at `.runtime/episode-worker/repo`, mounted inside PicoClaw as `workspace/jiang-lens`.
- The wrapper enables PicoClaw heartbeat so the worker can wake without a manual room kick.
- Moltnet runs inside the container and exposes `local_lab/episode-floor`.
- Codex OAuth is mounted from a local Spawnfile auth profile.
- `GH_TOKEN` is injected from a local env file so the worker can push branches and open PRs.
- The worker image includes `yt-dlp` for metadata fallback when a synced transcript folder lacks `metadata.youtube.json`.

## Prerequisites

Install the current Spawnfile CLI:

```bash
npm install -g spawnfile@0.1.4
```

The launcher requires Spawnfile `0.1.4` or newer because it relies on external env-file injection and the current PicoClaw Codex auth wiring.

Log in to Codex on the host account that will run the stack:

```bash
codex login --device-auth
```

Create a fine-grained GitHub token for `apresmoi/jianglens` with:

- Contents: read/write
- Pull requests: read/write
- Metadata: read

Store it locally:

```bash
mkdir -p ops/secrets
cp ops/env/episode-worker.env.example ops/secrets/episode-worker.env
$EDITOR ops/secrets/episode-worker.env
```

`ops/secrets/` is gitignored. Do not commit real tokens.

## Build

```bash
ops/scripts/build-episode-worker-image.sh
```

The build script checks the Spawnfile CLI version before compiling. It creates two local Docker images by default:

- `jiang-lens-agents:spawnfile`: raw Spawnfile-generated base image
- `jiang-lens-episode-worker:latest`: overlay image with `gh`, Codex CLI, `yt-dlp`, and GitHub setup

`yt-dlp` is present so `ops/scripts/import-colab-video.mjs` can resolve public
YouTube title/date metadata. The worker still should not download audio/video or
use browser/YouTube cookies; Colab and Drive remain the transcription pipeline.

Useful build environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPAWNFILE_BIN` | `spawnfile` | Spawnfile CLI path or command. |
| `SPAWN_OUT` | `.spawn/episode-worker-build` | Generated Spawnfile output directory. |
| `BASE_TAG` | `jiang-lens-agents:spawnfile` | Intermediate generated image tag. |
| `FINAL_TAG` | `jiang-lens-episode-worker:latest` | Final worker image tag. |
| `CODEX_VERSION` | `0.128.0` | Codex CLI version installed in the overlay image. |

## Run

```bash
ops/scripts/run-episode-worker-stack.sh
```

The launcher does this on every run:

1. Checks Spawnfile `>= 0.1.4`.
2. Reads `ops/secrets/episode-worker.env`.
3. Runs `spawnfile auth sync . --profile jiang-lens --env-file ops/secrets/episode-worker.env`.
4. Compiles the current Spawnfile graph to `.spawn/episode-worker-build`.
5. Builds the Docker run invocation from the installed Spawnfile compiler.
6. Passes the env file through the run invocation so `GH_TOKEN` is available in the container.
7. Mounts `.runtime/episode-worker/repo` as the worker checkout.
8. Clones `https://github.com/apresmoi/jianglens.git` into the mounted checkout if missing, or fast-forwards a clean `main` checkout.
9. Enables PicoClaw heartbeat unless `PICOCLAW_AUTONOMY_ENABLED=false`.
10. Mounts persisted Moltnet state under `.runtime/episode-worker/`.
11. Registers the local `codex-operator` participant so host `moltnet send` messages are visible in room history.

If an older container already has an unmounted checkout and `.runtime/episode-worker/repo` is empty, the launcher snapshots that checkout before replacing the container.

The container starts detached by default:

```bash
docker logs -f jiang-lens-episode-worker
```

Run in the foreground when debugging:

```bash
ops/scripts/run-episode-worker-stack.sh --foreground
```

Stop the stack:

```bash
docker rm -f jiang-lens-episode-worker
```

## Moltnet

Open the local console:

```text
http://127.0.0.1:8787/console/
```

Expected topology:

- Network: `local_lab`
- Room: `episode-floor`
- Member: `episode-worker`
- Local operator: `codex-operator` can read and send from the host, with no automatic replies.

The worker should use `episode-floor` for claims, blockers, PR handoffs, and validation status.

## Runtime Environment

Useful run environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPAWNFILE_BIN` | `spawnfile` | Spawnfile CLI path or command. |
| `IMAGE` | `jiang-lens-episode-worker:latest` | Docker image to run. |
| `NAME` | `jiang-lens-episode-worker` | Docker container name. |
| `PORT` | `8787` | Host port bound to Moltnet console/API. |
| `RUNTIME_DIR` | `.runtime/episode-worker` | Gitignored persisted Moltnet/runtime state and worker checkout. |
| `ENV_FILE` | `ops/secrets/episode-worker.env` | Local env file with `GH_TOKEN`. |
| `AUTH_PROFILE` | `jiang-lens` | Local Spawnfile auth profile name. |
| `SPAWN_OUT` | `.spawn/episode-worker-build` | Generated Spawnfile output directory. |
| `JIANG_LENS_REPO_URL` | `https://github.com/apresmoi/jianglens.git` | Repo cloned into the worker workspace. |
| `JIANG_LENS_REPO_BRANCH` | `main` | Base branch used for clean checkout updates. |
| `JIANG_LENS_REPO_DIR` | `/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/workspace/jiang-lens` | Absolute checkout path used by the worker container. |
| `PICOCLAW_AUTONOMY_ENABLED` | `true` | Set `false` to disable heartbeat patching at boot. |
| `PICOCLAW_HEARTBEAT_INTERVAL_SECONDS` | `900` | Autonomous wake interval. |

Example with a custom port:

```bash
PORT=18787 ops/scripts/run-episode-worker-stack.sh
```

Example with a locally built Spawnfile CLI:

```bash
SPAWNFILE_BIN=/Users/apresmoi/Documents/spawnfile/dist/cli/index.js \
  ops/scripts/run-episode-worker-stack.sh
```

## Manual Auth Check

You can verify the auth profile without starting Docker:

```bash
spawnfile auth sync . --profile jiang-lens --env-file ops/secrets/episode-worker.env
spawnfile auth show --profile jiang-lens
```

The profile should include Codex imported auth and `GH_TOKEN` in env. The run script repeats this sync before every container start.

## Troubleshooting

If the script reports an old Spawnfile version, update it:

```bash
npm install -g spawnfile@0.1.4
```

If port `8787` is busy, either stop the other Moltnet process or run with `PORT=...`.

If GitHub commands fail inside the worker, check:

```bash
docker exec -it jiang-lens-episode-worker gh auth status
docker exec -it jiang-lens-episode-worker git config --list
```

If Codex auth fails, refresh host Codex auth and rerun the stack:

```bash
codex login --device-auth
ops/scripts/run-episode-worker-stack.sh
```
