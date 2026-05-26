# Interview Corpus Impact Validator

## Problem

Plato PR #647 records a corpus-impact proposal for `interview-dkagddve8sm`, a published interview source. `node ops/scripts/compile-content.mjs` correctly emits the public source data under:

```text
website/src/data/lens/interviews/interview-dkagddve8sm.json
```

The corpus-impact validator still treats every impact source as an episode. It requires:

```text
content/lens/episodes/<slug>/read.json
website/src/data/lens/episodes/<slug>.json
```

That makes these commands fail even when the interview source, transcript refs, lens-point refs, and generated interview JSON are present:

```bash
node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/interview-dkagddve8sm/corpus-impact.json
node ops/scripts/validate-content.mjs
```

## Proposed Repair

Teach `ops/scripts/validate-corpus-impact.mjs` to resolve the public read and generated source JSON by source kind instead of assuming the `episodes` collection.

Minimal behavior:

- keep accepting existing `video:<slug>@transcript:v1` impact refs;
- detect whether the source has a public read at `content/lens/episodes/<slug>/read.json` or the generated site data has `website/src/data/lens/episodes/<slug>.json`;
- also accept published interview reads and generated data at `content/lens/episodes/<slug>/read.json` plus `website/src/data/lens/interviews/<slug>.json`, matching the current compiler output for interview sources;
- keep the error message explicit about which generated path was expected.

The source directory remains `content/sources/videos/<slug>/`, so transcript existence and segment-ref validation do not need a separate source root.

## Why Plato Should Not Patch It Here

This is an `ops/` validator repair, not a lens-content mutation. Plato's ordinary write scope allows corpus-impact proposals, lens docs, generated compiler outputs, and Plato-local proposals. PR #647 therefore records the content-side impact and this proposal records the operational change needed for clean validation without broadening Plato's scope silently.

## Acceptance Check

After the validator repair, these checks should pass for PR #647 after a fresh compile:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/interview-dkagddve8sm/corpus-impact.json
node ops/scripts/validate-content.mjs
```

