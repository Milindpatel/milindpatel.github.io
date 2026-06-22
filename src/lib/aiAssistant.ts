// AI assistant that talks to a free serverless proxy (Cloudflare Worker → Groq).
// The proxy holds the API key server-side, so the static site never exposes it
// and visitors need no key and no download. See worker/README.md to deploy.
import type { PortfolioData } from '../types/portfolio'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ⬇️ After deploying the Worker, set this to its URL (see worker/README.md).
export const PROXY_URL = 'https://milind-portfolio-ai.milindpatel.workers.dev'

export function isConfigured(): boolean {
  return !PROXY_URL.includes('REPLACE_WITH_YOUR_WORKER_URL')
}

// Grounded system prompt built from the live portfolio data.
export function buildSystemPrompt(d: PortfolioData): string {
  const lines: Array<string | false | undefined> = []
  lines.push(
    `You are a friendly assistant on ${d.name}'s portfolio website. Answer questions about ${d.name} using ONLY the facts below. Speak in the third person, be concise (1-3 sentences), and never invent details. If the answer isn't in the facts, say you don't have that information and suggest the contact section.`,
    '',
    'FACTS:',
    `Name: ${d.name}. Title: ${d.title}.`,
    d.contact.location && `Location: ${d.contact.location}.`,
    d.summary && `Summary: ${d.summary}`,
    '',
  )
  if (d.experience.length) {
    lines.push('Experience:')
    for (const e of d.experience) {
      lines.push(`- ${e.title} at ${e.company} (${e.startDate}–${e.endDate}): ${e.bullets.join(' ')}${e.tech?.length ? ` Tech: ${e.tech.join(', ')}.` : ''}`)
    }
    lines.push('')
  }
  if (d.skills.length) {
    lines.push('Skills:')
    for (const g of d.skills) lines.push(`- ${g.category}: ${g.items.join(', ')}`)
    lines.push('')
  }
  if (d.education.length) {
    lines.push('Education:', ...d.education.map(ed => `- ${ed.degree}, ${ed.institution}${ed.period ? ` (${ed.period})` : ''}${ed.score ? `, score ${ed.score}` : ''}`), '')
  }
  if (d.certifications.length) lines.push('Certifications: ' + d.certifications.join('; '), '')
  if (d.projects.length) lines.push('Projects: ' + d.projects.map(p => `${p.name}${p.description ? ` (${p.description})` : ''}`).join('; '), '')
  return lines.filter((l): l is string => typeof l === 'string').join('\n')
}

// Stream a response from the proxy, parsing the OpenAI-style SSE chunks.
export async function streamChat(opts: {
  system: string
  messages: ChatMessage[]
  onText: (text: string) => void
  signal?: AbortSignal
}): Promise<void> {
  const resp = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: opts.system }, ...opts.messages] }),
    signal: opts.signal,
  })

  if (!resp.ok || !resp.body) {
    const detail = await resp.text().catch(() => '')
    throw new Error(describeError(resp.status, detail))
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) opts.onText(delta)
      } catch { /* ignore keep-alive / partial lines */ }
    }
  }
}

function describeError(status: number, detail: string): string {
  if (status === 403) return 'This chat can only be used from the portfolio site.'
  if (status === 429) return 'The free AI is busy right now (rate limit). Please try again in a moment.'
  if (status >= 500) return 'The AI service is temporarily unavailable. Please try again shortly.'
  if (detail && detail.length < 200) return detail
  return 'Something went wrong reaching the AI. Please try again.'
}
