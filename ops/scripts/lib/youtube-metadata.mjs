import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function youtubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function parseYtDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

function isoFromTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp * 1000).toISOString();
}

export function compactYoutubeMetadata(info, source = "yt-dlp") {
  const publishedAt = parseYtDate(info.upload_date) || isoFromTimestamp(info.timestamp)?.slice(0, 10) || null;

  return {
    id: info.id || null,
    title: info.title || null,
    source_url: info.webpage_url || (info.id ? youtubeUrl(info.id) : null),
    published_at: publishedAt,
    upload_date_raw: info.upload_date || null,
    timestamp: info.timestamp || null,
    timestamp_iso: isoFromTimestamp(info.timestamp),
    duration_seconds: info.duration || null,
    channel: {
      id: info.channel_id || info.uploader_id || null,
      title: info.channel || info.uploader || null,
      url: info.channel_url || info.uploader_url || null,
    },
    live_status: info.live_status || null,
    was_live: info.was_live ?? null,
    availability: info.availability || null,
    extractor: info.extractor || null,
    metadata_source: source,
    fetched_at: new Date().toISOString(),
  };
}

async function runYtDlp(commandPrefix, videoId) {
  const [binary, ...prefixArgs] = commandPrefix;
  const args = [
    ...prefixArgs,
    "--dump-json",
    "--skip-download",
    "--no-warnings",
    youtubeUrl(videoId),
  ];
  const { stdout } = await execFileAsync(binary, args, { maxBuffer: 64 * 1024 * 1024 });
  const line = stdout.split("\n").find((candidate) => candidate.trim().startsWith("{"));
  if (!line) throw new Error("yt-dlp returned no JSON metadata");
  return JSON.parse(line);
}

export async function fetchYoutubeMetadata(videoId) {
  const candidates = [
    ["yt-dlp"],
    ["uvx", "yt-dlp"],
    ["python3", "-m", "yt_dlp"],
  ];
  const errors = [];

  for (const candidate of candidates) {
    try {
      const raw = await runYtDlp(candidate, videoId);
      return compactYoutubeMetadata(raw, candidate.join(" "));
    } catch (error) {
      const message = error.stderr || error.message || String(error);
      if (error.code === "ENOENT" || /No module named yt_dlp/.test(message)) {
        errors.push(`${candidate.join(" ")}: unavailable`);
        continue;
      }
      errors.push(`${candidate.join(" ")}: ${message.trim().slice(0, 240)}`);
    }
  }

  throw new Error(`Could not fetch YouTube metadata for ${videoId}: ${errors.join("; ")}`);
}

export async function readYoutubeMetadataFile(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (raw.metadata_source) return raw;
  return compactYoutubeMetadata(raw, path.basename(filePath));
}

export async function findStagedYoutubeMetadata(videoDir) {
  const candidates = [
    "metadata.youtube.json",
    "metadata.json",
    "info.json",
  ];

  for (const filename of candidates) {
    const filePath = path.join(videoDir, filename);
    try {
      await fs.access(filePath);
      return { filePath, metadata: await readYoutubeMetadataFile(filePath) };
    } catch {
      // Try the next known metadata name.
    }
  }

  const entries = await fs.readdir(videoDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".info.json")) {
      const filePath = path.join(videoDir, entry.name);
      return { filePath, metadata: await readYoutubeMetadataFile(filePath) };
    }
  }

  return null;
}
