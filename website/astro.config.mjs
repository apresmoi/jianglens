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
const starlightHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'sitemap',
      href: sitemapHref,
    },
  },
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
      head: starlightHead,
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/StarlightHeader.astro',
      },
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Introduction', slug: 'introduction' },
            { label: 'The Jiang Lens', slug: 'lens' },
            { label: 'Use With ChatGPT Or Claude', slug: 'use-with-your-agent' },
          ],
        },
        {
          label: 'Discovery',
          items: [
            { label: 'Who Is Jiang Xueqin?', slug: 'who-is-jiang-xueqin' },
            { label: 'What Is Predictive History?', slug: 'what-is-predictive-history' },
            { label: 'Is Professor Jiang Legit?', slug: 'is-professor-jiang-legit' },
            { label: 'Professor Jiang Predictions', slug: 'professor-jiang-predictions' },
            { label: 'Professor Jiang Transcripts', slug: 'professor-jiang-transcripts' },
          ],
        },
        {
          label: 'Lens Atlas',
          items: [
            { label: 'How Poetry Creates Civilization', slug: 'lens/how-poetry-creates-civilization' },
            { label: 'How Stories Control Reality', slug: 'lens/how-stories-control-reality' },
            { label: 'The Dead World And The Cave', slug: 'lens/the-dead-world-and-the-cave' },
            { label: 'Fictional Heroes And The Self', slug: 'lens/how-fictional-heroes-become-part-of-the-self' },
            { label: 'The Guide Who Becomes A Trap', slug: 'lens/the-guide-who-becomes-a-trap' },
            { label: 'War As Story Versus Material Test', slug: 'lens/when-war-becomes-a-story-instead-of-a-material-test' },
          ],
        },
        {
          label: 'Strategy And Endings',
          items: [
            { label: 'Game Theory', slug: 'lens/game-theory' },
            { label: 'Eschatology', slug: 'lens/eschatology' },
          ],
        },
      ],
    }),
  ],
});
