'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'

// ============================================================================
// OSCILLOSCOPE - Living waveform feedback
// ============================================================================

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { speed, normalizedSpeed, isScrolling, scroll } = useScrollVelocity()
  const animationRef = useRef<number>(undefined)
  const phaseRef = useRef(0)
  const historyRef = useRef<number[]>([])

  // Calculate depth
  const depth = Math.round((scroll / 4000) * -1000)

  // Get status text and color
  const getStatus = () => {
    if (normalizedSpeed > 0.7)
      return { text: 'CRITICAL', color: 'text-red-400' }
    if (normalizedSpeed > 0.4)
      return { text: 'ELEVATED', color: 'text-amber-400' }
    if (isScrolling) return { text: 'ACTIVE', color: 'text-cyan-400' }
    return { text: 'STABLE', color: 'text-emerald-400' }
  }

  const status = getStatus()

  // Draw the waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerY = height / 2

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)'
    ctx.lineWidth = 0.5

    // Vertical grid lines
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Center line
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()

    // Calculate wave parameters based on velocity
    const baseFrequency = 0.02
    const frequency = baseFrequency + normalizedSpeed * 0.08
    const baseAmplitude = 15
    const amplitude = baseAmplitude + normalizedSpeed * 25
    const noiseLevel = normalizedSpeed > 0.7 ? normalizedSpeed * 0.5 : 0

    // Update phase for continuous motion
    phaseRef.current += 0.05 + normalizedSpeed * 0.15

    // Draw waveform
    ctx.beginPath()
    ctx.strokeStyle =
      normalizedSpeed > 0.7
        ? `rgba(248, 113, 113, ${0.8 + Math.sin(phaseRef.current * 5) * 0.2})` // Red pulsing at high speed
        : normalizedSpeed > 0.4
          ? 'rgba(251, 191, 36, 0.9)' // Amber
          : 'rgba(34, 211, 238, 0.9)' // Cyan
    ctx.lineWidth = 2
    ctx.shadowColor = ctx.strokeStyle
    ctx.shadowBlur = 10

    for (let x = 0; x < width; x++) {
      // Base sine wave
      let y = Math.sin(x * frequency + phaseRef.current) * amplitude

      // Add noise at high velocity
      if (noiseLevel > 0) {
        y += (Math.random() - 0.5) * noiseLevel * 40
      }

      // Add secondary harmonic for complexity
      y +=
        Math.sin(x * frequency * 2.5 + phaseRef.current * 1.5) *
        (amplitude * 0.3)

      if (x === 0) {
        ctx.moveTo(x, centerY + y)
      } else {
        ctx.lineTo(x, centerY + y)
      }
    }
    ctx.stroke()

    // Add glow layer
    ctx.shadowBlur = 20
    ctx.globalAlpha = 0.3
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    // Draw pulse blips at high speed
    if (normalizedSpeed > 0.5) {
      const blipCount = Math.floor(normalizedSpeed * 5)
      ctx.fillStyle = 'rgba(248, 113, 113, 0.8)'
      for (let i = 0; i < blipCount; i++) {
        const blipX = (phaseRef.current * 50 + i * 40) % width
        const blipY =
          centerY + Math.sin(blipX * frequency + phaseRef.current) * amplitude
        ctx.beginPath()
        ctx.arc(blipX, blipY, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [normalizedSpeed])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <div className="fixed top-24 right-6 z-50 pointer-events-none">
      {/* Monitor frame */}
      <div className="relative backdrop-blur-md bg-black/60 border border-cyan-500/20 rounded-sm overflow-hidden">
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-500/10 bg-black/40">
          <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase">
            Bioscan
          </div>
          <div
            className={`text-[9px] tracking-wider font-mono ${status.color}`}
          >
            {status.text}
          </div>
        </div>

        {/* Canvas */}
        <div className="p-2">
          <canvas
            ref={canvasRef}
            width={180}
            height={60}
            className="rounded-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-cyan-500/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[8px] text-neutral-600 uppercase">Vel</div>
              <div
                className={`text-[10px] font-mono tabular-nums ${status.color}`}
              >
                {speed.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[8px] text-neutral-600 uppercase">Depth</div>
              <div className="text-[10px] font-mono tabular-nums text-cyan-400">
                {depth}m
              </div>
            </div>
          </div>

          {/* Heartbeat indicator */}
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isScrolling ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                normalizedSpeed > 0.3
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-neutral-700'
              }`}
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                normalizedSpeed > 0.6
                  ? 'bg-red-400 animate-pulse'
                  : 'bg-neutral-800'
              }`}
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-500/30" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500/30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-500/30" />
      </div>
    </div>
  )
}
