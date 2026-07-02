# Local Judge: Borderland Density Split Judgment

Date: 2026-07-02
Review modes: local Plato reader/world-model judge and local grounding/provenance judge
Target: `content/workflow/proposals/borderland-density-split-judgment/proposal.md`
Public prose changed: no

## Reader And World-Model Judge

Pass.

The proposal answers the live question with a concrete boundary decision: keep Borderland whole, put it on compression watch, and reopen only the knowledge-becomes-empire child if a later public draft proves extraction improves the parent.

The judgment preserves the Jiang mechanism. It does not reduce Borderland to geography or to a list of civilization cases. The core remains pressure becoming energy, openness, cohesion, learning, contact, sacrifice, and margin-to-center reversal. The named sections still function as tests of that same engine rather than as independent concepts.

The strongest part of the decision is its distinction between provenance density and concept sprawl. A high generated ref count warns future editors not to append casually, but it does not by itself prove that Greece, Arabia, Vikings, Mongols, Rome, Qin, Pax Judaica, Russia/Ukraine adaptation, Aristotle, or Bank of England material should become separate public children.

## Grounding And Provenance Judge

Pass.

The proposal does not edit public Markdown, move anchors, change evidence refs, or alter episode read JSON. The metrics were taken from current authored Markdown and compiled `website/src/data/lens/link-index.json`:

- `wc -w website/src/content/docs/lens/the-borderland-engine.md`
- `grep -o 'evidence="[^"]*"' website/src/content/docs/lens/the-borderland-engine.md | wc -l`
- `grep -o 'video:[^@"]*' website/src/content/docs/lens/the-borderland-engine.md | sort -u | wc -l`
- `grep -o '<!-- lens-point id="[^"]*"' website/src/content/docs/lens/the-borderland-engine.md | wc -l`
- local Node inspection of `doc_evidence_marks` and `lens_points` for `lens/the-borderland-engine`

The proposal correctly treats Cassandra's source-density warning as a split-review trigger rather than a direct count of authored local video slugs. Current compiled data shows 42 doc evidence marks, 84 unique evidence segment refs from doc marks, and 91 unique combined evidence/lens-point segment refs, but only 14 distinct local video slugs across those refs.

Boundary notes are specific enough for future validation. Borderland keeps the energy/openness/cohesion and margin-to-center diagnostic; Poetry, Education, Bureaucracy, Strategy, Prediction, and Power receive active-mechanism routing instead of vague related-topic routing.

## Patched Findings

None.

## Residual Risk

Cassandra's wording says "135 distinct sources," while current compiled inspection shows 91 unique combined segment refs and 14 distinct local video slugs. The difference may come from another generated diagnostic counting rows, backlinks, source-ref records, or repeated evidence surfaces differently. If a future split tool exposes the exact 135-row calculation, remeasure that tool's definition before opening a public split PR.

## Verdict

Record the judgment. Do not change public Borderland prose, lens-point anchors, evidence marks, episode JSON, transcripts, or publication artifacts in this PR.
