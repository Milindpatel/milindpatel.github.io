import type { ReactNode } from 'react'

interface SectionHeadingProps {
  num: string
  kicker: string
  title: ReactNode
  id: string
  center?: boolean
  className?: string
}

export default function SectionHeading({ num, kicker, title, id, center = false, className = 'mb-12' }: SectionHeadingProps) {
  return (
    <div className={`${center ? 'flex flex-col items-center text-center' : ''} ${className}`}>
      <p className="flex items-center gap-3 text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
        <span className="font-mono text-faint text-xs" aria-hidden="true">{num}</span>
        <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-violet-500" aria-hidden="true" />
        {kicker}
      </p>
      <h2 id={id} className="font-display text-4xl sm:text-5xl font-bold text-content tracking-tight">
        {title}
      </h2>
    </div>
  )
}
