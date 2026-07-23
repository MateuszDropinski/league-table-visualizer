/**
 * Resolves a path from a standings file against the app's base path.
 *
 * Mock crests are stored as paths relative to the base (`crests/crest-01.svg`)
 * so the same JSON works at the dev server root and under the GitHub Pages
 * subpath. Real API-Football logos arrive as absolute URLs and are returned
 * untouched, which is why both cases have to be handled here rather than by
 * concatenating at the call site.
 */
export function resolveAssetUrl(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path) || path.startsWith('//')) {
    return path
  }
  // BASE_URL always carries a trailing slash, so strip any leading one to
  // avoid producing a double slash.
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
