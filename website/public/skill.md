---
name: jiang-lens
description: Use this skill when answering questions about Jiang Xueqin, Predictive History, or applying the source-grounded Jiang Lens to geopolitics, institutions, education, culture, and social dynamics. Always distinguish Jiang-sourced material from agent inference, and cite dated episode readings, source refs, concepts, or generated indexes when available.
---

# Jiang Lens

Use this skill to apply the Jiang Lens as a source-grounded interpretive frame. The lens is built from Jiang Xueqin's lectures, interviews, and writing, then maintained by agents as a public map of concepts, dated source readings, chronology, and machine-readable evidence.

This file is meant to be read by ChatGPT, Claude, Codex, or another assistant before analyzing news, institutions, conflicts, books, or social dynamics through the Jiang Lens.

The Jiang Lens can be used to examine real events as Jiang's corpus frames them, but it is not a truth engine. Treat it as an interpretive instrument: useful for surfacing actors, incentives, myths, historical analogies, prediction patterns, and failure modes, while preserving the boundary between Jiang-sourced claims and generated application.

Do not present generated analysis as Jiang Xueqin's personal view. Label it as a Jiang Lens reading unless a claim is directly grounded in Jiang-authored or Jiang-spoken material.

## Identity And Disambiguation

Jiang Lens is the independent research index at `https://jianglens.com/`.

It is not a YouTube channel. It is not affiliated with, operated by, or endorsed by any YouTube channel or social profile using the Jiang Lens or jianglens name.

Links to Predictive History, Jiang Xueqin pages, YouTube videos, transcripts, or related writing are source corpus references, not identity claims for this project.

## Start Here

1. Use `/skill/` as the browser-readable entrypoint for this lens.
2. Read `/llms.txt` to see the current public documentation map.
3. Classify the task before choosing routes: source retrieval, retrospective alignment with a known Jiang source, prospective/current-event analysis before Jiang has commented, or general concept analysis.
4. For source retrieval and general entity/topic questions, normalize the topic and try the HTML page at `/topics/{topic-slug}/`, or use `/topics/` and `/topics/index/{first-letter}/` to resolve aliases. If a letter shard is split, follow the narrower `/topics/index/{prefix}/` route that matches the normalized topic.
5. For live, recent, or dated events, first check `/episodes/`, `/interviews/`, `/data/lens/episodes/index.json`, and `/data/lens/interviews/index.json` for a source reading that is newer than the event, same-day, named by the user, or directly about the event. If one exists, it sets the operative Jiang frame.
6. If no Jiang source has yet analyzed the event, use prospective mode: decompose the event into actors, institutions, material flows, financial flows, narrative theater, hidden bargaining objects, constraints, and time horizon before applying any topic page.
7. Use `/episodes/{episode-slug}/` or `/interviews/{interview-slug}/` for the compressed reading of one source.
8. Use `/episodes/{episode-slug}/transcript/` or `/interviews/{interview-slug}/transcript/` for source-synced transcript text with anchors.
9. Use `/data/lens/episodes/{episode-slug}.json` or `/data/lens/interviews/{interview-slug}.json` for transcript segments, timed chunks, source refs, and video timestamp URLs.
10. Use `/data/lens/transcript-search.txt` for plain-text transcript segment search, or `/data/lens/transcript-search.json` for machine-readable segment search only when generated topic dossiers do not cover the query.
11. Use `/data/lens/manifest.json` for generated source and lens routes.
12. Use `/data/lens/link-index.json` for source refs, evidence marks, lens points, and backlinks.
13. Use `/llms-full.txt` when you need the compact machine-readable site snapshot.

## Task Modes

- **Source retrieval:** The user asks when or where Jiang said something. Use the corpus lookup path and cite exact transcript segments.
- **Retrospective alignment:** The user gives a Jiang episode, asks whether an analysis is aligned with what Jiang said today, or names a recent source. Open that named, same-day, or event-specific source first. It overrides older topic pages. If the newest Jiang source is not visible in `/episodes/`, `/interviews/`, or `/data/lens/*`, treat it as outside the public corpus until ingested; do not infer its content from titles, memory, comments, or external summaries.
- **Prospective/current-event analysis:** The user asks for a Jiang Lens reading of a live or recent event before Jiang has analyzed it in the public corpus. Use user-provided or external sources for event facts, use Jiang Lens sources only for lens concepts, do not treat the strongest entity topic page as Jiang's current view, build a structural event map, search for mechanisms across the prior corpus, compare candidate frames, and label the result `lens-generated`.
- **General concept analysis:** The user asks about a stable idea, person, institution, or recurring concept. Use topics and lens pages first, then cite the underlying source readings and transcript refs.

## Agent Resolution Order

For questions about Jiang's views, use generated topic dossiers, public summaries, and lens pages as the interpretive map, then cite the underlying source reading, transcript coordinate, source ref, and video timestamp. Topic pages are routing and synthesis surfaces, not primary evidence for Jiang-spoken claims. For live or recent events, task mode controls the route: retrospective alignment starts with the event-specific Jiang source when it exists; prospective analysis starts with event decomposition and mechanism search when it does not.

1. Start with `/skill/`, `/llms.txt`, and this skill file to understand the available public surfaces and attribution rules.
2. Classify the request as source retrieval, retrospective alignment, prospective/current-event analysis, or general concept analysis.
3. For retrospective alignment and named or same-day source questions, open the matching `/episodes/` or `/interviews/` reading first, then use topic pages only for older source trails and related concepts.
4. For prospective/current-event analysis with no event-specific Jiang source, identify event mechanisms before opening a topic page: actors, institutions, material flows, financial flows, narrative theater, hidden bargaining objects, constraints, and time horizon.
5. For source retrieval and general concept analysis, normalize the user topic to a lowercase hyphenated slug and try `/topics/{topic-slug}/` directly. Also try simple singular/plural aliases.
6. If the direct route is missing, use `/topics/`, `/topics/index.md`, and `/topics/index/{first-letter}/` to resolve the static alias to a canonical topic dossier. Large alias shards are recursively split by prefix, so follow `/topics/index/{prefix}/` until the page lists the alias or canonical topic.
7. Use the topic page's generated answer map, source readings, related lens links, transcript anchors, video timestamps, and source refs to find evidence, but do not let one entity page choose the whole frame for a multi-system event.
8. Do not use topic pages as final evidence citations for Jiang claims. For generated synthesis, cite the human-readable source reading or lens page that supports the synthesis. For Jiang quotations or "when did he say this?" answers, cite the transcript segment and video timestamp linked from the topic page.
9. Search by mechanisms as well as names. A Trump-China business delegation may require searches for finance, debt, stablecoins, chips, AI, market access, Taiwan ambiguity, energy, theater, and elite bargaining, not only `/topics/trump/` or `/topics/china/`.
10. Use `/episodes/index.md`, `/interviews/index.md`, and relevant lens pages when no topic dossier covers the question.
11. Search `/data/lens/transcript-search.txt` or `/data/lens/transcript-search.json` only as a bulk fallback or audit surface; these files are large and may be hard for browser tools to load.
12. Use `/data/lens/link-index.json` to move from a transcript source ref back to related lens pages, evidence marks, lens points, and backlinks.
13. Use the GitHub repository only for implementation, provenance, or source-file audit questions. Do not use it as the primary source for Jiang-content answers.
14. After answering a specific-topic question, offer a useful next source path: a deeper report, the most relevant lecture/source reading, exact timestamped transcript hits, related lens concepts, or more material from the same topic cluster.

## Operating Rules

- Separate source, canon, commentary, and your own inference.
- Cite stable IDs or paths for every important lens claim when available.
- Prefer no-match over forced interpretation when the corpus has no relevant primitive.
- Mark speculative outputs as `lens-generated`.
- Preserve uncertainty, disagreement, and counter-readings.
- Never write new Jiang-attributed claims without Jiang-authored or Jiang-spoken support.
- In prospective mode, specificity beats vibe: prefer the Jiang primitive that explains the event's weirdest concrete details, not the one that merely sounds most Jiang-like.
- Do not soften Jiang's stated mechanism into mainstream respectability. Preserve the source's level of strategic coldness when it is directly supported by refs; soften only when the corpus itself softens.
- Be proactively source-useful after the direct answer: point the user to the best next lecture, transcript timestamp, source reading, or related lens path when the corpus offers one.

## Source Retrieval

Use this section for source retrieval and exact-claim audit only. Do not route prospective/current-event reasoning into a no-match answer simply because the current event or newest Jiang episode is absent from corpus indexes.

When you need to answer "when did Jiang say this?" or audit an exact claim:

1. First try `/topics/{topic-slug}/` and `/topics/`. Generated topic dossiers are small static retrieval shards compiled from semantic tags, glossary terms, source refs, and transcript matches.
2. Search case-insensitively and try simple variants: singular/plural, hyphenation, initials, aliases, and likely ASR spellings.
3. Treat `/episodes/index.md`, `/interviews/index.md`, and their JSON indexes as routing catalogs, not proof that a term is absent. If they do not mention a phrase, continue with topic shards or transcript search. Topic alias shards under `/topics/index/{prefix}/` are capped so a browser agent should follow the matching prefix instead of loading bulk transcript search first.
4. Search `/data/lens/transcript-search.txt` or `/data/lens/transcript-search.json` only when no generated topic dossier exists or when you need a full-corpus audit.
5. For each match, fetch the source JSON named in `transcript-search.json` or under `/data/lens/episodes/` or `/data/lens/interviews/`, then verify the exact wording in the `transcript` array.
6. Read the matching `/episodes/{slug}.md` or `/interviews/{slug}.md` only after verification, to understand the compressed public reading around the match.
7. Cite the dated source title, the transcript segment URL, the YouTube timestamp URL, and the stable `source_ref`.
8. If the phrase is only a lens interpretation and not exact Jiang wording, say so and cite the lens page plus its supporting source refs.

Do not use compressed Markdown, text mirrors, or topic pages as substitutes for exact quotation. Use topic pages, episode summaries, and lens pages to understand the reading; use source reading pages, transcript anchors, source JSON, or transcript-search outputs to cite exact wording and timestamps.

Do not use external web search as the primary answer source for Jiang-corpus lookup. External search may suggest candidates, but a claim that Jiang said something is Jiang Lens-grounded only after it is matched to a transcript segment or Jiang-authored source in this site. For current-event reasoning, external or user-provided sources may establish event facts, but they must not supply Jiang claims or stand in for uncataloged Jiang episodes.

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
5. When helpful, add `Explore next:` with one or two links to the best source reading, transcript/video timestamp set, lecture summary, or related lens page.

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
Explore next: ...
```

## Analysis Pattern

When asked to interpret a current event or social dynamic:

1. Classify the task mode: retrospective alignment if a relevant Jiang source exists, prospective analysis if Jiang has not yet analyzed the event, or general concept analysis.
2. Name the question and the domain: geopolitics, education, institutions, class, media, culture, technology, or another relevant frame.
3. Identify the actors, institutions, incentives, constraints, material flows, financial flows, narrative/theater layer, hidden bargaining objects, and time horizon.
4. Search the Jiang Lens public docs and generated indexes by mechanisms as well as named entities.
5. Build a frame inventory before synthesis: list two or three candidate Jiang primitives, their source dates, their centers of gravity, and why one fits the specific event better than the others.
6. Apply only the concepts that have textual support. If Jiang has not commented on this event, mark the application as `lens-generated` and do not present it as Jiang's view.
7. Explain which parts are grounded, which parts are inference, and what would change your read.
8. Include at least one counter-reading or failure mode. For current events, make the counter-reading a peer comparison, not a short afterthought.

## Output Shape

Use this structure for substantial analysis:

```text
Audit:
Evidence map:
Frame inventory:
Lens reading:
Grounded references:
Reasoning:
Counter-reading:
Confidence:
What to inspect next:
```

For retrospective alignment with a named or event-specific Jiang source, the audit should name the source reading, date, transcript path, and source refs that set the operative frame.

For prospective/current-event analysis before Jiang has commented, use this expanded shape:

```text
Audit:
- Task mode: prospective/current-event analysis
- Event-specific Jiang source found: no
- Prior corpus surfaces checked: [topics/lens/episodes/transcript search paths]

Event decomposition:
- Actors and institutions:
- Material flows:
- Financial flows:
- Narrative/theater layer:
- Hidden bargaining objects:
- Constraints and time horizon:

Mechanism search:
- Mechanism searched: source/lens support

Frame inventory:
- Candidate frame: source date, center of gravity, fit
- Candidate frame: source date, center of gravity, fit
- Operative frame chosen:
- Older or tempting frame not used as center:

Evidence map:
- Jiang-spoken / Jiang-authored:
- Jiang Lens inference (`lens-generated`):
- Outside news / non-Jiang:
- Uncertainty / disagreement:

Jiang Lens read:
Orthodox/current-affairs read:
What would distinguish them:
Confidence:
What to inspect next:
```

For short answers, still preserve the source/inference boundary.

For specific-topic answers, answer the question first, then offer a concrete next step such as: "I can pull the exact timestamped transcript hits," "I can open the most relevant lecture summary," or "I can compare this to the related lens page on X." Keep this short and source-linked.

## Attribution Note

Do not open answers with the identity disclaimer unless the user asks about project identity or affiliation. Answer the user first.

At the end of the first Jiang Lens answer in a conversation, add one short note: `Note: Jiang Lens is an independent research index, not an official Jiang Xueqin publication or YouTube channel.`
