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

const META_DESCRIPTION_MIN_LENGTH = 25;
const META_DESCRIPTION_MAX_LENGTH = 160;

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

function tagAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function checkHtmlSeo(rel, text, failures) {
  const descriptionTags = [...text.matchAll(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>/gi)]
    .map((match) => match[0]);

  if (!descriptionTags.length) {
    failures.push(`${rel}: missing meta description`);
  }

  for (const tag of descriptionTags) {
    const description = tagAttribute(tag, 'content') ?? '';
    if (
      description.length < META_DESCRIPTION_MIN_LENGTH ||
      description.length > META_DESCRIPTION_MAX_LENGTH
    ) {
      failures.push(`${rel}: meta description length ${description.length}; expected ${META_DESCRIPTION_MIN_LENGTH}-${META_DESCRIPTION_MAX_LENGTH}`);
    }
  }

  for (const match of text.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const alt = tagAttribute(tag, 'alt');
    if (!alt || !alt.trim()) {
      failures.push(`${rel}: image missing non-empty alt text`);
    }
  }
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
      checkHtmlSeo(rel, text, failures);

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
      'Skill: https://jianglens.com/skill/',
      'Skill-markdown: https://jianglens.com/skill.md',
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

  const htmlSitemapPath = path.join(distRoot, 'sitemap-0.xml');
  if (!existsSync(htmlSitemapPath)) {
    failures.push('dist/sitemap-0.xml: missing');
  } else {
    const htmlSitemap = await readFile(htmlSitemapPath, 'utf8');
    const topicHtmlPageCount = files.filter((file) => {
      return path.basename(file) === 'index.html' && path.relative(distRoot, file).startsWith(`topics${path.sep}`);
    }).length;
    const topicXmlUrlCount = [...htmlSitemap.matchAll(/<loc>https:\/\/jianglens\.com\/topics\//g)].length;
    for (const expected of [
      '<loc>https://jianglens.com/topics/</loc>',
      '<loc>https://jianglens.com/topics/knights-templar/</loc>',
      '<loc>https://jianglens.com/topics/index/a/</loc>',
      '<loc>https://jianglens.com/topics/index/aa/</loc>',
    ]) {
      if (!htmlSitemap.includes(expected)) {
        failures.push(`dist/sitemap-0.xml: missing generated topic HTML URL ${expected}`);
      }
    }
    if (topicXmlUrlCount !== topicHtmlPageCount) {
      failures.push(`dist/sitemap-0.xml: has ${topicXmlUrlCount} topic URLs but generated ${topicHtmlPageCount} topic HTML pages`);
    }
  }

  const sitemapIndexPath = path.join(distRoot, 'sitemap-index.xml');
  if (existsSync(sitemapIndexPath)) {
    const sitemapIndex = await readFile(sitemapIndexPath, 'utf8');
    if (!sitemapIndex.includes('<loc>https://jianglens.com/sitemap-0.xml</loc>')) {
      failures.push('dist/sitemap-index.xml: missing production sitemap-0 URL');
    }
  }

  const skillHtmlPath = path.join(distRoot, 'skill/index.html');
  if (!existsSync(skillHtmlPath)) {
    failures.push('dist/skill/index.html: missing');
  } else {
    const skillHtml = await readFile(skillHtmlPath, 'utf8');
    for (const expected of [
      '<link rel="canonical" href="https://jianglens.com/skill/">',
      '<link rel="alternate" type="text/plain" href="https://jianglens.com/skill.txt"',
      '<link rel="alternate" type="text/markdown" href="https://jianglens.com/skill.md"',
      'Use HTML pages first',
      'Canonical Skill Content',
      'The block below is the exact Jiang Lens skill.',
      'name: jiang-lens',
      'Use this skill to apply the Jiang Lens as a source-grounded interpretive frame.',
      'Topic pages are routing and synthesis surfaces, not primary evidence for Jiang-spoken claims.',
      'Do not use topic pages as final evidence citations for Jiang claims.',
      'Explore next:',
      '## Corpus Lookup Output',
      '## Output Shape',
      'Do not cite <code',
      'Topic pages are discovery surfaces, not primary evidence for what Jiang said.',
      '.txt</code> mirrors unless no HTML route is available',
      'Read https://jianglens.com/skill/ and analyze this with Jiang Lens',
    ]) {
      if (!skillHtml.includes(expected)) {
        failures.push(`dist/skill/index.html: missing ${expected}`);
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
      'Do not use topic pages as final evidence citations for Jiang claims.',
      'Timestamp link using `video_url`',
      'Transcript link using `transcript_url`',
      'Stable `source_ref`',
      'Quote excerpts should be brief',
      'Explore next:',
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
    if (!home.includes('<link rel="help" href="https://jianglens.com/skill/">')) {
      failures.push('dist/index.html: missing skill help link');
    }
    if (!home.includes('Read https://jianglens.com/skill/ and analyze this with Jiang Lens')) {
      failures.push('dist/index.html: homepage prompt does not use /skill/');
    }
    if (!home.includes('href="./topics/"') || !home.includes('>Topics</a>')) {
      failures.push('dist/index.html: primary navigation is missing Topics link');
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
      '<link rel="alternate" type="text/html" href="https://jianglens.com/skill/"',
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
      'https://jianglens.com/skill/',
      'https://jianglens.com/topics/',
      'https://jianglens.com/topics/index.txt',
      'https://jianglens.com/sitemap-agent.txt',
      'Knights Templar / templars',
      'Topic pages are routing and synthesis surfaces, not primary evidence for Jiang-spoken claims',
      'After answering, offer one useful next source path',
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
      'Try `/topics/{normalized-topic}/` directly',
      'cite source readings, transcript anchors, source refs, and video timestamps in final answers',
      'https://jianglens.com/topics/index/k.txt',
    ]) {
      if (!topicIndex.includes(expected)) {
        failures.push(`dist/topics/index.txt: missing ${expected}`);
      }
    }
  }

  const topicIndexHtmlPath = path.join(distRoot, 'topics/index.html');
  if (existsSync(topicIndexHtmlPath)) {
    const topicIndexHtml = await readFile(topicIndexHtmlPath, 'utf8');
    for (const expected of [
      '<span>Jiang Lens</span>',
      'Topic router',
      'Top Ranked Topics',
      'Score ',
      'What Counts As A Topic',
      'mechanically generated evidence bundle',
      'Browse By Letter',
      'Use this static router to resolve a user topic',
      'final citations should point to source readings, transcript anchors, source refs, and video timestamps',
    ]) {
      if (!topicIndexHtml.includes(expected)) {
        failures.push(`dist/topics/index.html: missing structured topic router HTML ${expected}`);
      }
    }
    if (topicIndexHtml.includes('<pre># Jiang Lens Topic Router')) {
      failures.push('dist/topics/index.html: still renders the topic router as raw preformatted Markdown');
    }
  }

  const topicShardAHtmlPath = path.join(distRoot, 'topics/index/a/index.html');
  if (existsSync(topicShardAHtmlPath)) {
    const topicShardAHtml = await readFile(topicShardAHtmlPath, 'utf8');
    for (const expected of [
      'Topic Router: A',
      'Narrow By Prefix',
      'prefix shards',
      'Search prefix shards or exact aliases',
    ]) {
      if (!topicShardAHtml.includes(expected)) {
        failures.push(`dist/topics/index/a/index.html: missing split alias shard HTML ${expected}`);
      }
    }
  }

  const topicShardAiHtmlPath = path.join(distRoot, 'topics/index/ai/index.html');
  if (existsSync(topicShardAiHtmlPath)) {
    const topicShardAiHtml = await readFile(topicShardAiHtmlPath, 'utf8');
    const expectedAiShardStrings = topicShardAiHtml.includes('Narrow By Prefix')
      ? [
          'Topic Router: ai',
          'prefix shards',
          'Search prefix shards or exact aliases',
          'Narrow By Prefix',
        ]
      : [
          'Topic Router: ai',
          'visible aliases',
          'Search aliases or canonical topics',
          'Topic brief',
        ];
    for (const expected of expectedAiShardStrings) {
      if (!topicShardAiHtml.includes(expected)) {
        failures.push(`dist/topics/index/ai/index.html: missing alias shard HTML ${expected}`);
      }
    }
  }

  const topicShardDir = path.join(distRoot, 'topics/index');
  if (existsSync(topicShardDir)) {
    const shardFiles = await readdir(topicShardDir);
    for (const file of shardFiles.filter((entry) => entry.endsWith('.txt'))) {
      const shardText = await readFile(path.join(topicShardDir, file), 'utf8');
      const aliasRows = shardText.split('\n').filter((line) => line.includes(' -> ')).length;
      if (aliasRows > 50) {
        failures.push(`dist/topics/index/${file}: has ${aliasRows} alias rows; capped shards should stay at 50 or fewer`);
      }
    }
  }

  const templarTopicPath = path.join(distRoot, 'topics/knights-templar.txt');
  if (existsSync(templarTopicPath)) {
    const templarTopic = await readFile(templarTopicPath, 'utf8');
    for (const expected of [
      '# Topic: Knights Templar',
      '## What This Topic Covers',
      '## Extracted Topic Notes',
      '## Quoted Transcript Hits',
      'Human topic page: [/topics/knights-templar/]',
      'Do not cite the topic page as primary evidence for what Jiang said',
      'multinational banking and trade organization',
      'https://jianglens.com/episodes/predictive-history-3751zjwmrbw/transcript/#seg-0034',
      'video:predictive-history-3751zjwmrbw@transcript:v1#seg-0034',
    ]) {
      if (!templarTopic.includes(expected)) {
        failures.push(`dist/topics/knights-templar.txt: missing ${expected}`);
      }
    }
  }

  const templarTopicHtmlPath = path.join(distRoot, 'topics/knights-templar/index.html');
  if (existsSync(templarTopicHtmlPath)) {
    const templarTopicHtml = await readFile(templarTopicHtmlPath, 'utf8');
    for (const expected of [
      '<span>Jiang Lens</span>',
      'hero-inner',
      'hero-topline',
      'Topic brief',
      'timestamped hits',
      'Aliases:',
      'Best source reading',
      'Search this topic',
      'Key Notes',
      'Timestamped Evidence',
      'data-source-ref=',
      'Transcript seg-',
      'YouTube',
      'Relevant Lectures And Readings',
      'How To Use And Cite This Page',
    ]) {
      if (!templarTopicHtml.includes(expected)) {
        failures.push(`dist/topics/knights-templar/index.html: missing structured topic HTML ${expected}`);
      }
    }
    if (templarTopicHtml.includes('<pre>---')) {
      failures.push('dist/topics/knights-templar/index.html: still renders the topic dossier as raw preformatted Markdown');
    }
  }

  const templarsAliasPath = path.join(distRoot, 'topics/templars.txt');
  if (existsSync(templarsAliasPath)) {
    const templarsAlias = await readFile(templarsAliasPath, 'utf8');
    for (const expected of [
      '# Topic Alias: templars',
      'https://jianglens.com/topics/knights-templar/',
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
      '/skill/',
      '/topics/{topic-slug}/',
      '/topics/index/{first-letter}/',
      '/episodes/{episode-slug}/',
      '/episodes/{episode-slug}/transcript/',
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
      'https://jianglens.com/skill/',
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
