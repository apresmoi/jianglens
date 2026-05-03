#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fetchYoutubeMetadata } from "./lib/youtube-metadata.mjs";

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
  node ops/scripts/fetch-youtube-metadata.mjs --video-id VIDEO_ID [--out PATH]`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const videoId = args.get("video-id");
  if (!videoId || videoId === true) throw new Error(`Missing --video-id\n\n${usage()}`);

  const metadata = await fetchYoutubeMetadata(videoId);
  const json = `${JSON.stringify(metadata, null, 2)}\n`;
  const out = args.get("out");
  if (out && out !== true) {
    await fs.mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await fs.writeFile(out, json);
  } else {
    process.stdout.write(json);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
