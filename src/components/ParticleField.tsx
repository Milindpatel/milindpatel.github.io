import { useEffect, useRef } from 'react'

interface ParticleFieldProps {
  className?: string
  /** Screen area (px²) per particle — larger means sparser. */
  density?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

const LINK_DIST = 110
const POINTER_DIST = 160

export default function ParticleField({ className = '', density = 15000 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let running = false
    let inView = true
    const pointer = { x: -1e4, y: -1e4 }
    let particles: Particle[] = []

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(110, Math.floor((w * h) / density))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.6,
      }))
    }

    const step = () => {
      if (!inView) {
        running = false
        return
      }
      ctx.clearRect(0, 0, w, h)
      const light = document.documentElement.classList.contains('light')
      const dot = light ? '71, 85, 105' : '148, 163, 184'
      const accent = light ? '37, 99, 235' : '96, 165, 250'

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -12) p.x = w + 12
        else if (p.x > w + 12) p.x = -12
        if (p.y < -12) p.y = h + 12
        else if (p.y > h + 12) p.y = -12
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dot}, 0.45)`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DIST * LINK_DIST) {
            ctx.strokeStyle = `rgba(${dot}, ${0.16 * (1 - d2 / (LINK_DIST * LINK_DIST))})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        const dx = a.x - pointer.x
        const dy = a.y - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < POINTER_DIST * POINTER_DIST) {
          ctx.strokeStyle = `rgba(${accent}, ${0.3 * (1 - d2 / (POINTER_DIST * POINTER_DIST))})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(pointer.x, pointer.y)
          ctx.stroke()
        }
      }
      raf = requestAnimationFrame(step)
    }

    const start = () => {
      if (running || !inView) return
      running = true
      raf = requestAnimationFrame(step)
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onPointerGone = () => {
      pointer.x = -1e4
      pointer.y = -1e4
    }

    resize()
    start()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    // Stop drawing entirely while the canvas is scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView) start()
      },
      { rootMargin: '120px' },
    )
    io.observe(canvas)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerGone)

    return () => {
      inView = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onPointerGone)
    }
  }, [density])

  return <canvas ref={canvasRef} className={`block w-full h-full pointer-events-none ${className}`} aria-hidden="true" />
}
