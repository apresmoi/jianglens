#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, true);
    } else {
      args.set(key, next);
      i += 1;
    }
  }
  return args;
}

function usage() {
  return `Usage:
  node ops/scripts/repair-transcript-boundaries.mjs --source content/sources/videos/<source-slug> [--write]
  node ops/scripts/repair-transcript-boundaries.mjs --transcript path/to/transcript.clean.jsonl [--write]

Options:
  --write             Apply repairs. Without this, prints a dry-run plan.
  --review-out PATH   Write compact candidate windows for agent review.
  --decisions PATH    Apply only approved candidate IDs from a decision JSON file.
  --max-lead-words N  Move at most this many words from next segment to previous. Default: 16
  --max-tail-words N  Move at most this many trailing starter words to next segment. Default: 4`;
}

function option(args, key, fallback = null) {
  const value = args.get(key);
  if (value === undefined || value === true) return fallback;
  return value;
}

function boolOption(args, key) {
  return args.get(key) === true;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function candidateId(boundary, type, text) {
  return `${boundary}:${type}:${sha256(text).slice(0, 12)}`;
}

function tokenize(text) {
  return cleanText(text).split(/\s+/).filter(Boolean);
}

function wordCount(text) {
  return tokenize(text).length;
}

function endsSentence(text) {
  return /[.!?](?:["')\]]+)?$/.test(cleanText(text));
}

function sentenceEndIndex(words, direction) {
  const indexes = direction === "last"
    ? Array.from({ length: words.length }, (_, index) => words.length - 1 - index)
    : Array.from({ length: words.length }, (_, index) => index);

  return indexes.find((index) => endsSentence(words[index])) ?? -1;
}

function startsLowercase(text) {
  const first = cleanText(text).match(/[A-Za-z]/)?.[0];
  return Boolean(first && first === first.toLowerCase());
}

function splitChunk(chunk, leftWords) {
  const words = tokenize(chunk.text);
  if (leftWords <= 0 || leftWords >= words.length) return null;

  const start = Number(chunk.start);
  const end = Number(chunk.end);
  const duration = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
  const mid = duration ? start + (duration * leftWords) / words.length : start;

  const leftText = cleanText(words.slice(0, leftWords).join(" "));
  const rightText = cleanText(words.slice(leftWords).join(" "));

  return {
    left: {
      ...chunk,
      start,
      end: Number(mid.toFixed(3)),
      text: leftText,
      word_count: wordCount(leftText),
    },
    right: {
      ...chunk,
      start: Number(mid.toFixed(3)),
      end,
      text: rightText,
      word_count: wordCount(rightText),
    },
  };
}

function reindexSegment(segment) {
  const chunks = (segment.timed_chunks ?? []).filter((chunk) => cleanText(chunk.text));
  const text = cleanText(chunks.map((chunk) => chunk.text).join(" "));
  const start = chunks.length ? Number(chunks[0].start) : Number(segment.start);
  const end = chunks.length ? Number(chunks[chunks.length - 1].end) : Number(segment.end);
  const timedChunks = chunks.map((chunk, index) => ({
    ...chunk,
    id: `${segment.id}-chunk-${String(index + 1).padStart(3, "0")}`,
    start: Number(Number(chunk.start).toFixed(3)),
    end: Number(Number(chunk.end).toFixed(3)),
    text: cleanText(chunk.text),
    word_count: Number(chunk.word_count) || wordCount(chunk.text),
  }));

  return {
    ...segment,
    start: Number(Number(start).toFixed(3)),
    end: Number(Number(end).toFixed(3)),
    text,
    word_count: timedChunks.reduce((sum, chunk) => sum + (Number(chunk.word_count) || 0), 0),
    timed_chunks: timedChunks,
    text_sha256: sha256(text),
  };
}

function boundaryContext(prev, next) {
  const tail = (prev.timed_chunks ?? []).slice(-5).map((chunk) => ({
    id: chunk.id,
    start: chunk.start,
    end: chunk.end,
    text: chunk.text,
  }));
  const head = (next.timed_chunks ?? []).slice(0, 5).map((chunk) => ({
    id: chunk.id,
    start: chunk.start,
    end: chunk.end,
    text: chunk.text,
  }));

  return {
    prev: {
      id: prev.id,
      start: prev.start,
      end: prev.end,
      tail_text: cleanText(tail.map((chunk) => chunk.text).join(" ")),
      tail_chunks: tail,
    },
    next: {
      id: next.id,
      start: next.start,
      end: next.end,
      head_text: cleanText(head.map((chunk) => chunk.text).join(" ")),
      head_chunks: head,
    },
  };
}

function moveTailStarter(prev, next, { maxTailWords }) {
  const chunks = prev.timed_chunks ?? [];
  if (!chunks.length || !(next.timed_chunks ?? []).length) return null;

  const last = chunks[chunks.length - 1];
  const words = tokenize(last.text);
  const endIndex = sentenceEndIndex(words, "last");
  if (endIndex < 0 || endIndex >= words.length - 1) return null;

  const suffixWords = words.length - endIndex - 1;
  if (suffixWords > maxTailWords) return null;

  const suffixText = cleanText(words.slice(endIndex + 1).join(" "));
  if (!suffixText || endsSentence(suffixText)) return null;
  if (!startsLowercase(next.timed_chunks[0]?.text ?? next.text)) return null;

  const split = splitChunk(last, endIndex + 1);
  if (!split) return null;
  const [firstNext, ...restNext] = next.timed_chunks ?? [];
  const moved = firstNext ? {
    ...split.right,
    end: firstNext.end,
    text: cleanText(`${split.right.text} ${firstNext.text}`),
    word_count: wordCount(`${split.right.text} ${firstNext.text}`),
  } : split.right;

  prev.timed_chunks = [...chunks.slice(0, -1), split.left];
  next.timed_chunks = [moved, ...restNext];

  return {
    type: "move-trailing-starter-to-next",
    text: suffixText,
  };
}

function leadingSentenceChunks(next, maxLeadWords) {
  const chunks = next.timed_chunks ?? [];
  const moved = [];
  let totalWords = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const words = tokenize(chunk.text);
    const endIndex = sentenceEndIndex(words, "first");

    if (endIndex === -1) {
      totalWords += words.length;
      if (totalWords > maxLeadWords) return null;
      moved.push(chunk);
      continue;
    }

    const prefixWords = endIndex + 1;
    totalWords += prefixWords;
    if (totalWords > maxLeadWords) return null;

    if (prefixWords === words.length) {
      moved.push(chunk);
      return {
        moved,
        remaining: chunks.slice(index + 1),
      };
    }

    const split = splitChunk(chunk, prefixWords);
    if (!split) return null;
    moved.push(split.left);
    return {
      moved,
      remaining: [split.right, ...chunks.slice(index + 1)],
    };
  }

  return null;
}

function moveHeadCompletion(prev, next, { maxLeadWords }) {
  if (endsSentence(prev.text)) return null;
  if (!(prev.timed_chunks ?? []).length || !(next.timed_chunks ?? []).length) return null;

  const candidate = leadingSentenceChunks(next, maxLeadWords);
  if (!candidate || !candidate.moved.length) return null;
  const movedText = cleanText(candidate.moved.map((chunk) => chunk.text).join(" "));
  if (!/^[A-Za-z0-9"'(]/.test(movedText)) return null;

  prev.timed_chunks = [...(prev.timed_chunks ?? []), ...candidate.moved];
  next.timed_chunks = candidate.remaining;

  return {
    type: "move-leading-completion-to-previous",
    text: movedText,
  };
}

function repairBoundaries(segments, options) {
  const approvedIds = options.approvedIds ?? null;
  const repaired = segments.map((segment) => ({
    ...segment,
    timed_chunks: (segment.timed_chunks ?? []).map((chunk) => ({ ...chunk })),
  }));
  const moves = [];

  for (let index = 0; index < repaired.length - 1; index += 1) {
    let prev = reindexSegment(repaired[index]);
    let next = reindexSegment(repaired[index + 1]);

    const tailCandidatePrev = clone(prev);
    const tailCandidateNext = clone(next);
    const tailMove = moveTailStarter(tailCandidatePrev, tailCandidateNext, options);
    if (tailMove) {
      const boundary = `${prev.id}->${next.id}`;
      const move = {
        candidate_id: candidateId(boundary, tailMove.type, tailMove.text),
        status: approvedIds ? (approvedIds.has(candidateId(boundary, tailMove.type, tailMove.text)) ? "approved" : "pending-or-rejected") : "candidate",
        boundary,
        ...tailMove,
        ...boundaryContext(prev, next),
      };
      moves.push(move);

      if (!approvedIds || approvedIds.has(move.candidate_id)) {
        prev = reindexSegment(tailCandidatePrev);
        next = reindexSegment(tailCandidateNext);
      }
    }

    const headCandidatePrev = clone(prev);
    const headCandidateNext = clone(next);
    const headMove = moveHeadCompletion(headCandidatePrev, headCandidateNext, options);
    if (headMove) {
      const boundary = `${prev.id}->${next.id}`;
      const move = {
        candidate_id: candidateId(boundary, headMove.type, headMove.text),
        status: approvedIds ? (approvedIds.has(candidateId(boundary, headMove.type, headMove.text)) ? "approved" : "pending-or-rejected") : "candidate",
        boundary: `${prev.id}->${next.id}`,
        ...headMove,
        ...boundaryContext(prev, next),
      };
      moves.push(move);

      if (!approvedIds || approvedIds.has(move.candidate_id)) {
        prev = reindexSegment(headCandidatePrev);
        next = reindexSegment(headCandidateNext);
      }
    }

    repaired[index] = prev;
    repaired[index + 1] = next;
  }

  return {
    segments: repaired.map(reindexSegment),
    moves,
  };
}

function parseSimpleYaml(text) {
  const data = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    data[key] = value.replace(/^["']|["']$/g, "").replace(/^null$/, "");
  }
  return data;
}

function formatSeconds(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

function transcriptMarkdown({ title, sourceUrl, segments }) {
  const lines = [`# ${title}`, "", `Source: ${sourceUrl}`, ""];
  for (const segment of segments) {
    lines.push(
      `## ${segment.id} / ${formatSeconds(segment.start)}-${formatSeconds(segment.end)} / ${segment.speaker}`,
      "",
      segment.text,
      "",
      `Ref: ${segment.source_ref}`,
      "",
    );
  }
  return `${lines.join("\n").trim()}\n`;
}

async function readJsonl(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function readApprovedDecisionIds(filePath) {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  const decisions = Array.isArray(parsed) ? parsed : parsed.decisions ?? [];
  return new Set(decisions
    .filter((decision) => ["approve", "approved", true].includes(decision.decision) || decision.approved === true)
    .map((decision) => decision.candidate_id)
    .filter(Boolean));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceArg = option(args, "source");
  const transcriptArg = option(args, "transcript");
  const write = boolOption(args, "write");
  const reviewOut = option(args, "review-out");
  const decisionsArg = option(args, "decisions");
  const verbose = boolOption(args, "verbose");
  const maxLeadWords = Number(option(args, "max-lead-words", "16"));
  const maxTailWords = Number(option(args, "max-tail-words", "4"));

  if (!sourceArg && !transcriptArg) throw new Error(`Missing --source or --transcript\n\n${usage()}`);
  if (!Number.isFinite(maxLeadWords) || maxLeadWords <= 0) throw new Error("--max-lead-words must be positive");
  if (!Number.isFinite(maxTailWords) || maxTailWords <= 0) throw new Error("--max-tail-words must be positive");

  const sourceDir = sourceArg ? path.resolve(repoRoot, sourceArg) : null;
  const transcriptPath = transcriptArg
    ? path.resolve(repoRoot, transcriptArg)
    : path.join(sourceDir, "transcripts/v1/transcript.clean.jsonl");
  const markdownPath = path.join(path.dirname(transcriptPath), "transcript.clean.md");
  const approvedIds = decisionsArg ? await readApprovedDecisionIds(path.resolve(repoRoot, decisionsArg)) : null;

  const segments = await readJsonl(transcriptPath);
  const before = segments.map((segment) => JSON.stringify(segment));
  const result = repairBoundaries(segments, { maxLeadWords, maxTailWords, approvedIds });
  const changedSegments = result.segments
    .filter((segment, index) => JSON.stringify(segment) !== before[index])
    .map((segment) => segment.id);

  if (reviewOut) {
    const reviewPath = path.resolve(repoRoot, reviewOut);
    await fs.mkdir(path.dirname(reviewPath), { recursive: true });
    await fs.writeFile(reviewPath, `${result.moves.map((move) => JSON.stringify(move)).join("\n")}${result.moves.length ? "\n" : ""}`);
  }

  if (write && changedSegments.length) {
    await fs.writeFile(transcriptPath, `${result.segments.map((segment) => JSON.stringify(segment)).join("\n")}\n`);

    if (sourceDir) {
      const source = parseSimpleYaml(await fs.readFile(path.join(sourceDir, "source.yaml"), "utf8"));
      await fs.writeFile(markdownPath, transcriptMarkdown({
        title: source.title || path.basename(sourceDir),
        sourceUrl: source.source_url || "",
        segments: result.segments,
      }));
    }
  }

  const summary = {
    status: write ? "repaired" : "dry-run",
    transcript: path.relative(repoRoot, transcriptPath),
    review_file: reviewOut ? path.relative(repoRoot, path.resolve(repoRoot, reviewOut)) : null,
    candidates: result.moves.length,
    approved_candidates: approvedIds ? result.moves.filter((move) => move.status === "approved").length : null,
    changed_segments: [...new Set(changedSegments)],
  };
  if (verbose) summary.moves = result.moves;

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
