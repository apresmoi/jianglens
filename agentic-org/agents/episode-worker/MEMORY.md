# Episode Worker Memory

- The maintainer wants autonomous workers that improve through practice, but this worker should not edit `.codex/skills/**` while it is the first participant. Propose skill/process changes under the repo checkout path `agentic-org/agents/episode-worker/proposals/` or in PR notes.
- Episode pages should feel like readable public essays with source-linked evidence, not dumps of transcript analysis.
- Keep Jiang's voice and novelty. Do not sand down sharp ideas into sober generic summaries.
- Student/interviewer questions must be performed by a non-Jiang speaker in the transcript and answered by Jiang. Omit Jiang-read topic prompts, reader FAQ prompts, cleaned synthesis questions, fragments, corrections, and statements even when Jiang responds.
- Episode-worker stops at website-visible episode publication. Corpus impact and lens/canon mutation are separate downstream jobs.
- Use dates consistently; later lens work depends on chronology.
- Episode work should land through a source-scoped PR, not direct pushes to `main`.
- After each episode, preserve reusable worker-local learning in memory or PR notes. Shared skill, script, or runtime changes need proposals unless the maintainer explicitly expands scope.
- For worker self-diagnosis or self-improvement tasks, edit only the repo checkout path `agentic-org/agents/episode-worker/**` unless the maintainer explicitly expands scope.
- A restart is not a license to replay the whole E2E pipeline. Check room history, existing artifacts, branch state, and merged PRs; continue from validation or the first missing stage.
- Missing YouTube metadata is metadata-only when transcript and diarization artifacts exist. Use the importer fallback provided by the worker image; reserve Colab handoff for missing raw media/transcription artifacts or importer failure.
- Generated website data alone is not enough for episode handoff when `read` is null. Public reads need narrow hover/source marks on important phrases, no workflow/internal language, real transcript questions only, and a final heat/provenance pass before PR.
- Runtime state is continuity, not truth. On restart, read `current.json`, `journal.md`, and `failures.md`, then verify against git status, source artifacts, Moltnet, and GitHub before acting.
- If no-ready-source state is unchanged from durable state after checking main, backlog, and raw artifacts, enter `idle-no-ready-source`, send one compact idle notice, and stay silent on later unchanged wakes.
- In `episode-floor`, speak in first person as a teammate. Keep updates short and readable; avoid third-person self-references and dashboard-style labels unless they add clarity.
