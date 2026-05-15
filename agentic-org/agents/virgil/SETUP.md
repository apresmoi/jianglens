# Virgil Setup

Virgil is deployed as an autonomous PR producer. He processes one ready video source into public episode or interview artifacts, pushes a source-scoped branch, opens a PR against protected `main`, and hands that PR to Aristotle for source QA.

## Fresh Workspace

Virgil needs GitHub access to push branches and create PRs. In Docker, pass a token at runtime with:

```bash
cp agentic-org/ops/env/agentic-org.env.example agentic-org/ops/secrets/agentic-org.env
$EDITOR agentic-org/ops/secrets/agentic-org.env
```

Use a fine-grained token scoped to `apresmoi/jianglens` with:

- Contents: read/write
- Pull requests: read/write
- Metadata: read

A classic token needs `repo`. Do not bake this token into the image. Keep it in
`agentic-org/ops/secrets/agentic-org.env` locally.

The local org stack requires `spawnfile@0.1.9` or newer so agent schedules are
lowered into PicoClaw's native cron store. Use `spawnfile up` directly; there is
no project-specific Docker launcher or overlay path.

The Spawnfile runtime includes `yt-dlp` only for YouTube metadata fallback during
`ops/scripts/import-colab-video.mjs`. Do not use the worker to download audio or
video; raw media and cookies belong to Colab/Drive, not the episode PR worker.

Configure `git` and `gh` inside the worker environment when needed:

```bash
git config --global user.name "${GIT_AUTHOR_NAME:-Jiang Lens Agents}"
git config --global user.email "${GIT_AUTHOR_EMAIL:-agents@jianglens.local}"
git config --global init.defaultBranch main
gh auth setup-git --hostname github.com
```

Run this at the start of a wake before branch or PR work if GitHub operations
are not already configured.

The worker runtime starts in a Picoclaw workspace. Spawnfile clones or updates
the repository resource at `repos/jiang-lens/` inside that workspace before the
agent starts.
Run repo commands from there:

```bash
cd repos/jiang-lens
```

The worker also has durable local state outside git. In the workspace it appears
at:

```text
state/
```

Read `STATE.md` before using these files. Runtime state helps restarts resume
the same source, but it does not override repo status, Moltnet instructions,
source artifacts, validation, or GitHub PR state.

## Local Spawnfile Stack

For local testing, run the organization with native Spawnfile:

```bash
spawnfile validate agentic-org
spawnfile up agentic-org \
  --out agentic-org/.spawn \
  --auth-profile jiang-lens \
  --env-file agentic-org/ops/secrets/agentic-org.env \
  --name jiang-lens-agentic-org \
  -d
```

This exposes the Moltnet console at:

```text
http://127.0.0.1:8787/console/
```

Use logs to watch the stack:

```bash
docker logs -f jiang-lens-agentic-org
```

Stop it with:

```bash
docker stop jiang-lens-agentic-org
```

For the full operator runbook, environment variables, version checks, and
troubleshooting, see `agentic-org/docs/EPISODE_WORKER_STACK.md`.

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

If `MOLTNET_CLIENT_CONFIG` is not already set after entering
`repos/jiang-lens/`, export the Picoclaw workspace client config before using
Moltnet:

```bash
export MOLTNET_CLIENT_CONFIG="$PWD/../../.moltnet/config.json"
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
Do not run corpus-impact, lens, canon, glossary, atlas, or ledger passes during ordinary episode work. Virgil stops once the episode is website-visible, validated, and handed to Aristotle for QA. Broader corpus or lens suggestions belong in PR notes or the Moltnet handoff for a separate agent.

If transcription and diarization artifacts are present but
`metadata.youtube.json` is missing, run the source importer and let its
metadata-only `yt-dlp` fallback fill the gap. The worker image includes `yt-dlp`
for this path. Hand off to Colab only when raw media, transcription, diarization,
or the importer fallback itself is missing or failing.

For runs that take more than a few minutes, post concise `episode-floor` progress
at stage boundaries: claim or cleanup, current stage, validation, PR creation,
and CI or blocker handoff.

The Docker stack runs episode work through Picoclaw's native cron service. While
ready episode or interview sources remain, keep one primary recurring
agent-turn job named `virgil-source-drain` and let it wake every 30
minutes. Each wake processes one source or resumes an in-progress source. If a
source PR is open, blocked, behind, waiting for Aristotle QA, or waiting for
auto-merge after QA pass, recover that PR before claiming the next source. When
the episode and interview backlogs are both empty, report the idle state once
and propose a daily maintenance cadence.
The Moltnet room attachment is configured
with `read: mentions` and `reply: never`: direct `@virgil` mentions are
room context for the next scheduled wake, not immediate production starts.
Treat Moltnet as the coordination surface, not as the job supervisor. Production
source work must run through the native PicoClaw cron wake, which decides
whether to process the next source based on backlog state. Read the room at
startup and stage boundaries, and post claims, questions, blockers, PRs, and
handoffs with the Moltnet CLI.

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

Post the PR to `episode-floor` and request Aristotle's review:

```bash
moltnet send --target room:episode-floor --text "@aristotle please review <PR URL> for <source-slug>. Validation: compile-content, validate-content, website build passed locally. @socrates source PR is ready for QA."
```

After Aristotle passes the PR, auto-merge completes, and final status is posted,
return the worker checkout to clean `main` so the next autonomous wake can claim
fresh work:

```bash
git checkout main
git pull --ff-only origin main
```

Do not use direct pushes or manual merge commands to bypass CI. If local validation fails, do not request QA as if the PR were ready.

## Learning

After each episode, ask what should improve next time:

- If it is an agent habit, update `MEMORY.md` concisely.
- If it is a repeatable method, write a proposal under the repo checkout path `agentic-org/agents/virgil/proposals/` or in the PR notes.
- If it is a missing mechanical check, write a concrete proposal instead of adding shared scripts unless the maintainer explicitly expands scope.
- If it is source-specific, keep it in that source's artifact or PR notes.

Growing with the system means preserving useful experience in durable, reviewable repo artifacts.

For worker self-diagnosis, postmortem, or instruction-hardening tasks, durable
changes by this worker are limited to the repo checkout path
`agentic-org/agents/virgil/**` unless the maintainer explicitly expands
the write scope. Put recommendations for root skills, content tooling, website,
ops scripts, or global docs in
`agentic-org/agents/virgil/proposals/` or the PR notes instead of
editing those files.
