#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '..');
const distRoot = path.join(websiteRoot, 'dist');

const forbidden = [
  /127\.0\.0\.1/g,
  /localhost/g,
  /to be selected before launch/gi,
  /to be published before launch/gi,
];

const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.md',
  '.txt',
  '.xml',
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  if (!existsSync(distRoot)) {
    throw new Error('Missing website/dist. Run npm run build first.');
  }

  const failures = [];
  const files = await walk(distRoot);

  for (const file of files) {
    const rel = path.relative(websiteRoot, file);
    const text = await readFile(file, 'utf8');

    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        failures.push(`${rel}: forbidden pattern ${pattern}`);
      }
    }
  }

  const robotsPath = path.join(distRoot, 'robots.txt');
  if (!existsSync(robotsPath)) {
    failures.push('dist/robots.txt: missing');
  } else {
    const robots = await readFile(robotsPath, 'utf8');
    if (!robots.includes('Sitemap: https://jianglens.com/sitemap-index.xml')) {
      failures.push('dist/robots.txt: missing production sitemap URL');
    }
  }

  if (failures.length) {
    console.error('Production output check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('Production output check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
