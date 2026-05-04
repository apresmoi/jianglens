#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { absoluteUrl, configuredBasePath, configuredOrigin, siteConfig } from '../site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(websiteRoot, '..');
const docsRoot = path.join(websiteRoot, 'src/content/docs');
const distRoot = path.join(websiteRoot, 'dist');
const docsOutRoot = path.join(distRoot, 'docs');
const dataRoot = path.join(websiteRoot, 'src/data/lens');
const dataOutRoot = path.join(distRoot, 'data/lens');
const publicSkillPath = path.join(websiteRoot, 'public/skill.md');
const origin = configuredOrigin();
const basePath = configuredBasePath();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const values = {};
  for (const line of match[1].split('\n')) {
    const parsed = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!parsed) continue;
    values[parsed[1]] = parsed[2].replace(/^["']|["']$/g, '');
  }

  return values;
}

function withoutFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

function docSlug(filePath) {
  let slug = path.relative(docsRoot, filePath).replace(/\.mdx?$/, '');
  if (slug.endsWith('/index')) slug = slug.slice(0, -'/index'.length);
  return slug;
}

function urlFor(pathname) {
  return absoluteUrl(pathname, { origin, basePath });
}

async function copyDocs(files) {
  for (const filePath of files) {
    const slug = docSlug(filePath);
    if (!slug) continue;

    const outPath = path.join(docsOutRoot, `${slug}.md`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await copyFile(filePath, outPath);
  }
}

async function copyData() {
  await mkdir(dataOutRoot, { recursive: true });
  await copyTree(dataRoot, dataOutRoot);
}

async function copyTree(inputRoot, outputRoot) {
  if (!existsSync(inputRoot)) return;
  await mkdir(outputRoot, { recursive: true });
  const entries = await readdir(inputRoot, { withFileTypes: true });
  for (const entry of entries) {
    const input = path.join(inputRoot, entry.name);
    const output = path.join(outputRoot, entry.name);
    if (entry.isDirectory()) {
      await copyTree(input, output);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(output), { recursive: true });
      await copyFile(input, output);
    }
  }
}

async function main() {
  if (!existsSync(distRoot)) {
    throw new Error('Missing website/dist. Run astro build before generating llms files.');
  }

  const files = (await walk(docsRoot)).sort();
  await copyDocs(files);
  await copyData();

  const indexLines = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.summary}`,
    '',
    'This is an independent research project, not an official Jiang Xueqin publication. It is designed for human readers and for agents such as ChatGPT, Claude, and Codex that need source-grounded access to the corpus.',
    '',
    'Agents should separate Jiang-sourced material from project interpretation and generated analysis.',
    '',
    '## Agent Entry Points',
    '',
    `- [Jiang Lens skill](${urlFor(siteConfig.paths.skill)})`,
    `- [Episodes](${urlFor(siteConfig.paths.episodes)})`,
    `- [Full compact docs](${urlFor(siteConfig.paths.llmsFull)})`,
    `- [Generated manifest JSON](${urlFor(siteConfig.paths.manifestJson)})`,
    `- [Generated link index JSON](${urlFor(siteConfig.paths.linkIndexJson)})`,
    '',
    '## Public Docs',
    '',
  ];

  const fullLines = [
    `# ${siteConfig.name} -- Full Agent Snapshot`,
    '',
    '> Compact public snapshot for agents using the Jiang Lens corpus.',
    '',
    'Important boundary: generated analysis is a Jiang Lens reading, not Jiang Xueqin speaking. Prefer cited canon, glossary, evidence, and ledger references when available. Use this snapshot with ChatGPT, Claude, Codex, or another assistant when exact public pages are not enough.',
    '',
  ];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');
    const metadata = extractFrontmatter(content);
    const slug = docSlug(filePath);
    if (!slug) continue;

    const title = metadata.title || slug;
    indexLines.push(`- [${title}](${urlFor(`/docs/${slug}.md`)})`);
    fullLines.push('---', '', `# ${title}`, '', withoutFrontmatter(content), '');
  }

  if (existsSync(publicSkillPath)) {
    const skill = await readFile(publicSkillPath, 'utf8');
    fullLines.push('---', '', '# Jiang Lens Skill', '', withoutFrontmatter(skill), '');
  }

  for (const fileName of ['manifest.json', 'link-index.json']) {
    const input = path.join(dataRoot, fileName);
    if (!existsSync(input)) continue;

    const json = await readFile(input, 'utf8');
    fullLines.push('---', '', `# Generated ${fileName}`, '', '```json', json.trim(), '```', '');
  }

  indexLines.push(
    '',
    '## External Profiles',
    '',
    ...siteConfig.externalProfiles.map((profile) => `- ${profile}`),
    '',
    '## Source',
    '',
    `- Public repository: ${siteConfig.urls.repository}`,
    '',
  );

  await writeFile(path.join(distRoot, 'llms.txt'), indexLines.join('\n'));
  await writeFile(path.join(distRoot, 'llms-full.txt'), fullLines.join('\n'));

  console.log(`Generated llms.txt, llms-full.txt, ${files.length} raw docs, and public lens JSON.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
