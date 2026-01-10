export function resolveOgImageUrl(value: string, slug: string): string {
  if (isAbsoluteUrl(value)) return value;
  return new URL(value, `https://inlang.com/blog/${slug}/`).toString();
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/.test(value);
}
