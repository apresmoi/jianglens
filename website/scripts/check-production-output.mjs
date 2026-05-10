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

    if (path.extname(file) === '.html') {
      if (text.includes('rel="sitemap" href="/sitemap-index.xml"')) {
        failures.push(`${rel}: still links relative sitemap-index.xml in head`);
      }
      if (text.includes('rel="sitemap" href="https://jianglens.com/sitemap-index.xml"')) {
        failures.push(`${rel}: still links production sitemap-index.xml in head`);
      }
    }
  }

  const robotsPath = path.join(distRoot, 'robots.txt');
  if (!existsSync(robotsPath)) {
    failures.push('dist/robots.txt: missing');
  } else {
    const robots = await readFile(robotsPath, 'utf8');
    if (!robots.includes('Sitemap: https://jianglens.com/sitemap-0.xml')) {
      failures.push('dist/robots.txt: missing production sitemap-0 URL');
    }
    if (!robots.includes('Sitemap: https://jianglens.com/sitemap-agent.txt')) {
      failures.push('dist/robots.txt: missing agent sitemap URL');
    }
    if (robots.includes('Sitemap: https://jianglens.com/sitemap-index.xml')) {
      failures.push('dist/robots.txt: still links sitemap-index.xml');
    }
    for (const expected of [
      'LLMs: https://jianglens.com/llms.txt',
      'LLMs-full: https://jianglens.com/llms-full.txt',
      'Skill: https://jianglens.com/skill.md',
      'Skill-text: https://jianglens.com/skill.txt',
      'Topic-index: https://jianglens.com/topics/index.txt',
      'Agent-sitemap: https://jianglens.com/sitemap-agent.txt',
      'Transcript-search: https://jianglens.com/data/lens/transcript-search.txt',
      'User-agent: ClaudeBot',
      'User-agent: Claude-User',
      'User-agent: Claude-SearchBot',
      'User-agent: PerplexityBot',
      'User-agent: Perplexity-User',
    ]) {
      if (!robots.includes(expected)) {
        failures.push(`dist/robots.txt: missing ${expected}`);
      }
    }
  }

  const skillPath = path.join(distRoot, 'skill.md');
  if (!existsSync(skillPath)) {
    failures.push('dist/skill.md: missing');
  } else {
    const skill = await readFile(skillPath, 'utf8');
    for (const expected of [
      '## Corpus Lookup Output',
      'Timestamp link using `video_url`',
      'Transcript link using `transcript_url`',
      'Stable `source_ref`',
      'Quote excerpts should be brief',
    ]) {
      if (!skill.includes(expected)) {
        failures.push(`dist/skill.md: missing corpus lookup instruction ${expected}`);
      }
    }
  }

  const homePath = path.join(distRoot, 'index.html');
  if (!existsSync(homePath)) {
    failures.push('dist/index.html: missing');
  } else {
    const home = await readFile(homePath, 'utf8');
    if (!home.includes('<link rel="sitemap" href="https://jianglens.com/sitemap-0.xml">')) {
      failures.push('dist/index.html: missing production sitemap-0 head link');
    }
    if (home.includes('<link rel="sitemap" href="https://jianglens.com/sitemap-index.xml">')) {
      failures.push('dist/index.html: still links sitemap-index.xml in head');
    }
    for (const expected of [
      '<meta property="og:image" content="https://jianglens.com/social-card.png">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:image" content="https://jianglens.com/social-card.png">',
    ]) {
      if (!home.includes(expected)) {
        failures.push(`dist/index.html: missing social card tag ${expected}`);
      }
    }
  }

  const sampleHeadPaths = [
    'index.html',
    'episodes/index.html',
    'episodes/predictive-history-6m1z-v3wgok/index.html',
    'episodes/predictive-history-6m1z-v3wgok/transcript/index.html',
    'introduction/index.html',
  ];
  const expectedAlternatesByHeadPath = {
    'index.html': [
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/skill.md"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/skill.txt"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/llms.txt"',
    ],
    'episodes/index.html': [
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/episodes/index.md"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/episodes/index.txt"',
    ],
    'episodes/predictive-history-6m1z-v3wgok/index.html': [
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/episodes/predictive-history-6m1z-v3wgok.md"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/episodes/predictive-history-6m1z-v3wgok.txt"',
    ],
    'episodes/predictive-history-6m1z-v3wgok/transcript/index.html': [
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/transcript.md"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/transcript.txt"',
    ],
    'introduction/index.html': [
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/docs/introduction.md"',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/docs/introduction.txt"',
    ],
  };
  for (const relPath of sampleHeadPaths) {
    const htmlPath = path.join(distRoot, relPath);
    if (!existsSync(htmlPath)) {
      failures.push(`dist/${relPath}: missing sample HTML page`);
      continue;
    }
    const html = await readFile(htmlPath, 'utf8');
    for (const expected of expectedAlternatesByHeadPath[relPath] ?? []) {
      if (!html.includes(expected)) {
        failures.push(`dist/${relPath}: missing alternate head link ${expected}`);
      }
    }
  }

  const requiredAgentFiles = [
    'episodes/index.md',
    'episodes/index.txt',
    'episodes/predictive-history-6m1z-v3wgok.md',
    'episodes/predictive-history-6m1z-v3wgok.txt',
    'episodes/predictive-history-6m1z-v3wgok/transcript.md',
    'episodes/predictive-history-6m1z-v3wgok/transcript.txt',
    'docs/lens/nation-as-god-machine.txt',
    'skill.txt',
    'sitemap-agent.txt',
    'topics/index.html',
    'topics/index.txt',
    'topics/index/k/index.html',
    'topics/index/k.txt',
    'topics/knights-templar/index.html',
    'topics/knights-templar.txt',
    'topics/templars.txt',
    'data/lens/episodes/index.json',
    'data/lens/episodes/predictive-history-6m1z-v3wgok.json',
    'data/lens/transcript-search.txt',
    'data/lens/transcript-search.json',
  ];
  for (const relPath of requiredAgentFiles) {
    if (!existsSync(path.join(distRoot, relPath))) {
      failures.push(`dist/${relPath}: missing agent-facing episode artifact`);
    }
  }

  const sampleEpisodeJsonPath = path.join(distRoot, 'data/lens/episodes/predictive-history-6m1z-v3wgok.json');
  if (existsSync(sampleEpisodeJsonPath)) {
    const sampleEpisodeJson = await readFile(sampleEpisodeJsonPath, 'utf8');
    for (const expected of [
      '"/episodes/predictive-history-6m1z-v3wgok/transcript/#seg-0005"',
      '"https://www.youtube.com/watch?v=6M1Z_V3WgOk&t=360s"',
    ]) {
      if (!sampleEpisodeJson.includes(expected)) {
        failures.push(`dist/data/lens/episodes/predictive-history-6m1z-v3wgok.json: missing ${expected}`);
      }
    }
  }

  const sampleEpisodeIndexJsonPath = path.join(distRoot, 'data/lens/episodes/index.json');
  if (existsSync(sampleEpisodeIndexJsonPath)) {
    const sampleEpisodeIndexJson = await readFile(sampleEpisodeIndexJsonPath, 'utf8');
    if (!sampleEpisodeIndexJson.includes('"/episodes/predictive-history-6m1z-v3wgok.md"')) {
      failures.push('dist/data/lens/episodes/index.json: missing episode Markdown path');
    }
    if (!sampleEpisodeIndexJson.includes('"/episodes/predictive-history-6m1z-v3wgok.txt"')) {
      failures.push('dist/data/lens/episodes/index.json: missing episode text path');
    }
    if (!sampleEpisodeIndexJson.includes('"/episodes/predictive-history-6m1z-v3wgok/transcript.md"')) {
      failures.push('dist/data/lens/episodes/index.json: missing episode transcript Markdown path');
    }
    if (!sampleEpisodeIndexJson.includes('"/episodes/predictive-history-6m1z-v3wgok/transcript.txt"')) {
      failures.push('dist/data/lens/episodes/index.json: missing episode transcript text path');
    }
  }

  const transcriptSearchPath = path.join(distRoot, 'data/lens/transcript-search.json');
  if (existsSync(transcriptSearchPath)) {
    const transcriptSearch = await readFile(transcriptSearchPath, 'utf8');
    for (const expected of [
      '"source_ref": "video:predictive-history-3751zjwmrbw@transcript:v1#seg-0034"',
      '"https://www.youtube.com/watch?v=3751ZjwmrBw&t=2272s"',
      'Knights Templars',
    ]) {
      if (!transcriptSearch.includes(expected)) {
        failures.push(`dist/data/lens/transcript-search.json: missing ${expected}`);
      }
    }
  }

  const transcriptSearchTextPath = path.join(distRoot, 'data/lens/transcript-search.txt');
  if (existsSync(transcriptSearchTextPath)) {
    const transcriptSearchText = await readFile(transcriptSearchTextPath, 'utf8');
    for (const expected of [
      '# Jiang Lens Transcript Search',
      'Plain-text transcript segment index',
      'World War Trump and the Fortress Empire',
      'https://jianglens.com/episodes/predictive-history-ts-aa6lqf6i.txt',
      'video:predictive-history-ts-aa6lqf6i@transcript:v1#seg-0001',
    ]) {
      if (!transcriptSearchText.includes(expected)) {
        failures.push(`dist/data/lens/transcript-search.txt: missing ${expected}`);
      }
    }
  }

  const llmsPath = path.join(distRoot, 'llms.txt');
  if (existsSync(llmsPath)) {
    const llms = await readFile(llmsPath, 'utf8');
    for (const expected of [
      'Static topic router',
      'https://jianglens.com/topics/index.txt',
      'https://jianglens.com/sitemap-agent.txt',
      'Knights Templar / templars',
      'Use bulk transcript-search.txt, transcript-search.json, and link-index.json only as fallback/offline audit surfaces',
    ]) {
      if (!llms.includes(expected)) {
        failures.push(`dist/llms.txt: missing ${expected}`);
      }
    }
  }

  const topicIndexPath = path.join(distRoot, 'topics/index.txt');
  if (existsSync(topicIndexPath)) {
    const topicIndex = await readFile(topicIndexPath, 'utf8');
    for (const expected of [
      '# Jiang Lens Topic Router',
      'Try `/topics/{normalized-topic}.txt` directly',
      'https://jianglens.com/topics/index/k.txt',
    ]) {
      if (!topicIndex.includes(expected)) {
        failures.push(`dist/topics/index.txt: missing ${expected}`);
      }
    }
  }

  const templarTopicPath = path.join(distRoot, 'topics/knights-templar.txt');
  if (existsSync(templarTopicPath)) {
    const templarTopic = await readFile(templarTopicPath, 'utf8');
    for (const expected of [
      '# Topic: Knights Templar',
      '## Generated Answer Map',
      '## Quoted Transcript Hits',
      'multinational banking and trade organization',
      'https://jianglens.com/episodes/predictive-history-3751zjwmrbw/transcript/#seg-0034',
      'video:predictive-history-3751zjwmrbw@transcript:v1#seg-0034',
    ]) {
      if (!templarTopic.includes(expected)) {
        failures.push(`dist/topics/knights-templar.txt: missing ${expected}`);
      }
    }
  }

  const templarsAliasPath = path.join(distRoot, 'topics/templars.txt');
  if (existsSync(templarsAliasPath)) {
    const templarsAlias = await readFile(templarsAliasPath, 'utf8');
    for (const expected of [
      '# Topic Alias: templars',
      'https://jianglens.com/topics/knights-templar.txt',
    ]) {
      if (!templarsAlias.includes(expected)) {
        failures.push(`dist/topics/templars.txt: missing ${expected}`);
      }
    }
  }

  const skillTextPath = path.join(distRoot, 'skill.txt');
  if (existsSync(skillTextPath)) {
    const skillText = await readFile(skillTextPath, 'utf8');
    for (const forbiddenText of [
      '/topics/.txt',
      '/topics/index/.txt',
      '/episodes/.txt',
      '/interviews/.txt',
    ]) {
      if (skillText.includes(forbiddenText)) {
        failures.push(`dist/skill.txt: includes collapsed placeholder ${forbiddenText}`);
      }
    }
    for (const expected of [
      '/topics/{topic-slug}.txt',
      '/topics/index/{first-letter}.txt',
      '/episodes/{episode-slug}.txt',
      '/episodes/{episode-slug}/transcript.txt',
    ]) {
      if (!skillText.includes(expected)) {
        failures.push(`dist/skill.txt: missing placeholder-safe route ${expected}`);
      }
    }
  }

  const agentSitemapPath = path.join(distRoot, 'sitemap-agent.txt');
  if (existsSync(agentSitemapPath)) {
    const agentSitemap = await readFile(agentSitemapPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/llms.txt',
      'https://jianglens.com/skill.txt',
      'https://jianglens.com/topics/',
      'https://jianglens.com/topics/knights-templar/',
      'https://jianglens.com/topics/knights-templar.txt',
      'https://jianglens.com/topics/templars.txt',
      'https://jianglens.com/data/lens/transcript-search.txt',
    ]) {
      if (!agentSitemap.includes(expected)) {
        failures.push(`dist/sitemap-agent.txt: missing ${expected}`);
      }
    }
  }

  const sampleEpisodeMarkdownPath = path.join(distRoot, 'episodes/predictive-history-6m1z-v3wgok.md');
  if (existsSync(sampleEpisodeMarkdownPath)) {
    const sampleEpisodeMarkdown = await readFile(sampleEpisodeMarkdownPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/',
      'https://jianglens.com/data/lens/episodes/predictive-history-6m1z-v3wgok.json',
      'video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0005',
    ]) {
      if (!sampleEpisodeMarkdown.includes(expected)) {
        failures.push(`dist/episodes/predictive-history-6m1z-v3wgok.md: missing ${expected}`);
      }
    }
  }

  const sampleEpisodeTextPath = path.join(distRoot, 'episodes/predictive-history-6m1z-v3wgok.txt');
  if (existsSync(sampleEpisodeTextPath)) {
    const sampleEpisodeText = await readFile(sampleEpisodeTextPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/',
      'https://jianglens.com/episodes/predictive-history-6m1z-v3wgok.txt',
      '## Quotable Evidence From This Reading',
      'video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0005',
    ]) {
      if (!sampleEpisodeText.includes(expected)) {
        failures.push(`dist/episodes/predictive-history-6m1z-v3wgok.txt: missing ${expected}`);
      }
    }
  }

  const sampleTranscriptHtmlPath = path.join(distRoot, 'episodes/predictive-history-6m1z-v3wgok/transcript/index.html');
  if (existsSync(sampleTranscriptHtmlPath)) {
    const sampleTranscriptHtml = await readFile(sampleTranscriptHtmlPath, 'utf8');
    if (!sampleTranscriptHtml.includes('id="seg-0005-chunk-001"')) {
      failures.push('dist/episodes/predictive-history-6m1z-v3wgok/transcript/index.html: missing chunk anchor id');
    }
  }

  const sampleEpisodeTranscriptTextPath = path.join(distRoot, 'episodes/predictive-history-6m1z-v3wgok/transcript.txt');
  if (existsSync(sampleEpisodeTranscriptTextPath)) {
    const sampleEpisodeTranscriptText = await readFile(sampleEpisodeTranscriptTextPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/transcript/',
      'https://jianglens.com/episodes/predictive-history-6m1z-v3wgok/transcript.txt',
      'video:predictive-history-6m1z-v3wgok@transcript:v1#seg-0005',
    ]) {
      if (!sampleEpisodeTranscriptText.includes(expected)) {
        failures.push(`dist/episodes/predictive-history-6m1z-v3wgok/transcript.txt: missing ${expected}`);
      }
    }
  }

  const sampleLensMarkdownPath = path.join(distRoot, 'docs/lens/nation-as-god-machine.md');
  if (existsSync(sampleLensMarkdownPath)) {
    const sampleLensMarkdown = await readFile(sampleLensMarkdownPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/docs/lens/power-as-alchemy.md',
      'https://jianglens.com/episodes/predictive-history-tquo1usc5nw/transcript/#seg-0010',
      'lens-point:nation-god-machine-absorbs-ideologies',
    ]) {
      if (!sampleLensMarkdown.includes(expected)) {
        failures.push(`dist/docs/lens/nation-as-god-machine.md: missing ${expected}`);
      }
    }
  }

  const sampleLensTextPath = path.join(distRoot, 'docs/lens/nation-as-god-machine.txt');
  if (existsSync(sampleLensTextPath)) {
    const sampleLensText = await readFile(sampleLensTextPath, 'utf8');
    for (const expected of [
      'https://jianglens.com/docs/lens/power-as-alchemy.txt',
      'https://jianglens.com/episodes/predictive-history-tquo1usc5nw/transcript/#seg-0010',
      'lens-point:nation-god-machine-absorbs-ideologies',
    ]) {
      if (!sampleLensText.includes(expected)) {
        failures.push(`dist/docs/lens/nation-as-god-machine.txt: missing ${expected}`);
      }
    }
  }

  const requiredIconFiles = [
    'logo.png',
    'social-card.png',
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'site.webmanifest',
  ];
  for (const iconFile of requiredIconFiles) {
    if (!existsSync(path.join(distRoot, iconFile))) {
      failures.push(`dist/${iconFile}: missing brand icon asset`);
    }
  }

  for (const relPath of sampleHeadPaths) {
    const htmlPath = path.join(distRoot, relPath);
    if (!existsSync(htmlPath)) {
      failures.push(`dist/${relPath}: missing`);
      continue;
    }
    const html = await readFile(htmlPath, 'utf8');
    if (!html.includes('https://www.googletagmanager.com/gtag/js?id=G-EWK5R4CE72')) {
      failures.push(`dist/${relPath}: missing Google Analytics tag`);
    }
    if (!html.includes(`gtag('config', "G-EWK5R4CE72")`)) {
      failures.push(`dist/${relPath}: missing Google Analytics config`);
    }
    for (const expected of [
      'href="/favicon.ico"',
      'href="/favicon-16x16.png"',
      'href="/favicon-32x32.png"',
      'href="/apple-touch-icon.png"',
      'href="/site.webmanifest"',
    ]) {
      if (!html.includes(expected)) {
        failures.push(`dist/${relPath}: missing icon head link ${expected}`);
      }
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
