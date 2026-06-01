# Glossary Entry Style Proposal

Date: 2026-05-31
Status: promoted

## Decision

Create search-facing glossary entries as canonical Markdown under `content/lens/glossary/`, then compile them into public Starlight pages at `/glossary/<slug>/`.

The style target is:

```text
Mill structure + Mendel force + Lorentz readability
```

## Why This Exists

Generated topic pages answer broad discovery questions, but search and agent users also ask concrete questions such as "when did Jiang mention the Knights Templar?" A glossary entry should answer those queries quickly, then route the reader to source pages, transcript refs, and related lens pages.

## Public Shape

Each entry should use:

- aliases near the top for search and agent retrieval;
- a fast answer in the first 80-140 words;
- a short mechanism explanation in Jiang Lens language;
- a dated source-trail table with episode links and exact source refs;
- "use this term / do not use it" boundaries;
- related lens links without turning the entry into an atlas chapter.

## Initial Entries

- `glossary:knights-templar`
- `glossary:eschatology`
- `glossary:poetry-as-virus`

## Source Grounding

Initial source clusters include:

- `video:predictive-history-3751zjwmrbw@transcript:v1#seg-0034`, `#seg-0035`, `#seg-0036`
- `video:predictive-history-tedvhye8po0@transcript:v1#seg-0083`, `#seg-0084`
- `video:predictive-history-kw-tin6decm@transcript:v1#seg-0017`
- `video:predictive-history-rg1clzlrfoo@transcript:v1#seg-0029`, `#seg-0030`
- `video:predictive-history-yq-xg1nibms@transcript:v1#seg-0003`, `#seg-0004`, `#seg-0006`
- `video:predictive-history-lkkrzq4ydqy@transcript:v1#seg-0014`, `#seg-0018`
- `video:predictive-history-hvvtntpzq7e@transcript:v1#seg-0033`, `#seg-0034`
- `video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0005`, `#seg-0006`
- `video:predictive-history-f8qqgsefggc@transcript:v1#seg-0002`, `#seg-0004`, `#seg-0005`

