import { useCallback, useRef, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Tracks the content box of an element with a ResizeObserver.
 *
 * The layout engine needs an exact height on every frame the container changes,
 * so this returns a ref callback rather than a ref object: the observer starts
 * the moment React attaches the node, with no first render where the size is
 * unknown for longer than it has to be.
 *
 * Heights are floored. A container is routinely a fractional number of pixels
 * tall, and handing the engine 0.6px it does not really have is the one way a
 * layout built to fit exactly can still overflow.
 */
export function useElementSize<T extends HTMLElement>() {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect()

    if (!node) {
      observer.current = null
      return
    }

    observer.current = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setSize((current) => {
        const width = Math.floor(box.width)
        const height = Math.floor(box.height)
        // Resize storms fire far more often than the numbers actually change,
        // and every new object here would rerun the whole layout.
        return current.width === width && current.height === height
          ? current
          : { width, height }
      })
    })
    observer.current.observe(node)
  }, [])

  return [ref, size] as const
}
