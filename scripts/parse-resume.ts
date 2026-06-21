import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { PortfolioData } from '../src/types/portfolio.ts'
import { parseResumeText, applyOverrides } from '../src/lib/parsePortfolio.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const RESUME_DIR = path.join(ROOT, 'public', 'resumes')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'portfolio.json')
const OVERRIDES_FILE = path.join(ROOT, 'src', 'data', 'overrides.json')

function loadOverrides(): Partial<PortfolioData> {
  if (!fs.existsSync(OVERRIDES_FILE)) return {}
  return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'))
}

// ── File readers ──────────────────────────────────────────────────────────────
async function readPdf(filePath: string): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(fs.readFileSync(filePath))
  return data.text
}

async function readDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth')
  const result  = await mammoth.extractRawText({ path: filePath })
  return result.value
}

// ── Seed (no resume present) ──────────────────────────────────────────────────
function seed(): PortfolioData {
  return {
    name: 'Your Name',
    title: 'Web Development Manager',
    summary: 'Add a resume (PDF or DOCX) to public/resumes/ to auto-generate this portfolio.',
    contact: { email: 'milindpatel647@gmail.com', github: 'https://github.com/Milindpatel' },
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    projects: [],
    lastUpdated: new Date().toISOString(),
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  const overrides = loadOverrides()
  const files = fs.existsSync(RESUME_DIR)
    ? fs.readdirSync(RESUME_DIR).filter(f => /\.(pdf|docx)$/i.test(f))
    : []

  if (files.length === 0) {
    console.log('No resumes in public/resumes/ — writing seed data.')
    fs.writeFileSync(OUT_FILE, JSON.stringify(applyOverrides(seed(), overrides), null, 2))
    return
  }

  const latest = files
    .map(f => ({ f, mtime: fs.statSync(path.join(RESUME_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f

  console.log(`Parsing resume: ${latest}`)
  const ext  = path.extname(latest).toLowerCase()
  const text = ext === '.pdf'
    ? await readPdf(path.join(RESUME_DIR, latest))
    : await readDocx(path.join(RESUME_DIR, latest))

  const data = applyOverrides(parseResumeText(text), overrides)
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2))
  console.log(`Written: ${OUT_FILE}`)
  console.log(`  Name:           ${data.name}`)
  console.log(`  Title:          ${data.title}`)
  console.log(`  Experience:     ${data.experience.length} roles`)
  console.log(`  Skill groups:   ${data.skills.length}`)
  console.log(`  Education:       ${data.education.length}`)
  console.log(`  Certifications:  ${data.certifications.length}`)
  console.log(`  Projects:        ${data.projects.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })
