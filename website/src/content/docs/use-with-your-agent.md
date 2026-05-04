---
title: Use Jiang Lens With ChatGPT Or Claude
description: Give ChatGPT, Claude, Codex, or another assistant the Jiang Lens skill so it can use source-grounded Predictive History concepts, transcripts, and evidence links.
---

# Use Jiang Lens With ChatGPT Or Claude

Jiang Lens is a public map of Jiang Xueqin's lectures, interviews, and writing as a reusable world model. You can give that map to ChatGPT, Claude, Codex, or another assistant and ask it to analyze a news story, institution, conflict, book, or social situation through the lens.

Paste this URL into ChatGPT, Claude, or another assistant:

```text
https://jianglens.com/skill.md
```

## What The Skill Does

The skill gives the assistant a compact set of instructions for using Jiang Lens responsibly. It tells the assistant what Jiang Lens is, where the public pages and generated indexes live, how to read the corpus through the lens, and how to keep source-grounded material separate from its own inference.

The assistant should use the public docs, the generated manifest, and the evidence link index where possible. It should preserve uncertainty and avoid pretending that every topic has a Jiang-grounded answer.

The useful output is not "what would Jiang say?" The useful output is a Jiang Lens reading: concepts first, reasoning second, uncertainty visible.

## Example Prompts

```text
Read this skill and use Jiang's lens to analyze the attached article:
https://jianglens.com/skill.md
```

```text
Use Jiang's lens to compare these two geopolitical moves. Separate source-grounded concepts from your own inference:
https://jianglens.com/skill.md
```

```text
Use Jiang's lens to identify the actors, incentives, traps, and time horizons in this situation:
https://jianglens.com/skill.md
```

## Expected Output

For a substantial question, ask the assistant to include:

- a short lens reading,
- grounded references,
- reasoning,
- counter-reading,
- confidence,
- what to inspect next.

Short answers can be lighter, but the source/inference boundary should remain visible.
