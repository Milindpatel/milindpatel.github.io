import { useInView } from '../hooks/useInView'
import { useSpotlight } from '../hooks/useSpotlight'
import SectionHeading from './SectionHeading'
import type { Experience as ExperienceType } from '../types/portfolio'

interface ExperienceProps {
  experience: ExperienceType[]
  num: string
}

const DOT_COLORS = [
  'bg-blue-500 ring-blue-500/30',
  'bg-violet-500 ring-violet-500/30',
  'bg-cyan-500 ring-cyan-500/30',
]

function ExperienceItem({ job, index }: { job: ExperienceType; index: number }) {
  const { ref, inView } = useInView(0.1)
  const spotlight = useSpotlight()
  const isCurrent = /present/i.test(job.endDate)

  return (
    <li
      ref={ref as React.RefObject<HTMLLIElement>}
      className={`pl-8 relative transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {isCurrent && (
        <span
          className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-400/70 animate-ping-slow"
          aria-hidden="true"
        />
      )}
      <span
        className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-app ring-2 ${DOT_COLORS[index % DOT_COLORS.length]}`}
        aria-hidden="true"
      />

      <div onMouseMove={spotlight} className="glass spotlight rounded-2xl p-6 hover:bg-line/10 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
          <h3 className="text-content font-semibold text-lg">{job.title}</h3>
          <span className="text-xs text-faint whitespace-nowrap font-mono">
            {job.startDate} — {job.endDate}
          </span>
        </div>

        <p className="text-blue-400 text-sm font-medium mb-4">
          {job.company}
          {job.location && <span className="text-faint font-normal"> · {job.location}</span>}
        </p>

        {job.bullets.length > 0 && (
          <ul className="space-y-2" aria-label={`Responsibilities at ${job.company}`}>
            {job.bullets.map((b, j) => (
              <li key={j} className="flex gap-2.5 text-muted text-sm leading-relaxed">
                <span className="text-blue-500 mt-0.5 shrink-0" aria-hidden="true">▸</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {job.tech && job.tech.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-line/5" aria-label={`Technologies used at ${job.company}`}>
            {job.tech.map((t, j) => (
              <li key={j} className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/20 rounded text-xs font-medium">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

export default function Experience({ experience, num }: ExperienceProps) {
  if (experience.length === 0) return null

  return (
    <section id="experience" className="section-pad bg-app" aria-labelledby="experience-heading">
      <div className="max-w-5xl mx-auto">
        <SectionHeading num={num} kicker="Career" title="Experience" id="experience-heading" />

        <ol className="timeline space-y-8 ml-2" aria-label="Work history">
          {experience.map((job, i) => (
            <ExperienceItem key={i} job={job} index={i} />
          ))}
        </ol>
      </div>
    </section>
  )
}
