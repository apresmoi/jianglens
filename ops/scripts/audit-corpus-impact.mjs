#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findCorpusImpactFiles, validateCorpusImpactFiles } from "./validate-corpus-impact.mjs";
import {
  normalizeSourcePolicy,
  readSourceProcessingPolicy,
} from "./lib/source-processing-policy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
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

function yamlScalar(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) return null;
  const value = match[1].trim();
  if (!value || value === "null") return null;
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

async function readSourceMeta(slug) {
  const filePath = path.join(repoRoot, "content/sources/videos", slug, "source.yaml");
  try {
    const raw = await readFile(filePath, "utf8");
    return {
      slug,
      title: yamlScalar(raw, "title"),
      video_id: yamlScalar(raw, "video_id"),
      source_date: yamlScalar(raw, "recorded_at") || yamlScalar(raw, "published_at"),
      source_class: yamlScalar(raw, "source_class") || (slug.startsWith("interview-") ? "interview" : "episode"),
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        slug,
        title: null,
        video_id: null,
        source_date: null,
        source_class: slug.startsWith("interview-") ? "interview" : "episode",
      };
    }
    throw error;
  }
}

function dateMs(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Date.parse(`${value}T00:00:00.000Z`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const strict = args.has("strict");
  const allMissing = strict || args.has("all-missing");
  const freshDays = Number(option(args, "fresh-days", "7"));
  const limit = Number(option(args, "limit", "5"));
  const sourcePolicy = await readSourceProcessingPolicy(repoRoot);
  const nonIndependentVideoIds = new Set(Object.entries(sourcePolicy.sources ?? {})
    .filter(([, entry]) => normalizeSourcePolicy(entry).counts_as_independent_source === false)
    .map(([key]) => key.split("/").pop())
    .filter(Boolean));

  const episodeSlugs = (await listDirs(path.join(repoRoot, "content/lens/episodes")))
    .filter((slug) => existsSync(path.join(repoRoot, "content/lens/episodes", slug, "read.json")));
  const episodeMetas = await Promise.all(episodeSlugs.map(readSourceMeta));
  const independentEpisodeMetas = episodeMetas
    .filter((meta) => !meta.video_id || !nonIndependentVideoIds.has(meta.video_id));
  const independentEpisodeSlugs = independentEpisodeMetas.map((meta) => meta.slug);
  const impactFiles = await findCorpusImpactFiles(repoRoot);
  const impactSlugs = impactFiles.map((filePath) => path.basename(path.dirname(filePath))).sort();
  const impactSlugSet = new Set(impactSlugs);
  const episodeSlugSet = new Set(episodeSlugs);

  const allMissingSlugs = independentEpisodeSlugs.filter((slug) => !impactSlugSet.has(slug));
  const missingDetails = await Promise.all(allMissingSlugs.map(readSourceMeta));
  const datedSourceTimes = independentEpisodeMetas
    .map((meta) => dateMs(meta.source_date))
    .filter((value) => value !== null);
  const newestSourceTime = datedSourceTimes.length ? Math.max(...datedSourceTimes) : null;
  const freshCutoff = newestSourceTime !== null && Number.isFinite(freshDays)
    ? newestSourceTime - freshDays * 24 * 60 * 60 * 1000
    : null;
  const sortedMissingDetails = missingDetails.sort((a, b) => {
    const left = dateMs(a.source_date) ?? 0;
    const right = dateMs(b.source_date) ?? 0;
    return right - left || a.slug.localeCompare(b.slug);
  });
  const activeMissingDetails = allMissing
    ? sortedMissingDetails
    : sortedMissingDetails
      .filter((entry) => {
        const sourceTime = dateMs(entry.source_date);
        return freshCutoff !== null && sourceTime !== null && sourceTime >= freshCutoff;
      })
      .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 5);
  const missing = activeMissingDetails.map((entry) => entry.slug);
  const extra = impactSlugs.filter((slug) => !episodeSlugSet.has(slug));
  const validation_errors = await validateCorpusImpactFiles(impactFiles, { repoRoot });

  const status = validation_errors.length
    ? "invalid"
    : strict && allMissingSlugs.length
      ? "incomplete"
      : "ok";

  const result = {
    status,
    strict,
    mode: allMissing ? "all-missing" : "budget-fresh-window",
    source_processing_policy: sourcePolicy.policy_path,
    budget_note: allMissing
      ? null
      : "Default audit intentionally hides historical impact backfill from scheduled agents. Use --all-missing or --strict for maintainer-directed full backlog work.",
    fresh_days: allMissing ? null : freshDays,
    limit: allMissing ? null : limit,
    episodes: episodeSlugs.length,
    independent_episodes: independentEpisodeSlugs.length,
    nonindependent_published_sources: episodeSlugs.length - independentEpisodeSlugs.length,
    impact_files: impactFiles.length,
    full_missing_count: allMissingSlugs.length,
    missing_count: missing.length,
    missing,
    missing_details: activeMissingDetails,
    historical_missing_count: allMissing
      ? 0
      : Math.max(0, allMissingSlugs.length - activeMissingDetails.length),
    extra,
    validation_errors,
    next: missing.length
      ? "Run agents with .codex/skills/jiang-corpus-impact-pass/SKILL.md for missing episodes."
      : allMissingSlugs.length
        ? "No fresh missing corpus-impact items in the budget window. Historical backfill is paused unless the maintainer explicitly asks."
        : "All published episodes have corpus-impact.json files.",
  };

  console.log(JSON.stringify(result, null, 2));

  if (validation_errors.length || (strict && allMissingSlugs.length)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
