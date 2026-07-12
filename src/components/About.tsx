import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'
import { useSpotlight } from '../hooks/useSpotlight'
import SectionHeading from './SectionHeading'

interface AboutProps {
  summary: string
  stats: { value: string; label: string }[]
}

/** Renders "11+" style values, counting the numeric part up when revealed. */
function StatValue({ value, active }: { value: string; active: boolean }) {
  const m = value.match(/^(\d+)(.*)$/)
  const target = m ? parseInt(m[1], 10) : 0
  const n = useCountUp(target, active && m !== null)
  if (!m) return <>{value}</>
  return <>{n}{m[2]}</>
}

export default function About({ summary, stats }: AboutProps) {
  const { ref, inView } = useInView()
  const spotlight = useSpotlight()
  if (!summary) return null

  return (
    <section id="about" className="section-pad bg-app" aria-labelledby="about-heading">
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={`max-w-5xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <SectionHeading title="Who I am" id="about-heading" className="mb-8" />

        <div className="grid sm:grid-cols-[1fr_auto] gap-10 items-start">
          <p className="text-lg text-muted leading-relaxed max-w-2xl">
            {summary}
          </p>

          <div className="flex flex-col gap-4 min-w-[160px]">
            {stats.map(({ value, label }) => (
              <div key={label} onMouseMove={spotlight} className="glass spotlight rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold gradient-text tabular-nums">
                  <StatValue value={value} active={inView} />
                </p>
                <p className="text-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
