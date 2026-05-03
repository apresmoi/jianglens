---
name: jiang-agent-transcript-pass
description: "Use this skill when an agent processes Jiang Lens transcript packets into semantic JSON outputs: interactions, speaker uncertainty, claims, glossary candidates, and chronology notes."
---

# Jiang Agent Transcript Pass

Use this for semantic processing of `content/workflow/tasks/<source-slug>/transcript-agent-packets.jsonl`.

## Model Policy

Use `gpt-5.5` with `reasoning_effort: xhigh` for transcript packet parsing unless the maintainer explicitly asks to test a smaller model. This pass defines the source semantics that later episode pages and lens distillation depend on, so do not default to mini/low for normal video parsing.

## Contract

Process only the packet's `focus_refs`. Use `context_segments` only to interpret those focus refs.

Return JSON matching:

```text
ops/schemas/agent-transcript-pass.schema.json
```

Validate outputs with:

```bash
node ops/scripts/validate-agent-pass.mjs content/workflow/proposals/<source-slug>/*.semantic.json
```

## Speaker Handling

Speaker labels are machine diarization hints. Do not trust them blindly.

Use context to decide whether a span is:

- Jiang monologue,
- an audience/interviewer question,
- Jiang answer,
- a back-and-forth exchange,
- quoted or read material,
- unclear.

Only use `kind: "question"` for substantive questions asked by a student, interviewer, audience member, or commenter. A lecturer prompt such as "can you read?" is not a public question; mark the actual student reading as `reading-quoted-material` and include the prompt only as context or `exchange` if needed.

Mark low confidence when speaker identity or interaction structure is ambiguous.

## Extraction

Extract:

- interactions and speaker uncertainty,
- claims with exact refs,
- signature moments: Jiang-specific metaphors, reversals, images, provocative causal chains, compact definitions, or unusual phrases that should not be sanded into generic summary prose,
- predictions and time-sensitive statements,
- models or definitions,
- glossary candidates,
- chronology notes that may update an older position.

Do not paraphrase away uncertainty. Keep dated refs attached to every claim.

Aim for enough density to support episode publication and later lens distillation. A schema-valid but sparse pass is not enough. Cover every focus ref in interactions, and extract the strongest reusable material from the packet. Do not extract every sentence mechanically.

For each packet, preserve the argumentative movement: what problem is introduced, what distinction is made, what model is built, and what the listener is supposed to see differently by the end of the focus refs. This makes the later episode read possible without flattening the transcript into topic labels.

For `signature_moments`, prefer the material a reader would remember tomorrow. Keep it source-grounded, but preserve the heat of Jiang's language. Examples of good signature moments:

- "poetry as almost like a virus" because it explains literature as an invasive technology of perception,
- a trusted guide becoming the obstacle,
- obedience becoming desire,
- a story creating the emotional conditions for hell,
- memory resurrecting a person an authority tried to erase.

Do not turn every claim into a signature moment. A packet with no sharp moment can return `signature_moments: []`, but do not omit the field.

For Great Books lectures, separate quoted/read-aloud material from Jiang's interpretation. Capture candidate primitives such as authority, desire, free will, reciprocity, myth, memory, unreliable guides, selfhood, social order, violence, salvation, and interpretation. Do not write public lens docs or canon from this packet pass.

## Chronology

Use `source_date` as the date for claims in the packet. If the packet references an older or newer dated source, preserve both refs. Otherwise, do not infer a contradiction from memory.

Older positions remain historical evidence. Latest-position summaries need exact dated support.
