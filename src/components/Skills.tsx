import { useInView } from '../hooks/useInView'
import { useSpotlight } from '../hooks/useSpotlight'
import SectionHeading from './SectionHeading'
import type { SkillGroup } from '../types/portfolio'

interface SkillsProps {
  skills: SkillGroup[]
  num: string
}

const DOTS = ['bg-blue-400', 'bg-violet-400', 'bg-cyan-400', 'bg-fuchsia-400']

export default function Skills({ skills, num }: SkillsProps) {
  const { ref, inView } = useInView(0.1)
  const spotlight = useSpotlight()
  if (skills.length === 0) return null

  // Flattened, deduped list feeding the marquee ribbon.
  const allSkills = Array.from(new Set(skills.flatMap(g => g.items)))

  return (
    <section id="skills" className="section-pad bg-app" aria-labelledby="skills-heading">
      <div className="max-w-5xl mx-auto">
        <SectionHeading num={num} kicker="Toolkit" title="Skills" id="skills-heading" className="mb-8" />
      </div>

      {/* Infinite ticker — decorative; the grid below carries the real content. */}
      {allSkills.length > 3 && (
        <div
          className="-mx-4 sm:-mx-6 mb-12 overflow-hidden"
          aria-hidden="true"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div
            className="flex w-max animate-marquee hover:[animation-play-state:paused]"
            style={{ animationDuration: `${Math.max(30, allSkills.length * 1.2)}s` }}
          >
            {[0, 1].map(copy => (
              <ul key={copy} className="flex items-center gap-3 pr-3">
                {allSkills.map((skill, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line/10 bg-line/5 px-4 py-2 text-xs font-medium text-muted"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${DOTS[i % DOTS.length]}`} />
                    {skill}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      <div ref={ref as React.RefObject<HTMLDivElement>} className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((group, gi) => (
            <div
              key={group.category}
              onMouseMove={spotlight}
              className={`glass spotlight rounded-2xl p-5 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${gi * 80}ms` }}
            >
              <h3 className="text-muted text-xs font-semibold tracking-widest uppercase mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                {group.category}
              </h3>
              <ul className="flex flex-wrap gap-2" role="list" aria-label={`${group.category} skills`}>
                {group.items.map((skill, i) => (
                  <li
                    key={i}
                    className="px-3 py-1.5 bg-line/5 border border-line/10 rounded-lg text-xs font-medium text-content hover:bg-blue-500/15 hover:border-blue-500/40 hover:text-content transition-all cursor-default"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
