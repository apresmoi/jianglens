# Static Repo Architecture v0

## Purpose
This is the proposed repository architecture for a markdown-first Lens Compression project. It is designed for autonomous agents that ingest source material, transcribe it, extract candidate models, crosscheck each other, promote source-grounded canon entries, attach external commentary, and render everything as a static site.

The architecture deliberately avoids a heavy database at the beginning. The first version should be git-native: files, frontmatter, stable IDs, source refs, and validation scripts.

## Design Principles

### 1. Source material is append-only
Raw or cleaned source artifacts should not be casually rewritten. If a transcript improves, create a new version or preserve enough stability that existing refs do not break.

### 2. Canon is Jiang-source-only
For the Predictive History case study, canonical entries can only be grounded in Jiang-authored or Jiang-spoken sources. Agents can propose structure, but they cannot make it canonical without reviewed source refs.

### 3. Commentary never mutates canon
External commentary can support, challenge, or contextualize a canon entry. It does not change the canon unless it points to Jiang-sourced material that the corpus missed.

### 4. Agents work through proposals
Agents draft in `proposals/`. Reviewers write to `reviews/`. Canon editors promote after approval. No single agent owns the full path from extraction to canon.

### 5. Static site is a view, not the source of truth
The site renders markdown and generated indexes. Canonical state lives in markdown/frontmatter and source artifacts.

### 6. Default deny for canon eligibility
No source is canon-eligible until its authority metadata says so. Ambiguous site pages, summaries, reading-list entries, captions, and commentary default to `canonical_eligible: false`.

### 7. Generated indexes are generated
Global indexes should be generated from per-source/per-entry files. Agents should not hand-edit aggregate registries that become merge-conflict hotspots.

## Implementation Mode
The first implementation should be a standalone static site repo, not part of `ledeluge.me`.

```text
source markdown/frontmatter -> generated indexes -> static site build -> dist/
```

Minimum build contract:
- content source dirs: `corpus/`, `canon/`, `glossary/`, `ledger/`, `evidence/`, `commentary/`
- generated dirs: `_generated/`
- output dir: `dist/`
- validation command: `scripts/validate`
- build command: `scripts/build-site`

The static site can later be integrated elsewhere, but the lens repo should not assume the existing Vite personal-site architecture.

## Repository Shape

```text
lens-compression/
├── AGENTS.md
│   Defines agent roles, promotion rules, review gates, allowed edits, and source-grounding policy.
│
├── notebooks/
│   Colab-friendly ingest notebooks for cheap/offloaded media processing.
│
│   └── colab/
│       ├── YouTube_Manager.ipynb
│       │   Download or manage YouTube source inputs and metadata.
│       ├── Whisper_Transcription.ipynb
│       │   Generate timestamped transcripts from extracted audio.
│       └── Pyannote_4_Pipeline-GPT-5.3.ipynb
│           Optional diarization / speaker segmentation workflow.
│
├── corpus/
│   Immutable or append-only source material. What the thinker actually said or wrote.
│
│   ├── channels/
│   │   One file per source channel. These are hand-authored or ingested metadata.
│   │
│   │   └── youtube-predictive-history.yaml
│   │       Channel metadata: URL, handle, channel ID, authority notes, ingest adapter.
│   │
│   ├── _generated/
│   │   Generated aggregate indexes. Do not edit by hand.
│   │
│   │   ├── sources.json
│   │   │   All source metadata derived from per-source files.
│   │   ├── refs.json
│   │   │   All valid source refs and their checksums.
│   │   ├── backlinks.json
│   │   │   Source-to-canon and canon-to-source links.
│   │   └── routes.json
│   │       Static-site route manifest.
│
│   ├── videos/
│   │   One folder per video source.
│
│   │   └── <video-id>/
│   │       ├── source.yaml
│   │       │   Metadata: work ID, manifestation ID, URL, date, duration, channel, series, authority.
│   │       ├── audio.*
│   │       │   Optional local audio artifact if storage policy allows it.
│   │       ├── transcripts/
│   │       │   Versioned transcript artifacts.
│   │       │
│   │       │   └── v1/
│   │       │       ├── transcript.raw.vtt
│   │       │       │   Raw timestamped transcript from Whisper, YouTube captions, or another transcriber.
│   │       │       ├── transcript.clean.jsonl
│   │       │       │   Stable segment IDs with start/end timestamps, speaker, cleaned text, and text hash.
│   │       │       ├── transcript.clean.md
│   │       │       │   Human-readable transcript for review and static rendering.
│   │       │       └── transcript.yaml
│   │       │           Transcriber, caption source, QA status, checksum, created date.
│   │       └── ingest-notes.md
│   │           Known issues: bad audio, missing chunks, uncertain speaker, duplicate upload.
│   │
│   ├── articles/
│   │   One folder per article or written source.
│   │
│   │   └── <article-id>/
│   │       ├── source.yaml
│   │       │   Metadata: URL, title, author, publication date, retrieval date, source authority.
│   │       ├── article.raw.md
│   │       │   Raw captured markdown/html-to-markdown output.
│   │       ├── article.clean.jsonl
│   │       │   Stable paragraph IDs with text and checksum.
│   │       ├── article.clean.md
│   │       │   Cleaned text with explicit stable anchors like `{#p-0017}`.
│   │       └── ingest-notes.md
│   │           Known issues: uncertain authorship, missing references, formatting problems.
│   │
│   └── interviews/
│       Same source shape for interviews, podcasts, or external appearances.
│
├── canon/
│   Source-grounded reconstruction of the thinker's system. Only changes when grounded in the thinker's own material.
│
│   ├── index.md
│   │   Entry point: scope, source policy, maturity, how to read status fields.
│
│   ├── world-model.md
│   │   What the lens assumes about reality: what matters, what drives events, what patterns recur.
│
│   ├── actors/
│   │   Reconstructed actor categories: states, elites, masses, institutions, religions, capital, armies, etc.
│
│   ├── forces/
│   │   Driving pressures: legitimacy, debt, war, humiliation, proximity, desire, collapse, coordination.
│
│   ├── models/
│   │   Named or inferred analytical models: empire lifecycle, escalation logic, social contract failure, etc.
│
│   ├── mechanics/
│   │   Reusable causal moves: inversion, sacrifice, encirclement, controlled opposition, narrative collapse.
│
│   ├── myths/
│   │   Mythic / literary / religious structures when the thinker uses them analytically.
│
│   └── prediction-protocol.md
│       How the thinker moves from present structure to forecast: triggers, thresholds, horizons, confidence.
│
├── glossary/
│   Canonical terms and concepts, one file per term. More atomic than `canon/`.
│
│   └── <term>.md
│       Definition, aliases, source refs, related terms, status: explicit / recurring / inferred.
│
├── ledger/
│   The thinker's applied claims about current or historical events.
│
│   ├── diagnoses/
│   │   Structured interpretations: "X is happening because Y model is active."
│   │
│   └── predictions/
│       Forecasts with source refs, horizon, conditions, uncertainty, and later outcome tracking.
│
├── evidence/
│   Grounding index connecting canon/glossary/ledger entries back to source spans.
│
│   └── assertions/
│       └── <evidence-id>.md
│           One evidence assertion per file to avoid agent collisions.
│
├── proposals/
│   Agent-generated drafts before promotion. Nothing here is canonical.
│
│   ├── canon/
│   │   Proposed additions or edits to the reconstructed system.
│   ├── glossary/
│   │   Proposed terms or term updates.
│   ├── ledger/
│   │   Proposed diagnoses/predictions extracted from sources.
│   └── evidence/
│       Proposed groundings and back-applications to older sources.
│
├── reviews/
│   Crosschecking records. Agents validate grounding, conceptual fit, duplication, contradiction, and promotion readiness.
│
│   └── <proposal-id>/
│       └── <review-type>-<reviewer-id>-<timestamp>.md
│           Immutable review note. Proposal status is computed from reviews.
│
├── promotions/
│   Immutable promotion records for canon/glossary/ledger/evidence changes.
│
│   └── <promotion-id>.md
│       Proposal ID, review IDs, promoter, commit, source snapshot, change reason.
│
├── commentary/
│   External commentary about the thinker's claims. Does not modify canon unless it points to thinker-authored evidence.
│
│   ├── supports/
│   │   External material supporting or extending a claim.
│   ├── challenges/
│   │   Critiques, contradictions, fact-checks, counterarguments.
│   └── audience/
│       YouTube comments, Reddit threads, community interpretations, reception signals.
│
├── tasks/
│   Lightweight agent work queue.
│
│   ├── inbox/
│   │   New work requests.
│   ├── active/
│   │   Claimed tasks with owner and scope.
│   └── done/
│       Completed tasks and summaries.
│
├── skills/
│   Runtime artifacts compiled from the canon.
│
│   └── <lens-name>/
│       Markdown skill or prompt pack for applying the lens to new material.
│
├── site/
│   Static site source. Renders corpus, canon, glossary, ledger, evidence, commentary.
│
└── scripts/
    Automation: sync Drive outputs, ingest video, clean transcripts, validate refs, build site, generate task queues.
```

## Storage Policy
Commit:
- source metadata
- transcripts and article text
- checksums
- canon/glossary/ledger/evidence/commentary markdown
- generated JSON indexes if they are deterministic and useful for static hosting

Do not commit by default:
- full video files
- large audio files
- model cache outputs

Use external storage or Git LFS only if the project later needs local media artifacts. Source metadata should still preserve URL, checksum/fingerprint where available, retrieval date, and rights notes.

## Source Identity Model
Use separate identity fields for the intellectual work and the concrete manifestation.

```yaml
work_id: work:example-game-theory-22
manifestation_id: video:example-gt22
manifestation_type: youtube-video
canonical_manifestation: true
duplicate_of: null
reupload_of: null
fingerprints:
  duration_seconds: 5412
  audio_sha256: null
  video_sha256: null
published_at: 2026-04-28T09:38:55Z
retrieved_at: 2026-05-01T00:00:00Z
source_url: https://www.youtube.com/watch?v=example
example_only: true
```

Use `work_id` when two uploads are the same lecture. Use `manifestation_id` when citing a concrete source span.

## Authority Metadata
Every source needs authority fields. Canon promotion can only use refs where `canonical_eligible: true`, except for entries explicitly marked `authority-ambiguous`.

```yaml
authority:
  authorship: jiang
  authorship_verified: true
  authorship_evidence: "YouTube channel controlled by Predictive History; Jiang is the speaker."
  editorial_control: jiang-or-official-channel
  medium: video
  derivative_of: null
  speaker_scope: jiang-only
  canonical_scope: spoken-content
  source_status: jiang-spoken
  canonical_eligible: true
```

Article status values:
- `jiang-written`
- `edited-transcript`
- `site-summary`
- `community-editorial`
- `unknown`

Reading-list entries are bibliographic references. They do not support canon claims unless tied to Jiang's own citation/use in a source span.

## Source References

The whole system depends on stable source refs.

### Video segment ref
```text
video:<manifestation-id>@transcript:v1#seg-0042
```

### Article paragraph ref
```text
article:<article-id>@text:v1#p-0017
```

### Interview segment ref
```text
interview:<interview-id>@transcript:v1#seg-0012
```

### Canon ref
```text
canon:model/legitimacy-collapse
```

Path derivation:
```text
canon:model/<slug> -> canon/models/<slug>.md
canon:actor/<slug> -> canon/actors/<slug>.md
canon:force/<slug> -> canon/forces/<slug>.md
canon:mechanic/<slug> -> canon/mechanics/<slug>.md
glossary:<slug> -> glossary/<slug>.md
ledger:prediction/<slug> -> ledger/predictions/<slug>.md
ledger:diagnosis/<slug> -> ledger/diagnoses/<slug>.md
```

## Clean Transcript JSONL

```jsonl
{"id":"seg-0001","start":12.4,"end":28.9,"speaker":"jiang","text":"...","text_sha256":"..."}
{"id":"seg-0002","start":29.0,"end":44.2,"speaker":"jiang","text":"...","text_sha256":"..."}
```

Rules:
- Segment IDs are stable after review.
- Text can be corrected, but if segmentation changes, keep an alias map or migration note.
- Speaker labels should be conservative: use `unknown` if unsure.
- Do not merge long sections just to make reading easier. The readable markdown can group segments; JSONL should preserve addressability.

## Canon Entry Frontmatter

```yaml
---
id: legitimacy-collapse
title: Legitimacy Collapse
kind: model
lifecycle_status: active
grounding_level: recurring
review_status: approved
authority_level: verified-jiang-source
contestation_status: uncontested
source_refs:
  - video:example-gt22@transcript:v1#seg-0042
  - video:example-gt21@transcript:v1#seg-0088
related:
  - social-contract-failure
  - population-as-battlefield
last_reviewed: 2026-05-01
promoted_from: proposal:legitimacy-collapse-v1
promotion_record: promotion:legitimacy-collapse-v1
example_only: true
---
```

Lifecycle values:
- `draft`
- `active`
- `provisional`
- `superseded`
- `deprecated`

Grounding level values:
- `explicit` — directly stated.
- `recurring` — repeated pattern across sources.
- `inferred` — reconstructed from multiple grounded examples.
- `ambiguous` — source exists, interpretation uncertain.

Review values:
- `unreviewed`
- `pending`
- `approved`
- `rejected`
- `needs-revision`
- `stale`

Contestation values:
- `uncontested`
- `contested`
- `externally-supported`
- `mixed`

## Ledger Entry Frontmatter

```yaml
---
id: twilight-nation-state
type: diagnosis
lifecycle_status: active
review_status: approved
grounding_level: explicit
authority_level: verified-jiang-source
source_refs:
  - video:example-gt22@transcript:v1#seg-0042
lens_primitives:
  - canon:model/social-contract-failure
  - canon:model/population-as-battlefield
  - canon:model/legitimacy-collapse
prediction_horizon: unclear
outcome_status: open
example_only: true
---
```

Ledger entries should connect current analysis back to the canon. If Jiang diagnoses an event, the entry should say which model/force/mechanic is active. If he predicts something, the entry should name conditions and horizon where possible.

## Evidence File Shape

```markdown
---
target: canon:model/legitimacy-collapse
source: video:example-gt22
evidence_relation: direct-support
review_status: approved
reviewed_by: grounding-reviewer
source_snapshot:
  - ref: video:example-gt22@transcript:v1#seg-0042
    text_sha256: "example"
example_only: true
---

# Evidence: Legitimacy Collapse in Game Theory #22

## Source refs
- `video:example-gt22@transcript:v1#seg-0042`
- `video:example-gt22@transcript:v1#seg-0043`

## Why this supports the target
Short explanation of how the source span grounds the canon entry.

## Limits
What the source span does not establish.
```

Evidence relation values:
- `direct-support` — source directly supports the target.
- `earlier-instance` — older source shows the pattern before later terminology exists.
- `later-clarification` — later Jiang source clarifies an earlier ambiguous pattern.
- `terminology-absent` — source has the structure but not the later term.
- `anachronism-risk` — retroactive link may be overreading; requires stronger review.

Retroactive evidence requires both old source refs and clarifying new source refs.

## Commentary File Shape

```markdown
---
id: reddit-legitimacy-collapse-2026-05-03
target: model:legitimacy-collapse
source_type: reddit
stance: challenges
quality: medium
expertise: unknown
independence: unknown
reach: low
evidence_type: argument
summary_confidence: medium
url: https://...
author: unknown
date: 2026-05-03
status: collected
---

# Commentary: Reddit challenge to legitimacy-collapse reading

Summary of the external commentary, with links and notes. This does not change canon.
```

If commentary reveals a missed Jiang source, create an ingest task. Do not carry the commentary interpretation into canon.

## Proposal Lifecycle

1. An agent creates a proposal in `proposals/`.
2. Grounding reviewer checks source refs and support.
3. Consistency reviewer checks duplicates, contradictions, and target fit.
4. Validator checks source refs, source snapshots, reviewer independence, duplicate IDs, route slugs, and target locks.
5. Canon editor promotes if review and validation gates pass.
6. Promotion record is written to `promotions/`.
7. Site/integrity agent runs a post-promotion audit.
8. If a later Jiang source clarifies the model, a new proposal updates canon and preserves prior evidence.

Promotion must fail if:
- proposal content changed after review
- any source text/hash changed after review
- reviewer independence rules fail
- source authority is not canon-eligible
- generated validation fails

## Why This Is Not Too Heavy
This looks like many folders, but the primitives are simple:
- markdown files
- YAML frontmatter
- JSONL transcripts
- source refs
- review notes

That is enough structure for agents to coordinate without requiring a database, ORM, custom UI, or complex object graph at the start.
