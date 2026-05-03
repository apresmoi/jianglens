import { listEpisodeSlugs, readEpisode } from '../../../../lib/episodes.mjs';

export async function getStaticPaths() {
  const slugs = await listEpisodeSlugs();
  return slugs.map((slug) => ({ params: { slug } }));
}

export async function GET({ params }) {
  const episode = await readEpisode(params.slug);
  return new Response(JSON.stringify(episode, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
