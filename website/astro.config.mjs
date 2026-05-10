// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import {
  configuredBasePath,
  configuredOrigin,
  googleAnalyticsInlineScript,
  googleAnalyticsScriptSrc,
  siteConfig,
} from './site.config.mjs';
import { starlightSidebar } from './src/lib/site-navigation.mjs';

const site = configuredOrigin();
const base = configuredBasePath();
const sitemapHref = `${site}${base ? `${base}/` : '/'}sitemap-0.xml`;
const googleTagId = siteConfig.analytics?.googleTagId;
const analyticsHead = googleTagId
  ? [
      {
        tag: 'script',
        attrs: {
          async: true,
          src: googleAnalyticsScriptSrc(),
        },
      },
      {
        tag: 'script',
        content: googleAnalyticsInlineScript(),
      },
    ]
  : [];
const iconHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      href: '/favicon.ico',
      sizes: 'any',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  },
  {
    tag: 'meta',
    attrs: {
      name: 'theme-color',
      content: siteConfig.seo.themeColor,
    },
  },
  {
    tag: 'meta',
    attrs: {
      property: 'og:logo',
      content: `${site}${base ? `${base}/` : '/'}logo.png`,
    },
  },
];
const starlightHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'sitemap',
      href: sitemapHref,
    },
  },
  ...iconHead,
  ...analyticsHead,
];

export default defineConfig({
  site,
  ...(base ? { base } : {}),
  devToolbar: {
    enabled: false,
  },
  integrations: [
    sitemap(),
    starlight({
      title: siteConfig.name,
      description: siteConfig.seo.pages.home.description,
      favicon: '/favicon.ico',
      head: starlightHead,
      customCss: ['./src/styles/custom.css'],
      components: {
        Head: './src/components/StarlightHead.astro',
        Header: './src/components/StarlightHeader.astro',
        MarkdownContent: './src/components/StarlightMarkdownContent.astro',
      },
      sidebar: starlightSidebar,
    }),
  ],
});
