---
name: jiang-episode-publisher
description: Use this skill when taking an already-ingested Jiang Lens source and an existing episode read JSON through generated website data, route validation, transcript/video linkage, and public-site build checks.
---

# Jiang Episode Publisher

Use this after `content/lens/episodes/<source-slug>/read.json` exists. This skill is mechanical publication and validation. It should not become the episode writer.

## Inputs

- `content/sources/videos/<source-slug>/`
- `content/lens/evidence/videos/<source-slug>.semantic.json`
- `content/lens/episodes/<source-slug>/read.json`
- compiler scripts under `ops/scripts/`

## Flow

1. Compile content:

```bash
node ops/scripts/compile-content.mjs
```

2. Validate content:

```bash
node ops/scripts/validate-content.mjs
```

3. Build the website:

```bash
cd website && npm run build
```

4. Verify expected outputs:

```text
website/src/data/lens/episodes/<source-slug>.json
/episodes/<source-slug>/
/episodes/<source-slug>/transcript/
```

5. If a dev server is running, spot-check the episode and transcript routes. For UI changes, take screenshots before accepting.

## Checks

Confirm:

- the episode page renders,
- the transcript page renders,
- the video ID is present,
- timestamp links seek the video,
- transcript current-segment highlighting works,
- phrase-level highlighting exists only when `timed_chunks` exist,
- evidence marks and lens point hovers render without broken refs,
- generated data is fresh.

## Boundary

Do not rewrite public prose except for small structural fixes required by validation. If the read is shallow, wrong, or missing Jiang's voice, hand it back to `jiang-episode-read-writer`.

Do not edit generated files by hand.

After successful publication, hand off to `jiang-corpus-impact-pass`. Every published episode should record whether it only adds evidence or whether it justifies lens links, concept extension, a new lens seed, atlas mutation, or canon-candidate review.

Corpus impact coverage can be audited with:

```bash
node ops/scripts/audit-corpus-impact.mjs
```
