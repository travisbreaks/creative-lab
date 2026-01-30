'use client'

import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'

export default function VelocityHUD() {
  const { speed, normalizedSpeed, scroll, direction, isScrolling } =
    useScrollVelocity()

  // Calculate depth based on scroll position (rough approximation)
  // Assuming ~4000px total scroll = -1000m depth
  const depth = Math.round((scroll / 4000) * -1000)

  // Velocity bar width (0-100%)
  const barWidth = Math.min(normalizedSpeed * 100, 100)

  // Color based on speed
  const getSpeedColor = () => {
    if (normalizedSpeed > 0.7) return 'text-red-400'
    if (normalizedSpeed > 0.4) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getBarColor = () => {
    if (normalizedSpeed > 0.7) return 'bg-red-500'
    if (normalizedSpeed > 0.4) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded px-6 py-3 flex items-center gap-6">
        {/* Scroll Velocity */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase mb-1">
            Scroll Velocity
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`font-mono text-lg tabular-nums ${getSpeedColor()} transition-colors`}
            >
              {speed.toFixed(1)}
            </div>
            <div className="text-[10px] text-neutral-600">m/s</div>
          </div>
          {/* Velocity bar */}
          <div className="w-24 h-1 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${getBarColor()}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-white/10" />

        {/* Depth */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase mb-1">
            Depth
          </div>
          <div className="font-mono text-lg text-cyan-400 tabular-nums">
            {depth}m
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-white/10" />

        {/* Direction indicator */}
        <div className="flex flex-col items-center min-w-[60px]">
          <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase mb-1">
            Vector
          </div>
          <div
            className={`font-mono text-sm ${isScrolling ? 'text-white/80' : 'text-white/30'} transition-colors`}
          >
            {direction === 1 && '↓ DESC'}
            {direction === -1 && '↑ ASC'}
            {direction === 0 && '— IDLE'}
          </div>
        </div>
      </div>

      {/* Noise texture overlay on HUD */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] rounded"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
