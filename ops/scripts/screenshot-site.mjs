#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import playwright from '../../website/node_modules/playwright-core/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(repoRoot, 'ops/staging/screenshots');
const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const viewports = [
  { name: 'desktop', width: 1440, height: 1200 },
  { name: 'mobile', width: 390, height: 1000 },
];

const { chromium } = playwright;

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(outputDir, `${viewport.name}.png`),
      fullPage: false,
    });

    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));

    console.log(`${viewport.name}: ${viewport.width}x${viewport.height}`, dimensions);
    await page.close();
  }
} finally {
  await browser.close();
}
