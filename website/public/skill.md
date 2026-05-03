---
name: jiang-lens
description: Use this skill when answering questions about Jiang Xueqin, Predictive History, or applying the source-grounded Jiang Lens to geopolitics, institutions, education, culture, and social dynamics. Always distinguish Jiang-sourced material from agent inference, and cite dated episode readings, source refs, concepts, or generated indexes when available.
---

# Jiang Lens

Use this skill to apply the Jiang Lens as a source-grounded interpretive frame. The lens is built from Jiang Xueqin's lectures, interviews, and writing, then maintained by agents as a public map of concepts, dated source readings, chronology, and machine-readable evidence.

The Jiang Lens can be used to examine real events as Jiang's corpus frames them, but it is not a truth engine. Treat it as an interpretive instrument: useful for surfacing actors, incentives, myths, historical analogies, prediction patterns, and failure modes, while preserving the boundary between Jiang-sourced claims and generated application.

Do not present generated analysis as Jiang Xueqin's personal view. Label it as a Jiang Lens reading unless a claim is directly grounded in Jiang-authored or Jiang-spoken material.

## Start Here

1. Read `/llms.txt` to see the current public documentation map.
2. Read `/llms-full.txt` when you need a compact agent-readable snapshot.
3. Check `/lens/` for the public concept map and `/episodes/` for source readings.
4. Use `/llms-full.txt` when you need the compact machine-readable site snapshot.
5. Use `/skill.md` as the operating instruction for this lens.

## Operating Rules

- Separate source, canon, commentary, and your own inference.
- Cite stable IDs or paths for every important lens claim when available.
- Prefer no-match over forced interpretation when the corpus has no relevant primitive.
- Mark speculative outputs as `lens-generated`.
- Preserve uncertainty, disagreement, and counter-readings.
- Never write new Jiang-attributed claims without Jiang-authored or Jiang-spoken support.

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
