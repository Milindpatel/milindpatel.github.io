# Milind Patel — Portfolio

Live site: **https://milindpatel.github.io**

A resume-driven single-page portfolio. The site's content is generated from my actual resume file at build time, deployed automatically to GitHub Pages on every push, and enhanced with an AI chat assistant, a command palette, and a set of hand-built interactive effects — all with **zero runtime dependencies beyond React**.

---

## Tech stack at a glance

| Layer | Technology | Why |
|---|---|---|
| UI framework | **React 18** (function components + hooks only) | Component model, ecosystem, `StrictMode` safety |
| Language | **TypeScript 5** (strict) | Compile-time safety across components, data, and scripts |
| Build tool | **Vite 5** | Instant dev server (native ESM), fast Rollup production builds |
| Styling | **Tailwind CSS 3** + CSS custom properties | Utility-first speed; CSS variables make theming trivial |
| Fonts | Inter (body) + Space Grotesk (display) via Google Fonts | Distinct typographic hierarchy |
| Hosting | **GitHub Pages** (user site, root domain) | Free, CDN-backed static hosting |
| CI/CD | **GitHub Actions** | Parse resume → build → deploy on every push to `main` |
| AI backend | **Cloudflare Worker** proxy → **Groq** (`llama-3.3-70b-versatile`) | Free streaming LLM chat without exposing an API key |
| Resume parsing | `pdf-parse` + `mammoth` (build time), `pdfjs-dist` + `mammoth` (in browser) | Turn a PDF/DOCX resume into structured JSON |

No UI libraries, no animation libraries, no state-management library — every effect (particles, palette, marquee, tilt) is hand-written. That's deliberate: it keeps the bundle lean and demonstrates fundamentals.

---

## Architecture

```
resume file (public/resumes/*.pdf|docx)
        │  npm run parse  (scripts/parse-resume.ts)
        ▼
parsed data  ──merge──  src/data/overrides.json   (manual corrections win)
        │
        ▼
src/data/portfolio.json     ← single source of truth
        │  imported at build time
        ▼
React SPA (App.tsx → section components)
        │  vite build
        ▼
dist/  ──GitHub Actions──►  gh-pages branch  ──►  GitHub Pages CDN
```

### 1. Resume-driven data pipeline
- `scripts/parse-resume.ts` finds the **newest** file in `public/resumes/`, extracts raw text (`pdf-parse` for PDF, `mammoth` for DOCX), and runs a heuristic parser (`src/lib/parsePortfolio.ts`) that recognizes sections, job entries, dates, skills, education, and certifications.
- `src/data/overrides.json` is deep-merged on top — the escape hatch for anything the parser gets wrong (e.g., job locations, curated skill groups). **Overrides always win**, so manual fixes survive re-parsing.
- The result is written to `src/data/portfolio.json` and imported directly by React. UI derives everything from it: nav links appear only for non-empty sections, hero stats (years of experience, companies, roles) are computed from the experience dates, and the typewriter cycles real job titles.

### 2. Deployment (`.github/workflows/deploy.yml`)
Every push to `main`: checkout → Node 20 + npm cache → `npm ci` → `npm run parse` → `npm run build` → publish `dist/` to the `gh-pages` branch (`peaceiris/actions-gh-pages`). GitHub Pages serves it globally. There is no server to maintain.

### 3. AI chat without a backend server
Static sites can't keep secrets, so the chat uses a ~40-line **Cloudflare Worker** (`worker/worker.js`) as a proxy:
- The browser POSTs the conversation to the Worker.
- The Worker holds the Groq API key as a **secret** (never in the repo or bundle), forwards the request, and streams the response back as Server-Sent Events; the client parses SSE chunks and renders tokens as they arrive.
- The system prompt is built **from the live portfolio JSON** (`buildSystemPrompt`), grounding the model in real resume facts with an explicit "don't invent details" instruction — a small practical RAG-style guardrail against hallucination.
- Cost: $0 (Groq free tier + Cloudflare free Workers tier). The Worker checks the request origin as a basic abuse deterrent.

### 4. Theming (dark/light)
- Colors are **CSS custom properties** (`--bg`, `--content`, `--muted`, `--line`…) defined per theme class on `<html>`; Tailwind tokens map to them (`app`, `content`, `muted`, `line`) with full alpha support: `rgb(var(--line) / <alpha-value>)`.
- A tiny inline script in `index.html` reads `localStorage` and applies the theme class **before first paint** — no flash of the wrong theme.
- Multiple components (nav toggle, command palette) share theme state via a custom `themechange` window event, so instances never desync.

---

## Feature highlights (and how they're built)

| Feature | Implementation |
|---|---|
| **Command palette (Ctrl+K)** | Custom React dialog: global `keydown` listener, fuzzy filter, arrow-key navigation with `aria-selected`, body-scroll lock, focus management. Actions dispatch `CustomEvent`s (open AI chat, Matrix mode) to stay decoupled from other components. |
| **Particle constellation (hero/contact)** | Raw `<canvas>` + `requestAnimationFrame`. Particle count scales with area, devicePixelRatio capped at 2, lines drawn between near neighbors and to the cursor. An `IntersectionObserver` pauses the loop off-screen; a `ResizeObserver` handles resizes; disabled under `prefers-reduced-motion`. |
| **Letter-by-letter name reveal** | The name is split into per-letter `<span>`s with staggered `animation-delay`s. The surname's gradient is done by **interpolating hex colors per letter** in JS (no `background-clip: text` on animated children — avoids a real cross-browser rendering pitfall). Screen readers get a `sr-only` full name; the animated copy is `aria-hidden`. |
| **Scroll-reveal sections** | A reusable `useInView` hook wrapping `IntersectionObserver`; disconnects after first trigger to avoid re-running. |
| **Cursor spotlight on cards** | One `mousemove` handler writes `--mx`/`--my` CSS variables on the card; a CSS `::before` radial-gradient positioned by those variables does the rendering — JS only feeds coordinates, the GPU does the work. |
| **3D tilt on project cards** | `getBoundingClientRect` → cursor offset → `perspective() rotateX() rotateY()` transform, gated to fine pointers and non-reduced-motion. |
| **Count-up stats** | `requestAnimationFrame` loop with an ease-out-quart curve; starts when the section scrolls into view; jumps straight to the final value under reduced motion. |
| **Skills marquee** | Pure CSS: the track holds two copies of the list and animates `translateX(-50%)` for a seamless loop; edge fades via `mask-image`; pauses on hover; the duplicate copy is `aria-hidden`. |
| **Live GitHub stats** | `fetch` to the public GitHub REST API (`/users/:name`), cached in `sessionStorage`, renders nothing on failure — progressive enhancement. |
| **Matrix easter egg** | Konami code (`↑↑↓↓←→←→BA`) sequence tracker on `keydown` (ignores inputs), or a palette command. Canvas digital-rain: per-column drop positions, translucent fill each frame for the trail effect, auto-dismisses. |
| **Magnetic CTA buttons** | Cursor offset from element center → clamped `translate()`; CSS transition springs it back on leave. |
| **Local time in Contact** | `Intl.DateTimeFormat` with an IANA `timeZone` (`America/Toronto`), refreshed on an interval — no date library. |
| **Admin mode + client-side resume upload** | Client-side gate (SHA-256 via Web Crypto, sessionStorage session). An admin can drop a new resume: it's parsed **entirely in the browser** (`pdfjs-dist`/`mammoth`) and stored in `localStorage` — it only affects that browser, never the deployed site, which is exactly why client-side auth is acceptable here. |
| **Theme toggle, scroll progress, active-nav highlight** | CSS variables + a scroll listener computing page %, and an `IntersectionObserver` with an offset `rootMargin` marking the active section link. |

---

## Accessibility & performance

- **Reduced motion**: a global `prefers-reduced-motion` rule collapses all CSS animations/transitions and forces single iterations; every JS-driven effect (canvas, tilt, count-up, magnetic) independently checks the media query.
- **Semantics**: skip-to-content link, `aria-labelledby` sections, `role="dialog"`/`listbox`/`option` in the palette, `aria-live` for the typewriter, labeled icon links, visible `:focus-visible` rings.
- **SEO/social**: meta description, Open Graph + Twitter cards with a generated OG image, JSON-LD `Person` schema.
- **Performance**: no runtime UI libraries; animations use only compositor-friendly properties (`transform`, `opacity`) or canvas; observers instead of scroll polling where possible; heavy resume-parsing libraries are code-split into a separate chunk that only loads for the admin upload flow; canvas loops stop entirely off-screen.

---

## Project structure

```
├── .github/workflows/deploy.yml   # CI/CD: parse → build → deploy to gh-pages
├── index.html                     # Meta/SEO, fonts, pre-paint theme script
├── scripts/
│   ├── parse-resume.ts            # Resume → portfolio.json (build time)
│   ├── generate-resume.ts         # Regenerate a styled resume from data
│   └── hash-password.ts           # Helper to set the admin password hash
├── worker/                        # Cloudflare Worker AI proxy (deployed separately)
├── src/
│   ├── App.tsx                    # Composition root; derives stats/links from data
│   ├── data/
│   │   ├── portfolio.json         # Generated content (single source of truth)
│   │   └── overrides.json         # Manual corrections merged over parsed data
│   ├── components/                # Hero, Experience, Skills, CommandPalette,
│   │   …                          # ParticleField, MatrixRain, AiChat, etc.
│   ├── hooks/                     # useInView, useCountUp, useSpotlight, useMagnetic
│   ├── lib/                       # parsePortfolio, aiAssistant, auth, useTheme
│   └── index.css                  # Theme variables + custom utilities/keyframes
└── tailwind.config.ts             # Theme tokens, fonts, keyframes/animations
```

---

## Running locally

Requires **Node 20+**.

```bash
npm ci            # install
npm run dev       # Vite dev server with HMR
npm run parse     # re-generate portfolio.json from public/resumes/
npm run build     # parse + type-safe production build to dist/
npm run preview   # serve the production build locally
npm run hash -- "new-password"   # rotate the admin password hash
```

---

## Interview cheat sheet

**"Walk me through the architecture."**
Static React SPA generated from data. A build-time script parses my real resume (PDF/DOCX → text → structured JSON), merges manual overrides, and the React app renders entirely from that JSON. GitHub Actions rebuilds and deploys to GitHub Pages on every push. The only dynamic piece — AI chat — goes through a Cloudflare Worker so the LLM API key stays server-side.

**"Why Vite instead of webpack/CRA?"**
Dev server starts instantly because it serves native ES modules and transpiles on demand with esbuild instead of bundling up front; production uses Rollup for tree-shaken output. CRA is deprecated and its webpack builds are much slower.

**"Why Tailwind? Isn't it messy?"**
Speed and consistency: design tokens (spacing, color, type) are constrained by config, dead styles are purged automatically, and there's no CSS-naming drift. Where utilities fall short, I wrote real CSS — theme variables, keyframes, and custom utilities like the cursor spotlight — so it's utilities *plus* CSS fundamentals, not instead of them.

**"How does dark mode work without flickering?"**
The theme is a class on `<html>` backed by CSS custom properties. An inline script in `<head>` applies the saved class *before* the first paint, so there's no flash. Components read/write it through a shared hook that broadcasts a `themechange` event to keep every instance in sync.

**"How do you keep the AI chat free and secure on a static site?"**
You can't ship an API key in a static bundle, so the key lives as a secret in a Cloudflare Worker. The browser talks only to the Worker; the Worker calls Groq's OpenAI-compatible endpoint and streams SSE back. The system prompt is generated from the portfolio JSON with instructions to answer only from those facts — grounding it against hallucination.

**"What did you do for accessibility?"**
Reduced-motion support at both the CSS layer (global media query) and JS layer (each effect checks before animating), semantic landmarks and ARIA roles (dialog/listbox for the palette, aria-live for the typewriter), keyboard-first features (Ctrl+K palette, arrow-key navigation), skip link, and visible focus states.

**"What was the trickiest bug or edge case?"**
Animating a gradient headline letter-by-letter: `background-clip: text` on a parent doesn't reliably follow transformed child spans across browsers. I solved it by interpolating the gradient's hex stops in JS and giving each letter its own solid color — same visual, no rendering pitfall, and the animation stays compositor-friendly.

**"How does the site stay in sync with your resume?"**
I drop the new PDF/DOCX into `public/resumes/` and push. CI re-parses it, and anything the parser can't infer correctly lives in `overrides.json`, which is merged on top — manual truth beats parsed guess. The stats (years of experience, role count) are computed from the data, so they update themselves.

**"Why no state-management library?"**
The data is read-only after build and flows top-down as props. Local `useState`/`useEffect` plus a couple of window events cover the cross-cutting cases (theme sync, opening the chat from the palette). Adding Redux/Zustand here would be complexity without payoff.

---

*Built by Milind Patel, with AI-assisted development (Claude) as part of the workflow — which is itself a talking point: prompt-engineering and reviewing AI output are skills I use professionally.*
