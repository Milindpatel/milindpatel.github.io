import { useCallback } from 'react'

/**
 * Returns a mousemove handler that tracks the cursor position as CSS
 * variables (--mx / --my) on the hovered element, powering the
 * `.spotlight` radial-glow utility (see index.css).
 */
export function useSpotlight() {
  return useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])
}
