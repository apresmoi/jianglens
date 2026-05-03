// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { configuredBasePath, configuredOrigin, siteConfig } from './site.config.mjs';

const site = configuredOrigin();
const base = configuredBasePath();

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
            { label: 'Use With Your Agent', slug: 'use-with-your-agent' },
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
