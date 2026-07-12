import { useEffect, useState } from 'react'

const THEME_KEY = 'portfolio-theme'
type Theme = 'dark' | 'light'

function current(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
    // Keep other useTheme instances (nav toggle, command palette) in sync.
    window.dispatchEvent(new Event('themechange'))
  }, [theme])

  useEffect(() => {
    const sync = () => setTheme(current())
    window.addEventListener('themechange', sync)
    return () => window.removeEventListener('themechange', sync)
  }, [])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}
