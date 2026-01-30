'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'
import { useMobile } from '@/hooks/useMobile'
import { ASSETS } from '@/config/assets'

gsap.registerPlugin(ScrollTrigger)

// ============================================================================
// ISOTOPE DATA
// ============================================================================

const ISOTOPES = [
  {
    id: 'isotope-1',
    symbol: 'Hg',
    name: 'Higgsonium',
    mass: '125.1',
    halfLife: '∞',
    color: 'amber',
    energy: 87,
    description: 'Primary carrier of mass. Detected at 125.1 GeV.',
    image: ASSETS.isotopes[0],
  },
  {
    id: 'isotope-2',
    symbol: 'Dk',
    name: 'Darkion',
    mass: '???',
    halfLife: 'Unknown',
    color: 'purple',
    energy: 42,
    description: 'Hypothetical dark matter candidate. Non-baryonic.',
    image: ASSETS.isotopes[1],
  },
  {
    id: 'isotope-3',
    symbol: 'Qk',
    name: 'Quarkite',
    mass: '173.1',
    halfLife: '5×10⁻²⁵s',
    color: 'cyan',
    energy: 95,
    description: 'Top quark composite. Heaviest known elementary particle.',
    image: ASSETS.isotopes[2],
  },
  {
    id: 'isotope-4',
    symbol: 'Nv',
    name: 'Neutronix',
    mass: '939.6',
    halfLife: '611s',
    color: 'emerald',
    energy: 73,
    description: 'Free neutron sample. Beta decays to proton.',
    image: ASSETS.isotopes[3],
  },
  {
    id: 'isotope-5',
    symbol: 'Ps',
    name: 'Positronium',
    mass: '1.022',
    halfLife: '142ns',
    color: 'rose',
    energy: 56,
    description: 'Bound electron-positron pair. Annihilates to gamma.',
    image: ASSETS.isotopes[4],
  },
  {
    id: 'isotope-6',
    symbol: 'Gv',
    name: 'Graviton',
    mass: '0',
    halfLife: 'Stable',
    color: 'orange',
    energy: 100,
    description: 'Theoretical quantum of gravity. Spin-2 massless boson.',
    image: ASSETS.isotopes[0], // Loop back to first image for 6th card
  },
]

const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; glow: string; rgbGlow: string }
> = {
  amber: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]',
    rgbGlow: 'rgba(251,191,36,0.4)',
  },
  purple: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/10',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
    rgbGlow: 'rgba(168,85,247,0.4)',
  },
  cyan: {
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_40px_rgba(34,211,238,0.3)]',
    rgbGlow: 'rgba(34,211,238,0.4)',
  },
  emerald: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_40px_rgba(52,211,153,0.3)]',
    rgbGlow: 'rgba(52,211,153,0.4)',
  },
  rose: {
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/10',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_40px_rgba(251,113,133,0.3)]',
    rgbGlow: 'rgba(251,113,133,0.4)',
  },
  orange: {
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/10',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_40px_rgba(251,146,60,0.3)]',
    rgbGlow: 'rgba(251,146,60,0.4)',
  },
}

// Chaos scatter positions (Z/X/Y offsets for 3D scatter)
const SCATTER_POSITIONS = [
  { x: -400, y: -200, z: -300, rotateX: 25, rotateY: -35 },
  { x: 350, y: -180, z: 200, rotateX: -20, rotateY: 40 },
  { x: -280, y: 250, z: -150, rotateX: 30, rotateY: -25 },
  { x: 420, y: 200, z: 250, rotateX: -35, rotateY: 30 },
  { x: -350, y: 100, z: 180, rotateX: 15, rotateY: -45 },
  { x: 300, y: -250, z: -200, rotateX: -25, rotateY: 35 },
]

// Glitch characters for text scramble
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ΔΩΣΨαβγδεζ'

// ============================================================================
// TEXT SCRAMBLE HOOK
// ============================================================================

function useTextScramble(text: string, isScrambling: boolean) {
  const [displayText, setDisplayText] = useState(text)
  const frameRef = useRef<number>(undefined)
  const iterationRef = useRef(0)

  useEffect(() => {
    if (!isScrambling) {
      setDisplayText(text)
      return
    }

    const scramble = () => {
      iterationRef.current += 1
      const scrambled = text
        .split('')
        .map((char) => {
          if (char === ' ') return ' '
          return Math.random() > 0.5
            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            : char
        })
        .join('')
      setDisplayText(scrambled)
      frameRef.current = requestAnimationFrame(scramble)
    }

    frameRef.current = requestAnimationFrame(scramble)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [text, isScrambling])

  return displayText
}

// ============================================================================
// ISOTOPE CARD COMPONENT
// ============================================================================

interface IsotopeCardProps {
  isotope: (typeof ISOTOPES)[0]
  index: number
  isScrambling: boolean
  isMobile: boolean
  onHover: (index: number | null) => void
  onMove: (index: number, e: React.MouseEvent) => void
  cardRef: (el: HTMLDivElement | null) => void
  tiltStyle: React.CSSProperties
}

function IsotopeCard({
  isotope,
  index,
  isScrambling,
  isMobile,
  onHover,
  onMove,
  cardRef,
  tiltStyle,
}: IsotopeCardProps) {
  const colors = COLOR_MAP[isotope.color]
  const scrambledSymbol = useTextScramble(isotope.symbol, isScrambling)
  const scrambledName = useTextScramble(isotope.name, isScrambling)
  const scrambledMass = useTextScramble(isotope.mass, isScrambling)

  // On mobile, disable tilt effect (no hover on touch devices)
  const effectiveTiltStyle = isMobile ? {} : tiltStyle

  return (
    <div
      ref={cardRef}
      data-index={index}
      onMouseEnter={() => !isMobile && onHover(index)}
      onMouseLeave={() => !isMobile && onHover(null)}
      onMouseMove={(e) => !isMobile && onMove(index, e)}
      className="relative flex-shrink-0 w-[320px] h-[400px] cursor-pointer select-none"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Card Inner - 3D tilt container */}
      <div
        className={`
          relative w-full h-full overflow-hidden
          backdrop-blur-xl border ${colors.border}
          transition-shadow duration-300
          ${isScrambling ? colors.glow : ''}
        `}
        style={{
          ...effectiveTiltStyle,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={isotope.image}
            alt={isotope.name}
            fill
            className="object-cover"
            sizes="320px"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Glassmorphism content overlay */}
        <div className="relative z-10 w-full h-full p-6">
          {/* Noise Texture Overlay - The "Secret Sauce" */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }}
          />

          {/* Inner glow edge */}
          <div className="absolute inset-0 pointer-events-none rounded-sm">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          </div>

          {/* Symbol & Mass Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div
                className={`font-mono text-6xl ${colors.text} mb-1 transition-all ${
                  isScrambling ? 'blur-[1px]' : ''
                }`}
                style={{ transform: 'translateZ(20px)' }}
              >
                {scrambledSymbol}
              </div>
              <div
                className={`text-[11px] tracking-[0.25em] text-neutral-400 uppercase ${
                  isScrambling ? 'blur-[0.5px]' : ''
                }`}
              >
                {scrambledName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
                Mass
              </div>
              <div
                className={`font-mono text-xl text-neutral-300 ${
                  isScrambling ? 'blur-[0.5px]' : ''
                }`}
              >
                {scrambledMass}
              </div>
            </div>
          </div>

          {/* Energy Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
                Energy Level
              </div>
              <div className={`font-mono text-xs ${colors.text}`}>
                {isotope.energy}%
              </div>
            </div>
            <div className="h-1.5 bg-neutral-900/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${isotope.energy}%`,
                  background: `linear-gradient(90deg, ${colors.rgbGlow.replace('0.4', '0.6')}, ${colors.rgbGlow})`,
                  boxShadow: `0 0 12px ${colors.rgbGlow}`,
                }}
              />
            </div>
          </div>

          {/* Half-life */}
          <div className="mb-6">
            <div className="text-[10px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
              Half-life
            </div>
            <div className="font-mono text-base text-neutral-400">
              {isotope.halfLife}
            </div>
          </div>

          {/* Description */}
          <div className="mt-auto">
            <div className="text-[10px] tracking-[0.3em] text-neutral-600 uppercase mb-2">
              Classification
            </div>
            <p
              className={`text-sm text-neutral-400 leading-relaxed ${
                isScrambling ? 'blur-[1px]' : ''
              }`}
            >
              {isotope.description}
            </p>
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-white/20" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-white/20" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-white/20" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-white/20" />

          {/* Scan line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SectorLattice() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const [tiltStyles, setTiltStyles] = useState<
    Record<number, React.CSSProperties>
  >({})
  const { speed, isScrolling } = useScrollVelocity()
  const isMobile = useMobile()

  // Velocity threshold for glitch effect
  const VELOCITY_THRESHOLD = 5
  const isHighVelocity = speed > VELOCITY_THRESHOLD

  // Calculate total horizontal scroll distance
  const getScrollDistance = useCallback(() => {
    if (!trackRef.current || typeof window === 'undefined') return 0
    const cardWidth = 320
    const gap = 48 // gap-12 = 48px
    const totalWidth = (cardWidth + gap) * ISOTOPES.length - gap
    return totalWidth - window.innerWidth + 200 // 200px padding
  }, [])

  // Main ScrollTrigger: Pin & Horizontal Slide
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[]

      // Initial chaos state - cards scattered in 3D space
      cards.forEach((card, index) => {
        const scatter = SCATTER_POSITIONS[index]
        gsap.set(card, {
          x: scatter.x,
          y: scatter.y,
          z: scatter.z,
          rotateX: scatter.rotateX,
          rotateY: scatter.rotateY,
          opacity: 0,
          scale: 0.6,
        })
      })

      // Master timeline for the pinned section
      // Gear ratio: 100vh = snappy, fast horizontal movement
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%', // Fast gear ratio - cards zip by quickly
          pin: true,
          scrub: 0, // Zero lag - instant response
          anticipatePin: 1,
        },
      })

      // Phase 1 (0-15%): Cards snap from chaos into formation
      tl.to(
        cards,
        {
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.02,
          ease: 'power3.out',
          duration: 0.15,
        },
        0
      )

      // Phase 2 (15-100%): Horizontal conveyor belt movement
      tl.to(
        trackRef.current,
        {
          x: () => -getScrollDistance(),
          ease: 'none',
          duration: 0.85,
        },
        0.15
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [getScrollDistance])

  // Inverse 3D tilt on hover - card moves AWAY from cursor
  const handleHover = useCallback((index: number | null) => {
    if (index === null) {
      // Reset all tilts
      setTiltStyles({})
    }
  }, [])

  const handleMouseMove = useCallback((index: number, e: React.MouseEvent) => {
    const card = cardsRef.current[index]
    if (!card) return

    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate distance from center (normalized -1 to 1)
    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)

    // Inverse physics: tilt AWAY from cursor
    const maxTilt = 15
    const rotateY = deltaX * maxTilt // Positive = tilt right when cursor is right
    const rotateX = -deltaY * maxTilt // Negative = tilt down when cursor is down

    setTiltStyles((prev) => ({
      ...prev,
      [index]: {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`,
        transition: 'transform 0.1s ease-out',
      },
    }))
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen bg-[#030303] overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* Background noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sector Header */}
      <div className="absolute top-8 left-8 z-20">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Sector 2
        </div>
        <div className="text-[11px] tracking-[0.3em] text-emerald-500/70 uppercase">
          The Lattice
        </div>
      </div>

      {/* Velocity Warning System Readout */}
      <div className="absolute top-8 right-8 z-20 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          System Status
        </div>
        <div
          className={`
            font-mono text-sm tracking-wider px-3 py-1 rounded
            transition-all duration-200
            ${
              isHighVelocity
                ? 'text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse'
                : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/20'
            }
          `}
        >
          {isHighVelocity ? '⚠ VELOCITY WARNING' : '◉ NOMINAL'}
        </div>
        {isHighVelocity && (
          <div className="text-[10px] text-red-400/70 mt-1 font-mono">
            SPEED: {speed.toFixed(1)} &gt; THRESHOLD
          </div>
        )}
      </div>

      {/* Section Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="text-[10px] tracking-[0.5em] text-emerald-500/50 uppercase mb-2">
          Isotope Conveyor // Sample Array
        </div>
        <h2 className="font-mono text-3xl md:text-4xl text-[#e5e5e5] tracking-tight">
          CONTAINED SPECIMENS
        </h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center overflow-hidden"
        style={{ paddingLeft: '100px' }}
      >
        {/* Card Track - moves horizontally */}
        <div
          ref={trackRef}
          className="flex gap-12 items-center"
          style={{ willChange: 'transform' }}
        >
          {ISOTOPES.map((isotope, index) => (
            <IsotopeCard
              key={isotope.id}
              isotope={isotope}
              index={index}
              isScrambling={isHighVelocity && isScrolling}
              isMobile={isMobile}
              onHover={handleHover}
              onMove={handleMouseMove}
              cardRef={(el) => {
                cardsRef.current[index] = el
              }}
              tiltStyle={tiltStyles[index] || {}}
            />
          ))}
        </div>
      </div>

      {/* Depth indicator */}
      <div className="absolute bottom-8 left-8 z-20">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Depth
        </div>
        <div className="font-mono text-2xl text-[#e5e5e5]/80 tabular-nums">
          -200m
        </div>
      </div>

      {/* Specimen count */}
      <div className="absolute bottom-8 right-8 z-20 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Active Specimens
        </div>
        <div className="font-mono text-2xl text-emerald-500 tabular-nums">
          {ISOTOPES.length} / {ISOTOPES.length}
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neutral-800 z-10" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-neutral-800 z-10" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-neutral-800 z-10" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-neutral-800 z-10" />

      {/* Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] z-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Viewing window frame effect */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#030303] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-10" />
    </section>
  )
}
