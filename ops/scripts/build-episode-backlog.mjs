#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const defaultArtifactRoot = 'content/sources/raw/youtube';

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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugForVideoId(videoId, sourceClass = 'episode') {
  const idSlug = slugify(videoId);
  return sourceClass === 'interview'
    ? `interview-${idSlug}`
    : `predictive-history-${idSlug}`;
}

async function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return (await readFile(filePath, 'utf8'))
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function listDirectories(dir) {
  if (!existsSync(dir)) return [];
  return (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readRawConfig(artifactRootPath) {
  const configPath = path.join(artifactRootPath, '_config.json');
  if (!existsSync(configPath)) return {};
  return JSON.parse(await readFile(configPath, 'utf8'));
}

async function collectPredictiveHistorySources({ artifactRootPath, channel }) {
  const channelRoot = path.join(artifactRootPath, channel);
  const flatPath = path.join(channelRoot, '_channel.flat.jsonl');

  if (!existsSync(channelRoot)) {
    throw new Error(`Missing source artifact channel folder: ${path.relative(repoRoot, channelRoot)}`);
  }

  const artifactVideoIds = await listDirectories(channelRoot);
  const flatRows = await readJsonl(flatPath);
  const flatById = new Map(flatRows.map((row) => [row.id, row]));

  return artifactVideoIds.map((videoId) => {
    const flat = flatById.get(videoId);
    const sourceClass = 'episode';
    const sourceSlug = slugForVideoId(videoId, sourceClass);
    return {
      video_id: videoId,
      source_slug: sourceSlug,
      source_class: sourceClass,
      collection: 'episodes',
      channel_path: channel,
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
}

async function collectInterviewSources({ artifactRootPath, channel }) {
  const interviewsRoot = path.join(artifactRootPath, 'Interviews');
  const hostFilter = channel.startsWith('Interviews/') ? channel.split('/').slice(1).join('/') : null;

  if (!existsSync(interviewsRoot)) {
    throw new Error(`Missing source artifact interviews folder: ${path.relative(repoRoot, interviewsRoot)}`);
  }

  const rawConfig = await readRawConfig(artifactRootPath);
  const bucketRows = rawConfig.buckets?.Interviews ?? [];
  const bucketById = new Map(bucketRows.map((row, index) => [row.id, { ...row, config_index: index }]));
  const hostChannels = hostFilter ? [hostFilter] : await listDirectories(interviewsRoot);
  const sources = [];

  for (const hostChannel of hostChannels) {
    const hostRoot = path.join(interviewsRoot, hostChannel);
    for (const videoId of await listDirectories(hostRoot)) {
      const bucket = bucketById.get(videoId);
      const sourceClass = 'interview';
      sources.push({
        video_id: videoId,
        source_slug: slugForVideoId(videoId, sourceClass),
        source_class: sourceClass,
        collection: 'interviews',
        channel_path: `Interviews/${hostChannel}`,
        channel_id: hostChannel,
        title: bucket?.title ?? null,
        playlist_index: null,
        config_index: bucket?.config_index ?? null,
        duration_seconds: null,
        duration_string: null,
        transcription: existsSync(path.join(hostRoot, videoId, 'transcription.json')),
        diarization: existsSync(path.join(hostRoot, videoId, 'dump.json')) && existsSync(path.join(hostRoot, videoId, 'grouped.json')),
        metadata: existsSync(path.join(hostRoot, videoId, 'metadata.youtube.json')),
      });
    }
  }

  return sources.sort((a, b) => {
    if (a.config_index !== null && b.config_index !== null && a.config_index !== b.config_index) {
      return a.config_index - b.config_index;
    }
    if (a.config_index !== null) return -1;
    if (b.config_index !== null) return 1;
    return a.channel_path.localeCompare(b.channel_path) || a.video_id.localeCompare(b.video_id);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const channel = option(args, 'channel', '@PredictiveHistory');
  const artifactRoot = option(args, 'artifact-root', option(args, 'staging-root', defaultArtifactRoot));
  const artifactRootPath = path.resolve(repoRoot, artifactRoot);
  const outJson = path.resolve(repoRoot, option(args, 'out', 'content/workflow/tasks/episode-production-backlog.json'));
  const outTsv = path.resolve(repoRoot, option(args, 'tsv-out', 'content/workflow/tasks/episode-production-backlog.tsv'));
  const importedSlugs = new Set(await listDirectories(path.join(repoRoot, 'content/lens/episodes')));

  const videos = (channel === 'Interviews' || channel.startsWith('Interviews/'))
    ? await collectInterviewSources({ artifactRootPath, channel })
    : await collectPredictiveHistorySources({ artifactRootPath, channel });

  for (const video of videos) {
    video.imported_episode = importedSlugs.has(video.source_slug);
    video.imported_source = video.imported_episode;
  }

  const backlog = {
    generated_by: 'ops/scripts/build-episode-backlog.mjs',
    generated_at: process.env.LENS_GENERATED_AT ?? new Date().toISOString(),
    channel,
    order: channel === 'Interviews' || channel.startsWith('Interviews/')
      ? 'interview bucket config order first, then host channel and video id'
      : 'oldest-first by YouTube channel playlist_index; playlist_index 1 is newest; null playlist entries last',
    counts: {
      raw_sources: videos.length,
      staged_sources: videos.length,
      raw_source_videos: videos.length,
      staged_videos: videos.length,
      imported_sources: videos.filter((video) => video.imported_source).length,
      remaining_sources: videos.filter((video) => !video.imported_source).length,
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
    'order\tsource_class\tchannel_path\tplaylist_index\tvideo_id\tsource_slug\timported\tdiarization\tduration\ttitle',
    ...videos.map((video, index) => [
      index + 1,
      video.source_class,
      video.channel_path,
      video.playlist_index ?? '',
      video.video_id,
      video.source_slug,
      video.imported_source ? 'yes' : 'no',
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
