#!/usr/bin/env node
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
  node ops/scripts/aggregate-agent-passes.mjs --source content/sources/videos/<source-slug>

Options:
  --proposals PATH   Defaults to content/workflow/proposals/<source-slug>
  --out PATH         Defaults to content/lens/evidence/videos/<source-slug>.semantic.json`;
}

function required(args, key) {
  const value = args.get(key);
  if (!value || value === true) throw new Error(`Missing --${key}\n\n${usage()}`);
  return value;
}

function option(args, key, fallback) {
  const value = args.get(key);
  if (value === undefined || value === true) return fallback;
  return value;
}

function parseSimpleYaml(text) {
  const data = {};
  const stack = [data];
  const indents = [0];

  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, spaces, key, rawValue] = match;
    const indent = spaces.length;

    while (indent < indents[indents.length - 1]) {
      stack.pop();
      indents.pop();
    }

    const parent = stack[stack.length - 1];
    if (rawValue === "") {
      parent[key] = {};
      stack.push(parent[key]);
      indents.push(indent + 2);
      continue;
    }

    parent[key] = rawValue
      .replace(/^["']|["']$/g, "")
      .replace(/^null$/, "");
  }

  return data;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function listSemanticFiles(proposalsDir) {
  const entries = await fs.readdir(proposalsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".semantic.json"))
    .map((entry) => path.join(proposalsDir, entry.name))
    .sort();
}

function flatten(passes, key) {
  return passes.flatMap((pass) => pass[key] ?? []);
}

function firstRefs(items) {
  return [...new Set(items.flatMap((item) => item.refs ?? []))].slice(0, 8);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.resolve(repoRoot, required(args, "source"));
  const sourceSlug = path.basename(sourceDir);
  const proposalsDir = path.resolve(repoRoot, option(args, "proposals", `content/workflow/proposals/${sourceSlug}`));
  const out = path.resolve(repoRoot, option(args, "out", `content/lens/evidence/videos/${sourceSlug}.semantic.json`));

  const source = parseSimpleYaml(await fs.readFile(path.join(sourceDir, "source.yaml"), "utf8"));
  const transcript = parseSimpleYaml(await fs.readFile(path.join(sourceDir, "transcripts/v1/transcript.yaml"), "utf8"));
  const semanticFiles = await listSemanticFiles(proposalsDir);
  if (!semanticFiles.length) throw new Error(`No semantic output files found in ${proposalsDir}`);

  const passes = [];
  for (const filePath of semanticFiles) {
    const pass = await readJson(filePath);
    passes.push({ ...pass, _path: path.relative(repoRoot, filePath) });
  }

  const claims = flatten(passes, "claims");
  const aggregate = {
    id: `evidence:semanticvideo-${sourceSlug}:v1`,
    kind: "video-semantic-pass",
    source_slug: sourceSlug,
    source_id: source.id,
    source_title: source.title,
    source_url: source.source_url,
    source_date: source.recorded_at || source.published_at || null,
    date_precision: source.date_precision,
    transcript_id: transcript.id,
    generated_from: {
      semantic_passes: passes.map((pass) => pass._path),
      source_path: path.relative(repoRoot, path.join(sourceDir, "source.yaml")),
      transcript_path: path.relative(repoRoot, path.join(sourceDir, "transcripts/v1/transcript.clean.jsonl")),
    },
    counts: {
      semantic_passes: passes.length,
      interactions: flatten(passes, "interactions").length,
      speaker_notes: flatten(passes, "speaker_notes").length,
      claims: claims.length,
      signature_moments: flatten(passes, "signature_moments").length,
      predictions: claims.filter((claim) => claim.claim_type === "prediction").length,
      models: claims.filter((claim) => claim.claim_type === "model").length,
      glossary_terms: flatten(passes, "glossary_terms").length,
      chronology_notes: flatten(passes, "chronology_notes").length,
      uncertainty_notes: flatten(passes, "uncertainty_notes").length,
    },
    first_refs: firstRefs(claims),
    interactions: flatten(passes, "interactions"),
    speaker_notes: flatten(passes, "speaker_notes"),
    claims,
    signature_moments: flatten(passes, "signature_moments"),
    glossary_terms: flatten(passes, "glossary_terms"),
    chronology_notes: flatten(passes, "chronology_notes"),
    uncertainty_notes: flatten(passes, "uncertainty_notes"),
  };

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, `${JSON.stringify(aggregate, null, 2)}\n`);

  console.log(JSON.stringify({
    source_id: source.id,
    semantic_passes: passes.length,
    claims: aggregate.counts.claims,
    signature_moments: aggregate.counts.signature_moments,
    predictions: aggregate.counts.predictions,
    models: aggregate.counts.models,
    glossary_terms: aggregate.counts.glossary_terms,
    semantic_bundle: path.relative(repoRoot, out),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
