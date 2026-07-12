import { Fragment, useState, useEffect } from 'react'
import type { Contact } from '../types/portfolio'
import ParticleField from './ParticleField'
import { useMagnetic } from '../hooks/useMagnetic'

interface HeroProps {
  name: string
  roles: string[]
  contact: Contact
  available: boolean
}

// Colour stops sampled per letter so the accent part of the name sweeps
// through the brand palette without relying on background-clip tricks.
const NAME_STOPS = ['#60a5fa', '#a78bfa', '#e879f9', '#22d3ee']

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function letterColor(i: number, total: number): string {
  if (total <= 1) return NAME_STOPS[0]
  const t = (i / (total - 1)) * (NAME_STOPS.length - 1)
  const seg = Math.min(NAME_STOPS.length - 2, Math.floor(t))
  const f = t - seg
  const [r1, g1, b1] = hexToRgb(NAME_STOPS[seg])
  const [r2, g2, b2] = hexToRgb(NAME_STOPS[seg + 1])
  return `rgb(${Math.round(r1 + (r2 - r1) * f)}, ${Math.round(g1 + (g2 - g1) * f)}, ${Math.round(b1 + (b2 - b1) * f)})`
}

export default function Hero({ name, roles, contact, available }: HeroProps) {
  const [roleIdx, setRoleIdx]   = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [offset, setOffset]     = useState(0)
  const magnetic = useMagnetic()

  // Subtle scroll parallax for the background orbs/grid (skipped if reduced motion).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll = () => setOffset(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const current = roles[roleIdx]
    if (!deleting && displayed.length < current.length) {
      const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 75)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === current.length) {
      const t = setTimeout(() => setDeleting(true), 2200)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 35)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false)
      setRoleIdx(i => (i + 1) % roles.length)
    }
  }, [displayed, deleting, roleIdx, roles])

  const words = name.trim().split(/\s+/)
  const accentTotal = words.slice(1).join('').length
  let letterIdx = 0
  let accentIdx = 0

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-app pt-14"
      aria-label="Introduction"
    >
      {/* Animated gradient orbs (with scroll parallax) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
        style={{ transform: `translateY(${offset * 0.3}px)` }}
      >
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-blue-700/25 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-3/4 left-1/3  w-[300px] h-[300px] bg-cyan-700/15  rounded-full blur-3xl animate-float" />
      </div>

      {/* Subtle grid (theme-aware, slower parallax) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          transform: `translateY(${offset * 0.15}px)`,
          backgroundImage: 'linear-gradient(to right,rgb(var(--line)/0.04) 1px,transparent 1px),linear-gradient(to bottom,rgb(var(--line)/0.04) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
        aria-hidden="true"
      />

      {/* Interactive constellation — particles link up near the cursor */}
      <ParticleField className="absolute inset-0" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-28 w-full">

        {available ? (
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" aria-hidden="true" />
            Available for opportunities
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-line/10 border border-line/20 text-faint text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-faint rounded-full" aria-hidden="true" />
            Not currently available
          </div>
        )}

        {/* Name rises letter by letter; the surname carries the palette sweep. */}
        <h1 className="font-display text-6xl sm:text-8xl font-bold leading-none mb-6 tracking-tight text-content">
          <span className="sr-only">{name}</span>
          <span aria-hidden="true">
            {words.map((word, wi) => (
              <Fragment key={wi}>
                {wi > 0 && ' '}
                <span className={`inline-block ${wi > 0 ? 'animate-hue' : ''}`}>
                  {Array.from(word).map((ch, ci) => {
                    const delay = 120 + letterIdx++ * 45
                    const color = wi > 0 ? letterColor(accentIdx++, accentTotal) : undefined
                    return (
                      <span key={ci} className="animate-letter" style={{ animationDelay: `${delay}ms`, color }}>
                        {ch}
                      </span>
                    )
                  })}
                </span>
              </Fragment>
            ))}
          </span>
        </h1>

        {/* Typewriter */}
        <div
          className="flex items-center gap-2 mb-10 h-9 animate-fade-up"
          style={{ animationDelay: '480ms' }}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-xl sm:text-2xl text-muted font-light">{displayed}</span>
          <span className="inline-block w-0.5 h-7 bg-blue-400 animate-blink" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap gap-4 mb-14 animate-fade-up" style={{ animationDelay: '620ms' }}>
          <a
            href="#experience"
            {...magnetic}
            className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-content font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-700/30"
          >
            View My Work
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
            </svg>
          </a>
          <a
            href="#contact"
            {...magnetic}
            className="inline-flex items-center gap-2 border border-line/20 hover:border-line/40 text-muted hover:text-content font-medium px-6 py-3 rounded-xl transition-all hover:bg-line/5"
          >
            Get in Touch
          </a>
          <a
            href={`${import.meta.env.BASE_URL}Milind_Patel_Resume.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            download
            {...magnetic}
            className="inline-flex items-center gap-2 border border-line/20 hover:border-line/40 text-muted hover:text-content font-medium px-6 py-3 rounded-xl transition-all hover:bg-line/5"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V3a1 1 0 011-1zM4 16a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"/>
            </svg>
            Download Resume
          </a>
        </div>

        {/* Social strip */}
        <div className="flex items-center gap-5 text-faint animate-fade-up" style={{ animationDelay: '780ms' }}>
          {contact.github && (
            <a href={contact.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile (opens in new tab)" className="hover:text-content transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile (opens in new tab)" className="hover:text-content transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.email}`} className="hover:text-content transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
          )}
          {contact.location && (
            <span className="flex items-center gap-1.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              {contact.location}
            </span>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-faint" aria-hidden="true">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-[22px] h-9 rounded-full border border-line/25 flex justify-center pt-1.5">
          <span className="w-1 h-2 rounded-full bg-blue-400 animate-scroll-dot" />
        </div>
      </div>
    </section>
  )
}
