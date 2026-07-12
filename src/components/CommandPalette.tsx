import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../lib/useTheme'
import type { Contact } from '../types/portfolio'

interface CommandPaletteProps {
  links: { label: string; href: string }[]
  contact: Contact
}

interface Command {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
}

function Icon({ d, stroke = false }: { d: string; stroke?: boolean }) {
  return stroke ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
  )
}

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function CommandPalette({ links, contact }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  // Reset and focus when opening; lock page scroll while open.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSel(0)
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = links.map(l => ({
      id: `nav-${l.href}`,
      label: `Go to ${l.label}`,
      hint: 'section',
      icon: <Icon stroke d="M5 12h14M13 6l6 6-6 6" />,
      run: () => document.querySelector(l.href)?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' }),
    }))
    const actions = [
      {
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        hint: 'theme',
        icon: theme === 'dark'
          ? <Icon stroke d="M12 3v2M12 19v2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M3 12h2M19 12h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" />
          : <Icon stroke d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />,
        run: toggle,
      },
      {
        id: 'resume',
        label: 'Download resume',
        hint: 'pdf',
        icon: <Icon stroke d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />,
        run: () => window.open(`${import.meta.env.BASE_URL}Milind_Patel_Resume.pdf`, '_blank', 'noopener'),
      },
      contact.email && {
        id: 'copy-email',
        label: 'Copy email address',
        hint: contact.email,
        icon: <Icon stroke d="M8 8h12v12H8zM8 8V4h12v12h-4" />,
        run: async () => {
          try {
            await navigator.clipboard.writeText(contact.email!)
            setToast('Email copied to clipboard ✓')
          } catch {
            setToast(contact.email!)
          }
        },
      },
      contact.email && {
        id: 'email',
        label: 'Send an email',
        hint: 'mailto',
        icon: <Icon stroke d="M4 4h16v16H4zM4 6l8 7 8-7" />,
        run: () => { window.location.href = `mailto:${contact.email}` },
      },
      contact.github && {
        id: 'github',
        label: 'Open GitHub profile',
        hint: 'github.com',
        icon: <Icon d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.03a9.56 9.56 0 015 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.66.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.16.58.67.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />,
        run: () => window.open(contact.github!, '_blank', 'noopener'),
      },
      {
        id: 'ai',
        label: 'Ask the AI assistant',
        hint: 'chat',
        icon: <Icon d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z" />,
        run: () => window.dispatchEvent(new Event('open-ai-chat')),
      },
      {
        id: 'matrix',
        label: 'Enter the Matrix',
        hint: 'easter egg',
        icon: <Icon stroke d="M4 4h16v16H4zM8 9l3 3-3 3M13 15h4" />,
        run: () => window.dispatchEvent(new Event('matrix-mode')),
      },
    ].filter(Boolean) as Command[]
    return [...nav, ...actions]
  }, [links, contact, theme, toggle])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? commands.filter(c => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(q))
    : commands
  const selected = Math.min(sel, Math.max(0, filtered.length - 1))

  // Keep the highlighted option visible while arrowing through the list.
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selected, query])

  function execute(cmd: Command) {
    setOpen(false)
    cmd.run()
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(s => (s + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(s => (s - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault()
      execute(filtered[selected])
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative max-w-lg mx-auto mt-[16vh] px-4">
            <div
              className="bg-app/95 backdrop-blur-xl border border-line/15 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 animate-fade-up"
              style={{ animationDuration: '0.18s' }}
            >
              <div className="flex items-center gap-3 px-4 border-b border-line/10">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-faint shrink-0" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSel(0) }}
                  onKeyDown={onInputKeyDown}
                  placeholder="Type a command or search…"
                  aria-label="Search commands"
                  className="w-full bg-transparent py-3.5 text-sm text-content placeholder:text-faint focus:outline-none"
                />
                <kbd className="text-[10px] text-faint border border-line/20 rounded px-1.5 py-0.5 shrink-0">esc</kbd>
              </div>

              <ul ref={listRef} role="listbox" aria-label="Commands" className="max-h-[42vh] overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <li className="px-4 py-6 text-center text-faint text-sm">No matching commands</li>
                )}
                {filtered.map((c, i) => (
                  <li key={c.id} role="option" aria-selected={i === selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setSel(i)}
                      onClick={() => execute(c)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        i === selected ? 'bg-blue-500/15 text-content' : 'text-muted'
                      }`}
                    >
                      <span className={`shrink-0 ${i === selected ? 'text-blue-400' : 'text-faint'}`}>{c.icon}</span>
                      <span className="flex-1 truncate">{c.label}</span>
                      {c.hint && (
                        <span className="text-[10px] text-faint uppercase tracking-wider shrink-0">{c.hint}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 px-4 py-2 border-t border-line/10 text-[10px] text-faint">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span className="ml-auto hidden sm:inline">psst — the Konami code works here</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[96] bg-app/95 backdrop-blur-xl border border-line/15 text-content text-sm px-4 py-2 rounded-full shadow-xl animate-fade-up"
          style={{ animationDuration: '0.2s' }}
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  )
}
