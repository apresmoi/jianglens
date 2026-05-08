import { readInterviewIndex } from '../../../../lib/episodes.mjs';

export async function GET() {
  const index = await readInterviewIndex();
  return new Response(JSON.stringify(index, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
