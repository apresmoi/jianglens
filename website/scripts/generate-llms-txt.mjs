#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
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
const episodeDataRoot = path.join(dataRoot, 'episodes');
const interviewDataRoot = path.join(dataRoot, 'interviews');
const episodeMarkdownOutRoot = path.join(distRoot, 'episodes');
const interviewMarkdownOutRoot = path.join(distRoot, 'interviews');
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

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function markdownText(value) {
  return String(value ?? '').replace(/\s+\n/g, '\n').trim();
}

function escapeLinkLabel(value) {
  return String(value ?? '').replace(/[[\]]/g, '\\$&').trim();
}

function markdownLink(label, href) {
  if (!href) return escapeLinkLabel(label);
  return `[${escapeLinkLabel(label)}](${href})`;
}

function parseAttrs(value) {
  const attrs = {};
  for (const attr of String(value ?? '').matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)) {
    attrs[attr[1]] = attr[2];
  }
  return attrs;
}

function publicPath(pathname) {
  if (!pathname) return '';
  if (/^https?:\/\//.test(pathname)) return pathname;
  return urlFor(pathname);
}

function collectionForSource(source) {
  return source.collection === 'interviews' ? 'interviews' : 'episodes';
}

function sourceKind(collection) {
  return collection === 'interviews' ? 'interview' : 'episode';
}

function sourceMarkdownPath(sourceOrSlug, collection = 'episodes') {
  const slug = typeof sourceOrSlug === 'string' ? sourceOrSlug : sourceOrSlug.slug;
  const sourceCollection = typeof sourceOrSlug === 'string' ? collection : collectionForSource(sourceOrSlug);
  return `/${sourceCollection}/${slug}.md`;
}

function sourceDataPath(sourceOrSlug, collection = 'episodes') {
  const slug = typeof sourceOrSlug === 'string' ? sourceOrSlug : sourceOrSlug.slug;
  const sourceCollection = typeof sourceOrSlug === 'string' ? collection : collectionForSource(sourceOrSlug);
  return `/data/lens/${sourceCollection}/${slug}.json`;
}

function refSegmentMap(episode) {
  const map = new Map();
  for (const segment of episode.transcript ?? []) {
    if (segment.source_ref) map.set(segment.source_ref, segment);
  }
  return map;
}

function refsMarkdown(refs, episode) {
  const uniqueRefs = [...new Set((refs ?? []).filter(Boolean))];
  if (!uniqueRefs.length) return '';

  const segmentByRef = refSegmentMap(episode);
  return uniqueRefs.map((ref) => {
    const segment = segmentByRef.get(ref);
    if (!segment) return `\`${ref}\``;

    const collection = collectionForSource(episode);
    const transcriptUrl = publicPath(segment.transcript_url || `/${collection}/${episode.slug}/transcript/#${segment.id}`);
    const videoUrl = segment.video_url || episode.source_url;
    const timeLabel = segment.time_label || segment.id;
    return `${markdownLink(`${timeLabel} ${segment.id}`, transcriptUrl)} (${markdownLink('video', videoUrl)}) \`${ref}\``;
  }).join('; ');
}

function renderRefsBlock(refs, episode) {
  const refsLine = refsMarkdown(refs, episode);
  return refsLine ? `\n\nSources: ${refsLine}` : '';
}

function renderParagraphs(paragraphs, episode) {
  return (paragraphs ?? [])
    .map((paragraph) => {
      const text = markdownText(paragraph.text);
      if (!text) return '';
      return `${text}${renderRefsBlock(paragraph.refs, episode)}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function renderEpisodeMarkdown(episode) {
  const read = episode.read ?? {};
  const collection = collectionForSource(episode);
  const kind = sourceKind(collection);
  const kindTitle = kind[0].toUpperCase() + kind.slice(1);
  const title = read.title || episode.title;
  const dek = read.dek || '';
  const episodePage = publicPath(episode.path || `/${collection}/${episode.slug}/`);
  const transcriptPage = publicPath(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`);
  const dataUrl = publicPath(episode.data_url || sourceDataPath(episode));
  const sourceTitle = episode.title || read.source_title || title;
  const sourceUrl = episode.source_url || '';
  const lines = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(dek || read.thesis || title)}`,
    `source_title: ${yamlString(sourceTitle)}`,
    `published_at: ${yamlString(episode.published_at || '')}`,
    `source_class: ${yamlString(kind)}`,
    `public_url: ${yamlString(episodePage)}`,
    `transcript_url: ${yamlString(transcriptPage)}`,
    `data_url: ${yamlString(dataUrl)}`,
    `source_url: ${yamlString(sourceUrl)}`,
    '---',
    '',
    `# ${title}`,
    '',
  ];

  if (dek) lines.push(`> ${dek}`, '');

  lines.push(
    `- Source: ${sourceUrl ? markdownLink(sourceTitle, sourceUrl) : sourceTitle}`,
    `- Published: ${episode.date_label || episode.published_at || 'unknown'}`,
    `- Human ${kind} page: ${markdownLink(`/${collection}/${episode.slug}/`, episodePage)}`,
    `- Transcript page: ${markdownLink(`/${collection}/${episode.slug}/transcript/`, transcriptPage)}`,
    `- ${kindTitle} JSON with transcript segments: ${markdownLink(sourceDataPath(episode), dataUrl)}`,
    '',
  );

  if (read.thesis) {
    lines.push('## Thesis', '', markdownText(read.thesis), '');
  }

  if (read.opening?.text) {
    lines.push(`## ${read.opening.heading || 'Core Reading'}`, '', markdownText(read.opening.text) + renderRefsBlock(read.opening.refs, episode), '');
  }

  if (read.beats?.length) {
    lines.push(`## In This ${kindTitle}`, '');
    for (const beat of read.beats) {
      const timeLabel = beat.time_range || (Number.isFinite(Number(beat.start)) ? beat.start : '');
      const firstRefSegment = refSegmentMap(episode).get((beat.refs ?? [])[0]);
      const href = firstRefSegment?.video_url || firstRefSegment?.transcript_url || '';
      lines.push(`- ${href ? markdownLink(timeLabel || 'source', publicPath(href)) : timeLabel} - ${beat.heading || beat.id}${beat.summary ? `: ${beat.summary}` : ''}`);
    }
    lines.push('');

    lines.push('## Reading', '');
    for (const beat of read.beats) {
      lines.push(`### ${beat.heading || beat.id}`, '');
      if (beat.time_range || beat.summary) {
        if (beat.time_range) lines.push(`Time: ${beat.time_range}`);
        if (beat.summary) lines.push(`Summary: ${beat.summary}`);
        lines.push('');
      }
      const paragraphs = renderParagraphs(beat.paragraphs ?? [], episode);
      if (paragraphs) lines.push(paragraphs, '');
      if (!paragraphs) lines.push(renderRefsBlock(beat.refs, episode).trim(), '');
    }
  }

  if (read.questions?.length) {
    lines.push('## Questions', '');
    for (const question of read.questions) {
      lines.push(`### ${question.question || question.id}`, '');
      if (question.answer) lines.push(markdownText(question.answer), '');
      const answerParagraphs = renderParagraphs(question.answer_paragraphs ?? [], episode);
      if (answerParagraphs && answerParagraphs !== markdownText(question.answer)) lines.push(answerParagraphs, '');
      const refs = [...(question.refs ?? []), ...(question.answer_refs ?? [])];
      const refsBlock = renderRefsBlock(refs, episode).trim();
      if (refsBlock) lines.push(refsBlock, '');
    }
  }

  if (read.source_notes?.length) {
    lines.push('## Source Notes', '');
    for (const note of read.source_notes) {
      const noteText = typeof note === 'string' ? note : note.text;
      if (!noteText) continue;
      lines.push(`- ${markdownText(noteText)}${renderRefsBlock(note.refs, episode)}`, '');
    }
  }

  lines.push(
    '## Retrieval Notes',
    '',
    'This Markdown file is the compressed public reading. It intentionally does not contain the full transcript.',
    '',
    `For exact wording, timestamps, timed chunks, transcript segment IDs, and source refs, fetch ${markdownLink(sourceDataPath(episode), dataUrl)}.`,
    '',
  );

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function renderEpisodeIndexMarkdown(index) {
  const collection = index.collection === 'interviews' ? 'interviews' : 'episodes';
  const kind = sourceKind(collection);
  const kindTitle = kind[0].toUpperCase() + kind.slice(1);
  const sources = index[collection] ?? index.items ?? index.episodes ?? index.interviews ?? [];
  const lines = [
    '---',
    `title: "Jiang Lens ${kindTitle} Index"`,
    `description: "Agent-readable Markdown catalog of Jiang Lens ${kind} readings."`,
    `generated_at: ${yamlString(index.generated_at || '')}`,
    '---',
    '',
    `# Jiang Lens ${kindTitle} Index`,
    '',
    `This is the agent-readable catalog of public ${kind} readings. Use each ${kind} Markdown file for the compressed reading and each ${kind} JSON file for exact transcript segments, timestamps, source refs, and video links.`,
    '',
    `${kindTitle}s indexed: ${sources.length}`,
    '',
    `## ${kindTitle}s`,
    '',
  ];

  for (const episode of sources) {
    const episodeMd = publicPath(episode.markdown_path || sourceMarkdownPath(episode));
    const episodePage = publicPath(episode.path || `/${collection}/${episode.slug}/`);
    const transcriptPage = publicPath(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`);
    const dataUrl = publicPath(episode.data_url || sourceDataPath(episode));

    lines.push(
      `### ${episode.title}`,
      '',
      `- Date: ${episode.date_label || episode.published_at || 'unknown'}`,
      `- Source: ${episode.source_url ? markdownLink(episode.source_title || episode.title, episode.source_url) : (episode.source_title || episode.title)}`,
      `- ${kindTitle} Markdown: ${markdownLink(sourceMarkdownPath(episode), episodeMd)}`,
      `- Human page: ${markdownLink(episode.path || `/${collection}/${episode.slug}/`, episodePage)}`,
      `- Transcript page: ${markdownLink(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`, transcriptPage)}`,
      `- ${kindTitle} JSON: ${markdownLink(episode.data_url || sourceDataPath(episode), dataUrl)}`,
    );

    if (episode.dek) lines.push(`- Summary: ${episode.dek}`);
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

async function generateSourceMarkdown(collection) {
  const dataRootForCollection = collection === 'interviews' ? interviewDataRoot : episodeDataRoot;
  const markdownOutRoot = collection === 'interviews' ? interviewMarkdownOutRoot : episodeMarkdownOutRoot;
  const indexPath = path.join(dataRootForCollection, 'index.json');
  if (!existsSync(indexPath)) return null;

  await mkdir(markdownOutRoot, { recursive: true });
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const episodeIndexMarkdown = renderEpisodeIndexMarkdown(index);
  await writeFile(path.join(markdownOutRoot, 'index.md'), episodeIndexMarkdown);

  const sources = index[collection] ?? index.items ?? [];
  for (const episodeSummary of sources) {
    const episodePath = path.join(dataRootForCollection, `${episodeSummary.slug}.json`);
    if (!existsSync(episodePath)) continue;
    const episode = JSON.parse(await readFile(episodePath, 'utf8'));
    await writeFile(path.join(markdownOutRoot, `${episode.slug}.md`), renderEpisodeMarkdown(episode));
  }

  return {
    count: sources.length,
    markdown: episodeIndexMarkdown,
  };
}

async function copyDocs(files) {
  for (const filePath of files) {
    const slug = docSlug(filePath);
    if (!slug) continue;

    const outPath = path.join(docsOutRoot, `${slug}.md`);
    const content = await readFile(filePath, 'utf8');
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, transformPublicMarkdown(content, { mode: 'doc' }));
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

let cachedSourceRefIndex = null;

function sourceRefIndex() {
  if (cachedSourceRefIndex) return cachedSourceRefIndex;
  const input = path.join(dataRoot, 'link-index.json');
  if (!existsSync(input)) {
    cachedSourceRefIndex = new Map();
    return cachedSourceRefIndex;
  }
  const parsed = JSON.parse(readFileSync(input, 'utf8'));
  cachedSourceRefIndex = new Map((parsed.source_refs ?? []).map((detail) => [detail.ref, detail]));
  return cachedSourceRefIndex;
}

function internalMarkdownHref(href) {
  if (!href || /^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) return href;
  if (!href.startsWith('/')) return href;

  const [pathname, suffix = ''] = href.split(/(?=[?#])/);
  if (pathname === '/episodes/') return urlFor('/episodes/index.md') + suffix;
  if (pathname === '/interviews/') return urlFor('/interviews/index.md') + suffix;

  const episodeMatch = pathname.match(/^\/episodes\/([^/]+)\/$/);
  if (episodeMatch) return urlFor(`/episodes/${episodeMatch[1]}.md`) + suffix;

  const interviewMatch = pathname.match(/^\/interviews\/([^/]+)\/$/);
  if (interviewMatch) return urlFor(`/interviews/${interviewMatch[1]}.md`) + suffix;

  if (pathname.startsWith('/episodes/') || pathname.startsWith('/interviews/') || pathname.startsWith('/data/')) {
    return urlFor(pathname) + suffix;
  }

  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (normalized === '/lens') return urlFor('/docs/lens.md') + suffix;

  if (normalized.startsWith('/lens/')) {
    return urlFor(`/docs${normalized}.md`) + suffix;
  }

  const docsSlugs = new Set([
    'introduction',
    'is-professor-jiang-legit',
    'professor-jiang-predictions',
    'professor-jiang-transcripts',
    'use-with-your-agent',
    'what-is-predictive-history',
    'who-is-jiang-xueqin',
  ]);
  const slug = normalized.slice(1);
  if (docsSlugs.has(slug)) return urlFor(`/docs/${slug}.md`) + suffix;

  return urlFor(pathname) + suffix;
}

function evidenceForRefs(refs) {
  const refIndex = sourceRefIndex();
  const refsList = [...new Set(splitRefs(refs))];
  if (!refsList.length) return '';

  return refsList.map((ref) => {
    const detail = refIndex.get(ref);
    if (!detail?.valid) return `\`${ref}\``;

    const transcriptUrl = publicPath(detail.transcript_url);
    const videoUrl = detail.video_url || '';
    const label = [detail.time_label, detail.segment_id].filter(Boolean).join(' ');
    return `${markdownLink(label || ref, transcriptUrl)}${videoUrl ? ` (${markdownLink('video', videoUrl)})` : ''} \`${ref}\``;
  }).join('; ');
}

function splitRefs(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function transformEvidenceMarks(content) {
  return content.replace(/\[([^\]\n]+)\]\{evidence=(?:"|“)([^"”]+)(?:"|”)\}/g, (_match, label, refs) => {
    const firstDetail = sourceRefIndex().get(splitRefs(refs)[0]);
    const labelHref = firstDetail?.transcript_url ? publicPath(firstDetail.transcript_url) : '';
    const evidence = evidenceForRefs(refs);
    const linkedLabel = labelHref ? markdownLink(label, labelHref) : label;
    return evidence ? `${linkedLabel} {source: ${evidence}}` : linkedLabel;
  });
}

function transformLensPointComments(content) {
  return content.replace(/<!--\s*lens-point\s+([^>]*?)\s*-->/g, (_match, rawAttrs) => {
    const attrs = parseAttrs(rawAttrs);
    const id = attrs.id ? `lens-point:${attrs.id}` : '';
    const concept = attrs.concept ? ` concept: \`${attrs.concept}\`` : '';
    const title = attrs.title ? ` title: ${attrs.title}` : '';
    const evidence = evidenceForRefs(attrs.evidence);
    const evidenceText = evidence ? ` Evidence: ${evidence}` : '';
    return `> Lens point: \`${id}\`${concept}${title}.${evidenceText}`;
  });
}

function transformMarkdownLinks(content) {
  return content.replace(/\[([^\]\n]+)\]\((\/[^)\s]+)\)/g, (_match, label, href) => {
    return markdownLink(label, internalMarkdownHref(href));
  });
}

function transformPublicMarkdown(content) {
  return [
    transformMarkdownLinks,
    transformEvidenceMarks,
    transformLensPointComments,
  ].reduce((current, transform) => transform(current), content);
}

async function main() {
  if (!existsSync(distRoot)) {
    throw new Error('Missing website/dist. Run astro build before generating llms files.');
  }

  const files = (await walk(docsRoot)).sort();
  await copyDocs(files);
  await copyData();
  const episodeMarkdown = await generateSourceMarkdown('episodes');
  const interviewMarkdown = await generateSourceMarkdown('interviews');

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
    `- [Episode Markdown index](${urlFor(siteConfig.paths.episodeIndexMarkdown)})`,
    `- [Episode JSON index](${urlFor(siteConfig.paths.episodeIndexJson)})`,
    `- [Interviews](${urlFor(siteConfig.paths.interviews)})`,
    `- [Interview Markdown index](${urlFor(siteConfig.paths.interviewIndexMarkdown)})`,
    `- [Interview JSON index](${urlFor(siteConfig.paths.interviewIndexJson)})`,
    `- [Transcript search JSON](${urlFor(siteConfig.paths.transcriptSearchJson)})`,
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
    const publicContent = transformPublicMarkdown(content);
    const metadata = extractFrontmatter(content);
    const slug = docSlug(filePath);
    if (!slug) continue;

    const title = metadata.title || slug;
    indexLines.push(`- [${title}](${urlFor(`/docs/${slug}.md`)})`);
    fullLines.push('---', '', `# ${title}`, '', withoutFrontmatter(publicContent), '');
  }

  if (existsSync(publicSkillPath)) {
    const skill = await readFile(publicSkillPath, 'utf8');
    fullLines.push('---', '', '# Jiang Lens Skill', '', withoutFrontmatter(skill), '');
  }

  if (episodeMarkdown?.markdown) {
    fullLines.push('---', '', '# Generated Episode Markdown Index', '', withoutFrontmatter(episodeMarkdown.markdown), '');
  }

  if (interviewMarkdown?.markdown) {
    fullLines.push('---', '', '# Generated Interview Markdown Index', '', withoutFrontmatter(interviewMarkdown.markdown), '');
  }

  fullLines.push(
    '---',
    '',
    '# Generated Transcript Search JSON',
    '',
    `Fetch ${urlFor(siteConfig.paths.transcriptSearchJson)} for full-text transcript segment lookup. It is linked here rather than embedded so llms-full remains compact.`,
    '',
  );

  for (const [title, input] of [
    ['manifest.json', path.join(dataRoot, 'manifest.json')],
    ['link-index.json', path.join(dataRoot, 'link-index.json')],
    ['episodes/index.json', path.join(episodeDataRoot, 'index.json')],
    ['interviews/index.json', path.join(interviewDataRoot, 'index.json')],
  ]) {
    if (!existsSync(input)) continue;

    const json = await readFile(input, 'utf8');
    fullLines.push('---', '', `# Generated ${title}`, '', '```json', json.trim(), '```', '');
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

  console.log(`Generated llms.txt, llms-full.txt, ${files.length} raw docs, ${episodeMarkdown?.count ?? 0} episode Markdown files, ${interviewMarkdown?.count ?? 0} interview Markdown files, and public lens JSON.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
