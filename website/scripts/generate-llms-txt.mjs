#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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
const topicOutRoot = path.join(distRoot, 'topics');
const topicIndexOutRoot = path.join(topicOutRoot, 'index');
const publicSkillPath = path.join(websiteRoot, 'public/skill.md');
const origin = configuredOrigin();
const basePath = configuredBasePath();

const topicStopwords = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

const weakAliasWords = new Set([
  'agency',
  'america',
  'authority',
  'capital',
  'church',
  'control',
  'empire',
  'history',
  'machine',
  'model',
  'nation',
  'power',
  'religion',
  'revolution',
  'society',
  'state',
  'technology',
  'war',
  'world',
]);

const topicSemanticFields = [
  'claims',
  'models',
  'diagnoses',
  'other_claims',
  'predictions',
];

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

function compactText(value) {
  return markdownText(value).replace(/\s+/g, ' ').trim();
}

function wordExcerpt(value, maxWords = 22) {
  const words = compactText(value).split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const excerpt = words.slice(0, maxWords).join(' ');
  return words.length > maxWords ? `${excerpt}...` : excerpt;
}

function quotedExcerpt(value, maxWords = 22) {
  return wordExcerpt(value, maxWords).replace(/"/g, "'");
}

function normalizedSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentenceExcerpt(value, maxWords = 28) {
  const text = compactText(value);
  if (!text) return '';
  const sentence = text.match(/.*?[.!?](?:\s|$)/)?.[0]?.trim() || text;
  return wordExcerpt(sentence, maxWords);
}

function topicSlug(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]s\b/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function topicLabelFromSlug(slug) {
  return String(slug ?? '')
    .split('-')
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && /^[a-z]+$/.test(word)) return word.toUpperCase();
      return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
    })
    .join(' ');
}

function singularSlug(slug) {
  const parts = String(slug ?? '').split('-').filter(Boolean);
  if (!parts.length) return '';
  const last = parts[parts.length - 1];
  if (last.endsWith('ies') && last.length > 4) parts[parts.length - 1] = `${last.slice(0, -3)}y`;
  else if (last.endsWith('s') && !last.endsWith('ss') && last.length > 3) parts[parts.length - 1] = last.slice(0, -1);
  return parts.join('-');
}

function pluralSlug(slug) {
  const parts = String(slug ?? '').split('-').filter(Boolean);
  if (!parts.length) return '';
  const last = parts[parts.length - 1];
  if (last.endsWith('s')) return parts.join('-');
  if (last.endsWith('y') && last.length > 3) parts[parts.length - 1] = `${last.slice(0, -1)}ies`;
  else parts[parts.length - 1] = `${last}s`;
  return parts.join('-');
}

function topicAliasSlugs(value, options = {}) {
  const canonical = topicSlug(value);
  if (!canonical) return [];

  const aliases = new Set([
    canonical,
    singularSlug(canonical),
    pluralSlug(canonical),
  ].filter(Boolean));

  const words = canonical.split('-').filter(Boolean);
  if (words.length > 1) {
    const withoutStopwords = words.filter((word) => !topicStopwords.has(word));
    if (withoutStopwords.length && withoutStopwords.length !== words.length) {
      const compact = withoutStopwords.join('-');
      aliases.add(compact);
      aliases.add(singularSlug(compact));
      aliases.add(pluralSlug(compact));
    }

    const lastWord = words.at(-1);
    if (options.allowTailAlias && lastWord && lastWord.length >= 5 && !weakAliasWords.has(lastWord)) {
      aliases.add(lastWord);
      aliases.add(singularSlug(lastWord));
      aliases.add(pluralSlug(lastWord));
    }
  }

  return [...aliases].filter((alias) => alias && alias.length >= 3);
}

function aliasSearchText(slug) {
  return normalizedSearchText(String(slug ?? '').replace(/-/g, ' '));
}

function excerptAroundAlias(text, aliases, maxWords = 24) {
  const words = compactText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return '';

  const normalizedWords = words.map((word) => topicSlug(word));
  const aliasWordLists = aliases
    .map((alias) => alias.split('-').filter(Boolean))
    .filter((parts) => parts.length);

  let matchIndex = -1;
  let matchLength = 1;
  for (let index = 0; index < normalizedWords.length; index += 1) {
    const found = aliasWordLists.find((parts) => {
      return parts.every((part, offset) => normalizedWords[index + offset] === part);
    });
    if (found) {
      matchIndex = index;
      matchLength = found.length;
      break;
    }
  }

  if (matchIndex < 0) return wordExcerpt(text, maxWords);

  const before = Math.max(0, Math.floor((maxWords - matchLength) / 2));
  const start = Math.max(0, matchIndex - before);
  const end = Math.min(words.length, start + maxWords);
  const excerpt = words.slice(start, end).join(' ');
  const prefix = start > 0 ? '...' : '';
  const suffix = end < words.length ? '...' : '';
  return `${prefix}${excerpt}${suffix}`.replace(/"/g, "'");
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPlainArtifactHtml({ title, description, canonicalPath, body, alternates = [] }) {
  const canonicalUrl = publicPath(canonicalPath);
  const alternateLinks = alternates
    .filter((alternate) => alternate?.path)
    .map((alternate) => {
      const href = publicPath(alternate.path);
      const titleAttr = alternate.title ? ` title="${escapeHtml(alternate.title)}"` : '';
      return `    <link rel="alternate" type="${escapeHtml(alternate.type)}" href="${escapeHtml(href)}"${titleAttr}>`;
    });
  const bodyLinks = alternates
    .filter((alternate) => alternate?.path)
    .map((alternate) => {
      const href = publicPath(alternate.path);
      return `<a href="${escapeHtml(href)}">${escapeHtml(alternate.title || alternate.path)}</a>`;
    })
    .join('\n        ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
${alternateLinks.join('\n')}
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: Canvas; color: CanvasText; }
      main { width: min(100% - 32px, 1040px); margin: 0 auto; padding: 32px 0 56px; }
      h1 { margin: 0 0 8px; font-size: clamp(1.7rem, 2vw, 2.2rem); line-height: 1.1; letter-spacing: 0; }
      p { max-width: 72ch; line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
      a { color: LinkText; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); padding: 20px; border-radius: 8px; line-height: 1.5; background: color-mix(in srgb, CanvasText 4%, Canvas); }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${bodyLinks ? `<nav aria-label="Alternate formats">
        ${bodyLinks}
      </nav>` : ''}
      <pre>${escapeHtml(body)}</pre>
    </main>
  </body>
</html>
`;
}

function collectionForSource(source) {
  return source.collection === 'interviews' ? 'interviews' : 'episodes';
}

function sourceKind(collection) {
  return collection === 'interviews' ? 'interview' : 'episode';
}

function sourceMarkdownPath(sourceOrSlug, collection = 'episodes') {
  return sourceArtifactPath(sourceOrSlug, collection, 'md');
}

function sourceTextPath(sourceOrSlug, collection = 'episodes') {
  return sourceArtifactPath(sourceOrSlug, collection, 'txt');
}

function sourceArtifactPath(sourceOrSlug, collection = 'episodes', extension = 'md') {
  const slug = typeof sourceOrSlug === 'string' ? sourceOrSlug : sourceOrSlug.slug;
  const sourceCollection = typeof sourceOrSlug === 'string' ? collection : collectionForSource(sourceOrSlug);
  const ext = extension === 'txt' ? 'txt' : 'md';
  return `/${sourceCollection}/${slug}.${ext}`;
}

function sourceTranscriptMarkdownPath(sourceOrSlug, collection = 'episodes') {
  return sourceTranscriptArtifactPath(sourceOrSlug, collection, 'md');
}

function sourceTranscriptTextPath(sourceOrSlug, collection = 'episodes') {
  return sourceTranscriptArtifactPath(sourceOrSlug, collection, 'txt');
}

function sourceTranscriptArtifactPath(sourceOrSlug, collection = 'episodes', extension = 'md') {
  const slug = typeof sourceOrSlug === 'string' ? sourceOrSlug : sourceOrSlug.slug;
  const sourceCollection = typeof sourceOrSlug === 'string' ? collection : collectionForSource(sourceOrSlug);
  const ext = extension === 'txt' ? 'txt' : 'md';
  return `/${sourceCollection}/${slug}/transcript.${ext}`;
}

function sourceDataPath(sourceOrSlug, collection = 'episodes') {
  const slug = typeof sourceOrSlug === 'string' ? sourceOrSlug : sourceOrSlug.slug;
  const sourceCollection = typeof sourceOrSlug === 'string' ? collection : collectionForSource(sourceOrSlug);
  return `/data/lens/${sourceCollection}/${slug}.json`;
}

function timestampedUrl(sourceUrl, start) {
  if (!sourceUrl || !Number.isFinite(Number(start))) return sourceUrl || '';

  try {
    const url = new URL(sourceUrl);
    url.searchParams.set('t', `${Math.max(0, Math.floor(Number(start)))}s`);
    return url.toString();
  } catch {
    return sourceUrl;
  }
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

function transcriptBasePath(episode) {
  const collection = collectionForSource(episode);
  return episode.transcript_path || `/${collection}/${episode.slug}/transcript/`;
}

function chunkForQuote(segment, quote) {
  const quoteNeedle = normalizedSearchText(quote);
  if (!quoteNeedle) return null;

  return (segment?.timed_chunks ?? []).find((chunk) => {
    const chunkText = normalizedSearchText(chunk.text);
    return chunkText && (chunkText.includes(quoteNeedle) || quoteNeedle.includes(chunkText));
  }) || null;
}

function transcriptAnchorUrl(episode, segment, quote = '') {
  const chunk = chunkForQuote(segment, quote);
  const anchor = chunk?.id || segment?.id;
  const base = transcriptBasePath(episode);
  return publicPath(anchor ? `${base}#${anchor}` : base);
}

function videoAnchorUrl(episode, segment, quote = '') {
  const chunk = chunkForQuote(segment, quote);
  if (chunk) return timestampedUrl(episode.source_url, chunk.start);
  return segment?.video_url || timestampedUrl(episode.source_url, segment?.start);
}

function relatedLinksForRef(ref, extension = 'txt') {
  const detail = sourceRefIndex().get(ref);
  const candidates = [];

  for (const point of detail?.lens_points ?? []) {
    candidates.push({
      label: point.doc_title || point.concept || point.id,
      href: point.url,
    });
  }

  for (const doc of detail?.docs ?? []) {
    candidates.push({
      label: doc.doc_title || doc.doc_slug || doc.text,
      href: doc.doc_url,
    });
  }

  const seen = new Set();
  return candidates
    .map((item) => ({
      label: item.label,
      href: item.href ? internalArtifactHref(item.href, extension) : '',
    }))
    .filter((item) => item.label && item.href)
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    })
    .slice(0, 3);
}

function evidenceCardFromRef(episode, ref, context, options = {}) {
  const segment = refSegmentMap(episode).get(ref);
  if (!segment) return null;

  const quote = options.quote ? quotedExcerpt(options.quote, 22) : quotedExcerpt(segment.text, 22);
  if (!quote) return null;

  const extension = options.extension || 'txt';
  const transcriptUrl = transcriptAnchorUrl(episode, segment, quote);
  const videoUrl = videoAnchorUrl(episode, segment, quote);
  const related = relatedLinksForRef(ref, extension);

  return {
    key: `${ref}:${quote}`,
    context: context || 'Source-backed reading point',
    quote,
    timeLabel: segment.time_label || segment.id,
    segmentId: segment.id,
    transcriptUrl,
    videoUrl,
    ref,
    related,
  };
}

function addEvidenceCard(cards, seen, card) {
  if (!card || seen.has(card.key)) return;
  seen.add(card.key);
  cards.push(card);
}

function collectEpisodeEvidenceCards(episode, options = {}) {
  const read = episode.read ?? {};
  const extension = options.extension || 'txt';
  const cards = [];
  const seen = new Set();
  const limit = options.limit ?? 12;

  function addFromRefs(refs, context) {
    for (const ref of refs ?? []) {
      addEvidenceCard(cards, seen, evidenceCardFromRef(episode, ref, context, { extension }));
      if (cards.length >= limit) return;
    }
  }

  function addFromMarks(marks, context) {
    for (const mark of marks ?? []) {
      const ref = (mark.refs ?? [])[0];
      addEvidenceCard(cards, seen, evidenceCardFromRef(episode, ref, context, { quote: mark.text, extension }));
      if (cards.length >= limit) return;
    }
  }

  const openingContext = read.opening?.heading || 'Core reading';
  addFromMarks(read.opening?.marks, openingContext);
  if (cards.length < limit) addFromRefs((read.opening?.refs ?? []).slice(0, 2), openingContext);

  for (const beat of read.beats ?? []) {
    if (cards.length >= limit) break;
    const beatContext = [beat.heading || beat.id, beat.summary].filter(Boolean).join(': ');
    addFromMarks(beat.marks, beatContext);
    if (cards.length >= limit) break;

    for (const paragraph of beat.paragraphs ?? []) {
      if (cards.length >= limit) break;
      const paragraphContext = [beat.heading || beat.id, firstSentenceExcerpt(paragraph.text)].filter(Boolean).join(': ');
      addFromMarks(paragraph.marks, paragraphContext);
      if (cards.length >= limit) break;
      addFromRefs((paragraph.refs ?? []).slice(0, 1), paragraphContext);
    }

    if (cards.length < limit) addFromRefs((beat.refs ?? []).slice(0, 1), beatContext);
  }

  return cards;
}

function renderEvidenceCards(episode, options = {}) {
  const extension = options.extension || 'txt';
  const cards = collectEpisodeEvidenceCards(episode, { extension });
  if (!cards.length) return '';

  const collection = collectionForSource(episode);
  const episodeArtifactUrl = publicPath(sourceArtifactPath(episode, collection, extension));
  const lines = [
    '## Quotable Evidence From This Reading',
    '',
    'These cards connect the compressed reading to exact source coordinates. Use the summary and related lens links as the interpretive map; use the transcript and video links when quoting or attributing claims to Jiang.',
    '',
  ];

  for (const [index, card] of cards.entries()) {
    lines.push(
      `${index + 1}. ${card.context}`,
      `   Quote: "${card.quote}"`,
      `   Transcript: ${markdownLink(`${card.timeLabel} ${card.segmentId}`, card.transcriptUrl)}`,
    );
    if (card.videoUrl) lines.push(`   Video: ${markdownLink(card.videoUrl, card.videoUrl)}`);
    lines.push(`   Source ref: \`${card.ref}\``);
    lines.push(`   Episode reading: ${markdownLink(sourceArtifactPath(episode, collection, extension), episodeArtifactUrl)}`);
    if (card.related.length) {
      lines.push(`   Related lens: ${card.related.map((item) => markdownLink(item.label, item.href)).join('; ')}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function renderEpisodeMarkdown(episode, options = {}) {
  const read = episode.read ?? {};
  const collection = collectionForSource(episode);
  const kind = sourceKind(collection);
  const kindTitle = kind[0].toUpperCase() + kind.slice(1);
  const extension = options.extension || 'md';
  const title = read.title || episode.title;
  const dek = read.dek || '';
  const episodePage = publicPath(episode.path || `/${collection}/${episode.slug}/`);
  const transcriptPage = publicPath(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`);
  const dataUrl = publicPath(episode.data_url || sourceDataPath(episode));
  const markdownUrl = publicPath(sourceMarkdownPath(episode));
  const textUrl = publicPath(sourceTextPath(episode));
  const transcriptMarkdownUrl = publicPath(sourceTranscriptMarkdownPath(episode));
  const transcriptTextUrl = publicPath(sourceTranscriptTextPath(episode));
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
    `markdown_url: ${yamlString(markdownUrl)}`,
    `text_url: ${yamlString(textUrl)}`,
    `transcript_url: ${yamlString(transcriptPage)}`,
    `transcript_markdown_url: ${yamlString(transcriptMarkdownUrl)}`,
    `transcript_text_url: ${yamlString(transcriptTextUrl)}`,
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
    `- ${kindTitle} Markdown: ${markdownLink(sourceMarkdownPath(episode), markdownUrl)}`,
    `- ${kindTitle} text: ${markdownLink(sourceTextPath(episode), textUrl)}`,
    `- Transcript page: ${markdownLink(`/${collection}/${episode.slug}/transcript/`, transcriptPage)}`,
    `- Transcript Markdown: ${markdownLink(sourceTranscriptMarkdownPath(episode), transcriptMarkdownUrl)}`,
    `- Transcript text: ${markdownLink(sourceTranscriptTextPath(episode), transcriptTextUrl)}`,
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

    const evidenceCards = renderEvidenceCards(episode, { extension });
    if (evidenceCards) lines.push(evidenceCards, '');

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

function renderTranscriptMarkdown(episode) {
  const collection = collectionForSource(episode);
  const kind = sourceKind(collection);
  const kindTitle = kind[0].toUpperCase() + kind.slice(1);
  const title = `${episode.title} transcript`;
  const transcriptPage = publicPath(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`);
  const sourcePage = publicPath(episode.path || `/${collection}/${episode.slug}/`);
  const markdownUrl = publicPath(sourceTranscriptMarkdownPath(episode));
  const textUrl = publicPath(sourceTranscriptTextPath(episode));
  const dataUrl = publicPath(episode.data_url || sourceDataPath(episode));
  const sourceTitle = episode.title || title;
  const lines = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(`Source-synced transcript archive for ${episode.title}.`)}`,
    `source_title: ${yamlString(sourceTitle)}`,
    `published_at: ${yamlString(episode.published_at || '')}`,
    `source_class: ${yamlString(kind)}`,
    `public_url: ${yamlString(transcriptPage)}`,
    `markdown_url: ${yamlString(markdownUrl)}`,
    `text_url: ${yamlString(textUrl)}`,
    `source_url: ${yamlString(episode.source_url || '')}`,
    `data_url: ${yamlString(dataUrl)}`,
    '---',
    '',
    `# ${title}`,
    '',
    `- Source: ${episode.source_url ? markdownLink(sourceTitle, episode.source_url) : sourceTitle}`,
    `- Published: ${episode.date_label || episode.published_at || 'unknown'}`,
    `- Human transcript page: ${markdownLink(`/${collection}/${episode.slug}/transcript/`, transcriptPage)}`,
    `- ${kindTitle} page: ${markdownLink(`/${collection}/${episode.slug}/`, sourcePage)}`,
    `- Transcript Markdown: ${markdownLink(sourceTranscriptMarkdownPath(episode), markdownUrl)}`,
    `- Transcript text: ${markdownLink(sourceTranscriptTextPath(episode), textUrl)}`,
    `- ${kindTitle} JSON: ${markdownLink(sourceDataPath(episode), dataUrl)}`,
    '',
    '## Transcript',
    '',
  ];

  for (const segment of episode.transcript ?? []) {
    const text = markdownText(segment.text || (segment.timed_chunks ?? []).map((chunk) => chunk.text).filter(Boolean).join(' '));
    if (!text) continue;

    const segmentUrl = publicPath(segment.transcript_url || `/${collection}/${episode.slug}/transcript/#${segment.id}`);
    const headingParts = [segment.time_label, segment.id].filter(Boolean);
    lines.push(`### ${headingParts.join(' ') || segment.id}`, '');
    if (segment.speaker) lines.push(`- Speaker: ${segment.speaker}`);
    if (segment.source_ref) lines.push(`- Source ref: \`${segment.source_ref}\``);
    lines.push(`- Transcript segment: ${markdownLink(segmentUrl, segmentUrl)}`);
    if (segment.video_url) lines.push(`- Video timestamp: ${markdownLink(segment.video_url, segment.video_url)}`);
    lines.push('', text, '');
  }

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
    `This is the agent-readable catalog of public ${kind} readings. Use each ${kind} text or Markdown file as the compressed interpretive map, then use its source refs, transcript links, and ${kind} JSON file for exact transcript segments, timestamps, source refs, and video links.`,
    '',
    `${kindTitle}s indexed: ${sources.length}`,
    '',
    `## ${kindTitle}s`,
    '',
  ];

  for (const episode of sources) {
    const episodeMd = publicPath(episode.markdown_path || sourceMarkdownPath(episode));
    const episodeTxt = publicPath(episode.text_path || sourceTextPath(episode));
    const transcriptMd = publicPath(episode.transcript_markdown_path || sourceTranscriptMarkdownPath(episode));
    const transcriptTxt = publicPath(episode.transcript_text_path || sourceTranscriptTextPath(episode));
    const episodePage = publicPath(episode.path || `/${collection}/${episode.slug}/`);
    const transcriptPage = publicPath(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`);
    const dataUrl = publicPath(episode.data_url || sourceDataPath(episode));

    lines.push(
      `### ${episode.title}`,
      '',
      `- Date: ${episode.date_label || episode.published_at || 'unknown'}`,
      `- Source: ${episode.source_url ? markdownLink(episode.source_title || episode.title, episode.source_url) : (episode.source_title || episode.title)}`,
      `- ${kindTitle} Markdown: ${markdownLink(sourceMarkdownPath(episode), episodeMd)}`,
      `- ${kindTitle} text: ${markdownLink(sourceTextPath(episode), episodeTxt)}`,
      `- Human page: ${markdownLink(episode.path || `/${collection}/${episode.slug}/`, episodePage)}`,
      `- Transcript page: ${markdownLink(episode.transcript_path || `/${collection}/${episode.slug}/transcript/`, transcriptPage)}`,
      `- Transcript Markdown: ${markdownLink(sourceTranscriptMarkdownPath(episode), transcriptMd)}`,
      `- Transcript text: ${markdownLink(sourceTranscriptTextPath(episode), transcriptTxt)}`,
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
  await writeFile(path.join(markdownOutRoot, 'index.txt'), episodeIndexMarkdown);

  const sources = index[collection] ?? index.items ?? [];
  for (const episodeSummary of sources) {
    const episodePath = path.join(dataRootForCollection, `${episodeSummary.slug}.json`);
    if (!existsSync(episodePath)) continue;
    const episode = JSON.parse(await readFile(episodePath, 'utf8'));
    const episodeMarkdown = renderEpisodeMarkdown(episode, { extension: 'md' });
    const episodeText = renderEpisodeMarkdown(episode, { extension: 'txt' });
    await writeFile(path.join(markdownOutRoot, `${episode.slug}.md`), episodeMarkdown);
    await writeFile(path.join(markdownOutRoot, `${episode.slug}.txt`), episodeText);

    const transcriptMarkdown = renderTranscriptMarkdown(episode);
    const transcriptOutRoot = path.join(markdownOutRoot, episode.slug);
    await mkdir(transcriptOutRoot, { recursive: true });
    await writeFile(path.join(transcriptOutRoot, 'transcript.md'), transcriptMarkdown);
    await writeFile(path.join(transcriptOutRoot, 'transcript.txt'), transcriptMarkdown);
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

    const markdownOutPath = path.join(docsOutRoot, `${slug}.md`);
    const textOutPath = path.join(docsOutRoot, `${slug}.txt`);
    const content = await readFile(filePath, 'utf8');
    await mkdir(path.dirname(markdownOutPath), { recursive: true });
    await writeFile(markdownOutPath, transformPublicMarkdown(content, { mode: 'doc', extension: 'md' }));
    await writeFile(textOutPath, transformPublicMarkdown(content, { mode: 'doc', extension: 'txt' }));
  }
}

async function copySkillText() {
  if (!existsSync(publicSkillPath)) return false;

  const skill = await readFile(publicSkillPath, 'utf8');
  await writeFile(path.join(distRoot, 'skill.txt'), transformPublicMarkdown(skill, { extension: 'txt' }));
  return true;
}

async function copyData() {
  await mkdir(dataOutRoot, { recursive: true });
  await copyTree(dataRoot, dataOutRoot);
}

async function generateTranscriptSearchText() {
  const input = path.join(dataRoot, 'transcript-search.json');
  if (!existsSync(input)) return null;

  const parsed = JSON.parse(await readFile(input, 'utf8'));
  const segments = parsed.segments ?? parsed.items ?? [];
  const lines = [
    '# Jiang Lens Transcript Search',
    '',
    'Plain-text transcript segment index for agents and readers. Use episode text and lens pages as the interpretive map; use these timestamped transcript records when quoting or attributing claims to Jiang.',
    '',
    `Segments indexed: ${segments.length}`,
    '',
    'Each record includes the source reading, date, transcript anchor, video timestamp, source ref, related episode text, and related lens links when available.',
    '',
  ];

  for (const segment of segments) {
    const collection = segment.collection === 'interviews' ? 'interviews' : 'episodes';
    const sourceClass = sourceKind(collection);
    const transcriptUrl = publicPath(segment.transcript_url);
    const videoUrl = segment.video_url || '';
    const episodeTextUrl = publicPath(sourceTextPath(segment.slug, collection));
    const sourceJsonUrl = publicPath(sourceDataPath(segment.slug, collection));
    const related = relatedLinksForRef(segment.source_ref, 'txt');

    lines.push(
      `## ${segment.title} -- ${segment.time_label || segment.segment_id}`,
      '',
      `- Source title: ${segment.source_title || segment.title}`,
      `- Source class: ${sourceClass}`,
      `- Date: ${segment.date_label || segment.published_at || 'unknown'}`,
      `- Transcript: ${markdownLink(segment.segment_id || transcriptUrl, transcriptUrl)}`,
    );
    if (videoUrl) lines.push(`- Video timestamp: ${markdownLink(videoUrl, videoUrl)}`);
    lines.push(
      `- Source ref: \`${segment.source_ref}\``,
      `- ${sourceClass[0].toUpperCase() + sourceClass.slice(1)} text: ${markdownLink(sourceTextPath(segment.slug, collection), episodeTextUrl)}`,
      `- ${sourceClass[0].toUpperCase() + sourceClass.slice(1)} JSON: ${markdownLink(sourceDataPath(segment.slug, collection), sourceJsonUrl)}`,
    );
    if (related.length) {
      lines.push(`- Related lens: ${related.map((item) => markdownLink(item.label, item.href)).join('; ')}`);
    }
    lines.push('', `Text: ${compactText(segment.text)}`, '');
  }

  await writeFile(path.join(dataOutRoot, 'transcript-search.txt'), `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`);
  return {
    count: segments.length,
  };
}

function newTopic(slug, label) {
  return {
    slug,
    label: label || topicLabelFromSlug(slug),
    aliases: new Set([slug]),
    refs: new Set(),
    sources: new Map(),
    glossary: [],
    glossarySeen: new Set(),
    semanticPoints: [],
    semanticSeen: new Set(),
    transcriptHits: [],
    transcriptRefs: new Set(),
    relatedTopics: new Map(),
  };
}

function ensureTopic(topics, value, options = {}) {
  const slug = topicSlug(value);
  if (!slug || slug.length < 3 || topicStopwords.has(slug)) return null;

  const topic = topics.get(slug) || newTopic(slug, options.label || topicLabelFromSlug(slug));
  if (!topics.has(slug)) topics.set(slug, topic);
  if (options.label && topic.label === topicLabelFromSlug(topic.slug)) topic.label = options.label;

  for (const alias of topicAliasSlugs(value, { allowTailAlias: options.allowTailAlias })) {
    topic.aliases.add(alias);
  }

  return topic;
}

function addTopicSource(topic, source, reason = '') {
  if (!topic || !source?.slug) return;
  const collection = collectionForSource(source);
  const existing = topic.sources.get(source.slug) || {
    slug: source.slug,
    collection,
    title: source.read?.title || source.title,
    sourceTitle: source.title,
    date: source.date_label || source.published_at || 'unknown',
    sourceUrl: source.source_url || '',
    textUrl: publicPath(sourceTextPath(source, collection)),
    markdownUrl: publicPath(sourceMarkdownPath(source, collection)),
    transcriptTextUrl: publicPath(sourceTranscriptTextPath(source, collection)),
    dataUrl: publicPath(sourceDataPath(source, collection)),
    summary: firstSentenceExcerpt(source.read?.dek || source.read?.thesis || source.read?.opening?.text || '', 34),
    reasons: new Set(),
  };
  if (reason) existing.reasons.add(reason);
  topic.sources.set(source.slug, existing);
}

function addTopicRefs(topic, refs) {
  for (const ref of refs ?? []) {
    if (ref) topic.refs.add(ref);
  }
}

function addSemanticPoint(topic, source, item, kind) {
  if (!topic || !item) return;
  const text = compactText(item.claim || item.prediction || item.moment || item.summary || item.definition_or_usage || item.text || '');
  if (!text) return;

  const refs = item.refs ?? [];
  const key = `${text}:${refs.join(',')}`;
  if (topic.semanticSeen.has(key)) return;
  topic.semanticSeen.add(key);
  topic.semanticPoints.push({
    kind,
    text,
    refs,
    confidence: item.confidence || '',
    claimType: item.claim_type || '',
    temporalScope: item.temporal_scope || '',
  });
  addTopicRefs(topic, refs);
  addTopicSource(topic, source, kind);
}

function addGlossaryUsage(topic, source, item) {
  if (!topic || !item?.term) return;
  const usages = (item.usages ?? [item.definition_or_usage]).filter(Boolean).map(compactText).filter(Boolean);
  const key = `${item.term}:${usages.join('|')}:${(item.refs ?? []).join(',')}`;
  if (topic.glossarySeen.has(key)) return;
  topic.glossarySeen.add(key);
  topic.glossary.push({
    term: item.term,
    usages,
    refs: item.refs ?? [],
  });
  addTopicRefs(topic, item.refs);
  addTopicSource(topic, source, 'glossary');
}

function addRelatedTopics(topic, tags) {
  if (!topic) return;
  const current = topic.slug;
  for (const tag of tags ?? []) {
    const slug = topicSlug(tag);
    if (!slug || slug === current) continue;
    topic.relatedTopics.set(slug, topicLabelFromSlug(slug));
  }
}

function sourceHitFromSegment(segment, sourceBySlug) {
  const source = sourceBySlug.get(segment.slug);
  const collection = segment.collection === 'interviews' ? 'interviews' : 'episodes';
  return {
    ref: segment.source_ref,
    slug: segment.slug,
    collection,
    title: segment.title || source?.read?.title || source?.title || segment.slug,
    sourceTitle: segment.source_title || source?.title || '',
    date: segment.date_label || segment.published_at || source?.date_label || source?.published_at || 'unknown',
    transcriptUrl: publicPath(segment.transcript_url),
    videoUrl: segment.video_url || '',
    sourceTextUrl: publicPath(sourceTextPath(segment.slug, collection)),
    sourceJsonUrl: publicPath(sourceDataPath(segment.slug, collection)),
    timeLabel: segment.time_label || segment.segment_id,
    segmentId: segment.segment_id,
    text: compactText(segment.text),
  };
}

function addTopicTranscriptHit(topic, segment, sourceBySlug, reason = 'alias-match', matchedAlias = '') {
  if (!topic || !segment?.source_ref || topic.transcriptRefs.has(segment.source_ref)) return;
  topic.transcriptRefs.add(segment.source_ref);
  const hit = sourceHitFromSegment(segment, sourceBySlug);
  hit.reason = reason;
  hit.matchedAlias = matchedAlias;
  hit.quote = excerptAroundAlias(segment.text, [...topic.aliases], 24);
  hit.related = relatedLinksForRef(segment.source_ref, 'txt');
  topic.transcriptHits.push(hit);
}

async function loadPublicSources(collection) {
  const dataRootForCollection = collection === 'interviews' ? interviewDataRoot : episodeDataRoot;
  const indexPath = path.join(dataRootForCollection, 'index.json');
  if (!existsSync(indexPath)) return [];

  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const summaries = index[collection] ?? index.items ?? [];
  const sources = [];
  for (const summary of summaries) {
    const sourcePath = path.join(dataRootForCollection, `${summary.slug}.json`);
    if (!existsSync(sourcePath)) continue;
    sources.push(JSON.parse(await readFile(sourcePath, 'utf8')));
  }
  return sources;
}

function buildTopicSeedIndex(sources) {
  const topics = new Map();

  for (const source of sources) {
    for (const item of source.glossary_terms ?? []) {
      const topic = ensureTopic(topics, item.term, { label: item.term, allowTailAlias: true });
      addGlossaryUsage(topic, source, item);
    }

    for (const field of topicSemanticFields) {
      for (const item of source[field] ?? []) {
        const tags = item.topic_tags ?? [];
        for (const tag of tags) {
          const topic = ensureTopic(topics, tag, { label: topicLabelFromSlug(tag) });
          addSemanticPoint(topic, source, item, field.replace(/_/g, ' '));
          addRelatedTopics(topic, tags);
        }
      }
    }
  }

  return topics;
}

function buildAliasTargets(topics) {
  const aliases = new Map();
  for (const topic of topics.values()) {
    topic.aliases.add(topic.slug);
    for (const alias of topic.aliases) {
      if (!alias || alias.length < 3 || topicStopwords.has(alias)) continue;
      if (!aliases.has(alias)) aliases.set(alias, new Set());
      aliases.get(alias).add(topic.slug);
    }
  }

  const targets = new Map();
  for (const [alias, slugs] of aliases.entries()) {
    if (slugs.size === 1) targets.set(alias, [...slugs][0]);
  }
  return targets;
}

function rankTopicHit(hit) {
  let score = 0;
  if (hit.reason === 'semantic-ref') score += 100;
  if (hit.matchedAlias && hit.matchedAlias.split('-').length > 1) score += 20;
  if (hit.quote) score += 5;
  return score;
}

function sortedTopicHits(topic) {
  return [...topic.transcriptHits]
    .sort((a, b) => {
      const scoreDelta = rankTopicHit(b) - rankTopicHit(a);
      if (scoreDelta) return scoreDelta;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 12);
}

function renderTopicMarkdown(topic) {
  const hits = sortedTopicHits(topic);
  const sources = [...topic.sources.values()].slice(0, 8);
  const relatedTopicLinks = [...topic.relatedTopics.entries()]
    .filter(([slug]) => slug !== topic.slug)
    .slice(0, 12)
    .map(([slug, label]) => markdownLink(label, publicPath(`/topics/${slug}.txt`)));

  const lines = [
    '---',
    `title: ${yamlString(`Topic: ${topic.label}`)}`,
    `description: ${yamlString(`Generated static Jiang Lens topic dossier for ${topic.label}.`)}`,
    `topic_slug: ${yamlString(topic.slug)}`,
    'generated: "true"',
    '---',
    '',
    `# Topic: ${topic.label}`,
    '',
    'Generated static topic dossier for agents. Use this file as the first retrieval hop for this topic, then follow the cited episode readings and transcript anchors for exact wording.',
    '',
    `Canonical path: ${markdownLink(`/topics/${topic.slug}.txt`, publicPath(`/topics/${topic.slug}.txt`))}`,
  ];

  const aliases = [...topic.aliases].filter((alias) => alias !== topic.slug).sort();
  if (aliases.length) lines.push(`Aliases: ${aliases.slice(0, 18).map((alias) => `\`${alias}\``).join(', ')}`);
  lines.push('');

  if (topic.glossary.length || topic.semanticPoints.length) {
    lines.push('## Generated Answer Map', '');
    for (const item of topic.glossary.slice(0, 4)) {
      const usages = item.usages.length ? item.usages.join(' ') : `Glossary term: ${item.term}.`;
      const refs = refsMarkdown(item.refs, { transcript: [] });
      lines.push(`- ${usages}${refs ? ` Source refs: ${refs}` : ''}`);
    }
    for (const point of topic.semanticPoints.slice(0, 8)) {
      const refs = point.refs.length ? ` Source refs: ${point.refs.map((ref) => `\`${ref}\``).join(', ')}` : '';
      const kind = point.claimType || point.kind;
      lines.push(`- ${kind}: ${point.text}${refs}`);
    }
    lines.push('');
  }

  if (hits.length) {
    lines.push('## Quoted Transcript Hits', '');
    for (const [index, hit] of hits.entries()) {
      lines.push(
        `${index + 1}. **${hit.title}** / ${hit.sourceTitle || hit.slug} -- ${hit.date}`,
        `   Timestamp: ${hit.videoUrl ? markdownLink(hit.timeLabel || hit.segmentId, hit.videoUrl) : (hit.timeLabel || hit.segmentId)} | Transcript: ${markdownLink(hit.segmentId || hit.transcriptUrl, hit.transcriptUrl)}`,
        `   Source ref: \`${hit.ref}\``,
        `   Quote: "${hit.quote}"`,
        `   Reading: ${markdownLink(sourceTextPath(hit.slug, hit.collection), hit.sourceTextUrl)} | JSON: ${markdownLink(sourceDataPath(hit.slug, hit.collection), hit.sourceJsonUrl)}`,
      );
      if (hit.related.length) {
        lines.push(`   Related lens: ${hit.related.map((item) => markdownLink(item.label, item.href)).join('; ')}`);
      }
      lines.push('');
    }
  }

  if (sources.length) {
    lines.push('## Source Readings', '');
    for (const source of sources) {
      const reason = source.reasons.size ? ` (${[...source.reasons].slice(0, 3).join(', ')})` : '';
      lines.push(
        `- ${markdownLink(source.title, source.textUrl)}${reason} -- ${source.date}`,
        `  Source: ${source.sourceUrl ? markdownLink(source.sourceTitle, source.sourceUrl) : source.sourceTitle}`,
        `  Transcript text: ${markdownLink(sourceTranscriptTextPath(source.slug, source.collection), source.transcriptTextUrl)} | JSON: ${markdownLink(sourceDataPath(source.slug, source.collection), source.dataUrl)}`,
      );
      if (source.summary) lines.push(`  Summary: ${source.summary}`);
    }
    lines.push('');
  }

  if (relatedTopicLinks.length) {
    lines.push('## Related Topics', '', relatedTopicLinks.map((link) => `- ${link}`).join('\n'), '');
  }

  lines.push(
    '## Retrieval Notes',
    '',
    'This file is generated from Jiang Lens episode JSON, semantic tags, glossary terms, source refs, and transcript segment matches. It is not a manually authored canon page.',
    '',
    'For broader or missing-topic search, use the letter shards under /topics/index/ before falling back to the bulk transcript-search files.',
    '',
  );

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function renderTopicAliasMarkdown(alias, topic) {
  return [
    '---',
    `title: ${yamlString(`Topic alias: ${alias}`)}`,
    `canonical_topic: ${yamlString(topic.slug)}`,
    'generated: "true"',
    '---',
    '',
    `# Topic Alias: ${alias}`,
    '',
    `This generated static route points to the canonical topic dossier for **${topic.label}**.`,
    '',
    `Canonical topic: ${markdownLink(`/topics/${topic.slug}.txt`, publicPath(`/topics/${topic.slug}.txt`))}`,
    '',
    'Open the canonical topic before answering. It contains the generated answer map, source readings, transcript anchors, video timestamps, and source refs.',
    '',
  ].join('\n');
}

function renderTopicIndex(aliasTargets, topics) {
  const letters = new Set([...aliasTargets.keys()].map((alias) => alias.slice(0, 1)).filter(Boolean));
  const lines = [
    '# Jiang Lens Topic Router',
    '',
    'Generated static topic router for agents. Do not load the bulk transcript-search files first for ordinary topic questions.',
    '',
    'Lookup order:',
    '',
    '1. Normalize the user topic to lowercase words, remove punctuation, and join words with hyphens.',
    '2. Try `/topics/{normalized-topic}.txt` directly.',
    '3. If that route is missing or ambiguous, open the letter shard under `/topics/index/{first-letter}.txt`.',
    '4. Open the canonical topic dossier linked by the shard or alias route.',
    '5. Use bulk transcript-search only as a fallback when no topic dossier exists.',
    '',
    `Canonical topics: ${topics.size}`,
    `Static aliases: ${aliasTargets.size}`,
    '',
    '## Letter Shards',
    '',
  ];

  for (const letter of [...letters].sort()) {
    lines.push(`- ${markdownLink(`/topics/index/${letter}.txt`, publicPath(`/topics/index/${letter}.txt`))}`);
  }
  lines.push('');

  return `${lines.join('\n').trim()}\n`;
}

function renderTopicLetterIndex(letter, aliasTargets, topics) {
  const entries = [...aliasTargets.entries()]
    .filter(([alias]) => alias.startsWith(letter))
    .sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    `# Jiang Lens Topic Router: ${letter.toUpperCase()}`,
    '',
    'Generated static alias shard. Open the canonical topic file for answer map, source readings, transcript anchors, video timestamps, and source refs.',
    '',
  ];

  for (const [alias, slug] of entries) {
    const topic = topics.get(slug);
    if (!topic) continue;
    const aliasLabel = alias === slug ? topic.label : alias;
    lines.push(`- \`${aliasLabel}\` -> ${markdownLink(topic.label, publicPath(`/topics/${slug}.txt`))}`);
  }
  lines.push('');
  return `${lines.join('\n').trim()}\n`;
}

async function generateTopicShards() {
  const transcriptPath = path.join(dataRoot, 'transcript-search.json');
  if (!existsSync(transcriptPath)) return null;

  const sources = [
    ...await loadPublicSources('episodes'),
    ...await loadPublicSources('interviews'),
  ];
  const sourceBySlug = new Map(sources.map((source) => [source.slug, source]));
  const topics = buildTopicSeedIndex(sources);
  const transcriptSearch = JSON.parse(await readFile(transcriptPath, 'utf8'));
  const segments = transcriptSearch.segments ?? [];
  const segmentByRef = new Map(segments.map((segment) => [segment.source_ref, segment]));

  for (const topic of topics.values()) {
    for (const ref of topic.refs) {
      const segment = segmentByRef.get(ref);
      if (segment) addTopicTranscriptHit(topic, segment, sourceBySlug, 'semantic-ref');
    }
  }

  const aliasTargets = buildAliasTargets(topics);
  const aliasSearchTargets = new Map();
  let maxAliasWords = 1;
  for (const [alias, slug] of aliasTargets.entries()) {
    const search = aliasSearchText(alias);
    const searchWords = search.split(/\s+/).filter(Boolean);
    const topic = topics.get(slug);
    if (!topic || search.length < 3 || !searchWords.length) continue;
    maxAliasWords = Math.max(maxAliasWords, searchWords.length);
    if (!aliasSearchTargets.has(search)) aliasSearchTargets.set(search, []);
    aliasSearchTargets.get(search).push({ alias, topic });
  }

  for (const segment of segments) {
    const words = normalizedSearchText(segment.text).split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const seenSearches = new Set();
    const maxWordsForSegment = Math.min(maxAliasWords, words.length);
    for (let size = 1; size <= maxWordsForSegment; size += 1) {
      for (let index = 0; index <= words.length - size; index += 1) {
        const search = words.slice(index, index + size).join(' ');
        if (seenSearches.has(search)) continue;
        seenSearches.add(search);
        const entries = aliasSearchTargets.get(search);
        if (!entries) continue;
        for (const entry of entries) {
          if (entry.topic.transcriptHits.length >= 12) continue;
          addTopicTranscriptHit(entry.topic, segment, sourceBySlug, 'alias-match', entry.alias);
        }
      }
    }
  }

  const activeTopics = new Map([...topics.entries()].filter(([, topic]) => {
    return topic.transcriptHits.length || topic.semanticPoints.length || topic.glossary.length;
  }));
  const activeAliasTargets = new Map([...aliasTargets.entries()].filter(([, slug]) => activeTopics.has(slug)));

  await rm(topicOutRoot, { recursive: true, force: true });
  await mkdir(topicIndexOutRoot, { recursive: true });

  for (const topic of activeTopics.values()) {
    const content = renderTopicMarkdown(topic);
    await writeFile(path.join(topicOutRoot, `${topic.slug}.txt`), content);
    await writeFile(path.join(topicOutRoot, `${topic.slug}.md`), content);
    const htmlOutRoot = path.join(topicOutRoot, topic.slug);
    await mkdir(htmlOutRoot, { recursive: true });
    await writeFile(path.join(htmlOutRoot, 'index.html'), renderPlainArtifactHtml({
      title: `Topic: ${topic.label}`,
      description: 'Generated Jiang Lens topic dossier with answer map, source readings, transcript anchors, video timestamps, and source refs.',
      canonicalPath: `/topics/${topic.slug}/`,
      body: content,
      alternates: [
        { type: 'text/plain', path: `/topics/${topic.slug}.txt`, title: 'Topic text' },
        { type: 'text/markdown', path: `/topics/${topic.slug}.md`, title: 'Topic Markdown' },
      ],
    }));
  }

  let aliasFileCount = 0;
  for (const [alias, slug] of activeAliasTargets.entries()) {
    if (alias === slug || activeTopics.has(alias)) continue;
    const topic = activeTopics.get(slug);
    if (!topic) continue;
    const content = renderTopicAliasMarkdown(alias, topic);
    await writeFile(path.join(topicOutRoot, `${alias}.txt`), content);
    await writeFile(path.join(topicOutRoot, `${alias}.md`), content);
    aliasFileCount += 1;
  }

  const topicIndex = renderTopicIndex(activeAliasTargets, activeTopics);
  await writeFile(path.join(topicOutRoot, 'index.txt'), topicIndex);
  await writeFile(path.join(topicOutRoot, 'index.md'), topicIndex);
  await writeFile(path.join(topicOutRoot, 'index.html'), renderPlainArtifactHtml({
    title: 'Jiang Lens Topic Router',
    description: 'Generated static topic router for Jiang Lens agents and search-backed browsing tools.',
    canonicalPath: '/topics/',
    body: topicIndex,
    alternates: [
      { type: 'text/plain', path: '/topics/index.txt', title: 'Topic router text' },
      { type: 'text/markdown', path: '/topics/index.md', title: 'Topic router Markdown' },
    ],
  }));

  const letters = new Set([...activeAliasTargets.keys()].map((alias) => alias.slice(0, 1)).filter(Boolean));
  for (const letter of letters) {
    const content = renderTopicLetterIndex(letter, activeAliasTargets, activeTopics);
    await writeFile(path.join(topicIndexOutRoot, `${letter}.txt`), content);
    await writeFile(path.join(topicIndexOutRoot, `${letter}.md`), content);
    const letterOutRoot = path.join(topicIndexOutRoot, letter);
    await mkdir(letterOutRoot, { recursive: true });
    await writeFile(path.join(letterOutRoot, 'index.html'), renderPlainArtifactHtml({
      title: `Jiang Lens Topic Router: ${letter.toUpperCase()}`,
      description: 'Generated static topic alias shard for Jiang Lens agents and browser tools.',
      canonicalPath: `/topics/index/${letter}/`,
      body: content,
      alternates: [
        { type: 'text/plain', path: `/topics/index/${letter}.txt`, title: 'Topic shard text' },
        { type: 'text/markdown', path: `/topics/index/${letter}.md`, title: 'Topic shard Markdown' },
      ],
    }));
  }

  return {
    topics: activeTopics.size,
    aliases: activeAliasTargets.size,
    aliasFiles: aliasFileCount,
    letterShards: letters.size,
    htmlPages: activeTopics.size + letters.size + 1,
  };
}

async function collectAgentSitemapPaths(root, predicate) {
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      paths.push(...await collectAgentSitemapPaths(fullPath, predicate));
    } else if (entry.isFile() && predicate(fullPath)) {
      paths.push(fullPath);
    }
  }

  return paths;
}

function publicSitemapPath(filePath) {
  const rel = path.relative(distRoot, filePath).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

async function generateAgentSitemap() {
  const priorityPaths = [
    '/',
    siteConfig.paths.llms,
    siteConfig.paths.skillText,
    siteConfig.paths.topicIndexText,
    '/topics/knights-templar.txt',
    '/topics/templars.txt',
    '/topics/trump.txt',
    '/topics/newton.txt',
    '/topics/freemasons.txt',
    siteConfig.paths.episodeIndexText,
    siteConfig.paths.interviewIndexText,
    siteConfig.paths.transcriptSearchText,
    siteConfig.paths.transcriptSearchJson,
    siteConfig.paths.llmsFull,
    siteConfig.paths.skill,
    siteConfig.paths.manifestJson,
    siteConfig.paths.linkIndexJson,
  ];
  const priorityUrls = priorityPaths.map((pathname) => urlFor(pathname));
  const urls = new Set(priorityUrls);

  const roots = [docsOutRoot, episodeMarkdownOutRoot, interviewMarkdownOutRoot, topicOutRoot, dataOutRoot];
  for (const root of roots) {
    const files = await collectAgentSitemapPaths(root, (filePath) => {
      const ext = path.extname(filePath);
      if (ext === '.txt') return true;
      if (ext === '.json') return true;
      return path.basename(filePath) === 'index.html';
    });

    for (const file of files) {
      urls.add(urlFor(publicSitemapPath(file)));
    }
  }

  const priorityUrlSet = new Set(priorityUrls);
  const content = [
    ...priorityUrls,
    ...[...urls].filter((url) => !priorityUrlSet.has(url)).sort(),
  ].join('\n');
  await writeFile(path.join(distRoot, 'sitemap-agent.txt'), `${content}\n`);
  return { count: urls.size };
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

function internalArtifactHref(href, extension = 'md') {
  if (!href || /^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) return href;
  if (!href.startsWith('/')) return href;

  const ext = extension === 'txt' ? 'txt' : 'md';
  const [pathname, suffix = ''] = href.split(/(?=[?#])/);
  if (pathname === '/episodes/') return urlFor(`/episodes/index.${ext}`) + suffix;
  if (pathname === '/interviews/') return urlFor(`/interviews/index.${ext}`) + suffix;
  if (pathname === '/topics/') return urlFor(`/topics/index.${ext}`) + suffix;

  const episodeMatch = pathname.match(/^\/episodes\/([^/]+)\/$/);
  if (episodeMatch) return urlFor(`/episodes/${episodeMatch[1]}.${ext}`) + suffix;

  const interviewMatch = pathname.match(/^\/interviews\/([^/]+)\/$/);
  if (interviewMatch) return urlFor(`/interviews/${interviewMatch[1]}.${ext}`) + suffix;

  const topicMatch = pathname.match(/^\/topics\/([^/]+)\/$/);
  if (topicMatch) return urlFor(`/topics/${topicMatch[1]}.${ext}`) + suffix;

  if (pathname.startsWith('/episodes/') || pathname.startsWith('/interviews/') || pathname.startsWith('/topics/') || pathname.startsWith('/data/')) {
    return urlFor(pathname) + suffix;
  }

  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (normalized === '/lens') return urlFor(`/docs/lens.${ext}`) + suffix;

  if (normalized.startsWith('/lens/')) {
    return urlFor(`/docs${normalized}.${ext}`) + suffix;
  }

  const docsSlugs = new Set([
    'disambiguation',
    'introduction',
    'is-professor-jiang-legit',
    'professor-jiang-predictions',
    'professor-jiang-transcripts',
    'use-with-your-agent',
    'what-is-predictive-history',
    'who-is-jiang-xueqin',
  ]);
  const slug = normalized.slice(1);
  if (docsSlugs.has(slug)) return urlFor(`/docs/${slug}.${ext}`) + suffix;

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

function transformMarkdownLinks(content, options = {}) {
  return content.replace(/\[([^\]\n]+)\]\((\/[^)\s]+)\)/g, (_match, label, href) => {
    return markdownLink(label, internalArtifactHref(href, options.extension));
  });
}

function transformLiteralArtifactPaths(content, options = {}) {
  if (options.extension !== 'txt') return content;

  return content
    .replace(/\/skill\.md/g, '/skill.txt')
    .replace(/\/episodes\/index\.md/g, '/episodes/index.txt')
    .replace(/\/interviews\/index\.md/g, '/interviews/index.txt')
    .replace(/\/topics\/index\.md/g, '/topics/index.txt')
    .replace(/\/topics\/index\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\.md/g, '/topics/index/$1.txt')
    .replace(/\/topics\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\.md/g, '/topics/$1.txt')
    .replace(/\/episodes\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\/transcript\.md/g, '/episodes/$1/transcript.txt')
    .replace(/\/interviews\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\/transcript\.md/g, '/interviews/$1/transcript.txt')
    .replace(/\/episodes\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\.md/g, '/episodes/$1.txt')
    .replace(/\/interviews\/(\{[^}\s]+\}|<[^>\s]+>|[A-Za-z0-9_-]+)\.md/g, '/interviews/$1.txt')
    .replace(/\/docs\/([A-Za-z0-9_/-]+)\.md/g, '/docs/$1.txt');
}

function transformPublicMarkdown(content, options = {}) {
  const transforms = [
    (current) => transformMarkdownLinks(current, options),
    (current) => transformLiteralArtifactPaths(current, options),
    transformEvidenceMarks,
    transformLensPointComments,
  ];

  return transforms.reduce((current, transform) => transform(current), content);
}

async function main() {
  if (!existsSync(distRoot)) {
    throw new Error('Missing website/dist. Run astro build before generating llms files.');
  }

  const files = (await walk(docsRoot)).sort();
  await copyDocs(files);
  await copyData();
  const transcriptSearchText = await generateTranscriptSearchText();
  const copiedSkillText = await copySkillText();
  const episodeMarkdown = await generateSourceMarkdown('episodes');
  const interviewMarkdown = await generateSourceMarkdown('interviews');
  const topicShards = await generateTopicShards();

  const indexLines = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.summary}`,
    '',
    'This is an independent research project, not an official Jiang Xueqin publication. It is designed for human readers and for agents such as ChatGPT, Claude, and Codex that need source-grounded access to the corpus.',
    '',
    'Agents should separate Jiang-sourced material from project interpretation and generated analysis.',
    '',
    '## Agent Resolution Order',
    '',
    'For questions about Jiang\'s views, use generated topic dossiers, public summaries, and lens pages as the interpretive map, then use their linked source refs to quote exact transcript coordinates.',
    '',
    '1. Read skill.txt for attribution, output, and identity rules.',
    '2. Normalize the user topic and try the static topic dossier at /topics/{topic-slug}.txt, or use /topics/index.txt and its letter shards to resolve aliases.',
    '3. Use the topic dossier\'s source readings, related lens links, transcript anchors, video timestamps, and source refs when answering.',
    '4. Use episode text indexes, interview text indexes, and lens docs when a topic dossier does not cover the question.',
    '5. Use bulk transcript-search.txt, transcript-search.json, and link-index.json only as fallback/offline audit surfaces, because they are large.',
    '6. Use GitHub only for implementation, provenance, or source-file audit questions, not as the primary source for Jiang-content answers.',
    '',
    '## Agent Entry Points',
    '',
    `- [Jiang Lens skill text](${urlFor(siteConfig.paths.skillText)})`,
    `- [Static topic router](${urlFor(siteConfig.paths.topicIndexText)})`,
    `- [Agent sitemap text](${urlFor(siteConfig.paths.agentSitemapText)})`,
    `- [Episodes](${urlFor(siteConfig.paths.episodes)})`,
    `- [Episode text index](${urlFor(siteConfig.paths.episodeIndexText)})`,
    `- [Episode JSON index](${urlFor(siteConfig.paths.episodeIndexJson)})`,
    `- [Interviews](${urlFor(siteConfig.paths.interviews)})`,
    `- [Interview text index](${urlFor(siteConfig.paths.interviewIndexText)})`,
    `- [Interview JSON index](${urlFor(siteConfig.paths.interviewIndexJson)})`,
    `- [Bulk transcript search text](${urlFor(siteConfig.paths.transcriptSearchText)})`,
    `- [Bulk transcript search JSON](${urlFor(siteConfig.paths.transcriptSearchJson)})`,
    `- [Full compact docs](${urlFor(siteConfig.paths.llmsFull)})`,
    `- [Generated manifest JSON](${urlFor(siteConfig.paths.manifestJson)})`,
    `- [Generated link index JSON](${urlFor(siteConfig.paths.linkIndexJson)})`,
    '',
    '## High-Signal Topic Examples',
    '',
    `- Knights Templar / templars: ${urlFor('/topics/knights-templar.txt')} (alias: ${urlFor('/topics/templars.txt')})`,
    `- Trump: ${urlFor('/topics/trump.txt')}`,
    `- Isaac Newton / Newton: ${urlFor('/topics/newton.txt')}`,
    `- Freemasons: ${urlFor('/topics/freemasons.txt')}`,
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
    const publicContent = transformPublicMarkdown(content, { extension: 'txt' });
    const metadata = extractFrontmatter(content);
    const slug = docSlug(filePath);
    if (!slug) continue;

    const title = metadata.title || slug;
    indexLines.push(`- [${title}](${urlFor(`/docs/${slug}.txt`)})`);
    fullLines.push('---', '', `# ${title}`, '', withoutFrontmatter(publicContent), '');
  }

  if (existsSync(publicSkillPath)) {
    const skill = await readFile(publicSkillPath, 'utf8');
    fullLines.push('---', '', '# Jiang Lens Skill', '', withoutFrontmatter(transformPublicMarkdown(skill, { extension: 'txt' })), '');
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
    '# Generated Topic And Bulk Index Routes',
    '',
    `Fetch ${urlFor(siteConfig.paths.topicIndexText)} for the generated static topic router. It points agents to small topic dossiers such as ${urlFor('/topics/knights-templar.txt')}.`,
    '',
    `Fetch ${urlFor(siteConfig.paths.transcriptSearchText)} for bulk plain-text transcript segment lookup or ${urlFor(siteConfig.paths.transcriptSearchJson)} for machine-readable lookup only when topic dossiers are missing. They are linked here rather than embedded so llms-full remains compact.`,
    '',
  );

  for (const [title, input] of [
    ['manifest.json', path.join(dataRoot, 'manifest.json')],
    ['episodes/index.json', path.join(episodeDataRoot, 'index.json')],
    ['interviews/index.json', path.join(interviewDataRoot, 'index.json')],
  ]) {
    if (!existsSync(input)) continue;

    const json = await readFile(input, 'utf8');
    fullLines.push('---', '', `# Generated ${title}`, '', '```json', json.trim(), '```', '');
  }

  indexLines.push(
    '',
    '## Repository Source For Site Implementation Only',
    '',
    'Use the repository for implementation, provenance, or source-file audit questions. Do not use it as the primary source for Jiang-content answers.',
    '',
    ...siteConfig.officialProfiles.map((profile) => `- ${profile}`),
    '',
    '## Source Corpus Profiles',
    '',
    ...siteConfig.sourceProfiles.map((profile) => `- ${profile.name}: ${profile.url}`),
    '',
    '## Source',
    '',
    `- Public repository: ${siteConfig.urls.repository}`,
    '',
  );

  await writeFile(path.join(distRoot, 'llms.txt'), indexLines.join('\n'));
  await writeFile(path.join(distRoot, 'llms-full.txt'), fullLines.join('\n'));
  const agentSitemap = await generateAgentSitemap();

  console.log(`Generated llms.txt, llms-full.txt, ${copiedSkillText ? 'skill.txt, ' : ''}${files.length} raw docs, ${episodeMarkdown?.count ?? 0} episode text/Markdown files, ${interviewMarkdown?.count ?? 0} interview text/Markdown files, ${topicShards?.topics ?? 0} topic shards, ${topicShards?.aliases ?? 0} topic aliases, ${topicShards?.htmlPages ?? 0} topic HTML pages, ${agentSitemap.count} agent sitemap URLs, ${transcriptSearchText?.count ?? 0} transcript search text records, and public lens JSON.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
