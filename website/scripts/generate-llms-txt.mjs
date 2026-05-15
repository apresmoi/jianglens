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
const TOPIC_ALIAS_SHARD_LIMIT = 100;

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

const META_DESCRIPTION_MIN_LENGTH = 25;
const META_DESCRIPTION_MAX_LENGTH = 160;

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

function metaDescription(value, fallback = 'Jiang Lens source-grounded readings with transcripts, timestamps, and evidence links.') {
  const candidate = compactText(value) || fallback;
  const description = candidate.length >= META_DESCRIPTION_MIN_LENGTH ? candidate : fallback;

  if (description.length <= META_DESCRIPTION_MAX_LENGTH) return description;

  const hardLimit = META_DESCRIPTION_MAX_LENGTH - 1;
  const softCut = description
    .slice(0, hardLimit)
    .replace(/\s+\S*$/, '')
    .replace(/[,;:\u2013\-]\s*$/, '')
    .trim();
  const clipped = softCut.length >= 80 ? softCut : description.slice(0, hardLimit).trim();

  if (clipped.endsWith('.')) return clipped.slice(0, META_DESCRIPTION_MAX_LENGTH);
  return `${clipped.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).trim()}.`;
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

function htmlHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:')) return href;
  if (/^https?:\/\//.test(href)) {
    try {
      const parsed = new URL(href);
      const siteOrigin = new URL(origin);
      if (parsed.origin === siteOrigin.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return href;
    }
    return href;
  }

  if (!href.startsWith('/')) return href;
  return basePath ? `${basePath}${href}` : href;
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
      return `<a href="${escapeHtml(htmlHref(href))}">${escapeHtml(alternate.title || alternate.path)}</a>`;
    })
    .join('\n        ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(metaDescription(description))}">
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

function generatedAlternateHead(alternates = []) {
  return alternates
    .filter((alternate) => alternate?.path)
    .map((alternate) => {
      const href = publicPath(alternate.path);
      const titleAttr = alternate.title ? ` title="${escapeHtml(alternate.title)}"` : '';
      return `    <link rel="alternate" type="${escapeHtml(alternate.type)}" href="${escapeHtml(href)}"${titleAttr}>`;
    })
    .join('\n');
}

function generatedAlternateLinks(alternates = []) {
  return alternates
    .filter((alternate) => alternate?.path)
    .map((alternate) => {
      const href = publicPath(alternate.path);
      return `<a href="${escapeHtml(htmlHref(href))}">${escapeHtml(alternate.title || alternate.path)}</a>`;
    })
    .join('');
}

function searchData(parts = []) {
  return escapeHtml(parts.flat().filter(Boolean).join(' '));
}

function sourceRefChips(refs = [], limit = 4) {
  const values = [...refs].filter(Boolean).slice(0, limit);
  if (!values.length) return '';
  const refIndex = sourceRefIndex();
  const transcriptRefs = transcriptRefIndex();
  return `<div class="source-links"><span class="source-label">Sources:</span>${values.map((ref) => {
    const detail = refIndex.get(ref) || transcriptRefs.get(ref);
    if (!detail?.valid) {
      return `<span class="ref-group" data-source-ref="${escapeHtml(ref)}"><span class="ref-pill" title="${escapeHtml(ref)}">Source ref</span></span>`;
    }

    const transcriptUrl = publicPath(detail.transcript_url);
    const readingUrl = publicPath(detail.episode_url || detail.source_url || '');
    const videoUrl = detail.video_url || '';
    const segmentLabel = detail.segment_id ? `Transcript ${detail.segment_id}` : 'Transcript';
    const timeLabel = detail.time_label ? `YouTube ${detail.time_label}` : 'YouTube timestamp';
    return `<span class="ref-group" data-source-ref="${escapeHtml(ref)}">
      ${htmlAnchor(readingUrl, 'Reading', 'ref-pill', { title: 'Human-readable source reading', 'aria-label': `Human-readable source reading for ${ref}` })}
      <span class="source-sep" aria-hidden="true">|</span>
      ${htmlAnchor(transcriptUrl, 'Transcript', 'ref-pill', { title: segmentLabel, 'aria-label': `${segmentLabel} for ${ref}` })}
      ${videoUrl ? `<span class="source-sep" aria-hidden="true">|</span>${htmlAnchor(videoUrl, 'YouTube', 'ref-pill yt', { title: timeLabel, 'aria-label': `${timeLabel} for ${ref}` })}` : ''}
    </span>`;
  }).join('')}</div>`;
}

function htmlAnchor(href, label, className = '', attrs = {}) {
  if (!href) return '';
  const classAttr = className ? ` class="${escapeHtml(className)}"` : '';
  const anchorHref = htmlHref(href);
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join('');
  return `<a${classAttr} href="${escapeHtml(anchorHref)}"${attrText}>${escapeHtml(label)}</a>`;
}

function generatedTopicShell({ title, description, canonicalPath, alternates = [], active = 'topics', content }) {
  const canonicalUrl = publicPath(canonicalPath);
  const alternateHead = generatedAlternateHead(alternates);
  const alternateLinks = generatedAlternateLinks(alternates);
  const navItems = [
    ['Home', '/'],
    ['Lens', '/lens/'],
    ['Episodes', '/episodes/'],
    ['Interviews', '/interviews/'],
    ['Topics', '/topics/'],
    ['Skill', '/skill/'],
  ];
  const navHtml = navItems
    .map(([label, href]) => `<a href="${href}"${active === label.toLowerCase() ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(metaDescription(description))}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
${alternateHead}
    <link rel="icon" href="/favicon.ico" sizes="any">
    <style>
      :root {
        color-scheme: dark;
        --bg: #090a08;
        --panel: rgba(244, 234, 216, 0.045);
        --panel-strong: rgba(244, 234, 216, 0.075);
        --ink: #f4ead8;
        --soft: #d7ccbb;
        --muted: #9e9585;
        --line: rgba(244, 234, 216, 0.14);
        --line-strong: rgba(244, 234, 216, 0.28);
        --gold: #c9a765;
        --rust: #c85a37;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--soft); }
      a { color: var(--gold); text-underline-offset: 0.22em; }
      .site-header { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid var(--line); background: rgba(9, 10, 8, 0.92); backdrop-filter: blur(16px); }
      .site-nav { width: min(1360px, calc(100% - 36px)); min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0 auto; }
      .brand { display: inline-flex; align-items: center; gap: 12px; color: var(--ink); font-weight: 760; text-decoration: none; }
      .brand-mark { width: 34px; height: 34px; display: block; border: 1px solid var(--line-strong); border-radius: 6px; background: #050505; overflow: hidden; }
      .brand-mark img { width: 100%; height: 100%; display: block; object-fit: cover; }
      .nav-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
      .nav-links a { border-radius: 5px; color: var(--soft); font-size: 0.88rem; font-weight: 690; padding: 8px 10px; text-decoration: none; }
      .nav-links a:hover, .nav-links a:focus-visible, .nav-links a[aria-current="page"] { background: rgba(244, 234, 216, 0.07); color: var(--ink); outline: none; }
      main { width: min(1180px, calc(100% - 36px)); margin: 0 auto; padding: 0 0 64px; }
      .hero { width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); border-bottom: 1px solid var(--line); padding: 30px 0 26px; }
      .hero-inner { width: min(1180px, calc(100% - 36px)); margin: 0 auto; }
      .router-hero { padding: 22px 0 22px; }
      .router-hero h1 { font-size: clamp(2.2rem, 4.8vw, 4.1rem); }
      .router-hero .topic-summary { max-width: 760px; margin-top: 8px; font-size: clamp(1rem, 1.25vw, 1.16rem); }
      .router-hero .toolbar { margin-top: 14px; }
      .hero-topline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-bottom: 10px; }
      .eyebrow { margin: 0; color: var(--gold); font-size: 0.78rem; font-weight: 780; text-transform: uppercase; letter-spacing: 0.04em; }
      h1, h2, h3 { color: var(--ink); font-family: Georgia, "Times New Roman", serif; font-weight: 560; letter-spacing: 0; }
      h1 { margin: 0; font-size: clamp(2.4rem, 5.5vw, 4.8rem); line-height: 0.94; }
      h2 { margin: 0 0 14px; font-size: clamp(1.35rem, 2.3vw, 2rem); }
      h3 { margin: 0; font-size: 1.1rem; line-height: 1.25; }
      p { line-height: 1.6; }
      .lead { max-width: 720px; margin: 8px 0 18px; color: var(--muted); font-size: 0.82rem; line-height: 1.45; }
      .topic-summary { max-width: 900px; margin: 14px 0 0; color: var(--ink); font-size: clamp(1.08rem, 1.6vw, 1.32rem); line-height: 1.52; }
      .toolbar, .stats, .actions, .chips { display: flex; flex-wrap: wrap; gap: 10px; }
      .toolbar { margin-top: 18px; }
      .stats { margin-top: 22px; }
      .hero-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
      .hero-meta span { border: 1px solid var(--line); border-radius: 999px; padding: 5px 9px; color: var(--muted); font-size: 0.78rem; }
      .hero-meta .alias-meta { max-width: 100%; color: var(--soft); }
      .stat, .chip, .button { border: 1px solid var(--line); border-radius: 6px; background: var(--panel); }
      .stat { min-width: 132px; padding: 10px 12px; }
      .stat strong { display: block; color: var(--ink); font-size: 1.2rem; }
      .stat span { color: var(--muted); font-size: 0.82rem; }
      .button { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; padding: 0 12px; color: var(--ink); font-size: 0.88rem; font-weight: 740; text-decoration: none; }
      .button.primary { border-color: var(--ink); background: var(--ink); color: #11100e; }
      .button.source { border-color: rgba(201, 167, 101, 0.52); color: var(--gold); }
      .button.small { min-height: 30px; border-radius: 5px; padding: 0 9px; font-size: 0.78rem; }
      .section { margin-top: 30px; }
      .panel, .card { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .panel { padding: 20px; }
      .grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; }
      .card { grid-column: span 6; padding: 18px; }
      .card.full { grid-column: 1 / -1; }
      .card p { margin: 10px 0 0; }
      .meta { color: var(--muted); font-size: 0.86rem; }
      .quote { margin: 14px 0 0; border-left: 3px solid var(--gold); padding-left: 14px; color: var(--ink); }
      .controls { margin-top: 24px; }
      .search-field { position: relative; max-width: 900px; }
      .search-field label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .search-field input { width: 100%; min-height: 42px; border: 1px solid var(--line); border-radius: 6px; padding: 0 78px 0 13px; color: var(--ink); font: inherit; font-size: 0.92rem; background: var(--panel); outline: none; }
      .search-field input::placeholder { color: rgba(209, 198, 180, 0.58); }
      .search-field input:focus { border-color: rgba(201, 167, 101, 0.54); box-shadow: 0 0 0 3px rgba(201, 167, 101, 0.1); }
      .clear-search { position: absolute; top: 50%; right: 7px; min-height: 28px; display: none; align-items: center; border: 1px solid var(--line); border-radius: 4px; padding: 0 8px; color: var(--muted); font: inherit; font-size: 0.76rem; font-weight: 720; background: rgba(9, 10, 8, 0.72); cursor: pointer; transform: translateY(-50%); }
      .clear-search.is-visible { display: inline-flex; }
      .clear-search:hover, .clear-search:focus-visible { border-color: rgba(201, 167, 101, 0.54); color: var(--ink); outline: none; }
      .results-row { margin: 10px 0 0; color: var(--muted); font-size: 0.86rem; }
      .empty-state { display: none; margin: 18px 0 0; color: var(--muted); }
      .empty-state.is-visible { display: block; }
      .note-list, .evidence-list, .source-list { display: grid; gap: 7px; }
      .note-row, .evidence-card, .source-row { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .note-row, .source-row { padding: 10px 12px; }
      .note-main, .source-row-main, .evidence-head { display: block; }
      .note-copy p, .source-copy p { margin: 4px 0 0; line-height: 1.42; }
      .note-copy h3, .source-copy h3, .evidence-title-line h3 { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 0.96rem; font-weight: 760; line-height: 1.25; }
      .row-title-line, .evidence-title-line { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
      .title-meta { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
      .row-title-line h3, .evidence-title-line h3 { margin: 0; }
      .row-title-line .meta, .evidence-title-line .meta { margin: 0; font-size: 0.78rem; }
      .type-badge { flex: 0 0 auto; display: inline-flex; align-items: center; width: max-content; max-width: 150px; min-height: 20px; border: 1px solid rgba(201, 167, 101, 0.38); border-radius: 999px; padding: 0 7px; color: var(--gold); background: rgba(201, 167, 101, 0.08); font-size: 0.59rem; font-weight: 820; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
      .evidence-card { padding: 10px 12px; }
      .evidence-card .quote { max-width: 100%; margin-top: 5px; padding-left: 9px; font-size: 0.9rem; line-height: 1.4; }
      .source-links { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 6px; color: var(--muted); font-size: 0.76rem; }
      .source-label { color: var(--muted); font-weight: 730; }
      .ref-group { display: inline-flex; flex-wrap: nowrap; gap: 0; align-items: center; border: 1px solid var(--line); border-radius: 999px; background: rgba(0, 0, 0, 0.18); overflow: hidden; }
      .source-sep { color: rgba(215, 204, 187, 0.36); font-size: 0.74rem; }
      .ref-pill { min-height: 25px; display: inline-flex; align-items: center; border: 0; padding: 0 8px; color: var(--soft); background: transparent; font-size: 0.74rem; font-weight: 720; text-decoration: none; white-space: nowrap; }
      .ref-pill:hover, .ref-pill:focus-visible { border-color: rgba(201, 167, 101, 0.58); color: var(--ink); outline: none; }
      .ref-pill.yt { color: var(--gold); }
      .lens-group .ref-pill { color: var(--gold); }
      code { border: 1px solid var(--line); border-radius: 4px; padding: 2px 5px; background: rgba(0, 0, 0, 0.22); color: var(--soft); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.82em; }
      .chip { display: inline-flex; align-items: center; min-height: 32px; padding: 0 10px; color: var(--soft); font-size: 0.88rem; text-decoration: none; }
      .chip.compact { min-height: 26px; padding: 0 8px; font-size: 0.76rem; }
      .chip:hover, .chip:focus-visible, .chip[aria-current="page"] { border-color: var(--gold); color: var(--ink); outline: none; }
      .chip[aria-current="page"] { background: rgba(201, 167, 101, 0.1); }
      .letter-links { gap: 6px; }
      .letter-links .chip { gap: 6px; }
      .letter-links strong { color: var(--ink); }
      .letter-links span { color: var(--muted); }
      .router-letters { margin-top: 22px; }
      .prefix-links { align-items: flex-start; gap: 7px; margin-top: 0; }
      .prefix-chip { min-height: 34px; gap: 8px; padding: 0 10px; }
      .prefix-chip strong { font-size: 0.86rem; }
      .prefix-chip span { font-size: 0.74rem; }
      .alias-arrow { color: var(--muted); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 0.88rem; }
      .letter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 10px; }
      .letter-card { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: var(--panel); text-decoration: none; }
      .letter-card strong { display: block; color: var(--ink); font-size: 1.4rem; }
      .letter-card span { color: var(--muted); font-size: 0.82rem; }
      .alias-table { width: 100%; border-collapse: collapse; overflow-wrap: anywhere; }
      .alias-table th, .alias-table td { border-bottom: 1px solid var(--line); padding: 10px 8px; text-align: left; vertical-align: top; }
      .alias-table th { color: var(--ink); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .footer { margin-top: 42px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.88rem; }
      .footer .alternates { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
      @media (max-width: 820px) {
        .site-nav { width: min(100% - 28px, 1360px); align-items: flex-start; flex-direction: column; padding: 12px 0; }
        .nav-links { justify-content: flex-start; }
        main { width: min(100% - 28px, 1180px); }
        .hero-inner { width: min(100% - 28px, 1180px); }
        .note-main, .source-row-main, .evidence-head { grid-template-columns: 1fr; gap: 7px; }
        .row-title-line, .evidence-title-line { align-items: flex-start; flex-wrap: wrap; }
        .type-badge { max-width: 100%; }
        .source-links { align-items: flex-start; }
        .ref-group { max-width: 100%; flex-wrap: wrap; border-radius: 6px; }
        .ref-pill { white-space: normal; }
        .card { grid-column: 1 / -1; }
        .alias-table { display: block; overflow-x: auto; }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <nav class="site-nav" aria-label="Primary navigation">
        <a class="brand" href="/" aria-label="Jiang Lens home">
          <span class="brand-mark" aria-hidden="true"><img src="/logo.png" alt="Jiang Lens logo"></span>
          <span>Jiang Lens</span>
        </a>
        <div class="nav-links">${navHtml}</div>
      </nav>
    </header>
    <main>
      ${content}
      <footer class="footer">
        <div>Jiang Lens is an independent research index. Generated topic pages are routing and synthesis surfaces; cite source readings, transcript anchors, source refs, and timestamps for Jiang claims.</div>
        ${alternateLinks ? `<div class="alternates">${alternateLinks}</div>` : ''}
      </footer>
    </main>
    <script>
      (() => {
        const searchInput = document.querySelector('[data-topic-search-input]');
        if (!(searchInput instanceof HTMLInputElement)) return;
        const clearButton = document.querySelector('[data-clear-search]');
        const items = Array.from(document.querySelectorAll('[data-topic-item]'));
        const resultCount = document.querySelector('[data-results-count]');
        const resultLabel = resultCount?.getAttribute('data-results-label') || 'evidence items';
        const emptyState = document.querySelector('[data-empty-state]');

        function normalized(value) {
          return String(value || '').trim().toLowerCase();
        }

        function updateQueryParam(query) {
          const url = new URL(window.location.href);
          if (query) {
            url.searchParams.set('q', query);
          } else {
            url.searchParams.delete('q');
          }
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }

        function filterItems() {
          const query = normalized(searchInput.value);
          let visible = 0;
          items.forEach((item) => {
            const matches = !query || String(item.getAttribute('data-topic-search') || '').toLowerCase().includes(query);
            item.hidden = !matches;
            if (matches) visible += 1;
          });
          if (resultCount) {
            resultCount.textContent = query
              ? 'Showing ' + visible + ' of ' + items.length + ' ' + resultLabel
              : 'Showing ' + items.length + ' ' + resultLabel;
          }
          emptyState?.classList.toggle('is-visible', visible === 0);
          clearButton?.classList.toggle('is-visible', Boolean(query));
          updateQueryParam(query);
        }

        const params = new URLSearchParams(window.location.search);
        searchInput.value = params.get('q') || '';
        searchInput.addEventListener('input', filterItems);
        clearButton?.addEventListener('click', () => {
          searchInput.value = '';
          searchInput.focus();
          filterItems();
        });
        filterItems();
      })();
    </script>
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
  const unique = candidates
    .map((item) => ({
      label: item.label,
      href: item.href ? internalArtifactHref(item.href, extension) : '',
    }))
    .filter((item) => item.label && item.href)
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    });

  const basesWithAnchors = new Set(unique
    .filter((item) => item.href.includes('#'))
    .map((item) => item.href.split('#')[0]));

  return unique
    .filter((item) => item.href.includes('#') || !basesWithAnchors.has(item.href.split('#')[0]))
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
    `description: ${yamlString(metaDescription(dek || read.thesis || title))}`,
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
    `description: ${yamlString(metaDescription(`Source-synced transcript archive for ${episode.title}.`))}`,
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
  const dateSortKey = sourceDateSortKey(source);
  const existing = topic.sources.get(source.slug) || {
    slug: source.slug,
    collection,
    title: source.read?.title || source.title,
    sourceTitle: source.title,
    date: source.date_label || source.published_at || 'unknown',
    dateLabel: source.date_label || source.published_at || 'unknown',
    publishedAt: source.published_at || '',
    recordedAt: source.recorded_at || '',
    dateSortKey,
    sourceClass: source.source_class || sourceKind(collection),
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

function firstIsoDate(value) {
  return String(value ?? '').match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)?.[0] || '';
}

function sourceDateSortKey(source) {
  return firstIsoDate(source?.published_at)
    || firstIsoDate(source?.recorded_at)
    || firstIsoDate(source?.date_label)
    || firstIsoDate(source?.date)
    || '';
}

function candidateDateSortKey(candidate) {
  return firstIsoDate(candidate?.dateSortKey)
    || firstIsoDate(candidate?.publishedAt)
    || firstIsoDate(candidate?.date)
    || '';
}

function daysBetweenDates(later, earlier) {
  const laterDate = Date.parse(later);
  const earlierDate = Date.parse(earlier);
  if (!Number.isFinite(laterDate) || !Number.isFinite(earlierDate)) return 0;
  return Math.max(0, (laterDate - earlierDate) / 86400000);
}

function sortedTopicSources(topic) {
  return [...topic.sources.values()].sort((a, b) => {
    const dateDelta = candidateDateSortKey(b).localeCompare(candidateDateSortKey(a));
    if (dateDelta) return dateDelta;
    return String(a.title || a.slug).localeCompare(String(b.title || b.slug));
  });
}

function latestTopicSource(topic) {
  return sortedTopicSources(topic)[0] || null;
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
    sourceSlug: source.slug,
    collection: collectionForSource(source),
    sourceTitle: source.title || '',
    sourceReadingTitle: source.read?.title || source.title || '',
    publishedAt: source.published_at || '',
    dateSortKey: sourceDateSortKey(source),
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
    sourceSlug: source.slug,
    collection: collectionForSource(source),
    sourceTitle: source.title || '',
    sourceReadingTitle: source.read?.title || source.title || '',
    publishedAt: source.published_at || '',
    dateSortKey: sourceDateSortKey(source),
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
    publishedAt: segment.published_at || source?.published_at || '',
    dateSortKey: firstIsoDate(segment.published_at) || sourceDateSortKey(source),
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
  const source = sourceBySlug.get(segment.slug);
  if (source) addTopicSource(topic, source, reason);
  const hit = sourceHitFromSegment(segment, sourceBySlug);
  hit.reason = reason;
  hit.matchedAlias = matchedAlias;
  hit.quote = excerptAroundAlias(segment.text, [...topic.aliases], 24);
  hit.related = relatedLinksForRef(segment.source_ref, 'html');
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
  if (hit.reason === 'semantic-ref') score += 12;
  if (hit.matchedAlias && hit.matchedAlias.split('-').length > 1) score += 20;
  if (hit.quote) score += 5;
  return score;
}

function sortedTopicHits(topic) {
  return [...topic.transcriptHits]
    .sort((a, b) => {
      const dateDelta = candidateDateSortKey(b).localeCompare(candidateDateSortKey(a));
      if (dateDelta) return dateDelta;
      const scoreDelta = rankTopicHit(b) - rankTopicHit(a);
      if (scoreDelta) return scoreDelta;
      return String(a.ref).localeCompare(String(b.ref));
    })
    .slice(0, 12);
}

function rankTopicForIndex(topic) {
  if (!topic) return 0;
  return (
    Math.min(topic.transcriptHits.length, 12) * 14 +
    Math.min(topic.sources.size, 10) * 11 +
    Math.min(topic.semanticPoints.length, 12) * 7 +
    Math.min(topic.glossary.length, 6) * 6 +
    Math.min(topic.refs.size, 18) * 3 +
    Math.min(topic.aliases.size, 18) +
    Math.min(topic.relatedTopics.size, 12)
  );
}

function rankedTopicsForIndex(topics, limit = 10) {
  return [...topics.values()]
    .filter((topic) => {
      if (!topic?.slug || topic.slug.length < 3) return false;
      if (topicStopwords.has(topic.slug) || weakAliasWords.has(topic.slug)) return false;
      return topic.transcriptHits.length || topic.sources.size || topic.semanticPoints.length || topic.glossary.length;
    })
    .sort((a, b) => {
      const scoreDelta = rankTopicForIndex(b) - rankTopicForIndex(a);
      if (scoreDelta) return scoreDelta;
      const sourceDelta = b.sources.size - a.sources.size;
      if (sourceDelta) return sourceDelta;
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

function topicFocusText(topic) {
  const candidates = [];

  for (const item of topic.glossary) {
    for (const usage of item.usages ?? []) {
      const text = firstSentenceExcerpt(usage, 34);
      if (text) {
        candidates.push({
          text,
          baseScore: 42,
          dateSortKey: item.dateSortKey,
          slug: item.sourceSlug || item.term,
          kind: 'glossary',
        });
      }
    }
  }

  for (const point of topic.semanticPoints) {
    const text = point.text ? firstSentenceExcerpt(point.text, 38) : '';
    if (!text) continue;
    let baseScore = 46;
    if (point.claimType === 'model' || point.kind === 'models') baseScore = 58;
    if (point.kind === 'diagnoses') baseScore = Math.max(baseScore, 54);
    candidates.push({
      text,
      baseScore,
      dateSortKey: point.dateSortKey,
      slug: point.sourceSlug || point.text,
      kind: point.claimType || point.kind || 'semantic',
    });
  }

  for (const source of sortedTopicSources(topic)) {
    if (!source.summary) continue;
    candidates.push({
      text: firstSentenceExcerpt(source.summary, 34),
      baseScore: 48,
      dateSortKey: source.dateSortKey,
      slug: source.slug,
      kind: 'source-summary',
    });
  }

  for (const hit of sortedTopicHits(topic)) {
    if (!hit.quote) continue;
    candidates.push({
      text: `A transcript-matched topic anchored by excerpts such as "${wordExcerpt(hit.quote, 24)}"`,
      baseScore: 30 + rankTopicHit(hit),
      dateSortKey: hit.dateSortKey,
      slug: hit.slug,
      kind: 'transcript-hit',
    });
  }

  const newestDate = candidates
    .map(candidateDateSortKey)
    .filter(Boolean)
    .sort()
    .at(-1);
  const halfLifeDays = 21;
  const maxRecencyBoost = 3;

  const best = candidates
    .filter((candidate) => candidate.text)
    .sort((a, b) => {
      const scoreFor = (candidate) => {
        const dateKey = candidateDateSortKey(candidate);
        if (!newestDate || !dateKey) return candidate.baseScore;
        const recency = Math.exp(-daysBetweenDates(newestDate, dateKey) / halfLifeDays);
        const boost = 1 + ((maxRecencyBoost - 1) * recency);
        return candidate.baseScore * boost;
      };
      const scoreDelta = scoreFor(b) - scoreFor(a);
      if (Math.abs(scoreDelta) > 0.0001) return scoreDelta;
      const dateDelta = candidateDateSortKey(b).localeCompare(candidateDateSortKey(a));
      if (dateDelta) return dateDelta;
      return String(a.slug || a.kind).localeCompare(String(b.slug || b.kind));
    })[0];
  if (best?.text) return best.text;

  return `A generated Jiang Lens topic assembled from source tags, source refs, and transcript matches for ${topic.label}.`;
}

function topicCoverageMarkdown(topic) {
  const related = [...topic.relatedTopics.values()].filter(Boolean).slice(0, 5);
  const sources = sortedTopicSources(topic);
  const latestSource = sources[0];
  const sourceTitles = sources.map((source) => source.title).filter(Boolean).slice(0, 3);
  const parts = [
    `This generated topic groups Jiang Lens evidence about **${topic.label}** across transcript matches, source readings, semantic tags, and source refs.`,
    `Current focus: ${topicFocusText(topic)}`,
  ];

  if (latestSource) {
    parts.push(`Most recent Jiang source touching this topic: ${markdownLink(latestSource.title, publicPath(`/${latestSource.collection}/${latestSource.slug}/`))} (${latestSource.dateLabel || latestSource.date}).`);
  }
  if (sourceTitles.length) {
    parts.push(`Most connected source reading${sourceTitles.length === 1 ? '' : 's'}: ${sourceTitles.map((title) => `**${title}**`).join('; ')}.`);
  }
  if (related.length) {
    parts.push(`Nearby topic cluster: ${related.join(', ')}.`);
  }
  parts.push('Freshness warning: this static topic page is bounded by the newest Jiang source listed here. For live/current events, first check `/episodes/` and `/interviews/` for newer event-specific readings. If none exists, use prospective mechanism search: establish current facts, actors, incentives, constraints, and mechanisms from live/current sources, then apply Jiang Lens concepts as dated hypotheses rather than as Jiang\'s current view.');
  return parts.join('\n\n');
}

function topicCoverageHtml(topic) {
  const related = [...topic.relatedTopics.entries()]
    .filter(([slug]) => slug !== topic.slug)
    .slice(0, 6);
  const sources = sortedTopicSources(topic);
  const latestSource = sources[0];
  const sourceTitles = sources.map((source) => source.title).filter(Boolean).slice(0, 3);

  return `<div class="topic-focus">
    <p>${escapeHtml(topicFocusText(topic))}</p>
    ${latestSource ? `<p class="meta">Most recent Jiang source touching this topic: ${htmlAnchor(publicPath(`/${latestSource.collection}/${latestSource.slug}/`), latestSource.title)} (${escapeHtml(latestSource.dateLabel || latestSource.date)}).</p>` : ''}
    ${sourceTitles.length ? `<p class="meta">Most connected source reading${sourceTitles.length === 1 ? '' : 's'}: ${sourceTitles.map((title) => escapeHtml(title)).join('; ')}.</p>` : ''}
    <p class="meta">Freshness warning: this static topic page is bounded by the newest Jiang source listed here. For live/current events, first check /episodes/ and /interviews/ for newer event-specific readings. If none exists, use prospective mechanism search before treating this topic focus as an operative Jiang Lens reading.</p>
    ${related.length ? `<div class="chips">${related.map(([slug, label]) => htmlAnchor(publicPath(`/topics/${slug}/`), label, 'chip')).join('')}</div>` : ''}
  </div>`;
}

function renderTopicMarkdown(topic) {
  const hits = sortedTopicHits(topic);
  const sources = sortedTopicSources(topic).slice(0, 8);
  const relatedTopicLinks = [...topic.relatedTopics.entries()]
    .filter(([slug]) => slug !== topic.slug)
    .slice(0, 12)
    .map(([slug, label]) => markdownLink(label, publicPath(`/topics/${slug}/`)));

  const lines = [
    '---',
    `title: ${yamlString(`Topic: ${topic.label}`)}`,
    `description: ${yamlString(metaDescription(`Generated static Jiang Lens topic dossier for ${topic.label}.`))}`,
    `topic_slug: ${yamlString(topic.slug)}`,
    'generated: "true"',
    '---',
    '',
    `# Topic: ${topic.label}`,
    '',
    'Generated static topic dossier for agents. Use this topic page as a routing and synthesis surface, not as primary evidence for Jiang-spoken claims. Final answers should cite the source reading, transcript segment, source ref, and video timestamp linked below.',
    '',
    `Human topic page: ${markdownLink(`/topics/${topic.slug}/`, publicPath(`/topics/${topic.slug}/`))}`,
    `Text mirror: ${markdownLink(`/topics/${topic.slug}.txt`, publicPath(`/topics/${topic.slug}.txt`))}`,
    `Markdown mirror: ${markdownLink(`/topics/${topic.slug}.md`, publicPath(`/topics/${topic.slug}.md`))}`,
    '',
    'Citation rule: do not cite this .txt/.md mirror in final answers. Do not cite the topic page as primary evidence for what Jiang said. Cite human-readable source readings for generated summaries and lens context; cite transcript and video timestamp links below for Jiang-spoken quotations.',
  ];

  const aliases = [...topic.aliases].filter((alias) => alias !== topic.slug).sort();
  if (aliases.length) lines.push(`Aliases: ${aliases.slice(0, 18).map((alias) => `\`${alias}\``).join(', ')}`);
  lines.push('');

  lines.push('## What This Topic Covers', '', topicCoverageMarkdown(topic), '');

  if (topic.glossary.length || topic.semanticPoints.length) {
    lines.push('## Extracted Topic Notes', '');
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
        `   Human reading: ${markdownLink(`/${hit.collection}/${hit.slug}/`, publicPath(`/${hit.collection}/${hit.slug}/`))} | Text mirror: ${markdownLink(sourceTextPath(hit.slug, hit.collection), hit.sourceTextUrl)} | JSON: ${markdownLink(sourceDataPath(hit.slug, hit.collection), hit.sourceJsonUrl)}`,
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
        `- ${markdownLink(source.title, publicPath(`/${source.collection}/${source.slug}/`))}${reason} -- ${source.date}`,
        `  Source: ${source.sourceUrl ? markdownLink(source.sourceTitle, source.sourceUrl) : source.sourceTitle}`,
        `  Transcript page: ${markdownLink(`/${source.collection}/${source.slug}/transcript/`, publicPath(`/${source.collection}/${source.slug}/transcript/`))} | Transcript text: ${markdownLink(sourceTranscriptTextPath(source.slug, source.collection), source.transcriptTextUrl)} | JSON: ${markdownLink(sourceDataPath(source.slug, source.collection), source.dataUrl)}`,
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
    'Freshness warning: this static topic page is bounded by the newest Jiang source listed above. For live/current events, first check /episodes/ and /interviews/ for newer event-specific readings. If none exists, use prospective mechanism search: establish current facts, actors, incentives, constraints, and mechanisms from live/current sources, then apply Jiang Lens concepts as dated hypotheses rather than as Jiang\'s current view.',
    '',
    'For broader or missing-topic search, use the letter shards under /topics/index/ before falling back to the bulk transcript-search files.',
    '',
  );

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function renderTopicAnswerCards(topic) {
  const cards = [];

  for (const item of topic.glossary.slice(0, 4)) {
    const usages = item.usages.length ? item.usages.join(' ') : `Glossary term: ${item.term}.`;
    cards.push(`<article class="note-row" data-topic-item data-topic-search="${searchData(['glossary', item.term, usages, item.refs])}">
      <div class="note-main">
        <div class="note-copy">
          <div class="row-title-line">
            <div class="title-meta"><h3>${escapeHtml(item.term)}</h3></div>
            <span class="type-badge">Glossary</span>
          </div>
          <p>${escapeHtml(usages)}</p>
          ${sourceRefChips(item.refs)}
        </div>
      </div>
    </article>`);
  }

  for (const point of topic.semanticPoints.slice(0, 8)) {
    const kind = point.claimType || point.kind || 'lens point';
    const noteLabel = point.temporalScope || point.confidence || 'Source-backed note';
    cards.push(`<article class="note-row" data-topic-item data-topic-search="${searchData([kind, noteLabel, point.text, point.refs])}">
      <div class="note-main">
        <div class="note-copy">
          <div class="row-title-line">
            <div class="title-meta"><h3>${escapeHtml(noteLabel)}</h3></div>
            <span class="type-badge">${escapeHtml(kind)}</span>
          </div>
          <p>${escapeHtml(point.text)}</p>
          ${sourceRefChips(point.refs)}
        </div>
      </div>
    </article>`);
  }

  if (!cards.length) {
    return '<p class="meta">No extracted notes were found for this topic.</p>';
  }

  return `<div class="note-list">${cards.join('\n')}</div>`;
}

function renderTopicHitCards(hits) {
  if (!hits.length) return '<p class="meta">No transcript-backed hits were selected for this topic brief.</p>';

  return `<div class="evidence-list">${hits.map((hit) => {
    const sourceReading = publicPath(`/${hit.collection}/${hit.slug}/`);
    const transcriptLabel = hit.segmentId ? `Transcript ${hit.segmentId}` : 'Transcript';
    const timestampTitle = hit.timeLabel ? `YouTube ${hit.timeLabel}` : 'YouTube timestamp';
    const related = hit.related?.length
      ? `<span class="source-label">Lens:</span><span class="ref-group lens-group">${hit.related.map((item, index) => `${index ? '<span class="source-sep" aria-hidden="true">|</span>' : ''}${htmlAnchor(item.href, item.label, 'ref-pill')}`).join('')}</span>`
      : '';
    return `<article class="evidence-card" data-topic-item data-source-ref="${escapeHtml(hit.ref)}" data-topic-search="${searchData([hit.date, hit.sourceTitle, hit.title, hit.quote, hit.ref, hit.segmentId, hit.timeLabel, hit.related?.map((item) => item.label)])}">
      <div class="evidence-head">
        <div class="evidence-copy">
          <div class="evidence-title-line">
            <div class="title-meta">
              <h3>${htmlAnchor(sourceReading, hit.title || hit.slug)}</h3>
              <p class="meta">${escapeHtml(hit.date)} · ${escapeHtml(hit.sourceTitle || hit.slug)}</p>
            </div>
            <span class="type-badge">Transcript</span>
          </div>
          ${hit.quote ? `<p class="quote">"${escapeHtml(hit.quote)}"</p>` : ''}
          <div class="source-links">
            <span class="source-label">Sources:</span>
            <span class="ref-group" data-source-ref="${escapeHtml(hit.ref)}">
              ${htmlAnchor(sourceReading, 'Reading', 'ref-pill', { title: 'Human-readable source reading', 'aria-label': `Human-readable source reading for ${hit.ref}` })}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(hit.transcriptUrl, 'Transcript', 'ref-pill', { title: transcriptLabel, 'aria-label': `${transcriptLabel} for ${hit.ref}` })}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(hit.videoUrl, 'YouTube', 'ref-pill yt', { title: timestampTitle, 'aria-label': `${timestampTitle} for ${hit.ref}` })}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(hit.sourceJsonUrl, 'Data', 'ref-pill', { title: 'Source JSON data', 'aria-label': `Source JSON data for ${hit.ref}` })}
            </span>
            ${related}
          </div>
        </div>
      </div>
    </article>`;
  }).join('\n')}</div>`;
}

function renderTopicSourceCards(sources) {
  if (!sources.length) return '<p class="meta">No source readings were selected for this topic dossier.</p>';

  return `<div class="source-list">${sources.map((source) => {
    const sourceReading = publicPath(`/${source.collection}/${source.slug}/`);
    const reason = source.reasons.size ? [...source.reasons].slice(0, 3).join(', ') : 'topic evidence';
    return `<article class="source-row" data-topic-item data-topic-search="${searchData([source.date, reason, source.title, source.summary, source.sourceTitle])}">
      <div class="source-row-main">
        <div class="source-copy">
          <div class="row-title-line">
            <div class="title-meta">
              <h3>${htmlAnchor(sourceReading, source.title || source.slug)}</h3>
              <p class="meta">${escapeHtml(source.date)} · ${escapeHtml(reason)}</p>
            </div>
            <span class="type-badge">Reading</span>
          </div>
          ${source.summary ? `<p>${escapeHtml(source.summary)}</p>` : ''}
          <div class="source-links">
            <span class="source-label">Sources:</span>
            <span class="ref-group">
              ${htmlAnchor(sourceReading, 'Reading', 'ref-pill', { title: 'Human-readable source reading' })}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(publicPath(`/${source.collection}/${source.slug}/transcript/`), 'Transcript', 'ref-pill', { title: 'Full transcript' })}
              ${source.sourceUrl ? `<span class="source-sep" aria-hidden="true">|</span>${htmlAnchor(source.sourceUrl, 'YouTube', 'ref-pill yt', { title: source.sourceTitle || 'Original source' })}` : ''}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(source.dataUrl, 'Data', 'ref-pill', { title: 'Source JSON data' })}
            </span>
          </div>
        </div>
      </div>
    </article>`;
  }).join('\n')}</div>`;
}

function renderTopicHtml(topic) {
  const hits = sortedTopicHits(topic);
  const sources = sortedTopicSources(topic).slice(0, 8);
  const latestSource = sources[0];
  const bestHit = hits[0];
  const bestSource = bestHit ? publicPath(`/${bestHit.collection}/${bestHit.slug}/`) : (latestSource ? publicPath(`/${latestSource.collection}/${latestSource.slug}/`) : '');
  const aliases = [...topic.aliases].filter((alias) => alias !== topic.slug).sort().slice(0, 18);
  const aliasPreview = aliases.slice(0, 8).join(', ');
  const aliasOverflow = aliases.length > 8 ? `, +${aliases.length - 8} more` : '';
  const relatedTopics = [...topic.relatedTopics.entries()]
    .filter(([slug]) => slug !== topic.slug)
    .slice(0, 18);
  const searchItemCount = topic.glossary.slice(0, 4).length + topic.semanticPoints.slice(0, 8).length + hits.length + sources.length;
  const content = `
      <section class="hero router-hero">
        <div class="hero-inner">
          <div class="hero-topline">
            <p class="eyebrow">Topic brief</p>
            <div class="hero-meta" aria-label="Topic evidence summary">
              <span>${hits.length} timestamped hit${hits.length === 1 ? '' : 's'}</span>
              <span>${sources.length} source reading${sources.length === 1 ? '' : 's'}</span>
              <span>${topic.semanticPoints.length + topic.glossary.length} extracted note${topic.semanticPoints.length + topic.glossary.length === 1 ? '' : 's'}</span>
              ${latestSource ? `<span>Newest source: ${escapeHtml(latestSource.dateLabel || latestSource.date)}</span>` : ''}
              ${aliases.length ? `<span class="alias-meta">Aliases: ${escapeHtml(aliasPreview + aliasOverflow)}</span>` : ''}
            </div>
          </div>
          <p class="lead">A Jiang Lens evidence brief for this topic, built from source tags, transcript matches, and linked source refs.</p>
          <h1>${escapeHtml(topic.label)}</h1>
          <p class="topic-summary">${escapeHtml(topicFocusText(topic))}</p>
          <div class="toolbar">
            ${htmlAnchor(bestSource, 'Best source reading', 'button primary')}
            ${bestHit ? htmlAnchor(bestHit.transcriptUrl, 'Best transcript hit', 'button source') : ''}
            ${bestHit ? htmlAnchor(bestHit.videoUrl, 'Open on YouTube', 'button source', { title: bestHit.timeLabel ? `YouTube ${bestHit.timeLabel}` : 'YouTube timestamp' }) : ''}
            ${htmlAnchor('/topics/', 'Topic router', 'button')}
          </div>
        </div>
      </section>

      <section class="controls" aria-label="Topic evidence search">
        <div class="search-field">
          <label for="topic-search">Search this topic</label>
          <input id="topic-search" type="search" inputmode="search" autocomplete="off" placeholder="Search notes, quotes, source refs, or titles" data-topic-search-input>
          <button class="clear-search" type="button" data-clear-search>Clear</button>
        </div>
        <p class="results-row" data-results-count>Showing ${searchItemCount} evidence items</p>
        <p class="empty-state" data-empty-state>No matching evidence on this topic page.</p>
      </section>

      <section class="section">
        <h2>Topic Scope And Freshness</h2>
        <div class="panel">
          ${topicCoverageHtml(topic)}
        </div>
      </section>

      <section class="section">
        <h2>Key Notes</h2>
        ${renderTopicAnswerCards(topic)}
      </section>

      <section class="section">
        <h2>Timestamped Evidence</h2>
        ${renderTopicHitCards(hits)}
      </section>

      <section class="section">
        <h2>Relevant Lectures And Readings</h2>
        ${renderTopicSourceCards(sources)}
      </section>

      ${relatedTopics.length ? `<section class="section">
        <h2>Related Topics</h2>
        <div class="chips">${relatedTopics.map(([slug, label]) => htmlAnchor(publicPath(`/topics/${slug}/`), label, 'chip')).join('')}</div>
      </section>` : ''}

      <section class="section">
        <div class="panel">
          <h2>How To Use And Cite This Page</h2>
          <p>This topic page is a discovery surface. For generated synthesis, cite the human-readable source reading or lens page. For Jiang-spoken claims, cite the transcript segment, source ref, and YouTube timestamp. Raw text and Markdown mirrors are fallback surfaces for tools that cannot read this HTML page.</p>
          <div class="actions" style="margin-top: 14px;">
            ${htmlAnchor(`/topics/${topic.slug}.txt`, 'Text mirror', 'button')}
            ${htmlAnchor(`/topics/${topic.slug}.md`, 'Markdown mirror', 'button')}
          </div>
        </div>
      </section>
  `;

  return generatedTopicShell({
    title: `Topic: ${topic.label}`,
    description: metaDescription(`Generated Jiang Lens topic brief for ${topic.label}, with source readings, transcript anchors, video timestamps, and source refs.`),
    canonicalPath: `/topics/${topic.slug}/`,
    alternates: [
      { type: 'text/plain', path: `/topics/${topic.slug}.txt`, title: 'Topic text' },
      { type: 'text/markdown', path: `/topics/${topic.slug}.md`, title: 'Topic Markdown' },
    ],
    content,
  });
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
    `Human topic page: ${markdownLink(`/topics/${topic.slug}/`, publicPath(`/topics/${topic.slug}/`))}`,
    `Canonical topic text mirror: ${markdownLink(`/topics/${topic.slug}.txt`, publicPath(`/topics/${topic.slug}.txt`))}`,
    '',
    'Open the human-readable topic page before answering. It contains the generated answer map, source readings, transcript anchors, video timestamps, and source refs.',
    '',
    'Citation rule: do not cite this alias mirror in final answers. Use the topic page for routing, then cite the source reading, transcript segment, source ref, or video timestamp that supports the answer.',
    '',
  ].join('\n');
}

function buildTopicAliasShards(aliasTargets, limit = TOPIC_ALIAS_SHARD_LIMIT) {
  const byLetter = new Map();
  for (const entry of [...aliasTargets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const letter = entry[0].slice(0, 1);
    if (!letter) continue;
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter).push(entry);
  }
  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, entries]) => buildTopicAliasShardNode(letter, entries, limit));
}

function buildTopicAliasShardNode(prefix, entries, limit) {
  const sortedEntries = [...entries].sort(([a], [b]) => a.localeCompare(b));
  const node = {
    prefix,
    totalAliases: sortedEntries.length,
    entries: sortedEntries,
    children: [],
  };

  if (sortedEntries.length <= limit) return node;

  const exactEntries = [];
  const buckets = new Map();
  for (const entry of sortedEntries) {
    const alias = entry[0];
    if (alias === prefix) {
      exactEntries.push(entry);
      continue;
    }
    const childPrefix = alias.slice(0, Math.min(alias.length, prefix.length + 1));
    if (!childPrefix || childPrefix === prefix) {
      exactEntries.push(entry);
      continue;
    }
    if (!buckets.has(childPrefix)) buckets.set(childPrefix, []);
    buckets.get(childPrefix).push(entry);
  }

  if (!buckets.size) return node;

  node.entries = exactEntries;
  node.children = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([childPrefix, childEntries]) => buildTopicAliasShardNode(childPrefix, childEntries, limit));
  return node;
}

function flattenTopicAliasShards(shards) {
  const output = [];
  const visit = (shard) => {
    output.push(shard);
    for (const child of shard.children) visit(child);
  };
  for (const shard of shards) visit(shard);
  return output;
}

function topicAliasShardLabel(prefix) {
  return prefix.length === 1 ? prefix.toUpperCase() : prefix;
}

function topicAliasShardChipMeta(shard) {
  if (!shard) return '';
  if (shard.children.length) return `${shard.children.length} shards`;
  return `${shard.totalAliases} aliases`;
}

function topicAliasShardPath(prefix, extension = 'html') {
  if (extension === 'html') return `/topics/index/${prefix}/`;
  return `/topics/index/${prefix}.${extension}`;
}

function renderTopicIndex(aliasTargets, topics, rootShards = buildTopicAliasShards(aliasTargets)) {
  const letters = new Set(rootShards.map((shard) => shard.prefix));
  const allShards = flattenTopicAliasShards(rootShards);
  const lines = [
    '# Jiang Lens Topic Router',
    '',
    'Generated static topic router for agents. Prefer the human-readable HTML router at https://jianglens.com/topics/ when browser access is available. Use topic pages to find evidence; cite source readings, transcript anchors, source refs, and video timestamps in final answers. Do not load the bulk transcript-search files first for ordinary topic questions.',
    '',
    'Lookup order:',
    '',
    '1. Normalize the user topic to lowercase words, remove punctuation, and join words with hyphens.',
    '2. Try `/topics/{normalized-topic}/` directly when HTML pages are available; use `/topics/{normalized-topic}.txt` only as a fallback mirror.',
    '3. If that route is missing or ambiguous, open the first-letter shard under `/topics/index/{first-letter}.txt`.',
    '4. If the shard is split, follow the narrower prefix shard that matches the normalized topic. Leaf shards are capped at 50 aliases.',
    '5. Open the canonical HTML topic dossier linked by the shard or alias route.',
    '6. Use the topic dossier to choose the best source reading, transcript anchor, source ref, and video timestamp to cite.',
    '7. Use bulk transcript-search only as a fallback when no topic dossier exists.',
    '',
    `Canonical topics: ${topics.size}`,
    `Static aliases: ${aliasTargets.size}`,
    `Static alias shards: ${allShards.length}`,
    `Leaf shard limit: ${TOPIC_ALIAS_SHARD_LIMIT} aliases`,
    '',
    '## Letter Shards',
    '',
  ];

  for (const letter of [...letters].sort()) {
    const shard = rootShards.find((item) => item.prefix === letter);
    const shardMeta = shard?.children.length ? `${shard.totalAliases} aliases, ${shard.children.length} prefix shards` : `${shard?.totalAliases ?? 0} aliases`;
    lines.push(`- ${markdownLink(`/topics/index/${letter}.txt`, publicPath(`/topics/index/${letter}.txt`))} (${shardMeta})`);
  }
  lines.push('');

  return `${lines.join('\n').trim()}\n`;
}

function renderTopicIndexHtml(aliasTargets, topics, rootShards = buildTopicAliasShards(aliasTargets)) {
  const letters = rootShards.map((shard) => shard.prefix);
  const shardByPrefix = new Map(rootShards.map((shard) => [shard.prefix, shard]));
  const allShards = flattenTopicAliasShards(rootShards);
  const featured = rankedTopicsForIndex(topics, 10);

  const content = `
      <section class="hero router-hero">
        <div class="hero-inner">
          <div class="hero-topline">
            <p class="eyebrow">Topic router</p>
            <div class="hero-meta" aria-label="Topic router counts">
              <span>${topics.size} canonical topics</span>
              <span>${aliasTargets.size} static aliases</span>
              <span>${allShards.length} capped shards</span>
            </div>
          </div>
          <p class="lead">Use this static router to resolve a user topic into a generated dossier; final citations should point to source readings, transcript anchors, source refs, and video timestamps.</p>
          <h1>Topic Router</h1>
          <p class="topic-summary">Start with the topic page, use it to locate source-backed evidence, and cite the underlying readings or transcript coordinates.</p>
          <div class="toolbar">
            ${htmlAnchor('/skill/', 'Read the skill', 'button primary')}
            ${htmlAnchor('/topics/index.txt', 'Text router', 'button')}
            ${htmlAnchor('/data/lens/transcript-search.txt', 'Transcript search fallback', 'button')}
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Browse By Letter</h2>
        <div class="chips letter-links router-letters">${letters.map((letter) => `<a class="chip compact" href="${escapeHtml(htmlHref(publicPath(`/topics/index/${letter}/`)))}">
          <strong>${escapeHtml(letter.toUpperCase())}</strong><span>${escapeHtml(topicAliasShardChipMeta(shardByPrefix.get(letter)))}</span>
        </a>`).join('')}</div>
      </section>

      ${featured.length ? `<section class="section">
        <h2>Top Ranked Topics</h2>
        <div class="source-list">${featured.map((topic) => `<article class="source-row">
          <div class="source-row-main">
            <div class="source-copy">
              <div class="row-title-line">
                <div class="title-meta">
                  <h3>${htmlAnchor(publicPath(`/topics/${topic.slug}/`), topic.label)}</h3>
                  <p class="meta">${escapeHtml(topic.slug)}</p>
                </div>
                <span class="type-badge">Score ${rankTopicForIndex(topic)}</span>
              </div>
              <div class="source-links">
                <span class="source-label">Signals:</span>
                <span class="ref-group">
                  <span class="ref-pill">${topic.transcriptHits.length} transcript hits</span>
                  <span class="source-sep" aria-hidden="true">|</span>
                  <span class="ref-pill">${topic.sources.size} source readings</span>
                  <span class="source-sep" aria-hidden="true">|</span>
                  <span class="ref-pill">${topic.semanticPoints.length + topic.glossary.length} answer-map points</span>
                </span>
              </div>
            </div>
          </div>
        </article>`).join('')}</div>
      </section>` : ''}

      <section class="section">
        <h2>How This Router Works</h2>
        <div class="note-list">
          <article class="note-row">
            <div class="note-main">
              <div class="note-copy">
                <div class="row-title-line">
                  <div class="title-meta"><h3>What Counts As A Topic</h3></div>
                  <span class="type-badge">Definition</span>
                </div>
                <p>A topic is a mechanically generated evidence bundle. It can come from semantic topic tags, glossary terms, source refs, transcript segment matches, and aliases that point to the same canonical subject.</p>
              </div>
            </div>
          </article>
          <article class="note-row">
            <div class="note-main">
              <div class="note-copy">
                <div class="row-title-line">
                  <div class="title-meta"><h3>Lookup Order</h3></div>
                  <span class="type-badge">Routing</span>
                </div>
                <p>Normalize the topic, try <code>/topics/{topic-slug}/</code>, then use a letter shard when the direct route is missing or ambiguous. Use bulk transcript-search only when no topic dossier exists.</p>
                <p>Large alias shards split recursively by prefix until leaf pages have ${TOPIC_ALIAS_SHARD_LIMIT} aliases or fewer, so agents do not need to parse thousand-row indexes.</p>
              </div>
            </div>
          </article>
        </div>
      </section>
  `;

  return generatedTopicShell({
    title: 'Jiang Lens Topic Router',
    description: 'Generated static topic router for Jiang Lens agents and search-backed browsing tools.',
    canonicalPath: '/topics/',
    alternates: [
      { type: 'text/plain', path: '/topics/index.txt', title: 'Topic router text' },
      { type: 'text/markdown', path: '/topics/index.md', title: 'Topic router Markdown' },
    ],
    content,
  });
}

function renderTopicLetterIndex(shard, topics) {
  const entries = shard.entries;
  const topicGroups = topicAliasGroups(entries, topics);
  const lines = [
    `# Jiang Lens Topic Router: ${topicAliasShardLabel(shard.prefix)}`,
    '',
    'Generated static alias shard. Open the canonical HTML topic page for answer map, source readings, transcript anchors, video timestamps, and source refs. Cite those underlying sources in final answers, not this shard.',
    '',
  ];

  if (shard.children.length) {
    lines.push(`This shard has ${shard.totalAliases} aliases, so it is split into narrower prefix shards. Follow the prefix that matches the normalized topic. Leaf shards are capped at ${TOPIC_ALIAS_SHARD_LIMIT} aliases.`, '', '## Narrower Prefix Shards', '');
    for (const child of shard.children) {
      lines.push(`- ${markdownLink(`/topics/index/${child.prefix}.txt`, publicPath(topicAliasShardPath(child.prefix, 'txt')))} (${child.totalAliases} aliases)`);
    }
    lines.push('');
  }

  if (entries.length) {
    lines.push(shard.children.length ? '## Exact Topics On This Prefix' : '## Topics', '');
  }

  for (const group of topicGroups) {
    const visibleAliases = group.aliases.filter((alias) => alias !== group.slug);
    const aliasText = visibleAliases.length
      ? `; aliases in this shard: ${visibleAliases.map((alias) => `\`${alias}\``).join(', ')}`
      : '';
    lines.push(`- ${markdownLink(group.topic.label, publicPath(`/topics/${group.slug}/`))} (${group.aliases.length} alias${group.aliases.length === 1 ? '' : 'es'}${aliasText}; text mirror: ${publicPath(`/topics/${group.slug}.txt`)})`);
  }
  lines.push('');
  return `${lines.join('\n').trim()}\n`;
}

function topicAliasGroups(entries, topics) {
  const groups = new Map();
  for (const [alias, slug] of entries) {
    const topic = topics.get(slug);
    if (!topic) continue;
    if (!groups.has(slug)) {
      groups.set(slug, {
        slug,
        topic,
        aliases: new Set(),
      });
    }
    groups.get(slug).aliases.add(alias);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      aliases: [...group.aliases].sort((a, b) => {
        if (a === group.slug) return -1;
        if (b === group.slug) return 1;
        return a.localeCompare(b);
      }),
    }))
    .sort((a, b) => {
      const aKey = a.aliases[0] || a.slug;
      const bKey = b.aliases[0] || b.slug;
      return aKey.localeCompare(bKey);
    });
}

function renderTopicAliasRowsHtml(entries, topics) {
  return topicAliasGroups(entries, topics).map((group) => {
    const { topic, slug, aliases } = group;
    const visibleAliases = aliases.filter((alias) => alias !== slug);
    const aliasPreview = visibleAliases.slice(0, 8).join(', ');
    const aliasOverflow = visibleAliases.length > 8 ? `, +${visibleAliases.length - 8} more` : '';
    const answerMapPoints = topic.semanticPoints.length + topic.glossary.length;
    const signalLinks = [
      topic.transcriptHits.length ? `<span class="ref-pill">${topic.transcriptHits.length} transcript hits</span>` : '',
      topic.sources.size ? `<span class="ref-pill">${topic.sources.size} source readings</span>` : '',
      answerMapPoints ? `<span class="ref-pill">${answerMapPoints} answer-map points</span>` : '',
    ].filter(Boolean);
    const signalsHtml = signalLinks.length
      ? `<span class="source-label">Signals:</span>
          <span class="ref-group">${signalLinks.join('<span class="source-sep" aria-hidden="true">|</span>')}</span>`
      : `<span class="meta">No compiled evidence signals yet.</span>`;
    const hasEvidence = topic.transcriptHits.length || topic.sources.size || topic.semanticPoints.length || topic.glossary.length;
    const aliasMeta = visibleAliases.length
      ? `<p class="meta">Aliases in this shard: ${escapeHtml(aliasPreview + aliasOverflow)}</p>`
      : '';
    return `<article class="source-row" data-topic-item data-topic-search="${searchData([aliases, topic.label, topic.slug, [...topic.aliases]])}">
      <div class="source-row-main">
        <div class="source-copy">
          <div class="row-title-line">
            <div class="title-meta">
              <h3>${htmlAnchor(publicPath(`/topics/${slug}/`), topic.label)}</h3>
              <p class="meta">${escapeHtml(topic.slug)}</p>
              ${aliasMeta}
            </div>
            <span class="type-badge">${hasEvidence ? `Score ${rankTopicForIndex(topic)}` : 'Topic'}</span>
          </div>
          <div class="source-links">
            <span class="source-label">Open:</span>
            <span class="ref-group">
              ${htmlAnchor(publicPath(`/topics/${slug}/`), 'Topic brief', 'ref-pill')}
              <span class="source-sep" aria-hidden="true">|</span>
              ${htmlAnchor(publicPath(`/topics/${slug}.txt`), 'Text mirror', 'ref-pill')}
            </span>
            ${signalsHtml}
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderTopicPrefixRowsHtml(shard) {
  return shard.children.map((child) => {
    const isLeaf = !child.children.length;
    const label = topicAliasShardLabel(child.prefix);
    const meta = isLeaf ? `${child.totalAliases} aliases` : `${child.totalAliases} aliases, split`;
    return `<a class="chip compact prefix-chip" href="${escapeHtml(htmlHref(publicPath(topicAliasShardPath(child.prefix))))}" data-topic-item data-topic-search="${searchData([child.prefix, label, child.totalAliases, isLeaf ? 'leaf' : 'split'])}">
      <strong>${escapeHtml(label)}</strong><span>${escapeHtml(meta)}</span>
    </a>`;
  }).join('');
}

function renderTopicLetterIndexHtml(shard, rootShards, topics) {
  const entries = shard.entries;
  const topicGroups = topicAliasGroups(entries, topics);
  const rows = renderTopicAliasRowsHtml(entries, topics);
  const childRows = renderTopicPrefixRowsHtml(shard);
  const allLetters = rootShards.map((rootShard) => rootShard.prefix);
  const shardByPrefix = new Map(rootShards.map((rootShard) => [rootShard.prefix, rootShard]));
  const resultLabel = shard.children.length ? 'routes' : 'topics';
  const searchableCount = shard.children.length + topicGroups.length;
  const content = `
      <section class="hero router-hero">
        <div class="hero-inner">
          <div class="hero-topline">
            <p class="eyebrow">Topic aliases</p>
            <div class="hero-meta" aria-label="Alias shard counts">
              <span>${shard.totalAliases} aliases</span>
              ${shard.children.length ? `<span>${shard.children.length} prefix shards</span>` : `<span>${topicGroups.length} visible topics</span>`}
            </div>
          </div>
          <p class="lead">Generated alias shard for topic lookup. Open the canonical topic page to find source readings, transcript anchors, source refs, and video timestamps.</p>
          <h1>Topic Router: ${escapeHtml(topicAliasShardLabel(shard.prefix))}</h1>
          <p class="topic-summary">${shard.children.length ? `This shard is split because it has more than ${TOPIC_ALIAS_SHARD_LIMIT} aliases. Follow the narrower prefix that matches the normalized topic.` : 'Resolve an alias to its canonical topic brief, then cite the underlying evidence.'}</p>
          <div class="toolbar">
            ${htmlAnchor('/topics/', 'All topic letters', 'button primary')}
            ${htmlAnchor(topicAliasShardPath(shard.prefix, 'txt'), 'Text shard', 'button')}
            ${htmlAnchor(topicAliasShardPath(shard.prefix, 'md'), 'Markdown shard', 'button')}
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Browse By Letter</h2>
        <div class="chips letter-links router-letters">${allLetters.map((entryLetter) => `<a class="chip compact" href="${escapeHtml(htmlHref(publicPath(topicAliasShardPath(entryLetter))))}"${entryLetter === shard.prefix ? ' aria-current="page"' : ''}>
          <strong>${escapeHtml(entryLetter.toUpperCase())}</strong><span>${escapeHtml(topicAliasShardChipMeta(shardByPrefix.get(entryLetter)))}</span>
        </a>`).join('')}</div>
      </section>

      <section class="section controls">
        <div class="search-field">
          <label for="alias-search">Search aliases</label>
          <input id="alias-search" type="search" inputmode="search" autocomplete="off" placeholder="${shard.children.length ? 'Search prefix shards or exact aliases' : 'Search aliases or canonical topics'}" data-topic-search-input>
          <button class="clear-search" type="button" data-clear-search>Clear</button>
        </div>
        <p class="results-row" data-results-count data-results-label="${resultLabel}">Showing ${searchableCount} ${resultLabel}</p>
        <p class="empty-state" data-empty-state>No matching routes in this shard.</p>
      </section>

      ${childRows ? `<section class="section">
        <h2>Narrow By Prefix</h2>
        <div class="chips letter-links prefix-links">${childRows}</div>
      </section>` : ''}

      ${rows ? `<section class="section">
        <h2>${shard.children.length ? 'Exact Topics On This Prefix' : 'Topics'}</h2>
        <div class="source-list">${rows}</div>
      </section>` : ''}
  `;

  return generatedTopicShell({
    title: `Jiang Lens Topic Router: ${topicAliasShardLabel(shard.prefix)}`,
    description: 'Generated static topic alias shard for Jiang Lens agents and browser tools.',
    canonicalPath: topicAliasShardPath(shard.prefix),
    alternates: [
      { type: 'text/plain', path: topicAliasShardPath(shard.prefix, 'txt'), title: 'Topic shard text' },
      { type: 'text/markdown', path: topicAliasShardPath(shard.prefix, 'md'), title: 'Topic shard Markdown' },
    ],
    content,
  });
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
          if (entry.topic.transcriptHits.length >= 48) continue;
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
    await writeFile(path.join(htmlOutRoot, 'index.html'), renderTopicHtml(topic));
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

  const rootAliasShards = buildTopicAliasShards(activeAliasTargets);
  const allAliasShards = flattenTopicAliasShards(rootAliasShards);
  const topicIndex = renderTopicIndex(activeAliasTargets, activeTopics, rootAliasShards);
  await writeFile(path.join(topicOutRoot, 'index.txt'), topicIndex);
  await writeFile(path.join(topicOutRoot, 'index.md'), topicIndex);
  await writeFile(path.join(topicOutRoot, 'index.html'), renderTopicIndexHtml(activeAliasTargets, activeTopics, rootAliasShards));

  for (const shard of allAliasShards) {
    const content = renderTopicLetterIndex(shard, activeTopics);
    await writeFile(path.join(topicIndexOutRoot, `${shard.prefix}.txt`), content);
    await writeFile(path.join(topicIndexOutRoot, `${shard.prefix}.md`), content);
    const shardOutRoot = path.join(topicIndexOutRoot, shard.prefix);
    await mkdir(shardOutRoot, { recursive: true });
    await writeFile(path.join(shardOutRoot, 'index.html'), renderTopicLetterIndexHtml(shard, rootAliasShards, activeTopics));
  }

  return {
    topics: activeTopics.size,
    aliases: activeAliasTargets.size,
    aliasFiles: aliasFileCount,
    letterShards: rootAliasShards.length,
    aliasShards: allAliasShards.length,
    htmlPages: activeTopics.size + allAliasShards.length + 1,
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

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateHtmlSitemap() {
  const files = await collectAgentSitemapPaths(distRoot, (filePath) => path.basename(filePath) === 'index.html');
  const urls = [...new Set(files.map((file) => urlFor(publicSitemapPath(file))))].sort();
  const urlset = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  const sitemapIndex = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${escapeXml(urlFor('/sitemap-0.xml'))}</loc></sitemap>`,
    '</sitemapindex>',
    '',
  ].join('\n');

  await writeFile(path.join(distRoot, 'sitemap-0.xml'), urlset);
  await writeFile(path.join(distRoot, 'sitemap-index.xml'), sitemapIndex);
  return { count: urls.length };
}

async function generateAgentSitemap() {
  const priorityPaths = [
    '/',
    siteConfig.paths.skillPage,
    siteConfig.paths.llms,
    '/topics/',
    siteConfig.paths.topicIndexText,
    '/topics/knights-templar/',
    '/topics/knights-templar.txt',
    '/topics/templars.txt',
    '/topics/trump/',
    '/topics/trump.txt',
    '/topics/newton/',
    '/topics/newton.txt',
    '/topics/freemasons/',
    '/topics/freemasons.txt',
    siteConfig.paths.episodeIndexText,
    siteConfig.paths.interviewIndexText,
    siteConfig.paths.transcriptSearchText,
    siteConfig.paths.transcriptSearchJson,
    siteConfig.paths.llmsFull,
    siteConfig.paths.skillText,
    siteConfig.paths.skillMarkdown,
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
let cachedTranscriptRefIndex = null;

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

function transcriptRefIndex() {
  if (cachedTranscriptRefIndex) return cachedTranscriptRefIndex;
  cachedTranscriptRefIndex = new Map();

  for (const [collection, root] of [['episodes', episodeDataRoot], ['interviews', interviewDataRoot]]) {
    const indexPath = path.join(root, 'index.json');
    if (!existsSync(indexPath)) continue;

    const parsed = JSON.parse(readFileSync(indexPath, 'utf8'));
    const summaries = parsed[collection] ?? parsed.items ?? [];
    for (const summary of summaries) {
      const sourcePath = path.join(root, `${summary.slug}.json`);
      if (!existsSync(sourcePath)) continue;

      const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
      for (const segment of source.transcript ?? []) {
        if (!segment.source_ref) continue;
        const transcriptUrl = segment.transcript_url || `/${collection}/${source.slug}/transcript/#${segment.id || segment.segment_id}`;
        cachedTranscriptRefIndex.set(segment.source_ref, {
          valid: true,
          collection,
          episode_url: `/${collection}/${source.slug}/`,
          transcript_url: transcriptUrl,
          video_url: segment.video_url || timestampedUrl(source.source_url, segment.start),
          episode_title: source.read?.title || source.title || summary.title || source.slug,
          segment_id: segment.id || segment.segment_id,
          time_label: segment.time_label || '',
        });
      }
    }
  }

  return cachedTranscriptRefIndex;
}

function internalArtifactHref(href, extension = 'md') {
  if (!href || /^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) return href;
  if (!href.startsWith('/')) return href;

  if (extension === 'html') return urlFor(href);

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
    'For questions about Jiang\'s views, use generated topic dossiers, public summaries, and lens pages as the interpretive map, then cite the underlying source reading, transcript coordinate, source ref, and video timestamp. Topic pages are routing and synthesis surfaces, not primary evidence for Jiang-spoken claims.',
    '',
    '1. Read the HTML skill page at /skill/ for attribution, output, and identity rules.',
    '2. Normalize the user topic and use the HTML topic router at /topics/, or try the static topic page at /topics/{topic-slug}/.',
    '3. Use the topic page\'s generated answer map, source readings, related lens links, transcript anchors, video timestamps, and source refs to find evidence.',
    '4. Cite human-readable source readings or lens pages for generated summaries and lens context; cite transcript/video links and source refs for Jiang-spoken quotations.',
    '5. Use .txt, .md, JSON, and bulk transcript-search surfaces only as fallback/offline audit surfaces, because they may be too large or may be cited instead of the source page.',
    '6. After answering, offer one useful next source path: exact transcript hits, a lecture/source reading, related lens concepts, or a deeper report.',
    '7. Use GitHub only for implementation, provenance, or source-file audit questions, not as the primary source for Jiang-content answers.',
    '',
    '## Agent Entry Points',
    '',
    `- [Jiang Lens skill HTML](${urlFor(siteConfig.paths.skillPage)})`,
    `- [Static topic router HTML](${urlFor('/topics/')})`,
    `- [Jiang Lens skill text fallback](${urlFor(siteConfig.paths.skillText)})`,
    `- [Jiang Lens skill Markdown fallback](${urlFor(siteConfig.paths.skillMarkdown)})`,
    `- [Static topic router text fallback](${urlFor(siteConfig.paths.topicIndexText)})`,
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
    `- Knights Templar / templars: ${urlFor('/topics/knights-templar/')} (text alias: ${urlFor('/topics/templars.txt')})`,
    `- Trump: ${urlFor('/topics/trump/')}`,
    `- Isaac Newton / Newton: ${urlFor('/topics/newton/')}`,
    `- Freemasons: ${urlFor('/topics/freemasons/')}`,
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
    `Fetch ${urlFor('/topics/')} for the generated static HTML topic router. Use text mirrors such as ${urlFor(siteConfig.paths.topicIndexText)} or ${urlFor('/topics/knights-templar.txt')} only as fallback or audit surfaces.`,
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
  const htmlSitemap = await generateHtmlSitemap();

  console.log(`Generated llms.txt, llms-full.txt, ${copiedSkillText ? 'skill.txt, ' : ''}${files.length} raw docs, ${episodeMarkdown?.count ?? 0} episode text/Markdown files, ${interviewMarkdown?.count ?? 0} interview text/Markdown files, ${topicShards?.topics ?? 0} topic shards, ${topicShards?.aliases ?? 0} topic aliases, ${topicShards?.htmlPages ?? 0} topic HTML pages, ${agentSitemap.count} agent sitemap URLs, ${htmlSitemap.count} HTML sitemap URLs, ${transcriptSearchText?.count ?? 0} transcript search text records, and public lens JSON.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
