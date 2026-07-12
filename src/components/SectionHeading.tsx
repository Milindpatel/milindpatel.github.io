import type { ReactNode } from 'react'

interface SectionHeadingProps {
  title: ReactNode
  id: string
  center?: boolean
  className?: string
}

export default function SectionHeading({ title, id, center = false, className = 'mb-8' }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={`font-display text-4xl sm:text-5xl font-bold text-content tracking-tight ${center ? 'text-center' : ''} ${className}`}
    >
      {title}
    </h2>
  )
}
