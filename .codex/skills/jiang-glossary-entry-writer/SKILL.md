---
name: jiang-glossary-entry-writer
description: Use this skill when creating or revising a Jiang Lens glossary entry for a search-facing term, alias, person, institution, phrase, or query target from dated Jiang source refs and existing lens pages.
---

# Jiang Glossary Entry Writer

Use this for glossary entries, not lens chapters.

Glossary entries are search and agent entry points. They answer concrete
queries quickly, then route readers and agents to exact episodes, transcript
refs, and deeper lens pages.

## Inputs

- target term and aliases,
- likely search or agent query,
- dated source refs and short source excerpts,
- related episode/interview pages,
- related public lens pages,
- existing topic aliases and generated topic pages when relevant,
- judge feedback if the entry is contentious or style is uncertain.

Do not browse or invent. If the packet lacks source refs, build the source
packet first from transcripts, semantic bundles, episode reads, or topic pages.

## Output

Canonical source:

```text
content/lens/glossary/<slug>.md
```

Public route should compile to:

```text
/glossary/<slug>/
```

Do not put glossary pages in the main lens atlas. A glossary entry may link to
`/lens/...` pages, but it is not itself a mature lens page.

## Style Discovery Loop

Use this loop when establishing style, handling a high-value SEO term, or
working on a sensitive phrase where the wrong framing could create bad answers.

1. Build one compact source packet.
2. Ask 3 independent draft agents for entries using different emphasis:
   search answer, Jiang voice, and agent citation utility.
3. Ask 2 independent judge agents:
   search/answer judge and Jiang voice/provenance judge.
4. Synthesize the winner.
5. Save the reusable style lesson in this skill or the agent memory only after
   the examples are actually good.

The current winning pattern is:

```text
Mill structure + Mendel force + Lorentz readability
```

Use a fast-answer block, a precise source-trail table, and clear usage
boundaries. Keep the prose sharper than documentation and smaller than a lens
chapter.

## Required Shape

Use this public shape unless the term clearly needs a small variation:

```md
---
title: Knights Templar
description: Jiang Lens glossary entry for Knights Templar, with dated source refs, episode links, aliases, and related lens pages.
aliases:
  - Knights Templars
  - Templars
related_lens:
  - secret-society-as-coordination-technology
---

# Knights Templar

**Aliases:** Knights Templars, Templars, Templar banking.

> **Fast answer:** In Jiang Lens, ...

## What Jiang Means

...

## Where Jiang Says It

| Source | Timestamp / ref | What to inspect | Why it matters |
|---|---|---|---|
| 2025-03-20, [Episode title](/episodes/<slug>/) | `video:<slug>@transcript:v1#seg-0034` | Short quote or phrase | Templars as bank. |

## How To Use This Term

Use this term when...

Do not use it when...

## Related Lens Pages

- [Secret Society As Coordination Technology](/lens/secret-society-as-coordination-technology/)
```

## Writing Rules

- Answer the likely query in the first 80 words.
- Explain the mechanism, not encyclopedia background.
- Keep the entry around 350-900 words. If it needs more, it may be a lens page
  or a parent/child split.
- Start with aliases for search and agent retrieval.
- Keep dates visible in the source trail.
- Include exact source refs and episode links.
- Include one short source phrase or quote when it materially helps an agent
  answer "when did Jiang say this?"
- Preserve Jiang-specific pressure when supported by the source: "promise
  becomes plan", "poetry behaves almost like a virus", "underground
  continuity", "self-authorization", "reality creation machine".
- Caveats should preserve pressure. If Jiang supplies the caveat, write it as
  part of the mechanism, not as external debunking.
- Link related lens pages, but do not turn the glossary entry into a tour of
  the atlas.

## Avoid

- Public-facing "Target path" or "Public path" lines.
- Generic openings such as "X is an important concept in Jiang Lens."
- Raw ref dumps without readable routing.
- Long lens synthesis.
- Caveats that sound like outside fact-checking unless Jiang himself supplies
  the caveat.
- Treating a search alias as a mature concept page.
- Making the glossary page part of `/lens/` navigation by default.

## Gold Examples

When calibrating style, read:

```text
.codex/skills/jiang-glossary-entry-writer/references/gold-examples.md
```

Use those examples for shape and voice, not as permanent truth. If the corpus
changes, source refs and chronology still win.

## Judge Gate

Before publishing high-value or sensitive glossary entries, use
`jiang-lens-judge` in two modes:

- Search/answer judge: first-80-word answer, snippet value, agent source
  navigation, continuation into episodes/lens pages, compactness.
- Jiang voice/provenance judge: Jiang-specific force, dated source support,
  caveats, and boundary discipline.

## Validation

For authored glossary changes, run:

```bash
node ops/scripts/compile-content.mjs
node ops/scripts/validate-content.mjs
cd website && npm run build
```
