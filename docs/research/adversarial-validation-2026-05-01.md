# Adversarial Validation — 2026-05-01

## Scope
Four read-only subagents attacked the `research/lens-compression/` docs from different perspectives:

- epistemic / canon policy
- agent governance / process
- repo architecture / static-site implementation
- corpus / source grounding for Predictive History

No subagent edited files. The findings were used to patch the docs.

## Main findings

### Identity and refs were underdefined
The first draft used refs like `video:<id>#seg-0042`, which did not encode transcript version or transcript source. It also mixed path refs, target IDs, and kind/type fields.

**Fix applied**: added deterministic ID/ref grammar in `schema-and-validation-v0.md` and `static-repo-architecture-v0.md`, including versioned source refs:

```text
video:<manifestation-id>@transcript:v<version>#seg-0001
article:<article-id>@text:v<version>#p-0001
```

### Status fields were overloaded
The docs mixed lifecycle, grounding, review, authority, and contestation into one loose notion of status.

**Fix applied**: split status into:

- `lifecycle_status`
- `grounding_level`
- `review_status`
- `authority_level`
- `contestation_status`

### Source authority was too coarse
The first draft separated Jiang-source material from commentary, but did not define enough fields for videos, articles, interviews, edited transcripts, site summaries, and reading-list entries.

**Fix applied**: added multidimensional authority metadata and default-deny canon eligibility:

```yaml
canonical_eligible: false
```

unless authorship is verified.

### Review independence was aspirational
The docs said agents should crosscheck, but did not make reviewer independence enforceable.

**Fix applied**: added validation rules rejecting creator/reviewer/promoter overlap, and requiring distinct reviewers for inferred, recurring, contested, and prediction entries.

### Reviews could go stale
Transcript text can change while segment IDs stay stable. The first draft did not prevent promotion after source/proposal mutation.

**Fix applied**: added `proposal_sha`, `source_snapshot`, text hashes, and stale-review promotion failure.

### Reuploads and duplicates needed source identity
Predictive History has reuploads and fixed-audio versions. The first draft treated each video folder as the source.

**Fix applied**: added `work_id` vs `manifestation_id`, `duplicate_of`, `reupload_of`, fingerprint fields, and canonical manifestation policy.

### Commentary could smuggle framing into canon
The exception "unless commentary points to Jiang evidence" was too loose.

**Fix applied**: commentary can create a source-discovery proposal only. Canon updates must cite newly ingested Jiang source spans, not commentary summaries.

### Runtime skills could drift
The runtime section did not require enough traceability for generated analysis.

**Fix applied**: runtime outputs must cite canon/glossary IDs for activated primitives, use refusal/no-match behavior, and label generated predictions as `lens-generated`.

## Follow-up risks
- The docs define validation rules, but no validator exists yet.
- The static site implementation mode is now specified as standalone, but no actual build stack has been chosen.
- Inferred entries still need a concrete evidence matrix template.
- Commentary quality metadata exists conceptually, but no scoring rubric exists yet.
