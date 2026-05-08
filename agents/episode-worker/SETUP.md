# Episode Worker Setup

This worker is deployed as an autonomous PR producer. It processes one ready video source into public episode or interview artifacts, pushes a source-scoped branch, opens a PR against protected `main`, and enables auto-merge after CI.

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

The Docker image includes `yt-dlp` only for YouTube metadata fallback during
`ops/scripts/import-colab-video.mjs`. Do not use the worker to download audio or
video; raw media and cookies belong to Colab/Drive, not the episode PR worker.

Configure `git` and `gh` inside the worker environment:

```bash
configure-agent-github
```

Run it at the start of a wake before branch or PR work.

The worker runtime starts in a Picoclaw workspace. The repository is cloned or
updated at `jiang-lens/` inside that workspace before the agent starts.
Run repo commands from there:

```bash
cd jiang-lens
```

The worker also has durable local state mounted outside git. By default the host
stores it at `.runtime/episode-worker/state` and the container sees it at:

```text
/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/state/episode-worker
```

Read `STATE.md` before using these files. Runtime state helps restarts resume
the same source, but it does not override repo status, Moltnet instructions,
source artifacts, validation, or GitHub PR state.

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
moltnet read --network local_lab --target room:episode-floor --limit 20
moltnet send --network local_lab --target room:episode-floor --text "Claiming predictive-history-example for episode processing."
```

Write room messages as yourself, in first person. Keep them short and useful to
teammates: what you are checking, what blocked, what PR or validation result
matters, and what you will do next. Avoid third-person self-references and rigid
workflow labels unless a label makes the update clearer.

If `MOLTNET_CLIENT_CONFIG` is not already set after entering `jiang-lens/`,
export the Picoclaw workspace client config before using Moltnet:

```bash
export MOLTNET_CLIENT_CONFIG=/var/lib/spawnfile/instances/picoclaw/agent-episode-worker/picoclaw/workspace/.moltnet/config.json
```

If the client config is not found, report a runtime blocker instead of working silently.

On restart, treat recent room history as ordered instructions, not as a backlog
of tasks to replay. The newest maintainer instruction wins over older source
claims. If the newest instruction says to diagnose, maintain worker docs, or stop
video work, create the instructed non-episode branch and do not run the video
pipeline.

If no task is assigned, inspect backlog:

```bash
node ops/scripts/build-episode-backlog.mjs --channel @PredictiveHistory
node ops/scripts/build-episode-backlog.mjs --channel Interviews \
  --out content/workflow/tasks/interview-production-backlog.json \
  --tsv-out content/workflow/tasks/interview-production-backlog.tsv
```

`source_class: episode` publishes under `/episodes/`; `source_class: interview`
publishes under `/interviews/`. If the backlog still has no ready source and `current.json` already records the
same blocked source, commit, raw files, and readiness booleans, treat the worker
as idle. Send the compact "going idle until new source artifacts, origin/main
change, or maintainer instruction" room message only when first entering that
state. On later unchanged wakes, exit silently after verifying state; do not
repeat the normal reception or blocker message.

## Branch

Never edit on `main`.

```bash
git checkout main
git pull --ff-only origin main
git checkout -b episode/<source-slug>
# or, for interview-format sources
git checkout -b interview/<source-slug>
```

If local changes already exist, inspect them first. Do not overwrite maintainer or other-agent work.

## Work

Run the E2E script for one video:

```bash
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel @PredictiveHistory
# or, for interview-format raw artifacts:
node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID --channel Interviews/<host-channel-id>
```

Before running a stage, check whether that stage is already complete on the
branch or on `origin/main`. Existing ingest files, packet outputs, read JSON,
generated episode data, or a merged PR mean the restart should continue from
validation or the first missing step instead of replaying completed work.

Use the narrower skills requested by the script status:

- `jiang-source-ingest`
- `jiang-transcript-boundary-review`
- `jiang-agent-transcript-pass`
- `jiang-episode-read-writer`
- `jiang-episode-publisher`

Do not operate Colab, download media, or create lens concept pages during ordinary episode work.
Do not run corpus-impact, lens, canon, glossary, atlas, or ledger passes during ordinary episode work. The episode worker stops once the episode is website-visible and validated. Broader corpus or lens suggestions belong in PR notes or the Moltnet handoff for a separate agent.

If transcription and diarization artifacts are present but
`metadata.youtube.json` is missing, run the source importer and let its
metadata-only `yt-dlp` fallback fill the gap. The worker image includes `yt-dlp`
for this path. Hand off to Colab only when raw media, transcription, diarization,
or the importer fallback itself is missing or failing.

For runs that take more than a few minutes, post concise `episode-floor` progress
at stage boundaries: claim or cleanup, current stage, validation, PR creation,
and CI or blocker handoff.

The Docker stack runs episode work through Picoclaw's native cron service. The
local launcher seeds one primary recurring agent-turn job, then the worker may
adjust that schedule through Picoclaw cron. The Moltnet room attachment is configured
with `reply: never` because Moltnet auto-reply is a short chat path and can
terminate long episode jobs. Treat Moltnet as the coordination surface, not as
the job supervisor. This does not mean silence: read the room at startup and
stage boundaries, answer fresh direct mentions, and post claims, questions,
blockers, PRs, and handoffs with the Moltnet CLI.

## Validate

Run targeted checks for touched semantic packet files when present:

```bash
node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/<source-slug>/*.semantic.json
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
git commit -m "Process source <source-slug>"
git push -u origin episode/<source-slug>
gh pr create --base main --head episode/<source-slug> --title "Process source <source-slug>" --body-file <pr-body-file>
gh pr merge --auto --squash --delete-branch
```

Use `interview/<source-slug>` instead of `episode/<source-slug>` for interview-format sources.

The PR body must include:

- source slug and video ID,
- source class and public route (`/episodes/<source-slug>/` or `/interviews/<source-slug>/`),
- what changed,
- validation commands and results,
- episode-only follow-up suggestions for a separate corpus-impact/lens agent, if any,
- memory updates or worker-local proposals, if any,
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
- If it is a repeatable method, write a proposal under `agents/episode-worker/proposals/` or in the PR notes.
- If it is a missing mechanical check, write a concrete proposal instead of adding shared scripts unless the maintainer explicitly expands scope.
- If it is source-specific, keep it in that source's artifact or PR notes.

Growing with the system means preserving useful experience in durable, reviewable repo artifacts.

For worker self-diagnosis, postmortem, or instruction-hardening tasks, durable
changes by this worker are limited to `agents/episode-worker/**` unless the
maintainer explicitly expands the write scope. Put recommendations for root
skills, content tooling, website, ops scripts, or global docs in
`agents/episode-worker/proposals/` or the PR notes.
instead of editing those files.
