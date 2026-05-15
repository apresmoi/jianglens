---
name: jiang-episode-quality-review
description: Use this skill when reviewing a Jiang Lens episode or interview PR for public-read quality against the clean transcript, semantic artifacts, source refs, real questions, marks, and website readiness before auto-merge.
---

# Jiang Episode Quality Review

Use this for source PRs that publish or revise one public episode or interview:

```text
episode/<source-slug>
interview/<source-slug>
```

This is an editorial QA gate. It does not rewrite the source, create lens pages,
or process new videos. It decides whether the public read is good enough to
merge, and if not, it gives concrete revision instructions.

## Inputs

- PR diff and PR body.
- `content/lens/episodes/<source-slug>/read.json`
- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.md`
- `content/sources/videos/<source-slug>/transcripts/v1/transcript.clean.jsonl`
- `content/lens/evidence/videos/<source-slug>.semantic.json` when present.
- Generated route data only when needed to verify route/build behavior.

## Review Pass

1. Identify source class, source slug, video ID, route, and changed files.
2. Read the public read JSON.
3. Sample the transcript around every chapter/section range and every marked
   phrase. Read enough surrounding transcript to judge whether the read carries
   the source's actual pressure.
4. Inspect semantic artifacts for signature moments, real questions, chronology,
   and notable speaker/interviewer pressure.
5. Compare the draft against the corpus anchor: curated strong episode reads,
   existing lens pages, topic aliases, and prior signature moments. This catches
   reads that are technically valid but weaker than the project's known bar.
6. Run validation when the PR looks close to pass:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
node ops/scripts/audit-episode-heat.mjs <source-slug> --strict --min 3
cd website && npm run build
```

## Quality Bar

Pass only when the public page is worth reading without the transcript.

Required:

- The read is a compressed Jiang-voice distillation, not a third-person recap.
- The strongest Jiang-specific ideas survive: metaphors, reversals, strange
  causal chains, provocations, and conceptual machinery.
- Important transcript material is not flattened into bland generic summary.
- The section structure reflects the source's actual movement.
- Marks attach to meaningful phrases, not whole generic paragraphs.
- Refs support the claims they mark.
- Questions are only real student/interviewer/audience questions that Jiang
  answers. No invented FAQ questions.
- Interview pages preserve the interviewer pressure when it shapes Jiang's
  answer.
- Source notes clarify mechanics or ASR issues without defensively dismissing
  Jiang's interpretation.
- The route builds and validators pass.

Fail when:

- The page reads like "Jiang discusses..." instead of carrying Jiang's voice.
- The transcript contains sharper or stranger material that the read omits.
- A cheaper first-pass draft missed source pressure that the existing corpus
  makes recognizable.
- Questions are invented, topic headings, Jiang prompts, or unanswered fragments.
- Claims are unsupported, dates are wrong, or source class/route is wrong.
- Public text exposes internal workflow labels such as models, diagnoses,
  proposal tiers, or confidence buckets.
- The page is a transcript dump or too skeletal to teach the source.

## Decision Format

Post one of these to Moltnet and, when reviewing a PR, also comment on the PR.

Pass:

```text
QA PASS <source-slug>: public read preserves the transcript's main pressure.
Checked: <files/commands>. Auto-merge <enabled/already enabled/not enabled because ...>.
```

Needs work:

```text
QA NEEDS WORK <source-slug>: <one-line reason>.
Fix:
1. <specific revision tied to transcript refs or section names>
2. <specific revision>
3. <specific revision>
```

Do not write vague feedback. Every revision request should point to a concrete
place in the read, transcript range, question list, marks, or source note.

## Escalation

Use strong judgment here. Aristotle is the guardrail that lets Virgil draft on a
cheaper model: reject shallow or over-smoothed work, and ask Virgil to repair it
instead of passing a page only because validators are clean.

## Merge Gate

If the PR passes and local validation passes, enable auto-merge:

```bash
gh pr merge <PR_NUMBER> --auto --squash --delete-branch
```

If the PR fails, do not enable auto-merge. Mention `@virgil` with the
revision list and leave the PR open.
