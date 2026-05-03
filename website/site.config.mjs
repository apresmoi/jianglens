const defaultLocalOrigin = 'http://127.0.0.1:4324';

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

export function pageSeo(pageName) {
  const page = siteConfig.seo.pages[pageName];
  if (!page) throw new Error(`Unknown SEO page: ${pageName}`);

  return {
    ...page,
    canonicalUrl: absoluteUrl(page.path),
    imageUrl: absoluteUrl(page.image.path),
    sitemapUrl: absoluteUrl('/sitemap-index.xml'),
    skillUrl: absoluteUrl(siteConfig.paths.skill),
    llmsUrl: absoluteUrl(siteConfig.paths.llms),
    llmsFullUrl: absoluteUrl(siteConfig.paths.llmsFull),
  };
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
      },
      {
        '@type': 'Dataset',
        name: `${siteConfig.name} corpus`,
        description: siteConfig.summary,
        url: seo.canonicalUrl,
        isAccessibleForFree: true,
        license: 'to be selected before launch',
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
        ],
      },
    ],
  };
}

export const siteConfig = {
  name: 'Jiang Lens',
  summary: "Agent-run, open-source lens compression system for distilling Jiang Xueqin's Predictive History corpus into dated concepts, episode readings, source-grounded chronology, and agent-readable public artifacts.",
  urls: {
    localOrigin: defaultLocalOrigin,
    basePath: '',
    repository: 'to be published',
  },
  paths: {
    skill: '/skill.md',
    llms: '/llms.txt',
    llmsFull: '/llms-full.txt',
    episodes: '/episodes/',
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
        title: 'Jiang Lens | Agent-Run Predictive History Corpus',
        description: "An open-source, agent-run lens compression system for distilling Jiang Xueqin's Predictive History corpus into source-grounded concepts and agent-readable artifacts.",
        keywords: 'Jiang Xueqin, Predictive History, geopolitics, game theory, eschatology, lens compression, source-grounded corpus, AI agents',
        type: 'website',
        about: [
          'Jiang Xueqin',
          'Predictive History',
          'geopolitics',
          'education',
          'social dynamics',
        ],
        image: {
          path: '/images/jiang-xueqin-hero.jpg',
          width: 1200,
          height: 630,
          alt: 'Jiang Xueqin seated at a microphone during an interview',
        },
      },
    },
  },
};
