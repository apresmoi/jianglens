import { absoluteUrl, configuredBasePath } from '../../site.config.mjs';

function normalizeExtension(extension = 'md') {
  return extension === 'txt' ? 'txt' : 'md';
}

function routePath(pathname) {
  const basePath = configuredBasePath();
  let normalized = String(pathname || '/');

  if (basePath && (normalized === basePath || normalized.startsWith(`${basePath}/`))) {
    normalized = normalized.slice(basePath.length) || '/';
  }

  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

export function sourceArtifactPath(collection, slug, extension = 'md') {
  const ext = normalizeExtension(extension);
  const sourceCollection = collection === 'interviews' ? 'interviews' : 'episodes';
  return `/${sourceCollection}/${slug}.${ext}`;
}

export function sourceArtifactUrl(collection, slug, extension = 'md') {
  return absoluteUrl(sourceArtifactPath(collection, slug, extension));
}

export function sourceTranscriptArtifactPath(collection, slug, extension = 'md') {
  const ext = normalizeExtension(extension);
  const sourceCollection = collection === 'interviews' ? 'interviews' : 'episodes';
  return `/${sourceCollection}/${slug}/transcript.${ext}`;
}

export function sourceTranscriptArtifactUrl(collection, slug, extension = 'md') {
  return absoluteUrl(sourceTranscriptArtifactPath(collection, slug, extension));
}

export function sourceIndexArtifactPath(collection, extension = 'md') {
  const ext = normalizeExtension(extension);
  const sourceCollection = collection === 'interviews' ? 'interviews' : 'episodes';
  return `/${sourceCollection}/index.${ext}`;
}

export function sourceIndexArtifactUrl(collection, extension = 'md') {
  return absoluteUrl(sourceIndexArtifactPath(collection, extension));
}

export function docArtifactPathFromRoute(pathname, extension = 'md') {
  const ext = normalizeExtension(extension);
  const normalized = routePath(pathname);

  if (!normalized || normalized === '/' || normalized === '/404' || normalized === '/404.html') {
    return '';
  }

  const slug = normalized.slice(1);
  return slug ? `/docs/${slug}.${ext}` : '';
}

export function docArtifactUrlFromRoute(pathname, extension = 'md') {
  const artifactPath = docArtifactPathFromRoute(pathname, extension);
  return artifactPath ? absoluteUrl(artifactPath) : '';
}
