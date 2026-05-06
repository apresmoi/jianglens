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
          label: 'Lens Atlas: World-Making',
          items: [
            { label: 'Civilization As Inner Order', slug: 'lens/civilization-as-inner-order' },
            { label: 'How Poetry Creates Civilization', slug: 'lens/how-poetry-creates-civilization' },
            { label: 'How Stories Control Reality', slug: 'lens/how-stories-control-reality' },
            { label: 'The Dead World And The Cave', slug: 'lens/the-dead-world-and-the-cave' },
            { label: 'Fictional Heroes And The Self', slug: 'lens/how-fictional-heroes-become-part-of-the-self' },
            { label: 'The Guide Who Becomes A Trap', slug: 'lens/the-guide-who-becomes-a-trap' },
            { label: 'Human Heart As Civilizational Measure', slug: 'lens/human-heart-as-civilizational-measure' },
            { label: 'Sacred Machines', slug: 'lens/sacred-machines' },
          ],
        },
        {
          label: 'Lens Atlas: Power And Institutions',
          items: [
            { label: 'Attention Capture As Capital Extraction', slug: 'lens/attention-capture-as-capital-extraction' },
            { label: 'Bureaucracy As Institutional Death', slug: 'lens/bureaucracy-as-institutional-death' },
            { label: 'Education As A Soul Game', slug: 'lens/education-as-a-soul-game' },
            { label: 'Free Will As Cosmic Burden', slug: 'lens/free-will-as-cosmic-burden' },
            { label: 'Gerontocracy As Intergenerational Extraction', slug: 'lens/gerontocracy-as-intergenerational-extraction' },
            { label: 'Living School For Psychohistory', slug: 'lens/living-school-for-psychohistory' },
            { label: 'Religion As Administrative Filter', slug: 'lens/religion-as-administrative-filter' },
          ],
        },
        {
          label: 'Lens Atlas: State And Strategy',
          items: [
            { label: 'Game Theory', slug: 'lens/game-theory' },
            { label: 'Eschatology As Script', slug: 'lens/eschatology' },
            { label: 'Legitimacy Fiction', slug: 'lens/legitimacy-fiction' },
            { label: 'Nation As God-Machine', slug: 'lens/nation-as-god-machine' },
            { label: 'Power As Alchemy', slug: 'lens/power-as-alchemy' },
            { label: 'Secret Society As Coordination Technology', slug: 'lens/secret-society-as-coordination-technology' },
            { label: 'Taboo As Control Surface', slug: 'lens/taboo-as-control-surface' },
            { label: 'The Borderland Engine', slug: 'lens/the-borderland-engine' },
            { label: 'War As Story Versus Material Test', slug: 'lens/when-war-becomes-a-story-instead-of-a-material-test' },
          ],
        },
      ],
    }),
  ],
});
