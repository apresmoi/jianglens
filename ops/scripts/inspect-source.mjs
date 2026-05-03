#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function usage() {
  return `Usage:
  node ops/scripts/inspect-source.mjs content/sources/videos/<source-slug>`;
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

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(value) {
  return Number(value.toFixed(2));
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) throw new Error(usage());

  const absSourceDir = path.resolve(sourceDir);
  const source = parseSimpleYaml(await fs.readFile(path.join(absSourceDir, "source.yaml"), "utf8"));
  const transcript = parseSimpleYaml(await fs.readFile(path.join(absSourceDir, "transcripts/v1/transcript.yaml"), "utf8"));
  const segments = await readJsonl(path.join(absSourceDir, "transcripts/v1/transcript.clean.jsonl"));

  const speakerStats = {};
  for (const segment of segments) {
    const speaker = segment.speaker || "UNKNOWN";
    speakerStats[speaker] ??= { segments: 0, words: 0, seconds: 0 };
    speakerStats[speaker].segments += 1;
    speakerStats[speaker].words += segment.word_count || 0;
    speakerStats[speaker].seconds += Math.max(0, (segment.end || 0) - (segment.start || 0));
  }

  const durations = segments.map((segment) => Math.max(0, (segment.end || 0) - (segment.start || 0)));
  const words = segments.map((segment) => segment.word_count || 0);
  const warnings = [];
  if (source.chronology_status !== "dated") warnings.push("source is not dated");
  if (source.authority?.canonical_eligible !== "true" && source.authority?.canonical_eligible !== true) {
    warnings.push("canon promotion is blocked until source date is resolved");
  }
  if (durations.some((duration) => duration > 240)) warnings.push("some transcript segments are longer than 4 minutes");
  if (speakerStats.UNKNOWN) warnings.push("unknown speaker spans need agent attention");

  console.log(JSON.stringify({
    id: source.id,
    title: source.title,
    source_url: source.source_url,
    published_at: source.published_at || null,
    recorded_at: source.recorded_at || null,
    chronology_status: source.chronology_status,
    date_precision: source.date_precision,
    transcript: {
      id: transcript.id,
      segments: segments.length,
      words: words.reduce((sum, value) => sum + value, 0),
      duration_seconds: Number(transcript.duration_seconds) || null,
      segment_seconds: {
        min: round(Math.min(...durations)),
        median: round(median(durations)),
        max: round(Math.max(...durations)),
      },
      segment_words: {
        min: Math.min(...words),
        median: round(median(words)),
        max: Math.max(...words),
      },
    },
    speakers: Object.fromEntries(
      Object.entries(speakerStats).map(([speaker, stats]) => [
        speaker,
        { ...stats, minutes: round(stats.seconds / 60) },
      ]),
    ),
    warnings,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
