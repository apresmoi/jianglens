const META_DESCRIPTION_MIN_LENGTH = 25;
const META_DESCRIPTION_MAX_LENGTH = 160;

function compactText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function metaDescription(value, fallback = 'Jiang Lens source-grounded readings with transcripts, timestamps, and evidence links.') {
  const candidate = compactText(value) || fallback;
  const description = candidate.length >= META_DESCRIPTION_MIN_LENGTH ? candidate : fallback;

  if (description.length <= META_DESCRIPTION_MAX_LENGTH) return description;

  const hardLimit = META_DESCRIPTION_MAX_LENGTH - 1;
  const softCut = description
    .slice(0, hardLimit)
    .replace(/\s+\S*$/, '')
    .replace(/[,;:\u2013\-]\s*$/, '')
    .trim();
  const clipped = softCut.length >= 80 ? softCut : description.slice(0, hardLimit).trim();

  if (clipped.endsWith('.')) return clipped.slice(0, META_DESCRIPTION_MAX_LENGTH);
  return `${clipped.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).trim()}.`;
}
