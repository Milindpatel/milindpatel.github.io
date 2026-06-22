# Portfolio AI Proxy (Cloudflare Worker)

A tiny free serverless proxy so the portfolio chat can use a hosted LLM
(**Groq**, free tier) without exposing an API key on the static site.

## One-time setup (~3 minutes, all free)

1. **Get a free Groq API key**
   - Sign up at https://console.groq.com → **API Keys** → create a key (starts with `gsk_...`).

2. **Install Wrangler (Cloudflare CLI)** — needs Node 18+:
   ```bash
   npm install -g wrangler
   wrangler login        # opens a browser; create a free Cloudflare account if needed
   ```

3. **Deploy the Worker** (from this `worker/` folder):
   ```bash
   cd worker
   wrangler secret put GROQ_API_KEY     # paste your gsk_... key when prompted
   wrangler deploy
   ```
   Wrangler prints the Worker URL, e.g.
   `https://milind-portfolio-ai.<your-subdomain>.workers.dev`

4. **Point the site at it**
   - Open `src/lib/aiAssistant.ts`, set `PROXY_URL` to your Worker URL.
   - Commit & push — GitHub Actions redeploys. The chat now works for everyone,
     with no download and no key.

## Notes
- **Cost:** $0 within Groq's free rate limits and Cloudflare's free Worker tier.
- **Model:** `llama-3.3-70b-versatile` (in `worker.js`). If Groq deprecates it,
  change `MODEL` to a current one from https://console.groq.com/docs/models and
  re-run `wrangler deploy`.
- **Abuse:** the Worker only accepts requests from the site's origin (a basic
  deterrent). For hard limits, add Cloudflare's Rate Limiting binding.
- **Switch providers:** to use Google Gemini / OpenRouter instead, change the
  upstream URL, model, and auth header in `worker.js` (all are OpenAI-compatible
  except Gemini, which needs its own request shape).
