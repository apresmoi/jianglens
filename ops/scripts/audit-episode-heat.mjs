#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const stopWords = new Set([
  "about",
  "after",
  "again",
  "because",
  "before",
  "being",
  "between",
  "could",
  "every",
  "first",
  "itself",
  "their",
  "there",
  "these",
  "thing",
  "those",
  "through",
  "where",
  "which",
  "while",
  "would",
]);

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
  node ops/scripts/audit-episode-heat.mjs --source-slug <source-slug> [--strict]

Options:
  --semantic PATH   Defaults to content/lens/evidence/videos/<source-slug>.semantic.json
  --read PATH       Defaults to content/lens/episodes/<source-slug>/read.json
  --min NUMBER      Minimum carried signature moments for strict mode. Defaults to 3.`;
}

function option(args, key, fallback) {
  const value = args.get(key);
  if (value === undefined || value === true) return fallback;
  return value;
}

function required(args, key) {
  const value = args.get(key);
  if (!value || value === true) throw new Error(`Missing --${key}\n\n${usage()}`);
  return value;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 5 && !stopWords.has(token));
}

function uniqueTokens(value) {
  return [...new Set(tokens(value))];
}

function carriedByRead(moment, readText) {
  const normalizedRead = normalize(readText);
  const sourcePhrase = normalize(moment.source_phrase);
  if (sourcePhrase && sourcePhrase.length > 18 && normalizedRead.includes(sourcePhrase)) {
    return { carried: true, score: 1, matched_tokens: uniqueTokens(moment.source_phrase) };
  }

  const terms = uniqueTokens(`${moment.moment} ${moment.source_phrase}`);
  if (!terms.length) return { carried: false, score: 0, matched_tokens: [] };

  const matched = terms.filter((term) => normalizedRead.includes(term));
  const score = matched.length / terms.length;
  return {
    carried: matched.length >= 4 && score >= 0.34,
    score: Number(score.toFixed(2)),
    matched_tokens: matched,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceSlug = required(args, "source-slug");
  const semanticPath = path.resolve(repoRoot, option(args, "semantic", `content/lens/evidence/videos/${sourceSlug}.semantic.json`));
  const readPath = path.resolve(repoRoot, option(args, "read", `content/lens/episodes/${sourceSlug}/read.json`));
  const strict = args.has("strict");
  const min = Number(option(args, "min", "3"));

  const semantic = await readJson(semanticPath);
  const read = await readJson(readPath);
  const readText = collectStrings({
    title: read.title,
    dek: read.dek,
    thesis: read.thesis,
    opening: read.opening,
    beats: read.beats,
    questions: read.questions,
  }).join("\n");

  const moments = (semantic.signature_moments ?? []).map((moment) => ({
    refs: moment.refs,
    tone: moment.tone,
    moment: moment.moment,
    source_phrase: moment.source_phrase,
    ...carriedByRead(moment, readText),
  }));
  const carriedCount = moments.filter((moment) => moment.carried).length;
  const report = {
    source_slug: sourceSlug,
    signature_moments: moments.length,
    carried_signature_moments: carriedCount,
    minimum_expected: min,
    status: carriedCount >= min ? "pass" : "needs-revision",
    moments,
  };

  console.log(JSON.stringify(report, null, 2));
  if (strict && carriedCount < min) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
