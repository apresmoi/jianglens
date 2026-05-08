#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, true);
    } else {
      args.set(key, next);
      i += 1;
    }
  }
  return args;
}

function usage() {
  return `Usage:
  node ops/scripts/process-video-e2e.mjs --video-id VIDEO_ID [--channel @PredictiveHistory|Interviews/<host-channel-id>]`;
}

function required(args, key) {
  const value = args.get(key);
  if (!value || value === true) throw new Error(`Missing --${key}\n\n${usage()}`);
  return value;
}

async function runNode(script, args) {
  const { stdout } = await execFileAsync("node", [script, ...args], {
    cwd: repoRoot,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (stdout.trim()) console.log(stdout.trim());
  return stdout.trim();
}

function lastJson(stdout) {
  const start = stdout.lastIndexOf("\n{");
  const json = start === -1 ? stdout : stdout.slice(start + 1);
  return JSON.parse(json);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const videoId = required(args, "video-id");
  const channel = args.get("channel");

  const importArgs = ["--video-id", videoId];
  if (channel && channel !== true) importArgs.push("--channel", channel);
  const importStdout = await runNode("ops/scripts/import-colab-video.mjs", importArgs);
  const imported = lastJson(importStdout);
  const sourceDir = imported.output_dir;
  const sourceSlug = path.basename(sourceDir);
  const collection = imported.collection === "interviews" ? "interviews" : "episodes";
  const publicBase = collection === "interviews" ? "/interviews" : "/episodes";
  const boundaryCandidates = path.join("content/workflow/tasks", sourceSlug, "transcript-boundary-candidates.jsonl");
  const boundaryDecisions = path.join("content/workflow/reviews", sourceSlug, "transcript-boundary-decisions.json");

  const boundaryStdout = await runNode("ops/scripts/repair-transcript-boundaries.mjs", [
    "--source", sourceDir,
    "--review-out", boundaryCandidates,
  ]);
  const boundaryInfo = lastJson(boundaryStdout);
  if (boundaryInfo.candidates > 0) {
    if (!await exists(path.join(repoRoot, boundaryDecisions))) {
      console.log(JSON.stringify({
        status: "pending-boundary-review",
        source_id: imported.source_id,
        candidate_file: boundaryCandidates,
        decision_file: boundaryDecisions,
        candidates: boundaryInfo.candidates,
        next: "Run an agent with .codex/skills/jiang-transcript-boundary-review/SKILL.md, then rerun this command.",
      }, null, 2));
      return;
    }

    await runNode("ops/scripts/repair-transcript-boundaries.mjs", [
      "--source", sourceDir,
      "--decisions", boundaryDecisions,
      "--write",
    ]);
  }

  await runNode("ops/scripts/inspect-source.mjs", [sourceDir]);

  const packetStdout = await runNode("ops/scripts/prepare-agent-transcript-packets.mjs", [
    "--source", sourceDir,
  ]);
  const packetInfo = lastJson(packetStdout);
  const manifest = JSON.parse(await fs.readFile(path.join(repoRoot, packetInfo.manifest), "utf8"));
  const proposalDir = path.join("content/workflow/proposals", manifest.source_slug);
  const expected = Array.from({ length: manifest.packet_count }, (_, index) =>
    path.join(proposalDir, `packet-${String(index + 1).padStart(4, "0")}.semantic.json`),
  );
  const missing = [];
  for (const filePath of expected) {
    if (!await exists(path.join(repoRoot, filePath))) missing.push(filePath);
  }

  if (missing.length) {
    console.log(JSON.stringify({
      status: "pending-agent-packets",
      source_id: imported.source_id,
      packet_file: packetInfo.packet_file,
      missing,
      next: "Run agents with .codex/skills/jiang-agent-transcript-pass/SKILL.md, then rerun this command.",
    }, null, 2));
    return;
  }

  await runNode("ops/scripts/validate-agent-pass.mjs", expected);
  const aggregateStdout = await runNode("ops/scripts/aggregate-agent-passes.mjs", [
    "--source", sourceDir,
  ]);
  const aggregate = lastJson(aggregateStdout);
  await runNode("ops/scripts/compile-content.mjs", []);
  await runNode("ops/scripts/validate-content.mjs", []);

  console.log(JSON.stringify({
    status: "published",
    source_id: imported.source_id,
    source_class: imported.source_class ?? (collection === "interviews" ? "interview" : "episode"),
    collection,
    semantic_bundle: `content/lens/evidence/videos/${manifest.source_slug}.semantic.json`,
    episode_data: `website/src/data/lens/${collection}/${manifest.source_slug}.json`,
    website_path: `${publicBase}/${manifest.source_slug}/`,
    counts: {
      claims: aggregate.claims,
      predictions: aggregate.predictions,
      models: aggregate.models,
      glossary_terms: aggregate.glossary_terms,
    },
    next: "Source is published. Corpus impact and lens/canon work are separate downstream jobs.",
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
