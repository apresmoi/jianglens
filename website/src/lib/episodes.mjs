import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const websiteRoot = path.basename(cwd) === 'website' ? cwd : path.join(cwd, 'website');
const episodeDataRoot = path.join(websiteRoot, 'src/data/lens/episodes');

export async function listEpisodeSlugs() {
  if (!existsSync(episodeDataRoot)) return [];
  const entries = await readdir(episodeDataRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json')
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

export async function readEpisode(slug) {
  const filePath = path.join(episodeDataRoot, `${slug}.json`);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function readEpisodeIndex() {
  const filePath = path.join(episodeDataRoot, 'index.json');
  if (!existsSync(filePath)) return { episodes: [] };
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export function episodeJsonPath(slug) {
  return `/data/lens/episodes/${slug}.json`;
}
