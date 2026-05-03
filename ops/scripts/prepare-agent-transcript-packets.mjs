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
  node ops/scripts/prepare-agent-transcript-packets.mjs --source content/sources/videos/<source-slug>

Options:
  --packet-segments N  Focus segments per packet. Default: 8
  --context N          Extra segments before/after focus. Default: 2
  --out PATH           Defaults to content/workflow/tasks/<source-slug>/transcript-agent-packets.jsonl`;
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

async function readJsonl(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function segmentForPacket(segment) {
  return {
    id: segment.id,
    source_ref: segment.source_ref,
    start: segment.start,
    end: segment.end,
    speaker_label: segment.speaker,
    text: segment.text,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.resolve(repoRoot, required(args, "source"));
  const sourceSlug = path.basename(sourceDir);
  const packetSegments = Number(option(args, "packet-segments", "8"));
  const context = Number(option(args, "context", "2"));

  if (!Number.isFinite(packetSegments) || packetSegments <= 0) throw new Error("--packet-segments must be positive");
  if (!Number.isFinite(context) || context < 0) throw new Error("--context must be zero or positive");

  const out = path.resolve(
    repoRoot,
    option(args, "out", `content/workflow/tasks/${sourceSlug}/transcript-agent-packets.jsonl`),
  );
  const manifestOut = path.join(path.dirname(out), "manifest.json");
  const source = parseSimpleYaml(await fs.readFile(path.join(sourceDir, "source.yaml"), "utf8"));
  const transcript = parseSimpleYaml(await fs.readFile(path.join(sourceDir, "transcripts/v1/transcript.yaml"), "utf8"));
  const segments = await readJsonl(path.join(sourceDir, "transcripts/v1/transcript.clean.jsonl"));
  const packets = [];

  for (let start = 0; start < segments.length; start += packetSegments) {
    const focus = segments.slice(start, start + packetSegments);
    const contextStart = Math.max(0, start - context);
    const contextEnd = Math.min(segments.length, start + packetSegments + context);
    const packetIndex = packets.length + 1;

    packets.push({
      packet_id: `${sourceSlug}-semantics-pkt-${String(packetIndex).padStart(4, "0")}`,
      source_id: source.id,
      source_title: source.title,
      source_url: source.source_url,
      source_date: source.recorded_at || source.published_at || null,
      date_precision: source.date_precision,
      transcript_id: transcript.id,
      packet_index: packetIndex,
      focus_segment_ids: focus.map((segment) => segment.id),
      focus_refs: focus.map((segment) => segment.source_ref),
      context_segments: segments.slice(contextStart, contextEnd).map(segmentForPacket),
      instructions: [
        "Process only the focus_refs, using surrounding context_segments for interpretation.",
        "Speaker labels are machine diarization hints, not truth. Correct or mark uncertainty from context.",
        "Identify real questions, answers, exchanges, quoted readings, and monologue; do not rely on punctuation alone.",
        "Extract dated claims, predictions, models, definitions, and glossary candidates with exact refs.",
        "Keep chronology explicit. Do not merge this source with older/newer sources unless exact dated refs are present.",
        "Return JSON matching ops/schemas/agent-transcript-pass.schema.json.",
      ],
      output_schema: "ops/schemas/agent-transcript-pass.schema.json",
    });
  }

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, `${packets.map((packet) => JSON.stringify(packet)).join("\n")}\n`);
  await fs.writeFile(manifestOut, `${JSON.stringify({
    source_id: source.id,
    source_slug: sourceSlug,
    source_date: source.recorded_at || source.published_at || null,
    transcript_id: transcript.id,
    packet_file: path.relative(repoRoot, out),
    packet_count: packets.length,
    packet_segments: packetSegments,
    context_segments_each_side: context,
    output_schema: "ops/schemas/agent-transcript-pass.schema.json",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    source_id: source.id,
    packet_file: path.relative(repoRoot, out),
    manifest: path.relative(repoRoot, manifestOut),
    packets: packets.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
