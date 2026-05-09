const defaultLocalOrigin = 'http://127.0.0.1:4324';
const repositoryUrl = 'https://github.com/apresmoi/jianglens';
const outboundRef = 'jianglens.com';
const officialProfiles = [repositoryUrl];
const sourceProfiles = [
  {
    name: 'Predictive History YouTube',
    url: 'https://www.youtube.com/@PredictiveHistory',
  },
  {
    name: 'Predictive History Substack',
    url: 'https://predictivehistory.substack.com/',
  },
  {
    name: 'Jiang Xueqin Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Jiang_Xueqin',
  },
];

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
  const organizationId = `${siteConfig.urls.publicOrigin}/#organization`;
  const websiteId = `${siteConfig.urls.publicOrigin}/#website`;
  const sameAs = siteConfig.officialProfiles?.length ? { sameAs: siteConfig.officialProfiles } : {};

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
        '@type': 'Organization',
        '@id': organizationId,
        name: siteConfig.name,
        alternateName: siteConfig.identity.alternateNames,
        url: siteConfig.urls.publicOrigin,
        logo: absoluteUrl('/logo.png'),
        description: siteConfig.identity.disambiguatingDescription,
        ...sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: siteConfig.name,
        alternateName: siteConfig.identity.alternateNames,
        url: seo.canonicalUrl,
        description: seo.description,
        publisher: {
          '@id': organizationId,
        },
        ...sameAs,
      },
      {
        '@type': 'Dataset',
        name: `${siteConfig.name} corpus`,
        description: siteConfig.summary,
        url: seo.canonicalUrl,
        isAccessibleForFree: true,
        creator: {
          '@id': organizationId,
        },
        publisher: {
          '@id': organizationId,
        },
        about: seo.about,
        isBasedOn: siteConfig.sourceProfiles.map((profile) => ({
          '@type': 'CreativeWork',
          name: profile.name,
          url: profile.url,
        })),
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
  summary: "Independent, source-grounded index of Professor Jiang Xueqin's Predictive History corpus at jianglens.com, built for readers and agents to inspect transcripts, concepts, claims, predictions, and evidence-linked lens compression.",
  identity: {
    alternateNames: ['JiangLens.com', 'Jiang Lens Project', 'Predictive History Lens'],
    disambiguatingDescription:
      'Jiang Lens is an independent research index at jianglens.com. It is not affiliated with, operated by, or endorsed by any YouTube channel using the Jiang Lens or jianglens name.',
  },
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
  officialProfiles,
  sourceProfiles,
  analytics: {
    googleTagId: 'G-EWK5R4CE72',
  },
  paths: {
    disambiguation: '/disambiguation/',
    skill: '/skill.md',
    llms: '/llms.txt',
    llmsFull: '/llms-full.txt',
    episodes: '/episodes/',
    episodeIndexMarkdown: '/episodes/index.md',
    episodeIndexJson: '/data/lens/episodes/index.json',
    interviews: '/interviews/',
    interviewIndexMarkdown: '/interviews/index.md',
    interviewIndexJson: '/data/lens/interviews/index.json',
    transcriptSearchJson: '/data/lens/transcript-search.json',
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
        description: "Jiang Lens is an independent source-grounded Jiang Xueqin and Predictive History index at jianglens.com: transcripts, concepts, claims, predictions, and evidence-linked lens compression.",
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
