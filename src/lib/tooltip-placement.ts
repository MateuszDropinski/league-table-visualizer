interface Anchor {
  left: number
  top: number
  bottom: number
  width: number
}

/** Keep the measured card inside the viewport, preferring space above its team. */
export function tooltipPlacement(
  anchor: Anchor,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const margin = 8
  const offset = 10
  const above = anchor.top - offset - card.height
  const desiredTop = above >= margin ? above : anchor.bottom + offset
  const clamp = (value: number, maximum: number) => Math.max(margin, Math.min(value, maximum))

  return {
    left: clamp(anchor.left + anchor.width / 2 - card.width / 2, viewport.width - card.width - margin),
    top: clamp(desiredTop, viewport.height - card.height - margin),
  }
}
