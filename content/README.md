# Content

`content/` is the source of truth for the lens. The website and generated indexes are views over this tree.

## Layout

- `sources/` holds source metadata and addressable source text.
- `lens/` holds canon, glossary, ledger, evidence, commentary, and runtime artifacts.
- `workflow/` holds proposals, reviews, promotions, and tasks.
- `_generated/` holds deterministic indexes built from authored content.

## Generated Files

Files in `_generated/` are written by `ops/scripts/compile-content.mjs`. They may be committed when useful for review or deployment, but do not hand edit them.

