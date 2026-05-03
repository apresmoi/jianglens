# Episode Worker Setup

This worker is deployed as an autonomous PR producer. It processes one ready video into episode artifacts, pushes a source-scoped branch, opens a PR against protected `main`, and enables auto-merge after CI.

## Fresh Workspace

The worker needs GitHub access to push branches, create PRs, and queue auto-merge. In Docker, pass a token at runtime with:

```bash
cp ops/env/episode-worker.env.example ops/secrets/episode-worker.env
$EDITOR ops/secrets/episode-worker.env
```

Use a fine-grained token scoped to `apresmoi/jianglens` with:

- Contents: read/write
- Pull requests: read/write
- Metadata: read

A classic token needs `repo`. Do not bake this token into the image. Keep it in
`ops/secrets/episode-worker.env` locally.

The local Docker stack requires `spawnfile@0.1.4` or newer. The launcher uses
that version to sync Codex OAuth and inject declared project secrets from the env
file at run time.

Configure `git` and `gh` inside the worker environment:

```bash
configure-agent-github
```

The Docker image does this automatically before starting the worker.

The worker runtime starts in a Picoclaw wrapper workspace. The repository is
cloned or updated at `jiang-lens/` inside that workspace before the agent starts.
Run repo commands from there:

```bash
cd jiang-lens
```

## Local Docker Stack

For local testing, run Moltnet inside the episode-worker container and expose it
to the host:

```bash
ops/scripts/build-episode-worker-image.sh
ops/scripts/run-episode-worker-stack.sh
```

This stores local runtime state under `.runtime/episode-worker/`, which is
gitignored, and exposes the Moltnet console at:

```text
http://127.0.0.1:8787/console/
```

Use logs to watch the stack:

```bash
docker logs -f jiang-lens-episode-worker
```

Stop it with:

```bash
docker rm -f jiang-lens-episode-worker
```

For the full operator runbook, environment variables, version checks, and
troubleshooting, see `docs/EPISODE_WORKER_STACK.md`.

Start from a clean clone. In Docker or any token-based environment, prefer HTTPS through `gh`:

```bash
gh repo clone apresmoi/jianglens jiang-lens
cd jiang-lens
```

On a local machine with SSH configured, this is also acceptable:

```bash
git clone git@github.com:apresmoi/jianglens.git jiang-lens
cd jiang-lens
```

After cloning, the same helper also exists at `ops/scripts/configure-agent-github.sh` for repo-local repair or validation.

Install website dependencies:

```bash
cd website
npm ci
cd ..
```

Validate the baseline before claiming work:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
cd ..
```

## Claim Work

Use the room, not DMs:

```bash
moltnet read --target room:episode-floor --limit 20
moltnet send --target room:episode-floor --text "Claiming predictive-history-example for episode processing."
```

If no task is assigned, inspect backlog:

```bash
node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory
node ops/scripts/audit-corpus-impact.mjs
```

## Branch

Never edit on `main`.

```bash
git checkout main
git pull --ff-only origin main
git checkout -b episode/<source-slug>
```

If local changes already exist, inspect them first. Do not overwrite maintainer or other-agent work.

## Work

Run the E2E script for one video:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
```

Use the narrower skills requested by the script status:

- `jiang-source-ingest`
- `jiang-transcript-boundary-review`
- `jiang-agent-transcript-pass`
- `jiang-episode-read-writer`
- `jiang-episode-publisher`
- `jiang-corpus-impact-pass`

Do not operate Colab, download media, or create lens concept pages during ordinary episode work.

## Validate

Run targeted checks for touched semantic and corpus impact files when present:

```bash
node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/<source-slug>/*.semantic.json
node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/<source-slug>/corpus-impact.json
```

Run the full repo checks:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
cd ..
```

## PR

Commit only scoped work:

```bash
git status --short
git add <scoped-files>
git commit -m "Process episode <source-slug>"
git push -u origin episode/<source-slug>
gh pr create --base main --head episode/<source-slug> --title "Process episode <source-slug>" --body-file <pr-body-file>
gh pr merge --auto --squash --delete-branch
```

The PR body must include:

- source slug and video ID,
- what changed,
- validation commands and results,
- corpus impact classification,
- memory or skill updates, if any,
- blockers or review requests.

Post the PR to `episode-floor`:

```bash
moltnet send --target room:episode-floor --text "Auto-merge queued: <PR URL> for <source-slug>. Validation: compile-content, validate-content, website build passed locally; GitHub CI is the merge gate."
```

After auto-merge completes and final status is posted, return the worker checkout
to clean `main` so the next autonomous wake can claim fresh work:

```bash
git checkout main
git pull --ff-only origin main
```

Do not use direct pushes or manual merge commands to bypass CI. If local validation fails, do not enable auto-merge.

## Learning

After each episode, ask what should improve next time:

- If it is an agent habit, update `MEMORY.md` concisely.
- If it is a repeatable method, update the relevant skill.
- If it is a missing mechanical check, propose or add a script.
- If it is source-specific, keep it in that source's artifact or PR notes.

Growing with the system means preserving useful experience in durable, reviewable repo artifacts.
