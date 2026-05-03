#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findCorpusImpactFiles, validateCorpusImpactFiles } from "./validate-corpus-impact.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  return {
    strict: argv.includes("--strict"),
  };
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const episodeSlugs = (await listDirs(path.join(repoRoot, "content/lens/episodes")))
    .filter((slug) => existsSync(path.join(repoRoot, "content/lens/episodes", slug, "read.json")));
  const impactFiles = await findCorpusImpactFiles(repoRoot);
  const impactSlugs = impactFiles.map((filePath) => path.basename(path.dirname(filePath))).sort();
  const impactSlugSet = new Set(impactSlugs);
  const episodeSlugSet = new Set(episodeSlugs);

  const missing = episodeSlugs.filter((slug) => !impactSlugSet.has(slug));
  const extra = impactSlugs.filter((slug) => !episodeSlugSet.has(slug));
  const validation_errors = await validateCorpusImpactFiles(impactFiles, { repoRoot });

  const status = validation_errors.length
    ? "invalid"
    : args.strict && missing.length
      ? "incomplete"
      : "ok";

  const result = {
    status,
    strict: args.strict,
    episodes: episodeSlugs.length,
    impact_files: impactFiles.length,
    missing_count: missing.length,
    missing,
    extra,
    validation_errors,
    next: missing.length
      ? "Run agents with .codex/skills/jiang-corpus-impact-pass/SKILL.md for missing episodes."
      : "All published episodes have corpus-impact.json files.",
  };

  console.log(JSON.stringify(result, null, 2));

  if (validation_errors.length || (args.strict && missing.length)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
