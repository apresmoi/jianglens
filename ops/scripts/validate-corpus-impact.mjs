#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(__dirname, "../..");

const impactLevels = [
  "evidence-only",
  "link-existing-lens",
  "extend-existing-concept",
  "create-new-lens-seed",
  "morph-atlas-structure",
  "canon-candidate",
];

const levelRank = new Map(impactLevels.map((level, index) => [level, index]));
const sourceRefPattern = /^(?:video:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4}|article:[a-z0-9][a-z0-9-]*@text:v[0-9]+#p-[0-9]{4}|interview:[a-z0-9][a-z0-9-]*@transcript:v[0-9]+#seg-[0-9]{4})$/;
const looseSourceRefPattern = /\b(?:video|article|interview):[A-Za-z0-9_:@#.-]+/g;
const videoRefPattern = /^video:([^@]+)@transcript:v([0-9]+)#(seg-[0-9]{4})$/;
const sourceBasePattern = /^video:([a-z0-9][a-z0-9-]*)@transcript:v([0-9]+)$/;
const lensPointPattern = /\blens-point:[a-z0-9][a-z0-9-]*\b/g;

const requiredStringFields = [
  "source_slug",
  "source_title",
  "source_ref_base",
  "impact_level",
  "summary",
];

const requiredArrayFields = [
  "existing_lens_links",
  "concept_extensions",
  "new_lens_seeds",
  "atlas_mutations",
  "chronology_notes",
  "canon_candidates",
  "next_actions",
];

const levelArrayRequirements = {
  "link-existing-lens": "existing_lens_links",
  "extend-existing-concept": "concept_extensions",
  "create-new-lens-seed": "new_lens_seeds",
  "morph-atlas-structure": "atlas_mutations",
  "canon-candidate": "canon_candidates",
};

const mutationArrayLevels = {
  existing_lens_links: "link-existing-lens",
  concept_extensions: "extend-existing-concept",
  new_lens_seeds: "create-new-lens-seed",
  atlas_mutations: "morph-atlas-structure",
  canon_candidates: "canon-candidate",
};

function usage() {
  return `Usage:
  node ops/scripts/validate-corpus-impact.mjs [--all]
  node ops/scripts/validate-corpus-impact.mjs content/workflow/proposals/<source-slug>/corpus-impact.json [...]`;
}

async function safeReadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function listDirs(dir) {
  try {
    return (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function findCorpusImpactFiles(repoRoot = defaultRepoRoot) {
  const proposalsRoot = path.join(repoRoot, "content/workflow/proposals");
  const slugs = await listDirs(proposalsRoot);
  return slugs
    .map((slug) => path.join(proposalsRoot, slug, "corpus-impact.json"))
    .filter((filePath) => existsSync(filePath));
}

async function loadLensPointIds(repoRoot, errors) {
  const linkIndexPath = path.join(repoRoot, "website/src/data/lens/link-index.json");
  if (!existsSync(linkIndexPath)) {
    errors.push("Missing website/src/data/lens/link-index.json. Run node ops/scripts/compile-content.mjs");
    return new Set();
  }

  try {
    const linkIndex = await safeReadJson(linkIndexPath);
    return new Set((linkIndex.lens_points ?? []).map((point) => point.id).filter(Boolean));
  } catch (error) {
    errors.push(`Invalid website/src/data/lens/link-index.json: ${error.message}`);
    return new Set();
  }
}

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }

  return out;
}

function parseSimpleYamlValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) return null;
  const value = match[1].trim().replace(/^["']|["']$/g, "");
  return value === "null" ? null : value;
}

async function expectedSourceDate(repoRoot, sourceSlug) {
  const sourcePath = path.join(repoRoot, "content/sources/videos", sourceSlug, "source.yaml");
  if (!existsSync(sourcePath)) return { exists: false, value: null };
  const text = await readFile(sourcePath, "utf8");
  return {
    exists: true,
    value: parseSimpleYamlValue(text, "recorded_at") || parseSimpleYamlValue(text, "published_at"),
  };
}

async function loadSegmentIds(repoRoot, slug, version, cache, errors) {
  const cacheKey = `${slug}:v${version}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const transcriptPath = path.join(repoRoot, "content/sources/videos", slug, "transcripts", `v${version}`, "transcript.clean.jsonl");
  const segmentIds = new Set();
  cache.set(cacheKey, segmentIds);

  if (!existsSync(transcriptPath)) {
    errors.push(`Missing transcript for video refs: ${path.relative(repoRoot, transcriptPath)}`);
    return segmentIds;
  }

  const lines = (await readFile(transcriptPath, "utf8")).trim().split("\n").filter(Boolean);
  for (const [index, line] of lines.entries()) {
    try {
      const item = JSON.parse(line);
      if (item.id) segmentIds.add(item.id);
      const refSegment = String(item.ref ?? "").split("#")[1];
      if (refSegment) segmentIds.add(refSegment);
    } catch (error) {
      errors.push(`${path.relative(repoRoot, transcriptPath)}:${index + 1}: invalid transcript JSON (${error.message})`);
    }
  }

  return segmentIds;
}

async function validateRefExists(repoRoot, ref, fileLabel, cache, errors) {
  const match = ref.match(videoRefPattern);
  if (!match) {
    errors.push(`${fileLabel}: unsupported source ref target ${JSON.stringify(ref)}`);
    return;
  }

  const [, slug, versionRaw, segmentId] = match;
  const segmentIds = await loadSegmentIds(repoRoot, slug, Number(versionRaw), cache, errors);
  if (!segmentIds.has(segmentId)) {
    errors.push(`${fileLabel}: source ref points to missing segment ${JSON.stringify(ref)}`);
  }
}

function highestImpliedLevel(data) {
  let rank = 0;
  for (const [arrayKey, level] of Object.entries(mutationArrayLevels)) {
    if (Array.isArray(data[arrayKey]) && data[arrayKey].length > 0) {
      rank = Math.max(rank, levelRank.get(level));
    }
  }
  return impactLevels[rank];
}

export async function validateCorpusImpactFiles(files, options = {}) {
  const repoRoot = options.repoRoot ?? defaultRepoRoot;
  const errors = [];
  const lensPointIds = await loadLensPointIds(repoRoot, errors);
  const transcriptCache = new Map();

  for (const filePath of files) {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
    const fileLabel = path.relative(repoRoot, absPath);
    let data;

    try {
      data = await safeReadJson(absPath);
    } catch (error) {
      errors.push(`${fileLabel}: invalid JSON (${error.message})`);
      continue;
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      errors.push(`${fileLabel}: root must be an object`);
      continue;
    }

    const allowedKeys = new Set([
      "source_slug",
      "source_title",
      "source_date",
      "source_ref_base",
      "impact_level",
      "summary",
      ...requiredArrayFields,
    ]);
    for (const key of Object.keys(data)) {
      if (!allowedKeys.has(key)) errors.push(`${fileLabel}: unexpected key ${JSON.stringify(key)}`);
    }

    for (const key of requiredStringFields) {
      if (typeof data[key] !== "string" || !data[key].trim()) {
        errors.push(`${fileLabel}: missing non-empty string ${key}`);
      }
    }

    if (!(typeof data.source_date === "string" || data.source_date === null)) {
      errors.push(`${fileLabel}: source_date must be a YYYY-MM-DD string or null`);
    } else if (typeof data.source_date === "string" && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.source_date)) {
      errors.push(`${fileLabel}: source_date must use YYYY-MM-DD`);
    }

    for (const key of requiredArrayFields) {
      if (!Array.isArray(data[key])) errors.push(`${fileLabel}: ${key} must be an array`);
    }

    if (!impactLevels.includes(data.impact_level)) {
      errors.push(`${fileLabel}: impact_level must be one of ${impactLevels.join(", ")}`);
    }

    const expectedParent = path.basename(path.dirname(absPath));
    if (data.source_slug && data.source_slug !== expectedParent) {
      errors.push(`${fileLabel}: source_slug must match parent proposal directory ${JSON.stringify(expectedParent)}`);
    }

    const baseMatch = typeof data.source_ref_base === "string" ? data.source_ref_base.match(sourceBasePattern) : null;
    if (!baseMatch) {
      errors.push(`${fileLabel}: source_ref_base must look like video:<source-slug>@transcript:v1`);
    } else if (data.source_slug && baseMatch[1] !== data.source_slug) {
      errors.push(`${fileLabel}: source_ref_base slug must match source_slug`);
    }

    const sourceDir = path.join(repoRoot, "content/sources/videos", data.source_slug ?? "");
    if (data.source_slug && !existsSync(path.join(sourceDir, "source.yaml"))) {
      errors.push(`${fileLabel}: missing source folder for ${data.source_slug}`);
    }

    if (data.source_slug && !existsSync(path.join(repoRoot, "content/lens/episodes", data.source_slug, "read.json"))) {
      errors.push(`${fileLabel}: missing public episode read for ${data.source_slug}`);
    }

    if (data.source_slug && !existsSync(path.join(repoRoot, "website/src/data/lens/episodes", `${data.source_slug}.json`))) {
      errors.push(`${fileLabel}: missing generated episode JSON for ${data.source_slug}. Run node ops/scripts/compile-content.mjs`);
    }

    if (data.source_slug) {
      const expectedDate = await expectedSourceDate(repoRoot, data.source_slug);
      if (expectedDate.exists && expectedDate.value && data.source_date !== expectedDate.value) {
        errors.push(`${fileLabel}: source_date ${JSON.stringify(data.source_date)} does not match source.yaml date ${JSON.stringify(expectedDate.value)}`);
      }
    }

    if (impactLevels.includes(data.impact_level)) {
      const requiredArray = levelArrayRequirements[data.impact_level];
      if (requiredArray && Array.isArray(data[requiredArray]) && data[requiredArray].length === 0) {
        errors.push(`${fileLabel}: impact_level ${data.impact_level} requires non-empty ${requiredArray}`);
      }

      const implied = highestImpliedLevel(data);
      if (levelRank.get(implied) > levelRank.get(data.impact_level)) {
        errors.push(`${fileLabel}: impact_level ${data.impact_level} is lower than non-empty mutation arrays imply (${implied})`);
      }
    }

    const strings = collectStrings(data);
    for (const value of strings) {
      const looseRefs = value.match(looseSourceRefPattern) ?? [];
      for (const ref of looseRefs) {
        if (!sourceRefPattern.test(ref) && ref !== data.source_ref_base) {
          errors.push(`${fileLabel}: malformed source ref ${JSON.stringify(ref)}`);
        } else if (sourceRefPattern.test(ref)) {
          await validateRefExists(repoRoot, ref, fileLabel, transcriptCache, errors);
        }
      }

      const lensIds = value.match(lensPointPattern) ?? [];
      for (const id of lensIds) {
        if (!lensPointIds.has(id)) {
          errors.push(`${fileLabel}: unknown lens point ${JSON.stringify(id)}. Run compile-content or create the lens point first.`);
        }
      }
    }
  }

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const useAll = args.length === 0 || args.includes("--all");
  const files = useAll
    ? await findCorpusImpactFiles(defaultRepoRoot)
    : args.filter((arg) => arg !== "--all");

  if (!files.length && !useAll) throw new Error(usage());

  const errors = await validateCorpusImpactFiles(files, { repoRoot: defaultRepoRoot });
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${files.length} corpus impact file(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
