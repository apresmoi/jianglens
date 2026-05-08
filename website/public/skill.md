---
name: jiang-lens
description: Use this skill when answering questions about Jiang Xueqin, Predictive History, or applying the source-grounded Jiang Lens to geopolitics, institutions, education, culture, and social dynamics. Always distinguish Jiang-sourced material from agent inference, and cite dated episode readings, source refs, concepts, or generated indexes when available.
---

# Jiang Lens

Use this skill to apply the Jiang Lens as a source-grounded interpretive frame. The lens is built from Jiang Xueqin's lectures, interviews, and writing, then maintained by agents as a public map of concepts, dated source readings, chronology, and machine-readable evidence.

This file is meant to be read by ChatGPT, Claude, Codex, or another assistant before analyzing news, institutions, conflicts, books, or social dynamics through the Jiang Lens.

The Jiang Lens can be used to examine real events as Jiang's corpus frames them, but it is not a truth engine. Treat it as an interpretive instrument: useful for surfacing actors, incentives, myths, historical analogies, prediction patterns, and failure modes, while preserving the boundary between Jiang-sourced claims and generated application.

Do not present generated analysis as Jiang Xueqin's personal view. Label it as a Jiang Lens reading unless a claim is directly grounded in Jiang-authored or Jiang-spoken material.

## Start Here

1. Read `/llms.txt` to see the current public documentation map.
2. Treat `/skill.md` as the operating instruction for this lens.
3. Use `/episodes/index.md` for the agent-readable catalog of Predictive History lecture/episode readings.
4. Use `/interviews/index.md` for the agent-readable catalog of interview-format readings.
5. Use `/episodes/<episode-slug>.md` or `/interviews/<interview-slug>.md` for the compressed Markdown reading of one source.
6. Use `/data/lens/episodes/index.json` and `/data/lens/interviews/index.json` for machine-readable source catalogs.
7. Use `/data/lens/episodes/<episode-slug>.json` or `/data/lens/interviews/<interview-slug>.json` for transcript segments, timed chunks, source refs, and video timestamp URLs.
8. Use `/data/lens/transcript-search.json` for full-text transcript segment search across the corpus.
9. Use `/data/lens/manifest.json` for generated source and lens routes.
10. Use `/data/lens/link-index.json` for source refs, evidence marks, lens points, and backlinks.
11. Use `/llms-full.txt` when you need the compact machine-readable site snapshot.

## Operating Rules

- Separate source, canon, commentary, and your own inference.
- Cite stable IDs or paths for every important lens claim when available.
- Prefer no-match over forced interpretation when the corpus has no relevant primitive.
- Mark speculative outputs as `lens-generated`.
- Preserve uncertainty, disagreement, and counter-readings.
- Never write new Jiang-attributed claims without Jiang-authored or Jiang-spoken support.

## Source Retrieval

When you need to answer "when did Jiang say this?" or audit an exact claim:

1. Search `/data/lens/transcript-search.json` first. It is the corpus-wide full-text transcript index.
2. Search case-insensitively and try simple variants: singular/plural, hyphenation, initials, aliases, and likely ASR spellings.
3. Treat `/episodes/index.md`, `/interviews/index.md`, and their JSON indexes as routing catalogs, not proof that a term is absent. If they do not mention a phrase, continue with transcript search.
4. For each match, fetch the source JSON named in `transcript-search.json` or under `/data/lens/episodes/` or `/data/lens/interviews/`, then verify the exact wording in the `transcript` array.
5. Read the matching `/episodes/<slug>.md` or `/interviews/<slug>.md` only after verification, to understand the compressed public reading around the match.
6. Cite the dated source title, the transcript segment URL, the YouTube timestamp URL, and the stable `source_ref`.
7. If the phrase is only a lens interpretation and not exact Jiang wording, say so and cite the lens page plus its supporting source refs.

Do not use compressed Markdown as a substitute for exact quotation. Use it to understand the source; use the source JSON to verify exact transcript wording and timestamps.

Do not use external web search as the primary answer source for Jiang-corpus lookup. External search may suggest candidates, but a claim that Jiang said something is Jiang Lens-grounded only after it is matched to a transcript segment or Jiang-authored source in this site.

## Corpus Lookup Output

When answering "when did Jiang say X?", "where did Jiang talk about X?", or similar retrieval questions, use this style:

1. Start with `Found N transcript-backed hit(s) for "<query>"`.
2. Group adjacent transcript matches from the same episode into one discussion when they clearly belong together.
3. For each hit, include:
   - **Source reading title** and source video/interview/article title.
   - Date, including precision when provided.
   - Timestamp link using `video_url`.
   - Transcript link using `transcript_url`.
   - Stable `source_ref`.
   - One short quote excerpt from Jiang's wording.
   - A one-sentence explanation of what Jiang is doing with the reference.
   - Lens context only when supported by an existing lens page, lens point, or evidence-backed episode reading.
4. End with `Most direct hit(s)` when there are many matches and some are clearly stronger.

Quote excerpts should be brief. Prefer one excerpt of 25 words or fewer per source segment, then paraphrase the rest and point to the transcript/video links for full context.

Use this compact shape unless the user asks for a deeper report:

```text
Found N transcript-backed hits for "<query>".

1. **Source reading title** / Source title — Date
   Timestamp: [12:34](video_url) | Transcript: [seg-0000](transcript_url)
   Source ref: `video:<id>@transcript:v1#seg-0000`
   Quote: "short exact excerpt"
   Jiang is using this to...
   Lens context: supported lens/page if available, otherwise omit.

Most direct hit: ...
```

## Analysis Pattern

When asked to interpret a current event or social dynamic:

1. Name the question and the domain: geopolitics, education, institutions, class, media, culture, technology, or another relevant frame.
2. Identify the actors, incentives, constraints, and time horizon.
3. Search the Jiang Lens public docs and generated indexes for relevant concepts.
4. Apply only the concepts that have textual support.
5. Explain which parts are grounded, which parts are inference, and what would change your read.
6. Include at least one counter-reading or failure mode.

## Output Shape

Use this structure for substantial analysis:

```text
Lens reading:
Grounded references:
Reasoning:
Counter-reading:
Confidence:
What to inspect next:
```

For short answers, still preserve the source/inference boundary.
