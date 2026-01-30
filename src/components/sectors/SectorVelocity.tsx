'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'

// ============================================================================
// EXPERIMENT LOG DATA
// ============================================================================

const EXPERIMENT_LOGS = [
  { id: 'PARTICLE_COLLISION_001', yield: '99.7%', status: 'NOMINAL' },
  { id: 'DARK_MATTER_YIELD_002', yield: '40.2%', status: 'ANOMALY' },
  { id: 'HIGGS_DECAY_CHAIN_003', yield: '78.4%', status: 'NOMINAL' },
  { id: 'ANTIMATTER_FLUX_004', yield: '12.8%', status: 'CRITICAL' },
  { id: 'NEUTRINO_TRACE_005', yield: '56.1%', status: 'NOMINAL' },
  { id: 'QUARK_GLUON_PLASMA_006', yield: '88.9%', status: 'NOMINAL' },
  { id: 'CHARM_BOTTOM_PAIR_007', yield: '23.4%', status: 'UNSTABLE' },
  { id: 'TAU_LEPTON_BURST_008', yield: '67.2%', status: 'NOMINAL' },
  { id: 'MUON_ANOMALY_009', yield: '91.0%', status: 'NOMINAL' },
  { id: 'BOSON_INTERACTION_010', yield: '45.6%', status: 'ANOMALY' },
  { id: 'GRAVITON_SEARCH_011', yield: '0.001%', status: 'NULL' },
  { id: 'STRING_RESONANCE_012', yield: '33.7%', status: 'UNSTABLE' },
  { id: 'VACUUM_ENERGY_013', yield: '72.3%', status: 'NOMINAL' },
  { id: 'PHOTON_PAIR_PROD_014', yield: '95.8%', status: 'NOMINAL' },
  { id: 'ELECTRON_POSITRON_015', yield: '84.1%', status: 'NOMINAL' },
  { id: 'PROTON_DECAY_016', yield: '0.0%', status: 'NULL' },
  { id: 'KAON_OSCILLATION_017', yield: '61.9%', status: 'NOMINAL' },
  { id: 'PION_CASCADE_018', yield: '52.4%', status: 'UNSTABLE' },
  { id: 'Z_PRIME_CANDIDATE_019', yield: '8.3%', status: 'ANOMALY' },
  { id: 'SUPERSYMMETRY_020', yield: '0.0%', status: 'NULL' },
]

// ============================================================================
// STATUS COLORS
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  NOMINAL: 'text-emerald-400',
  ANOMALY: 'text-amber-400',
  UNSTABLE: 'text-orange-400',
  CRITICAL: 'text-red-400',
  NULL: 'text-neutral-600',
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SectorVelocity() {
  const { normalizedSpeed, direction, isScrolling } = useScrollVelocity()
  const containerRef = useRef<HTMLDivElement>(null)
  const logRefs = useRef<(HTMLDivElement | null)[]>([])
  const smoothedValuesRef = useRef({ skew: 0, scaleY: 1, blur: 0 })

  // Animate log entries based on velocity
  useEffect(() => {
    if (!containerRef.current) return

    // Calculate target transforms based on speed
    // Speed 0 = no effect, Speed 1 = maximum spaghettification
    const intensity = normalizedSpeed
    const directionMultiplier = direction

    // Target values
    const targetSkew = intensity * 25 * directionMultiplier // -25 to 25 degrees
    const targetScaleY = 1 + intensity * 1.5 // 1 to 2.5 scale
    const targetBlur = intensity * 4 // 0 to 4px blur

    // Smooth interpolation using GSAP
    gsap.to(smoothedValuesRef.current, {
      skew: targetSkew,
      scaleY: targetScaleY,
      blur: targetBlur,
      duration: isScrolling ? 0.15 : 0.4, // Faster response while scrolling
      ease: isScrolling ? 'power2.out' : 'power3.out',
      onUpdate: () => {
        const { skew, scaleY, blur } = smoothedValuesRef.current

        logRefs.current.forEach((ref, index) => {
          if (!ref) return

          // Stagger the effect slightly based on index for wave-like motion
          const staggerOffset = Math.sin(index * 0.3) * 0.1
          const adjustedSkew = skew * (1 + staggerOffset)
          const adjustedScaleY = scaleY * (1 + staggerOffset * 0.2)

          ref.style.transform = `skewY(${adjustedSkew}deg) scaleY(${adjustedScaleY})`
          ref.style.filter = `blur(${blur}px)`

          // Opacity based on speed - faster = more ghostly
          const baseOpacity = 0.7 + (1 - Math.abs(skew) / 25) * 0.3
          ref.style.opacity = String(baseOpacity)
        })
      },
    })
  }, [normalizedSpeed, direction, isScrolling])

  // Reset on mount
  useEffect(() => {
    logRefs.current.forEach((ref) => {
      if (ref) {
        ref.style.transform = 'skewY(0deg) scaleY(1)'
        ref.style.filter = 'blur(0px)'
        ref.style.opacity = '1'
      }
    })
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#050505] py-24 overflow-hidden"
    >
      {/* Sector Header */}
      <div className="absolute top-8 left-8 z-10">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Sector 0
        </div>
        <div className="text-[11px] tracking-[0.3em] text-neutral-500 uppercase">
          The Event Horizon
        </div>
      </div>

      {/* Velocity Indicator */}
      <div className="absolute top-8 right-8 z-10 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Velocity
        </div>
        <div className="font-mono text-2xl text-[#e5e5e5] tabular-nums">
          {(normalizedSpeed * 100).toFixed(1)}%
        </div>
        <div className="text-[10px] tracking-[0.2em] text-neutral-600 mt-1">
          {direction > 0
            ? '▼ DESCENDING'
            : direction < 0
              ? '▲ ASCENDING'
              : '■ STATIC'}
        </div>
      </div>

      {/* Depth Indicator Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-800 to-transparent" />

      {/* Experiment Logs Container */}
      <div className="relative max-w-4xl mx-auto px-8 pt-32">
        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_100px_100px] gap-4 mb-8 pb-4 border-b border-neutral-800">
          <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase">
            Experiment ID
          </div>
          <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase text-right">
            Yield
          </div>
          <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase text-right">
            Status
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-1">
          {EXPERIMENT_LOGS.map((log, index) => (
            <div
              key={log.id}
              ref={(el) => {
                logRefs.current[index] = el
              }}
              className="grid grid-cols-[1fr_100px_100px] gap-4 py-3 border-b border-neutral-900 origin-left will-change-transform"
              style={{
                transformOrigin: 'left center',
              }}
            >
              {/* Experiment ID */}
              <div className="font-mono text-xl md:text-2xl lg:text-3xl text-[#e5e5e5] tracking-tight">
                {log.id}
              </div>

              {/* Yield */}
              <div className="font-mono text-lg md:text-xl text-neutral-400 text-right tabular-nums self-center">
                {log.yield}
              </div>

              {/* Status */}
              <div
                className={`font-mono text-sm uppercase tracking-wider text-right self-center ${
                  STATUS_COLORS[log.status]
                }`}
              >
                {log.status}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-16 pt-8 border-t border-neutral-800 grid grid-cols-3 gap-8">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-2">
              Total Experiments
            </div>
            <div className="font-mono text-3xl text-[#e5e5e5]">
              {EXPERIMENT_LOGS.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-2">
              Nominal Rate
            </div>
            <div className="font-mono text-3xl text-emerald-400">
              {(
                (EXPERIMENT_LOGS.filter((l) => l.status === 'NOMINAL').length /
                  EXPERIMENT_LOGS.length) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-2">
              Anomalies
            </div>
            <div className="font-mono text-3xl text-amber-400">
              {EXPERIMENT_LOGS.filter((l) => l.status === 'ANOMALY').length}
            </div>
          </div>
        </div>
      </div>

      {/* Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-neutral-800" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r border-t border-neutral-800" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l border-b border-neutral-800" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-neutral-800" />
    </section>
  )
}
