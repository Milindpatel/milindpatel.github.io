import { useInView } from '../hooks/useInView'
import { useSpotlight } from '../hooks/useSpotlight'
import SectionHeading from './SectionHeading'
import type { Project } from '../types/portfolio'

interface ProjectsProps {
  projects: Project[]
}

const canTilt =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { ref, inView } = useInView(0.1)
  const spotlight = useSpotlight()

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    spotlight(e)
    if (!canTilt) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(750px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`
  }

  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = ''
  }

  return (
    <li
      ref={ref as React.RefObject<HTMLLIElement>}
      className={`transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="glass spotlight rounded-2xl p-6 h-full flex flex-col gap-4 hover:bg-line/10 transition-transform duration-150 ease-out will-change-transform"
      >
        <h3 className="font-semibold text-content text-base">{project.name}</h3>

        {project.description && (
          <p className="text-muted text-sm leading-relaxed flex-1">{project.description}</p>
        )}

        {project.technologies && project.technologies.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
            {project.technologies.map((tech, j) => (
              <li key={j} className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/20 rounded text-xs font-medium">
                {tech}
              </li>
            ))}
          </ul>
        )}

        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.name} (opens in new tab)`}
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors mt-auto"
          >
            View project
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M3.5 3a.5.5 0 000 1H7.29L2.15 9.15a.5.5 0 10.7.7L8 4.71V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z"/>
            </svg>
          </a>
        )}
      </div>
    </li>
  )
}

export default function Projects({ projects }: ProjectsProps) {
  if (projects.length === 0) return null

  return (
    <section id="projects" className="section-pad bg-app" aria-labelledby="projects-heading">
      <div className="max-w-5xl mx-auto">
        <SectionHeading title="Projects" id="projects-heading" className="mb-8" />

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
          {projects.map((project, i) => (
            <ProjectCard key={i} project={project} index={i} />
          ))}
        </ul>
      </div>
    </section>
  )
}
