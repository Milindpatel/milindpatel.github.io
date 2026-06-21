// Pure résumé-text → PortfolioData parsing, shared by the build-time Node script
// (scripts/parse-resume.ts) and the in-browser live upload (ResumeUpload.tsx).
// No filesystem / Node APIs here so it runs in both environments.
import type {
  PortfolioData, Experience, Education, Project, Contact, SkillGroup,
} from '../types/portfolio'

// ── Section heading detection ─────────────────────────────────────────────────
function sectionKey(line: string): string | null {
  const t = line.trim()
  if (t.length > 42) return null
  if (/^(highlight of qualification|professional summary|summary|profile|objective|about)/i.test(t)) return 'summary'
  if (/^(technical skill|skills|core competenc|technologies\b)/i.test(t)) return 'skills'
  if (/^(work experience|professional experience|experience|employment|career)/i.test(t)) return 'experience'
  if (/^(certification)/i.test(t)) return 'certifications'
  if (/^(project)/i.test(t)) return 'projects'
  if (/^(education|academic)/i.test(t)) return 'education'
  return null
}

function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    header: [], summary: [], skills: [], experience: [],
    certifications: [], projects: [], education: [],
  }
  let current = 'header'
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const key = sectionKey(line)
    if (key) { current = key; continue }
    sections[current].push(line)
  }
  return sections
}

function extractNameTitle(header: string[]): { name: string; title: string } {
  const name = header[0]?.trim() ?? 'Your Name'
  const titleLine = header.slice(1).find(l => !/@|\d{3}.*\d{4}|https?:|linkedin|github/i.test(l))
  const title = (titleLine ?? '').replace(/^\(+|\)+$/g, '').trim() || 'Professional'
  return { name, title }
}

function extractContact(text: string, fallbackLocation?: string): Contact {
  const email         = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0]
  const phone         = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0]
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w-]+)/i)
  const githubMatch   = text.match(/github\.com\/([\w-]+)/i)
  return {
    ...(email         && { email }),
    ...(phone         && { phone }),
    ...(linkedinMatch && { linkedin: `https://linkedin.com/in/${linkedinMatch[1]}` }),
    ...(githubMatch   && { github:   `https://github.com/${githubMatch[1]}` }),
    ...(fallbackLocation && { location: fallbackLocation }),
  }
}

function parseSkills(lines: string[]): SkillGroup[] {
  const groups: SkillGroup[] = []
  let current: SkillGroup | null = null
  for (const line of lines) {
    if (line.includes(',')) {
      const items = line.split(',').map(s => s.trim()).filter(Boolean)
      if (!current) { current = { category: 'Skills', items: [] }; groups.push(current) }
      current.items.push(...items)
    } else {
      current = { category: line.trim(), items: [] }
      groups.push(current)
    }
  }
  return groups.filter(g => g.items.length > 0)
}

const DATE_RANGE = /^([A-Za-z]{3,9}\.?\s*\d{4}|\d{4})\s*[–—-]\s*([A-Za-z]{3,9}\.?\s*\d{4}|Present|Current|\d{4})/i
const TOOLS_LINE = /^tools?\s*(and|&)?\s*tech/i

function jobFromHeader(line: string): Experience {
  const [left, right = ''] = line.split('|').map(s => s.trim())
  const parts = left.split(',').map(s => s.trim()).filter(Boolean)
  return {
    title:     right,
    company:   parts[0] ?? '',
    ...(parts.length > 1 ? { location: parts.slice(1).join(', ') } : {}),
    startDate: '',
    endDate:   '',
    bullets:   [],
  }
}

function parseExperience(lines: string[]): Experience[] {
  const jobs: Experience[] = []
  let current: Experience | null = null
  for (const line of lines) {
    if (TOOLS_LINE.test(line)) {
      const after = line.slice(line.indexOf(':') + 1)
      if (current && line.includes(':')) {
        current.tech = after.split(',').map(s => s.trim()).filter(Boolean)
      }
      continue
    }
    const date = line.match(DATE_RANGE)
    if (date) {
      if (current) { current.startDate = date[1].trim(); current.endDate = date[2].trim() }
      continue
    }
    if (line.includes('|')) {
      if (current) jobs.push(current)
      current = jobFromHeader(line)
      continue
    }
    if (current) current.bullets.push(line.replace(/^[•·\-*]\s*/, ''))
  }
  if (current) jobs.push(current)
  return jobs.filter(j => j.company)
}

function parseEducation(lines: string[]): Education[] {
  const results: Education[] = []
  let current: Education | null = null
  for (const line of lines) {
    if (line.includes('||')) {
      if (current) results.push(current)
      const [inst, degree = ''] = line.split('||').map(s => s.trim())
      current = { institution: inst, degree }
    } else if (current && /^score/i.test(line)) {
      current.score = line.replace(/^score:?\s*/i, '').trim()
    } else if (current && line.includes('|')) {
      const [loc, period = ''] = line.split('|').map(s => s.trim())
      current.location = loc
      if (period) current.period = period
    } else if (current && !current.degree) {
      current.degree = line
    }
  }
  if (current) results.push(current)
  return results
}

function parseCertifications(lines: string[]): string[] {
  return lines.map(l => l.trim()).filter(l => l.length > 2)
}

function parseProjects(lines: string[]): Project[] {
  const results: Project[] = []
  let current: Project | null = null
  for (const line of lines) {
    if (TOOLS_LINE.test(line) || /^tools?\s*(and|&)?\s*technolog/i.test(line)) {
      if (current && line.includes(':')) {
        current.technologies = line.slice(line.indexOf(':') + 1).split(',').map(s => s.trim()).filter(Boolean)
      }
      continue
    }
    if (line.includes('|')) {
      if (current) results.push(current)
      const [name, context = ''] = line.split('|').map(s => s.trim())
      current = { name, description: context, technologies: [] }
    } else if (current) {
      current.description = current.description ? `${current.description} ${line}` : line
    }
  }
  if (current) results.push(current)
  return results.filter(p => p.name)
}

// ── Raw text → PortfolioData ──────────────────────────────────────────────────
export function parseResumeText(text: string): PortfolioData {
  const lines    = text.split('\n')
  const sections = splitSections(lines)
  const { name, title } = extractNameTitle(sections.header)

  const experience = parseExperience(sections.experience)
  const fallbackLocation = experience[0]?.location?.split(',')[0]

  return {
    name,
    title,
    summary:        sections.summary.join(' ').replace(/\s+/g, ' ').trim(),
    contact:        extractContact(text, fallbackLocation),
    experience,
    skills:         parseSkills(sections.skills),
    education:      parseEducation(sections.education),
    certifications: parseCertifications(sections.certifications),
    projects:       parseProjects(sections.projects),
    lastUpdated:    new Date().toISOString(),
  }
}

// ── Manual overrides ──────────────────────────────────────────────────────────
// Merge an overrides object on top of parsed data. Experience patches match an
// existing role by company + startDate (stable key), then company + title, then
// company; an unmatched patch is prepended (e.g. a promotion).
export function applyOverrides(data: PortfolioData, ov: Partial<PortfolioData>): PortfolioData {
  if (!ov) return data
  if (ov.name)           data.name = ov.name
  if (ov.title)          data.title = ov.title
  if (ov.summary)        data.summary = ov.summary
  if (ov.contact)        data.contact = { ...data.contact, ...ov.contact }
  if (ov.skills)         data.skills = ov.skills
  if (ov.education)      data.education = ov.education
  if (ov.certifications) data.certifications = ov.certifications
  if (ov.projects)       data.projects = ov.projects

  if (Array.isArray(ov.experience)) {
    for (const patch of ov.experience as Experience[]) {
      const idx = data.experience.findIndex(e =>
        e.company === patch.company &&
        (patch.startDate ? e.startDate === patch.startDate
          : patch.title ? e.title === patch.title
            : true),
      )
      if (idx >= 0) data.experience[idx] = { ...data.experience[idx], ...patch }
      else data.experience.unshift(patch)
    }
  }
  return data
}
