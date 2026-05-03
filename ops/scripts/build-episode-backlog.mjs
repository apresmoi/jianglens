#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, true);
    } else {
      args.set(key, next);
      index += 1;
    }
  }
  return args;
}

function option(args, key, fallback) {
  const value = args.get(key);
  if (value === undefined || value === true) return fallback;
  return value;
}

function slugForVideoId(videoId) {
  return `predictive-history-${String(videoId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

async function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return (await readFile(filePath, 'utf8'))
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function listDirectories(dir) {
  return (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const channel = option(args, 'channel', '@PredictiveHistory');
  const stagingRoot = path.resolve(repoRoot, option(args, 'staging-root', 'ops/staging/drive/youtube'));
  const channelRoot = path.join(stagingRoot, channel);
  const outJson = path.resolve(repoRoot, option(args, 'out', 'content/workflow/tasks/episode-production-backlog.json'));
  const outTsv = path.resolve(repoRoot, option(args, 'tsv-out', 'content/workflow/tasks/episode-production-backlog.tsv'));
  const flatPath = path.join(channelRoot, '_channel.flat.jsonl');

  if (!existsSync(channelRoot)) {
    throw new Error(`Missing staged channel folder: ${path.relative(repoRoot, channelRoot)}`);
  }

  const stagedVideoIds = await listDirectories(channelRoot);
  const flatRows = await readJsonl(flatPath);
  const flatById = new Map(flatRows.map((row) => [row.id, row]));
  const importedSlugs = new Set(await listDirectories(path.join(repoRoot, 'content/lens/episodes')));

  const videos = stagedVideoIds.map((videoId) => {
    const flat = flatById.get(videoId);
    const sourceSlug = slugForVideoId(videoId);
    return {
      video_id: videoId,
      source_slug: sourceSlug,
      imported_episode: importedSlugs.has(sourceSlug),
      title: flat?.title ?? null,
      playlist_index: flat?.playlist_index ?? null,
      duration_seconds: flat?.duration ?? null,
      duration_string: flat?.duration_string ?? null,
      transcription: existsSync(path.join(channelRoot, videoId, 'transcription.json')),
      diarization: existsSync(path.join(channelRoot, videoId, 'dump.json')) && existsSync(path.join(channelRoot, videoId, 'grouped.json')),
      metadata: existsSync(path.join(channelRoot, videoId, 'metadata.youtube.json')),
    };
  }).sort((a, b) => {
    const left = a.playlist_index ?? -1;
    const right = b.playlist_index ?? -1;
    return right - left || a.video_id.localeCompare(b.video_id);
  });

  const backlog = {
    generated_by: 'ops/scripts/build-episode-backlog.mjs',
    generated_at: process.env.LENS_GENERATED_AT ?? new Date().toISOString(),
    channel,
    order: 'oldest-first by YouTube channel playlist_index; playlist_index 1 is newest; null playlist entries last',
    counts: {
      staged_videos: videos.length,
      imported_episodes: videos.filter((video) => video.imported_episode).length,
      remaining_episodes: videos.filter((video) => !video.imported_episode).length,
      transcribed: videos.filter((video) => video.transcription).length,
      diarized: videos.filter((video) => video.diarization).length,
      missing_flat_metadata: videos.filter((video) => !video.title).length,
    },
    videos,
  };

  await mkdir(path.dirname(outJson), { recursive: true });
  await writeFile(outJson, `${JSON.stringify(backlog, null, 2)}\n`);
  await writeFile(outTsv, [
    'order\tplaylist_index\tvideo_id\tsource_slug\timported\tdiarization\tduration\ttitle',
    ...videos.map((video, index) => [
      index + 1,
      video.playlist_index ?? '',
      video.video_id,
      video.source_slug,
      video.imported_episode ? 'yes' : 'no',
      video.diarization ? 'yes' : 'no',
      video.duration_string ?? '',
      String(video.title ?? '').replaceAll('\t', ' '),
    ].join('\t')),
  ].join('\n') + '\n');

  console.log(JSON.stringify({
    output: path.relative(repoRoot, outJson),
    tsv: path.relative(repoRoot, outTsv),
    counts: backlog.counts,
    first_remaining: videos.filter((video) => !video.imported_episode).slice(0, 10),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
