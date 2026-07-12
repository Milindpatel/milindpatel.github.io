import { useEffect, useRef, useState } from 'react'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/**
 * Digital-rain easter egg. Triggered by the Konami code or the
 * "Enter the Matrix" command in the palette. Auto-dismisses.
 */
export default function MatrixRain() {
  const [active, setActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let pos = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActive(false)
        return
      }
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === KONAMI[pos]) {
        pos++
        if (pos === KONAMI.length) {
          pos = 0
          setActive(true)
        }
      } else {
        pos = key === KONAMI[0] ? 1 : 0
      }
    }
    const onEvent = () => setActive(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('matrix-mode', onEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('matrix-mode', onEvent)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(false)
      return
    }
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const fs = 14
    const cols = Math.ceil(w / fs)
    const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50))

    ctx.fillStyle = 'rgb(2, 6, 23)'
    ctx.fillRect(0, 0, w, h)

    let raf = 0
    let last = 0
    const step = (t: number) => {
      raf = requestAnimationFrame(step)
      if (t - last < 33) return
      last = t
      ctx.fillStyle = 'rgba(2, 6, 23, 0.10)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${fs}px monospace`
      for (let i = 0; i < cols; i++) {
        const y = drops[i]
        if (y >= 0) {
          const ch = Math.random() < 0.5
            ? String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
            : String.fromCharCode(0x21 + Math.floor(Math.random() * 93))
          ctx.fillStyle = Math.random() < 0.08 ? 'rgba(187, 247, 208, 0.95)' : 'rgba(34, 197, 94, 0.85)'
          ctx.fillText(ch, i * fs, y * fs)
        }
        drops[i] = y * fs > h && Math.random() > 0.975 ? Math.floor(Math.random() * -30) : y + 1
      }
    }
    raf = requestAnimationFrame(step)

    const timeout = setTimeout(() => setActive(false), 9000)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [active])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[95] bg-gray-950"
      onClick={() => setActive(false)}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-green-400/90 font-mono text-xs tracking-[0.25em] uppercase">
        Wake up, Neo · click or Esc to exit
      </p>
    </div>
  )
}
