# Schema and Validation v0

## Purpose
This artifact consolidates the validation rules surfaced by adversarial review. The main problem in the first draft was that the philosophy was strong but the enforceable schemas were weak.

The system needs strict enough schemas that agents cannot accidentally promote hallucinated, stale, externally contaminated, or weakly grounded material into canon.

## ID Grammar

Canonical target refs:
```text
canon:model/<slug>
canon:actor/<slug>
canon:force/<slug>
canon:mechanic/<slug>
canon:myth/<slug>
glossary:<slug>
ledger:diagnosis/<slug>
ledger:prediction/<slug>
evidence:<slug>
proposal:<slug>
review:<slug>
promotion:<slug>
```

Source refs:
```text
video:<manifestation-id>@transcript:v<version>#seg-0001
article:<article-id>@text:v<version>#p-0001
interview:<interview-id>@transcript:v<version>#seg-0001
```

Path derivation must be deterministic:
```text
canon:model/foo -> canon/models/foo.md
glossary:foo -> glossary/foo.md
ledger:prediction/foo -> ledger/predictions/foo.md
```

## Status Fields

Do not use one `status` field for everything.

```yaml
lifecycle_status: active
grounding_level: recurring
review_status: approved
authority_level: verified-jiang-source
contestation_status: uncontested
```

Allowed values:
- `lifecycle_status`: `draft`, `active`, `provisional`, `superseded`, `deprecated`
- `grounding_level`: `explicit`, `recurring`, `inferred`, `ambiguous`
- `review_status`: `unreviewed`, `pending`, `approved`, `rejected`, `needs-revision`, `stale`
- `authority_level`: `verified-jiang-source`, `authority-ambiguous`, `noncanonical-commentary`, `platform-metadata`
- `contestation_status`: `uncontested`, `contested`, `externally-supported`, `mixed`

Proposal lifecycle values:
- `proposed`
- `needs-grounding`
- `needs-consistency-review`
- `needs-revision`
- `approved`
- `rejected`
- `promoted`
- `superseded`

## Source Authority Gate

Canon/glossary/ledger promotion requires `canonical_eligible: true`.

```yaml
authority:
  authorship: jiang
  authorship_verified: true
  authorship_evidence: "..."
  editorial_control: jiang-or-official-channel
  medium: video
  derivative_of: null
  speaker_scope: jiang-only
  canonical_scope: spoken-content
  source_status: jiang-spoken
  canonical_eligible: true
```

Default: `canonical_eligible: false`.

## Inferred Entry Gate

An inferred canon entry requires:
- at least three source refs unless explicitly waived
- at least two source works where possible
- evidence matrix
- limits section
- counterexample check
- distinct grounding reviewer and consistency reviewer
- no stale source snapshots

## Review Independence Gate

Validation rejects:
- creator is grounding reviewer
- creator is consistency reviewer
- grounding reviewer is consistency reviewer for inferred/recurring/prediction entries
- promoter is one of the required reviewers
- reviewer approved a proposal SHA that no longer matches
- source snapshot hash changed after review

## Source Snapshot Requirement

Reviews must record:
```yaml
proposal_sha: "..."
source_snapshot:
  - ref: video:example@transcript:v1#seg-0042
    text_sha256: "..."
reviewed_at: 2026-05-01T10:00:00Z
```

Promotion fails if source snapshot or proposal hash changed after review.

## Task Lease Requirement

Active tasks must include:
```yaml
owner: agent-id
claimed_at: 2026-05-01T10:00:00Z
lease_expires_at: 2026-05-01T12:00:00Z
base_commit: abc123
target_paths:
  - canon/models/foo.md
```

Validation flags duplicate active target locks.

## Generated Indexes

Use `_generated/` for deterministic indexes:
- `_generated/sources.json`
- `_generated/refs.json`
- `_generated/backlinks.json`
- `_generated/routes.json`
- `_generated/audit.json`

Generated files should include a "do not edit" header or metadata field. If committed, they must be reproducible.

## Commentary Gate

Commentary can attach to targets but cannot promote canon changes.

If commentary reveals missed Jiang material:
1. Create source-discovery proposal.
2. Ingest the Jiang source.
3. Review source authority.
4. Create a normal canon proposal from source spans.

The commentary interpretation does not transfer into canon.

## Runtime Gate

Skills must:
- cite canon/glossary IDs for every activated primitive
- label generated predictions as `lens-generated`
- never write runtime predictions into Jiang-authored `ledger/`
- include refusal/no-match behavior
- declare canon version or source index version

## Validation Commands

Minimum validators:
- `validate:refs` — all refs resolve.
- `validate:authority` — canon targets use canon-eligible source refs.
- `validate:reviews` — review independence and stale snapshot checks.
- `validate:ids` — duplicate IDs and path derivation.
- `validate:routes` — static route slug conflicts.
- `validate:generated` — indexes reproduce.
- `validate:build` — static site builds.
