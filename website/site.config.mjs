const defaultLocalOrigin = 'http://127.0.0.1:4324';
const repositoryUrl = 'https://github.com/apresmoi/jianglens';
const outboundRef = 'jianglens.com';

function runtimeEnv() {
  return typeof process === 'undefined' ? {} : process.env;
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function normalizeBasePath(basePath = '') {
  if (!basePath || basePath === '/') return '';
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export function configuredOrigin(env = runtimeEnv()) {
  return trimTrailingSlash(env.ASTRO_SITE || siteConfig.urls.localOrigin);
}

export function configuredBasePath(env = runtimeEnv()) {
  return normalizeBasePath(env.ASTRO_BASE || siteConfig.urls.basePath);
}

export function absoluteUrl(pathname, options = {}) {
  const origin = trimTrailingSlash(options.origin || configuredOrigin());
  const basePath = normalizeBasePath(options.basePath ?? configuredBasePath());
  const pathWithSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${origin}${basePath}${pathWithSlash}`;
}

export function externalHref(value, options = {}) {
  if (!value) return value;
  const ref = options.ref ?? outboundRef;
  const siteHost = new URL(siteConfig.urls.publicOrigin).hostname;

  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol)) return value;
    if (url.hostname === siteHost || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return value;
    }
    if (!url.searchParams.has('ref')) {
      url.searchParams.set('ref', ref);
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function pageSeo(pageName) {
  const page = siteConfig.seo.pages[pageName];
  if (!page) throw new Error(`Unknown SEO page: ${pageName}`);

  return {
    ...page,
    canonicalUrl: absoluteUrl(page.path),
    imageUrl: absoluteUrl(page.image.path),
    sitemapUrl: absoluteUrl('/sitemap-0.xml'),
    skillUrl: absoluteUrl(siteConfig.paths.skill),
    llmsUrl: absoluteUrl(siteConfig.paths.llms),
    llmsFullUrl: absoluteUrl(siteConfig.paths.llmsFull),
  };
}

export function googleAnalyticsScriptSrc() {
  const googleTagId = siteConfig.analytics?.googleTagId;
  return googleTagId ? `https://www.googletagmanager.com/gtag/js?id=${googleTagId}` : '';
}

export function googleAnalyticsInlineScript() {
  const googleTagId = siteConfig.analytics?.googleTagId;
  if (!googleTagId) return '';

  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(googleTagId)});`,
  ].join('\n');
}

export function structuredDataForPage(pageName) {
  const seo = pageSeo(pageName);

  if (pageName !== 'home') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seo.title,
      url: seo.canonicalUrl,
      description: seo.description,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: siteConfig.name,
        url: seo.canonicalUrl,
        description: seo.description,
        sameAs: siteConfig.externalProfiles,
      },
      {
        '@type': 'Dataset',
        name: `${siteConfig.name} corpus`,
        description: siteConfig.summary,
        url: seo.canonicalUrl,
        isAccessibleForFree: true,
        creator: {
          '@type': 'Organization',
          name: siteConfig.name,
        },
        about: seo.about,
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/markdown',
            contentUrl: seo.skillUrl,
            name: 'Jiang Lens skill',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/plain',
            contentUrl: seo.llmsUrl,
            name: 'llms.txt',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/plain',
            contentUrl: seo.llmsFullUrl,
            name: 'llms-full.txt',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: absoluteUrl(siteConfig.paths.manifestJson),
            name: 'Generated lens manifest JSON',
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: absoluteUrl(siteConfig.paths.linkIndexJson),
            name: 'Generated evidence link index JSON',
          },
        ],
      },
    ],
  };
}

export const siteConfig = {
  name: 'Jiang Lens',
  summary: "Independent, source-grounded index of Professor Jiang Xueqin's Predictive History corpus, built for readers and agents to inspect transcripts, concepts, claims, predictions, and evidence-linked lens compression.",
  urls: {
    localOrigin: defaultLocalOrigin,
    publicOrigin: 'https://jianglens.com',
    basePath: '',
    repository: repositoryUrl,
  },
  credits: {
    builderName: '@ledeluge.me',
    builderUrl: 'https://ledeluge.me/',
    repositoryUrl,
  },
  externalProfiles: [
    'https://www.youtube.com/@PredictiveHistory',
    'https://predictivehistory.substack.com/',
    'https://en.wikipedia.org/wiki/Jiang_Xueqin',
  ],
  analytics: {
    googleTagId: 'G-EWK5R4CE72',
  },
  paths: {
    skill: '/skill.md',
    llms: '/llms.txt',
    llmsFull: '/llms-full.txt',
    episodes: '/episodes/',
    episodeIndexMarkdown: '/episodes/index.md',
    episodeIndexJson: '/data/lens/episodes/index.json',
    manifestJson: '/data/lens/manifest.json',
    linkIndexJson: '/data/lens/link-index.json',
  },
  seo: {
    author: 'Jiang Lens',
    defaultTitle: 'Jiang Lens',
    siteName: 'Jiang Lens',
    themeColor: '#070707',
    locale: 'en_US',
    twitterCard: 'summary_large_image',
    pages: {
      home: {
        path: '/',
        title: 'Jiang Lens | Professor Jiang Xueqin & Predictive History Source Index',
        description: "A source-grounded Jiang Xueqin and Predictive History index for readers, ChatGPT, Claude, and other agents: transcripts, concepts, claims, predictions, and evidence-linked lens compression.",
        keywords: 'Jiang Xueqin, Professor Jiang, Predictive History, ChatGPT Jiang lens, Claude Jiang lens, geopolitics, game theory, eschatology, lens compression, source-grounded corpus, AI agents',
        type: 'website',
        about: [
          'Jiang Xueqin',
          'Predictive History',
          'geopolitics',
          'education',
          'social dynamics',
          'AI agents',
        ],
        image: {
          path: '/social-card.png',
          width: 1200,
          height: 630,
          alt: 'Jiang Lens social card for a source-grounded Predictive History corpus for agents',
        },
      },
    },
  },
};
