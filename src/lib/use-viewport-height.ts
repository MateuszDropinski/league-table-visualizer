import { useEffect, useState } from 'react'

/**
 * The height of the visible page, floored to whole pixels.
 *
 * The table no longer scrolls inside a container: when the grid is taller than
 * the screen the whole document scrolls, which means the element around the
 * table is as tall as the table and can no longer be asked how much room there
 * is. Only the viewport knows that, and taking the number from here keeps the
 * one feedback loop that would matter out of the layout entirely: the grid
 * grows, the page grows, and what the engine is handed does not move.
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : Math.floor(window.innerHeight),
  )

  useEffect(() => {
    const update = () => setHeight(Math.floor(window.innerHeight))
    // Once on mount as well, since the first paint can land before the browser
    // has settled on a height, notably while a mobile URL bar is collapsing.
    update()

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return height
}
