import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const websiteRoot = path.basename(cwd) === 'website' ? cwd : path.join(cwd, 'website');
const collectionRoots = {
  episodes: path.join(websiteRoot, 'src/data/lens/episodes'),
  interviews: path.join(websiteRoot, 'src/data/lens/interviews'),
};

function dataRoot(collection) {
  return collectionRoots[collection] ?? collectionRoots.episodes;
}

async function listCollectionSlugs(collection) {
  const root = dataRoot(collection);
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json')
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

async function readCollectionItem(collection, slug) {
  const filePath = path.join(dataRoot(collection), `${slug}.json`);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readCollectionIndex(collection, emptyKey) {
  const filePath = path.join(dataRoot(collection), 'index.json');
  if (!existsSync(filePath)) return { collection, [emptyKey]: [], items: [] };
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function listEpisodeSlugs() {
  return listCollectionSlugs('episodes');
}

export async function readEpisode(slug) {
  return readCollectionItem('episodes', slug);
}

export async function readEpisodeIndex() {
  return readCollectionIndex('episodes', 'episodes');
}

export function episodeJsonPath(slug) {
  return `/data/lens/episodes/${slug}.json`;
}

export async function listInterviewSlugs() {
  return listCollectionSlugs('interviews');
}

export async function readInterview(slug) {
  return readCollectionItem('interviews', slug);
}

export async function readInterviewIndex() {
  return readCollectionIndex('interviews', 'interviews');
}

export function interviewJsonPath(slug) {
  return `/data/lens/interviews/${slug}.json`;
}
