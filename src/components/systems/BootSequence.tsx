'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAudio } from '@/contexts/AudioContext'

// ============================================================================
// BOOT SEQUENCE CONFIGURATION
// Simplified boot messages as per spec
// ============================================================================

const BOOT_MESSAGES = [
  { text: 'SYSTEM BOOT...', delay: 0 },
  { text: 'LOADING ASSETS...', delay: 600 },
  { text: 'INITIALIZING AUDIO ENGINE...', delay: 1200 },
]

const TYPEWRITER_SPEED = 25 // ms per character (faster)
const CURSOR_BLINK_SPEED = 530 // ms

// ============================================================================
// TYPEWRITER LINE COMPONENT
// ============================================================================

interface TypewriterLineProps {
  text: string
  startDelay: number
  onComplete?: () => void
  showCursor?: boolean
}

function TypewriterLine({
  text,
  startDelay,
  onComplete,
  showCursor = false,
}: TypewriterLineProps) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsTyping(true)
    }, startDelay)

    return () => clearTimeout(startTimeout)
  }, [startDelay])

  useEffect(() => {
    if (!isTyping || isComplete) return

    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1))
      }, TYPEWRITER_SPEED)

      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
      onComplete?.()
    }
  }, [isTyping, displayText, text, isComplete, onComplete])

  if (!isTyping && displayText.length === 0) {
    return null
  }

  return (
    <div className="flex items-center font-mono text-sm md:text-base">
      <span className="text-green-500 mr-2">&gt;</span>
      <span className="text-green-400">{displayText}</span>
      {showCursor && isComplete && <BlinkingCursor />}
      {isTyping && !isComplete && (
        <span className="text-green-300 animate-pulse">_</span>
      )}
      {isComplete && !showCursor && (
        <span className="text-green-600 ml-2">[OK]</span>
      )}
    </div>
  )
}

// ============================================================================
// BLINKING CURSOR
// ============================================================================

function BlinkingCursor() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => !v)
    }, CURSOR_BLINK_SPEED)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={`text-green-400 ml-1 transition-opacity duration-100 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      _
    </span>
  )
}

// ============================================================================
// LOADING PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
  progress: number
  label: string
}

function ProgressBar({ progress, label }: ProgressBarProps) {
  const barWidth = 30
  const filled = Math.floor((progress / 100) * barWidth)
  const empty = barWidth - filled

  return (
    <div className="font-mono text-xs md:text-sm mt-4">
      <div className="flex items-center gap-2">
        <span className="text-green-700">{label}</span>
        <span className="text-green-600">[</span>
        <span className="text-green-400">{'='.repeat(filled)}</span>
        <span className="text-green-900">{'-'.repeat(empty)}</span>
        <span className="text-green-600">]</span>
        <span className="text-green-500 tabular-nums w-12">
          {progress.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN BOOT SEQUENCE COMPONENT
// ============================================================================

interface BootSequenceProps {
  children: React.ReactNode
}

export default function BootSequence({ children }: BootSequenceProps) {
  const { isLoaded, loadProgress, initialize, isInitialized } = useAudio()
  const [bootPhase, setBootPhase] = useState<'booting' | 'ready' | 'complete'>(
    'booting'
  )
  const [completedLines, setCompletedLines] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track completed boot lines
  const handleLineComplete = useCallback(() => {
    setCompletedLines((prev) => prev + 1)
  }, [])

  // Check if boot sequence is complete
  useEffect(() => {
    if (completedLines >= BOOT_MESSAGES.length && isLoaded) {
      // Small delay before showing "ready" state
      const timeout = setTimeout(() => {
        setBootPhase('ready')
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [completedLines, isLoaded])

  // Handle initialization click
  const handleInitialize = useCallback(async () => {
    if (bootPhase !== 'ready') return

    setIsExiting(true)

    // Start the audio
    await initialize()

    // Fade out animation
    setTimeout(() => {
      setBootPhase('complete')
    }, 600)
  }, [bootPhase, initialize])

  // Handle keyboard input
  useEffect(() => {
    if (bootPhase !== 'ready') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleInitialize()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bootPhase, handleInitialize])

  // Skip boot sequence if already initialized
  if (isInitialized || bootPhase === 'complete') {
    return <>{children}</>
  }

  return (
    <>
      {/* Boot Screen Overlay */}
      <div
        ref={containerRef}
        className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleInitialize}
        role="button"
        tabIndex={0}
        aria-label="Click to initialize system"
      >
        {/* Scanlines overlay - green tint */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
          }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* CRT Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Phosphor glow effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,255,0,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-xl px-8">
          {/* Terminal window - minimal frame */}
          <div className="bg-black/90 border border-green-900/50 p-6">
            {/* Boot messages */}
            <div className="space-y-2 min-h-[140px]">
              {BOOT_MESSAGES.map((msg, index) => (
                <TypewriterLine
                  key={index}
                  text={msg.text}
                  startDelay={msg.delay}
                  onComplete={
                    index === BOOT_MESSAGES.length - 1
                      ? handleLineComplete
                      : () =>
                          setCompletedLines((prev) => Math.max(prev, index + 1))
                  }
                />
              ))}

              {/* Loading progress */}
              {completedLines >= BOOT_MESSAGES.length && !isLoaded && (
                <ProgressBar progress={loadProgress} label="CACHING" />
              )}

              {/* Complete message */}
              {completedLines >= BOOT_MESSAGES.length &&
                isLoaded &&
                bootPhase === 'booting' && (
                  <div className="flex items-center font-mono text-sm md:text-base mt-2">
                    <span className="text-green-500 mr-2">&gt;</span>
                    <span className="text-green-400">COMPLETE.</span>
                    <span className="text-green-600 ml-2">[OK]</span>
                  </div>
                )}

              {/* Ready message - INITIALIZE button */}
              {bootPhase === 'ready' && (
                <div className="mt-8 pt-4 border-t border-green-900/30">
                  <div className="flex items-center justify-center font-mono text-base md:text-lg">
                    <span className="text-green-400 animate-pulse tracking-wider">
                      [ INITIALIZE ]
                    </span>
                    <BlinkingCursor />
                  </div>
                  <div className="text-center mt-3 text-[10px] text-green-700 tracking-widest">
                    CLICK OR PRESS ENTER
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-[9px] font-mono text-green-900 tracking-widest">
            HIGGS-BOSON AUDIO ENGINE v1.0
          </div>
        </div>

        {/* Corner brackets - green */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l border-t border-green-900/40" />
        <div className="absolute top-4 right-4 w-6 h-6 border-r border-t border-green-900/40" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l border-b border-green-900/40" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r border-b border-green-900/40" />
      </div>
    </>
  )
}
