'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  children: React.ReactNode
  id?: string
  level?: string
  title?: string
  className?: string
  accent?: 'amber' | 'cyan' | 'emerald' | 'default'
}

export default function SectionWrapper({
  children,
  id,
  level,
  title,
  className,
  accent = 'default',
}: SectionWrapperProps) {
  const sectionRef = useRef<HTMLElement>(null)

  const accentColors = {
    amber: 'border-amber-400/20',
    cyan: 'border-cyan-400/20',
    emerald: 'border-emerald-400/20',
    default: 'border-white/[0.08]',
  }

  const accentText = {
    amber: 'text-amber-400/50',
    cyan: 'text-cyan-400/50',
    emerald: 'text-emerald-400/50',
    default: 'text-white/40',
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn(
        'relative min-h-screen w-full',
        'flex items-center justify-center',
        'overflow-hidden',
        className
      )}
    >
      {/* Glass containment border */}
      <div className="absolute inset-6 md:inset-8 pointer-events-none">
        {/* Corner accents - with color option */}
        <div
          className={cn(
            'absolute top-0 left-0 w-12 h-12 border-l border-t',
            accentColors[accent]
          )}
        />
        <div
          className={cn(
            'absolute top-0 right-0 w-12 h-12 border-r border-t',
            accentColors[accent]
          )}
        />
        <div
          className={cn(
            'absolute bottom-0 left-0 w-12 h-12 border-l border-b',
            accentColors[accent]
          )}
        />
        <div
          className={cn(
            'absolute bottom-0 right-0 w-12 h-12 border-r border-b',
            accentColors[accent]
          )}
        />

        {/* Subtle full border */}
        <div className="absolute inset-0 border border-white/[0.04] rounded-sm" />
      </div>

      {/* Level indicator - refined typography */}
      {level && (
        <div className="absolute top-10 md:top-12 left-10 md:left-12 text-[11px] tracking-[0.2em] uppercase">
          <span className={accentText[accent]}>{level}</span>
          {title && <span className="ml-6 text-white/15">{title}</span>}
        </div>
      )}

      {/* Subtle scan line texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-12 md:px-20 py-24">
        {children}
      </div>
    </section>
  )
}
