import { listInterviewSlugs, readInterview } from '../../../../lib/episodes.mjs';

export async function getStaticPaths() {
  const slugs = await listInterviewSlugs();
  return slugs.map((slug) => ({ params: { slug } }));
}

export async function GET({ params }) {
  const interview = await readInterview(params.slug);
  return new Response(JSON.stringify(interview, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
