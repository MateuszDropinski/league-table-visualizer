/*
  Builds the example crests the mock teams point at. Six silhouettes crossed
  with four palettes gives 24, which is more than the largest mock league, so
  no two teams in the same table share a crest.

  Everything is deliberately chunky. These have to stay readable at the Micro
  tier, where a logo is roughly 8px square, so thin strokes and any kind of
  lettering are useless. Silhouette plus one bold motif is what survives.
*/

interface Palette {
  bg: string
  fg: string
  accent: string
}

const PALETTES: Palette[] = [
  { bg: '#1d4ed8', fg: '#f8fafc', accent: '#facc15' },
  { bg: '#b91c1c', fg: '#fef2f2', accent: '#0f172a' },
  { bg: '#047857', fg: '#ecfdf5', accent: '#fbbf24' },
  { bg: '#6d28d9', fg: '#f5f3ff', accent: '#22d3ee' },
]

/**
 * Outer silhouettes, each drawn inside a 64x64 viewBox. `attrs` carries the
 * paint, so the same geometry can be reused as a fill, as a clip path and as
 * an outline without any string surgery on the result.
 */
const SHAPES: Array<(attrs: string) => string> = [
  // Shield
  (a) =>
    `<path d="M32 3 L59 12 V33 C59 47 47 57 32 61 C17 57 5 47 5 33 V12 Z" ${a}/>`,
  // Roundel
  (a) => `<circle cx="32" cy="32" r="28" ${a}/>`,
  // Hexagon
  (a) => `<polygon points="32,3 57,17 57,47 32,61 7,47 7,17" ${a}/>`,
  // Diamond
  (a) => `<polygon points="32,2 62,32 32,62 2,32" ${a}/>`,
  // Pennant
  (a) => `<path d="M7 4 H57 V38 L32 61 L7 38 Z" ${a}/>`,
  // Rounded square
  (a) => `<rect x="5" y="5" width="54" height="54" rx="13" ${a}/>`,
]

/** Motifs, clipped to the silhouette so they never bleed outside it. */
const MOTIFS: Array<(p: Palette) => string> = [
  // Broad vertical stripe
  (p) => `<rect x="25" y="0" width="14" height="64" fill="${p.accent}"/>`,
  // Chevron
  (p) =>
    `<path d="M32 16 L53 35 L44 44 L32 32 L20 44 L11 35 Z" fill="${p.fg}"/>`,
  // Five pointed star
  (p) => `<polygon points="${starPoints(32, 31, 15, 6.4)}" fill="${p.accent}"/>`,
  // Cross
  (p) =>
    `<rect x="26" y="8" width="12" height="48" fill="${p.fg}"/>` +
    `<rect x="8" y="26" width="48" height="12" fill="${p.fg}"/>`,
  // Twin bars
  (p) =>
    `<rect x="0" y="22" width="64" height="7" fill="${p.fg}"/>` +
    `<rect x="0" y="35" width="64" height="7" fill="${p.accent}"/>`,
  // Ring
  (p) =>
    `<circle cx="32" cy="31" r="14" fill="none" stroke="${p.fg}" stroke-width="8"/>`,
]

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (-90 + i * 36) * (Math.PI / 180)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export const CREST_COUNT = SHAPES.length * PALETTES.length

/** Zero-based. Returns the full SVG document for one crest. */
export function buildCrest(index: number): string {
  const shape = SHAPES[index % SHAPES.length]
  const palette = PALETTES[Math.floor(index / SHAPES.length) % PALETTES.length]
  // Steps out of phase with the shape so consecutive crests differ in both.
  const motif = MOTIFS[(index * 5 + 2) % MOTIFS.length]

  const clipId = `c${index}`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">` +
    `<clipPath id="${clipId}">${shape('')}</clipPath>` +
    shape(`fill="${palette.bg}"`) +
    `<g clip-path="url(#${clipId})">${motif(palette)}</g>` +
    // Redrawn on top as an outline, which keeps the silhouette legible once
    // the motif has filled most of the interior.
    shape(`fill="none" stroke="${palette.fg}" stroke-width="3"`) +
    `</svg>\n`
  )
}
