#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  fetchYoutubeMetadata,
  findStagedYoutubeMetadata,
  readYoutubeMetadataFile,
  youtubeUrl,
} from "./lib/youtube-metadata.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultArtifactRoot = "content/sources/raw/youtube";

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
  node ops/scripts/import-colab-video.mjs --video-id VIDEO_ID [options]

Options:
  --channel HANDLE             Drive channel folder, for example @PredictiveHistory
  --metadata PATH              Compact or raw yt-dlp metadata JSON
  --title TITLE                Overrides metadata title
  --published-at YYYY-MM-DD    Overrides YouTube publication date
  --recorded-at YYYY-MM-DD     Recording date when different from publication date
  --source-url URL             Defaults to YouTube watch URL
  --no-fetch-youtube-metadata  Do not call yt-dlp when metadata is missing
  --artifact-root PATH         Defaults to ${defaultArtifactRoot}
  --staging-root PATH          Legacy alias for --artifact-root
  --out-root PATH              Defaults to content/sources/videos
  --max-words N                Defaults to 160 words per transcript segment
  --max-seconds N              Defaults to 180 seconds per transcript segment
  --dry-run                    Print the import plan without writing files`;
}

function required(args, key) {
  const value = args.get(key);
  if (!value || value === true) throw new Error(`Missing required --${key}\n\n${usage()}`);
  return value;
}

function option(args, key, fallback = null) {
  const value = args.get(key);
  if (value === undefined || value === true) return fallback;
  return value;
}

function boolOption(args, key) {
  return args.get(key) === true;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function seconds(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatSeconds(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function wordText(word) {
  return cleanText(word?.word || word?.text || "");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function fileSha256(filePath) {
  try {
    return sha256(await fs.readFile(filePath));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findVideoDir(stagingRoot, channel, videoId) {
  if (channel) {
    const candidate = path.join(stagingRoot, channel, videoId);
    if (await exists(path.join(candidate, "transcription.json"))) return candidate;
  }

  const channels = await fs.readdir(stagingRoot, { withFileTypes: true });
  const matches = [];
  for (const entry of channels) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(stagingRoot, entry.name, videoId);
    if (await exists(path.join(candidate, "transcription.json"))) matches.push(candidate);
  }

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Multiple source artifact videos matched ${videoId}; pass --channel.`);
  throw new Error(`No source artifact transcription.json found for ${videoId} under ${stagingRoot}`);
}

function timedPhraseChunks(words, turn) {
  const phrases = [];
  let phrase = [];

  function flush() {
    const cleanWords = phrase.filter((word) => wordText(word));
    if (!cleanWords.length) {
      phrase = [];
      return;
    }

    const first = cleanWords[0];
    const last = cleanWords[cleanWords.length - 1];
    const start = seconds(first.start, seconds(turn.start));
    const end = seconds(last.end, seconds(last.start, seconds(turn.end, start)));
    const text = cleanText(cleanWords.map((word) => wordText(word)).join(" "));

    if (text) {
      phrases.push({
        start,
        end: Math.max(start, end),
        text,
        word_count: cleanWords.length,
      });
    }

    phrase = [];
  }

  for (const word of words) {
    const text = wordText(word);
    if (!text) continue;

    phrase.push(word);
    const wordCount = phrase.length;
    const hardBoundary = /[.!?]$/.test(text) && wordCount >= 2;
    const softBoundary = /[,;:]$/.test(text) && wordCount >= 5;

    if (hardBoundary || softBoundary || wordCount >= 12) flush();
  }

  flush();
  return phrases;
}

function chunkWords(words, turn, maxWords, maxSeconds) {
  const chunks = [];
  let chunk = [];

  function flush() {
    if (!chunk.length) return;
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    const start = seconds(first.start, seconds(turn.start));
    const end = seconds(last.end, seconds(last.start, seconds(turn.end, start)));
    chunks.push({
      start,
      end: Math.max(start, end),
      text: cleanText(chunk.map((word) => wordText(word)).join(" ")),
      wordCount: chunk.length,
      timedChunks: timedPhraseChunks(chunk, turn),
    });
    chunk = [];
  }

  for (const word of words) {
    const start = seconds(chunk[0]?.start, seconds(word.start, seconds(turn.start)));
    const end = seconds(word.end, seconds(word.start, seconds(turn.end, start)));
    if (chunk.length && (chunk.length >= maxWords || end - start >= maxSeconds)) flush();
    chunk.push(word);
  }
  flush();
  return chunks.filter((chunk) => chunk.text);
}

function chunkText(turn, maxWords) {
  const words = cleanText(turn.text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const start = seconds(turn.start);
  const end = Math.max(start, seconds(turn.end, start));
  const chunkCount = Math.ceil(words.length / maxWords);

  return Array.from({ length: chunkCount }, (_, index) => {
    const chunkWords = words.slice(index * maxWords, (index + 1) * maxWords);
    return {
      start: start + ((end - start) * index) / chunkCount,
      end: start + ((end - start) * (index + 1)) / chunkCount,
      text: cleanText(chunkWords.join(" ")),
      wordCount: chunkWords.length,
    };
  });
}

function makeSegments(transcription, sourceId, maxWords, maxSeconds) {
  const turns = Array.isArray(transcription.turns) ? transcription.turns : [];
  const segments = [];

  for (const turn of turns) {
    const chunks = Array.isArray(turn.words) && turn.words.length
      ? chunkWords(turn.words, turn, maxWords, maxSeconds)
      : chunkText(turn, maxWords);

    for (const chunk of chunks) {
      const id = `seg-${String(segments.length + 1).padStart(4, "0")}`;
      const sourceRef = `${sourceId}@transcript:v1#${id}`;
      const timedChunks = (chunk.timedChunks ?? []).map((timedChunk, index) => ({
        id: `${id}-chunk-${String(index + 1).padStart(3, "0")}`,
        start: Number(timedChunk.start.toFixed(3)),
        end: Number(timedChunk.end.toFixed(3)),
        text: timedChunk.text,
        word_count: timedChunk.word_count,
      }));
      segments.push({
        id,
        source_ref: sourceRef,
        start: Number(chunk.start.toFixed(3)),
        end: Number(chunk.end.toFixed(3)),
        speaker: turn.speaker || "UNKNOWN",
        text: chunk.text,
        word_count: chunk.wordCount,
        timed_chunks: timedChunks,
        text_sha256: sha256(chunk.text),
      });
    }
  }

  return segments;
}

function yamlScalar(value) {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return JSON.stringify(String(value));
}

function yamlBlock(entries, indent = 0) {
  const pad = " ".repeat(indent);
  return entries.flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      if (!value.length) return `${pad}${key}: []`;
      return [`${pad}${key}:`, ...value.map((item) => `${pad}  - ${yamlScalar(item)}`)];
    }
    if (value && typeof value === "object") {
      return [`${pad}${key}:`, ...yamlBlock(Object.entries(value), indent + 2)];
    }
    return `${pad}${key}: ${yamlScalar(value)}`;
  });
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

async function writeIfChanged(filePath, content) {
  let previous = null;
  try {
    previous = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (previous === content) return false;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  return true;
}

function inferDatePrecision(value) {
  if (!value) return "unknown";
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}$/.test(value)) return "month";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "day";
  return "unknown";
}

async function resolveMetadata(args, videoDir, videoId, { cache }) {
  const metadataPath = option(args, "metadata");
  if (metadataPath) {
    const filePath = path.resolve(repoRoot, metadataPath);
    return { filePath, metadata: await readYoutubeMetadataFile(filePath) };
  }

  const staged = await findStagedYoutubeMetadata(videoDir);
  if (staged) return staged;

  if (boolOption(args, "no-fetch-youtube-metadata")) {
    return { filePath: null, metadata: null };
  }

  const metadata = await fetchYoutubeMetadata(videoId);
  const filePath = path.join(videoDir, "metadata.youtube.json");
  if (cache) {
    await fs.writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
    return { filePath, metadata };
  }
  return { filePath: null, metadata };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const videoId = required(args, "video-id");
  const channelArg = option(args, "channel");
  const artifactRoot = option(args, "artifact-root", option(args, "staging-root", defaultArtifactRoot));
  const stagingRoot = path.resolve(repoRoot, artifactRoot);
  const outRoot = path.resolve(repoRoot, option(args, "out-root", "content/sources/videos"));
  const maxWords = Number(option(args, "max-words", "160"));
  const maxSeconds = Number(option(args, "max-seconds", "180"));
  const dryRun = boolOption(args, "dry-run");

  if (!Number.isFinite(maxWords) || maxWords <= 0) throw new Error("--max-words must be a positive number");
  if (!Number.isFinite(maxSeconds) || maxSeconds <= 0) throw new Error("--max-seconds must be a positive number");

  const videoDir = await findVideoDir(stagingRoot, channelArg, videoId);
  const metadataResult = await resolveMetadata(args, videoDir, videoId, { cache: !dryRun });
  const metadata = metadataResult.metadata || {};
  const channelFolder = path.basename(path.dirname(videoDir));
  const channelMetaPath = path.join(path.dirname(videoDir), "_channel.json");
  const channelMeta = await exists(channelMetaPath) ? await readJson(channelMetaPath) : {};
  const transcriptionPath = path.join(videoDir, "transcription.json");
  const groupedPath = path.join(videoDir, "grouped.json");
  const dumpPath = path.join(videoDir, "dump.json");
  const transcription = await readJson(transcriptionPath);

  const channelTitle = option(args, "channel-title", metadata.channel?.title || channelMeta.name || channelFolder.replace(/^@/, ""));
  const channelHandle = option(args, "channel-handle", channelMeta.handle || channelFolder);
  const channelId = option(args, "channel-id", metadata.channel?.id || channelMeta.id || channelMeta.channel_id || null);
  const title = option(args, "title", metadata.title || `YouTube video ${videoId}`);
  const sourceUrl = option(args, "source-url", metadata.source_url || youtubeUrl(videoId));
  const publishedAt = option(args, "published-at", metadata.published_at || null);
  const recordedAt = option(args, "recorded-at", null);
  const sourceDate = recordedAt || publishedAt;
  const datePrecision = option(args, "date-precision", inferDatePrecision(sourceDate));
  const chronologyStatus = sourceDate ? "dated" : "needs-date";
  const sourceSlug = `${slugify(channelTitle || channelHandle || "youtube")}-${slugify(videoId)}`;
  const sourceId = `video:${sourceSlug}`;
  const outDir = path.join(outRoot, sourceSlug);
  const transcriptDir = path.join(outDir, "transcripts", "v1");

  const segments = makeSegments(transcription, sourceId, maxWords, maxSeconds);
  const totalWords = segments.reduce((sum, segment) => sum + segment.word_count, 0);
  const speakers = [...new Set(segments.map((segment) => segment.speaker))].sort();

  const sourceYaml = `${yamlBlock([
    ["id", sourceId],
    ["kind", "video"],
    ["platform", "youtube"],
    ["title", title],
    ["source_url", sourceUrl],
    ["video_id", videoId],
    ["published_at", publishedAt],
    ["recorded_at", recordedAt],
    ["date_precision", datePrecision],
    ["chronology_status", chronologyStatus],
    ["channel", {
      id: channelId,
      handle: channelHandle,
      title: channelTitle,
      url: metadata.channel?.url || null,
    }],
    ["authority", {
      authorship: "platform-video",
      authorship_verified: false,
      canonical_eligible: chronologyStatus === "dated",
      canonical_scope: "spoken-content",
      review_required: false,
      review_policy: "report-driven",
      confidence: "provisional",
    }],
    ["processing", {
      status: "transcript-imported",
      transcript_version: "v1",
      pipeline: "colab-video-pipeline",
    }],
  ]).join("\n")}\n`;

  const transcriptYaml = `${yamlBlock([
    ["id", `${sourceId}@transcript:v1`],
    ["source_id", sourceId],
    ["version", 1],
    ["language", transcription.language || null],
    ["language_probability", transcription.language_probability ?? null],
    ["duration_seconds", transcription.duration ?? metadata.duration_seconds ?? null],
    ["segments", segments.length],
    ["word_count", totalWords],
    ["speakers", speakers],
    ["chronology", {
      source_date: sourceDate,
      date_precision: datePrecision,
      chronology_status: chronologyStatus,
      date_gate_passed: chronologyStatus === "dated",
    }],
    ["automation", {
      canon_promotion_allowed: chronologyStatus === "dated",
      human_review_policy: "report-driven",
      speaker_label_source: "diarization",
      semantic_pass: "agent-required",
      accepts_error_reports: true,
    }],
    ["segmentation", {
      strategy: "word-timestamp-chunks",
      max_words: maxWords,
      max_seconds: maxSeconds,
      timed_phrase_chunks: "preserved-when-word-timestamps-exist",
    }],
    ["generated_from", {
      source_artifact_dir: path.relative(repoRoot, videoDir),
      youtube_metadata: metadataResult.filePath ? path.relative(repoRoot, metadataResult.filePath) : null,
      youtube_metadata_source: metadata.metadata_source || null,
      transcription_json_sha256: await fileSha256(transcriptionPath),
      grouped_json_sha256: await fileSha256(groupedPath),
      dump_json_sha256: await fileSha256(dumpPath),
    }],
  ]).join("\n")}\n`;

  const jsonl = `${segments.map((segment) => JSON.stringify(segment)).join("\n")}\n`;
  const markdown = transcriptMarkdown({ title, sourceUrl, segments });
  const targets = [
    [path.join(outDir, "source.yaml"), sourceYaml],
    [path.join(transcriptDir, "transcript.yaml"), transcriptYaml],
    [path.join(transcriptDir, "transcript.clean.jsonl"), jsonl],
    [path.join(transcriptDir, "transcript.clean.md"), markdown],
  ];

  const summary = {
    source_id: sourceId,
    title,
    source_url: sourceUrl,
    published_at: publishedAt,
    chronology_status: chronologyStatus,
    date_precision: datePrecision,
    metadata_source: metadata.metadata_source || null,
    output_dir: path.relative(repoRoot, outDir),
    segments: segments.length,
    words: totalWords,
    speakers,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const written = [];
  for (const [target, content] of targets) {
    if (await writeIfChanged(target, content)) written.push(path.relative(repoRoot, target));
  }

  console.log(JSON.stringify({ ...summary, written }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
