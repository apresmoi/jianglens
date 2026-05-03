#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCorpusImpactFiles, validateCorpusImpactFiles } from './validate-corpus-impact.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const contentRoot = path.join(repoRoot, 'content');
const websiteDocsRoot = path.join(repoRoot, 'website/src/content/docs');
const websiteDataRoot = path.join(repoRoot, 'website/src/data/lens');
const websiteEpisodesDataRoot = path.join(websiteDataRoot, 'episodes');
const authoredExtensions = new Set(['.md', '.mdx', '.yaml', '.yml', '.json', '.jsonl']);

const requiredDirs = [
  'content/sources',
  'content/lens',
  'content/workflow',
  'content/_generated',
  'ops/scripts',
  'ops/schemas',
  'website/src/data/lens',
];

const sourceRefPattern = /\b(?:video:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4}|article:[a-z0-9][a-z0-9-]*@text:v[0-9]+#p-[0-9]{4}|interview:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4})\b/g;
const sourceArtifactPattern = /\b(?:video:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+|article:[a-z0-9][a-z0-9-]*@text:v[0-9]+|interview:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+)\b/g;
const looseSourceRefPattern = /\b(?:video|article|interview):[A-Za-z0-9_:@#.-]+/g;
const sourceIdPattern = /\b(?:video|article|interview):[a-z0-9][a-z0-9-]*\b/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(repoRoot, fullPath);

    if (entry.isDirectory()) {
      if (relPath === 'content/_generated') continue;
      if (relPath === 'content/sources/raw') continue;
      files.push(...await walk(fullPath));
    } else if (entry.isFile() && authoredExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseSimpleYaml(text) {
  const data = {};

  for (const line of text.split('\n')) {
    if (/^\s/.test(line)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (value === '>' || value === '|') continue;
    data[key] = value.replace(/^["']|["']$/g, '');
  }

  return data;
}

function parseMetadata(text, ext) {
  if (ext === '.yaml' || ext === '.yml') return parseSimpleYaml(text);
  if (ext === '.json') {
    try {
      const parsed = JSON.parse(text);
      return parsed && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---', 4);
  if (end === -1) return {};

  const data = {};
  for (const line of text.slice(4, end).trim().split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return data;
}

function collectMalformedRefs(text) {
  const looseRefs = text.match(looseSourceRefPattern) ?? [];
  const validRefs = new Set(text.match(sourceRefPattern) ?? []);
  const validArtifacts = new Set(text.match(sourceArtifactPattern) ?? []);
  const validSourceIds = new Set(text.match(sourceIdPattern) ?? []);
  return looseRefs.filter((ref) => !validRefs.has(ref) && !validArtifacts.has(ref) && !validSourceIds.has(ref));
}

function docSlug(filePath) {
  let slug = path.relative(websiteDocsRoot, filePath).replace(/\.mdx?$/, '');
  if (slug.endsWith('/index')) slug = slug.slice(0, -'/index'.length);
  return slug;
}

function splitEvidenceRefs(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map((ref) => ref.trim())
    .filter(Boolean);
}

function parseAttrs(value) {
  const attrs = {};
  for (const attr of String(value ?? '').matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)) {
    attrs[attr[1]] = attr[2];
  }
  return attrs;
}

function canonicalLensPointId(id) {
  const value = String(id ?? '').trim();
  if (!value) return '';
  return value.startsWith('lens-point:') ? value : `lens-point:${value}`;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function stripMarkdownForIndex(value) {
  return String(value ?? '')
    .replace(/\[([^\]\n]+)\]\{evidence=(?:"|“)[^"”]+(?:"|”)\}/g, '$1')
    .replace(/\[([^\]\n]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMarkdownBlockAfter(text, index) {
  const lines = text.slice(index).replace(/^\s+/, '').split('\n');
  const body = [];
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isAnchor = /^<(span|a)\b[^>]*\bid="[^"]+"[^>]*>\s*<\/\1>$/.test(trimmed);
    const isComment = /^<!--/.test(trimmed);

    if (!started && (!trimmed || isAnchor || isComment)) {
      continue;
    }

    if (!started) {
      if (/^#{1,6}\s+/.test(trimmed) || /^:::/.test(trimmed)) break;
      started = true;
    }

    if (!trimmed) break;
    body.push(line);
  }

  return body.join('\n').trim();
}

function extractDocEvidenceMarks(text, relPath, slug) {
  const marks = [];
  const evidencePattern = /\[([^\]\n]+)\]\{evidence=(?:"|“)([^"”]+)(?:"|”)\}/g;
  let match;

  while ((match = evidencePattern.exec(text)) !== null) {
    marks.push({
      id: `doc-evidence:${slug || 'index'}:${String(marks.length + 1).padStart(4, '0')}`,
      doc_slug: slug,
      doc_path: relPath,
      line: lineNumberForIndex(text, match.index),
      text: match[1].trim().replace(/\s+/g, ' '),
      refs: splitEvidenceRefs(match[2]),
    });
  }

  return marks;
}

function extractDocLensPoints(text, relPath, slug) {
  const points = [];
  const pointPattern = /<!--\s*lens-point\s+([^>]*?)\s*-->/g;
  let match;

  while ((match = pointPattern.exec(text)) !== null) {
    const attrs = parseAttrs(match[1]);
    const anchorId = String(attrs.id ?? '').trim();
    const bodyMd = firstMarkdownBlockAfter(text, pointPattern.lastIndex);
    points.push({
      id: canonicalLensPointId(anchorId),
      anchor_id: anchorId,
      concept: attrs.concept ?? null,
      doc_slug: slug,
      doc_path: relPath,
      line: lineNumberForIndex(text, match.index),
      text: stripMarkdownForIndex(bodyMd),
      refs: splitEvidenceRefs(attrs.evidence),
    });
  }

  return points;
}

async function collectDocEvidenceMarks() {
  if (!existsSync(websiteDocsRoot)) return [];
  const files = (await walk(websiteDocsRoot)).filter((filePath) => {
    const ext = path.extname(filePath);
    return ext === '.md' || ext === '.mdx';
  });
  const marks = [];

  for (const filePath of files.sort()) {
    const relPath = path.relative(repoRoot, filePath);
    const text = await readFile(filePath, 'utf8');
    marks.push(...extractDocEvidenceMarks(text, relPath, docSlug(filePath)));
  }

  return marks;
}

async function collectDocLensPoints() {
  if (!existsSync(websiteDocsRoot)) return [];
  const files = (await walk(websiteDocsRoot)).filter((filePath) => {
    const ext = path.extname(filePath);
    return ext === '.md' || ext === '.mdx';
  });
  const points = [];

  for (const filePath of files.sort()) {
    const relPath = path.relative(repoRoot, filePath);
    const text = await readFile(filePath, 'utf8');
    points.push(...extractDocLensPoints(text, relPath, docSlug(filePath)));
  }

  return points;
}

function videoRefParts(ref) {
  const match = String(ref ?? '').match(/^video:([^@]+)@transcript:v([0-9]+)#(seg-[0-9]{4})$/);
  if (!match) return null;
  return {
    slug: match[1],
    version: Number(match[2]),
    segmentId: match[3],
  };
}

async function readJson(filePath, errors, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push(`Invalid JSON in ${label}: ${error.message}`);
    return null;
  }
}

async function listJsonFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(dir, entry.name))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function validateGeneratedVideoRef(ref, detail, context, errors) {
  if (!sourceRefPattern.test(ref)) {
    errors.push(`Malformed ${context.kind} ref "${ref}" in ${context.location}`);
  }
  sourceRefPattern.lastIndex = 0;

  const parsed = videoRefParts(ref);
  if (!parsed) {
    errors.push(`Unsupported ${context.kind} ref target "${ref}" in ${context.location}`);
    return;
  }

  const episodePath = path.join(websiteEpisodesDataRoot, `${parsed.slug}.json`);
  if (!existsSync(episodePath)) {
    errors.push(`${context.kind} ref points to missing episode JSON "${ref}" in ${context.location}`);
    return;
  }

  const episode = await readJson(episodePath, errors, `website/src/data/lens/episodes/${parsed.slug}.json`);
  if (!episode) return;
  const segment = (episode.transcript ?? []).find((item) => item.id === parsed.segmentId || item.ref?.endsWith(`#${parsed.segmentId}`));
  if (!segment) {
    errors.push(`${context.kind} ref points to missing transcript segment "${ref}" in ${context.location}`);
  }

  if (!detail || detail.valid !== true) {
    errors.push(`Generated refs_detail is missing or invalid for "${ref}" in ${context.id}`);
  }
}

async function validateGeneratedLinkIndex(errors) {
  const linkIndexPath = path.join(websiteDataRoot, 'link-index.json');
  if (!existsSync(linkIndexPath)) return;

  const authoredMarks = await collectDocEvidenceMarks();
  const authoredLensPoints = await collectDocLensPoints();
  const authoredById = new Map(authoredMarks.map((mark) => [mark.id, mark]));
  const authoredLensById = new Map();
  for (const point of authoredLensPoints) {
    if (!point.id) {
      errors.push(`Lens point missing id in ${point.doc_path}:${point.line}`);
      continue;
    }
    if (authoredLensById.has(point.id)) {
      errors.push(`Duplicate lens point id "${point.id}" in ${point.doc_path}:${point.line} and ${authoredLensById.get(point.id).doc_path}:${authoredLensById.get(point.id).line}`);
      continue;
    }
    authoredLensById.set(point.id, point);
  }

  const linkIndex = await readJson(linkIndexPath, errors, 'website/src/data/lens/link-index.json');
  if (!linkIndex) return;

  if (!Array.isArray(linkIndex.doc_evidence_marks)) {
    errors.push('Generated link-index.json is missing doc_evidence_marks array');
    return;
  }

  if (!Array.isArray(linkIndex.source_refs)) {
    errors.push('Generated link-index.json is missing source_refs array');
  }

  if (!Array.isArray(linkIndex.lens_points)) {
    errors.push('Generated link-index.json is missing lens_points array');
  }

  if (!Array.isArray(linkIndex.episode_lens_links)) {
    errors.push('Generated link-index.json is missing episode_lens_links array');
  }

  if (linkIndex.doc_evidence_marks.length !== authoredMarks.length) {
    errors.push(`Generated doc evidence mark count is stale: JSON has ${linkIndex.doc_evidence_marks.length}, docs have ${authoredMarks.length}. Run node ops/scripts/compile-content.mjs`);
  }

  const generatedById = new Map();
  for (const mark of linkIndex.doc_evidence_marks) {
    if (!mark?.id) {
      errors.push('Generated doc evidence mark is missing id');
      continue;
    }

    if (generatedById.has(mark.id)) {
      errors.push(`Duplicate generated doc evidence mark id: ${mark.id}`);
    }
    generatedById.set(mark.id, mark);

    const authored = authoredById.get(mark.id);
    if (!authored) {
      errors.push(`Generated doc evidence mark not found in docs: ${mark.id}. Run node ops/scripts/compile-content.mjs`);
      continue;
    }

    if (mark.doc_path !== authored.doc_path || mark.line !== authored.line || mark.text !== authored.text || JSON.stringify(mark.refs) !== JSON.stringify(authored.refs)) {
      errors.push(`Generated doc evidence mark is stale: ${mark.id}. Run node ops/scripts/compile-content.mjs`);
    }

    if (!Array.isArray(mark.refs) || mark.refs.length === 0) {
      errors.push(`Generated doc evidence mark has no refs: ${mark.id}`);
      continue;
    }

    if (!Array.isArray(mark.refs_detail) || mark.refs_detail.length !== mark.refs.length) {
      errors.push(`Generated doc evidence mark refs_detail mismatch: ${mark.id}`);
    }

    for (const ref of mark.refs) {
      const detail = (mark.refs_detail ?? []).find((item) => item.ref === ref);
      await validateGeneratedVideoRef(ref, detail, {
        kind: 'doc evidence',
        id: mark.id,
        location: `${mark.doc_path}:${mark.line}`,
      }, errors);
    }
  }

  for (const authored of authoredMarks) {
    if (!generatedById.has(authored.id)) {
      errors.push(`Doc evidence mark missing from generated JSON: ${authored.id}. Run node ops/scripts/compile-content.mjs`);
    }
  }

  const generatedLensById = new Map();
  if (Array.isArray(linkIndex.lens_points)) {
    if (linkIndex.lens_points.length !== authoredLensPoints.length) {
      errors.push(`Generated lens point count is stale: JSON has ${linkIndex.lens_points.length}, docs have ${authoredLensPoints.length}. Run node ops/scripts/compile-content.mjs`);
    }

    for (const point of linkIndex.lens_points) {
      if (!point?.id) {
        errors.push('Generated lens point is missing id');
        continue;
      }

      if (generatedLensById.has(point.id)) {
        errors.push(`Duplicate generated lens point id: ${point.id}`);
      }
      generatedLensById.set(point.id, point);

      const authored = authoredLensById.get(point.id);
      if (!authored) {
        errors.push(`Generated lens point not found in docs: ${point.id}. Run node ops/scripts/compile-content.mjs`);
        continue;
      }

      if (
        point.doc_path !== authored.doc_path ||
        point.line !== authored.line ||
        point.text !== authored.text ||
        point.concept !== authored.concept ||
        JSON.stringify(point.refs) !== JSON.stringify(authored.refs)
      ) {
        errors.push(`Generated lens point is stale: ${point.id}. Run node ops/scripts/compile-content.mjs`);
      }

      for (const ref of point.refs ?? []) {
        const detail = (point.refs_detail ?? []).find((item) => item.ref === ref);
        await validateGeneratedVideoRef(ref, detail, {
          kind: 'lens point evidence',
          id: point.id,
          location: `${point.doc_path}:${point.line}`,
        }, errors);
      }
    }

    for (const authored of authoredLensPoints) {
      if (!generatedLensById.has(authored.id)) {
        errors.push(`Lens point missing from generated JSON: ${authored.id}. Run node ops/scripts/compile-content.mjs`);
      }
    }
  }

  if (Array.isArray(linkIndex.source_refs)) {
    const refsInMarks = new Set([
      ...linkIndex.doc_evidence_marks.flatMap((mark) => mark.refs ?? []),
      ...(linkIndex.lens_points ?? []).flatMap((point) => point.refs ?? []),
    ]);
    const refsInSourceIndex = new Set(linkIndex.source_refs.map((entry) => entry.ref).filter(Boolean));
    for (const ref of refsInMarks) {
      if (!refsInSourceIndex.has(ref)) {
        errors.push(`Generated source_refs is missing doc evidence ref: ${ref}`);
      }
    }
    if (refsInSourceIndex.size !== linkIndex.source_refs.length) {
      errors.push('Generated source_refs contains duplicate refs');
    }
  }

  if (generatedLensById.size > 0) {
    const episodeFiles = (await listJsonFiles(websiteEpisodesDataRoot))
      .filter((filePath) => path.basename(filePath) !== 'index.json');

    for (const episodePath of episodeFiles) {
      const relPath = path.relative(repoRoot, episodePath);
      const episode = await readJson(episodePath, errors, relPath);
      if (!episode) continue;

      const stack = [{ value: episode.read, path: `${relPath}:read` }];
      while (stack.length) {
        const current = stack.pop();
        if (!current?.value || typeof current.value !== 'object') continue;

        if (Array.isArray(current.value.lens_points)) {
          for (const id of current.value.lens_points) {
            const canonicalId = canonicalLensPointId(id);
            if (!generatedLensById.has(canonicalId)) {
              errors.push(`Episode read points to missing lens point "${canonicalId}" in ${current.path}`);
            }
          }

          for (const detail of current.value.lens_points_detail ?? []) {
            if (!detail?.id || !detail.valid) {
              errors.push(`Episode read has invalid lens point detail in ${current.path}`);
            }
          }
        }

        if (Array.isArray(current.value)) {
          current.value.forEach((item, index) => stack.push({ value: item, path: `${current.path}[${index}]` }));
        } else {
          for (const [key, value] of Object.entries(current.value)) {
            if (value && typeof value === 'object') {
              stack.push({ value, path: `${current.path}.${key}` });
            }
          }
        }
      }
    }
  }
}

async function main() {
  const errors = [];
  const ids = new Map();

  for (const dir of requiredDirs) {
    const fullPath = path.join(repoRoot, dir);
    if (!existsSync(fullPath) || !(await stat(fullPath)).isDirectory()) {
      errors.push(`Missing required directory: ${dir}`);
    }
  }

  const files = await walk(contentRoot);

  for (const filePath of files) {
    const relPath = path.relative(repoRoot, filePath);
    const text = await readFile(filePath, 'utf8');
    const frontmatter = parseMetadata(text, path.extname(filePath));

    if (frontmatter.id) {
      if (ids.has(frontmatter.id)) {
        errors.push(`Duplicate id "${frontmatter.id}" in ${relPath} and ${ids.get(frontmatter.id)}`);
      } else {
        ids.set(frontmatter.id, relPath);
      }
    }

    for (const ref of collectMalformedRefs(text)) {
      errors.push(`Malformed source ref "${ref}" in ${relPath}`);
    }
  }

  for (const generatedFile of [
    'content/_generated/manifest.json',
    'content/_generated/link-index.json',
    'content/_generated/content-index.md',
    'website/src/data/lens/manifest.json',
    'website/src/data/lens/link-index.json',
  ]) {
    if (!existsSync(path.join(repoRoot, generatedFile))) {
      errors.push(`Missing generated file: ${generatedFile}. Run node ops/scripts/compile-content.mjs`);
    }
  }

  await validateGeneratedLinkIndex(errors);

  const corpusImpactFiles = await findCorpusImpactFiles(repoRoot);
  errors.push(...await validateCorpusImpactFiles(corpusImpactFiles, { repoRoot }));

  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${files.length} authored content files and ${ids.size} explicit IDs.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
