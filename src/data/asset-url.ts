/** Resolve bundled data/assets beneath the GitHub Pages project path. */
export function resolveAssetUrl(path: string): string {
  if (/^https:\/\//i.test(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
