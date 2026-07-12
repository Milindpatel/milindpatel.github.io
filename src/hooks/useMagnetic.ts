import { useCallback } from 'react'

const canUse =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Makes an element gently follow the cursor while hovered ("magnetic"
 * buttons). Pair with a transform transition for the spring-back.
 */
export function useMagnetic(strength = 0.22, max = 7) {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!canUse) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const clamp = (v: number) => Math.max(-max, Math.min(max, v * strength))
    const dx = clamp(e.clientX - (r.left + r.width / 2))
    const dy = clamp(e.clientY - (r.top + r.height / 2))
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
  }, [strength, max])

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = ''
  }, [])

  return { onMouseMove, onMouseLeave }
}
