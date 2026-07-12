import { useEffect, useState } from 'react'

interface GhData {
  repos: number
  followers: number
  since: string
}

/**
 * Live stats pulled from the public GitHub API. Renders nothing until the
 * fetch succeeds, and caches per session to stay well under rate limits.
 */
export default function GitHubStats({ githubUrl }: { githubUrl?: string }) {
  const [data, setData] = useState<GhData | null>(null)
  const username = githubUrl?.match(/github\.com\/([^/?#]+)/)?.[1]

  useEffect(() => {
    if (!username) return
    const KEY = `gh-stats-${username}`
    try {
      const cached = sessionStorage.getItem(KEY)
      if (cached) {
        setData(JSON.parse(cached) as GhData)
        return
      }
    } catch { /* ignore */ }

    let alive = true
    fetch(`https://api.github.com/users/${username}`)
      .then(r => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((j: { public_repos?: number; followers?: number; created_at?: string }) => {
        const d: GhData = {
          repos: j.public_repos ?? 0,
          followers: j.followers ?? 0,
          since: (j.created_at ?? '').slice(0, 4),
        }
        if (alive) {
          setData(d)
          try { sessionStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ }
        }
      })
      .catch(() => { /* stay hidden on failure */ })
    return () => { alive = false }
  }, [username])

  if (!username || !data) return null

  const chips = [
    `${data.repos} public repos`,
    `${data.followers} follower${data.followers === 1 ? '' : 's'}`,
    data.since && `on GitHub since ${data.since}`,
  ].filter(Boolean) as string[]

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 text-xs" aria-label="Live GitHub statistics">
      <span className="flex items-center gap-1.5 text-green-400 font-semibold tracking-widest uppercase text-[10px]">
        <span className="relative flex w-2 h-2" aria-hidden="true">
          <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-60 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
        </span>
        Live
      </span>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`GitHub profile of ${username} (opens in new tab)`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line/10 bg-line/5 text-muted hover:text-content hover:border-line/25 transition-colors font-medium"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.03a9.56 9.56 0 015 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.66.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.16.58.67.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z"/>
        </svg>
        @{username}
      </a>
      {chips.map(chip => (
        <span key={chip} className="px-2.5 py-1 rounded-full border border-line/10 bg-line/5 text-muted font-medium">
          {chip}
        </span>
      ))}
    </div>
  )
}
