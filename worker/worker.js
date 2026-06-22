// Cloudflare Worker — free AI proxy for the portfolio chat.
// Holds the LLM API key server-side (as a secret) so the static site never
// exposes it. Streams responses from Groq's free, OpenAI-compatible API.
//
// Deploy: see worker/README.md. Set the secret with:
//   wrangler secret put GROQ_API_KEY

const MODEL = 'llama-3.3-70b-versatile' // Groq free model; swap if deprecated
const ALLOWED_ORIGINS = [
  'https://milindpatel.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), allowOrigin)
    if (request.method !== 'POST') return cors(new Response('Method not allowed', { status: 405 }), allowOrigin)
    // Light deterrent against off-site abuse (Origin is spoofable, but stops casual use).
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return cors(json({ error: 'Forbidden origin' }, 403), allowOrigin)
    }

    let body
    try { body = await request.json() } catch { return cors(json({ error: 'Invalid JSON' }, 400), allowOrigin) }
    const messages = body && body.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return cors(json({ error: 'messages[] required' }, 400), allowOrigin)
    }
    // Cap input size as a basic guard.
    const trimmed = messages.slice(-12).map(m => ({
      role: String(m.role || 'user'),
      content: String(m.content || '').slice(0, 6000),
    }))

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: trimmed,
        stream: true,
        temperature: 0.3,
        max_tokens: 512,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '')
      return cors(new Response(text || 'Upstream error', { status: upstream.status || 502 }), allowOrigin)
    }

    // Pass the SSE stream straight through to the browser.
    return cors(
      new Response(upstream.body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }),
      allowOrigin,
    )
  },
}

function cors(resp, origin) {
  const h = new Headers(resp.headers)
  h.set('Access-Control-Allow-Origin', origin)
  h.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type')
  h.set('Vary', 'Origin')
  return new Response(resp.body, { status: resp.status, headers: h })
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
