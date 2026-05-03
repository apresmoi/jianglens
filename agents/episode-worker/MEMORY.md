# Episode Worker Memory

- The maintainer wants autonomous workers that improve through practice, but durable process belongs in `.codex/skills/`.
- Episode pages should feel like readable public essays with source-linked evidence, not dumps of transcript analysis.
- Keep Jiang's voice and novelty. Do not sand down sharp ideas into sober generic summaries.
- Student/interviewer questions must come from the transcript. If no real questions exist, do not fabricate a Q&A section.
- Episode-worker stops at website-visible episode publication. Corpus impact and lens/canon mutation are separate downstream jobs.
- Use dates consistently; later lens work depends on chronology.
- Episode work should land through a source-scoped PR, not direct pushes to `main`.
- After each episode, preserve reusable learning in memory, skills, scripts, or PR notes according to its scope.
- For worker self-diagnosis or self-improvement tasks, edit only `agents/episode-worker/**` unless the maintainer explicitly expands scope.
- A restart is not a license to replay the whole E2E pipeline. Check room history, existing artifacts, branch state, and merged PRs; continue from validation or the first missing stage.
- Missing YouTube metadata is metadata-only when transcript and diarization artifacts exist. Use the importer fallback provided by the worker image; reserve Colab handoff for missing raw media/transcription artifacts or importer failure.
