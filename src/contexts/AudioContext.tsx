'use client'

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Sequencer, type SequencerState, type SequencerStatus } from '@/components/systems/Sequencer'

// ============================================================================
// TYPES
// ============================================================================

interface AudioContextValue {
  // Loading state
  isLoaded: boolean
  loadProgress: number

  // Playback state
  isInitialized: boolean
  isPlaying: boolean
  isPaused: boolean
  state: SequencerState

  // Current zone
  currentZone: string | null
  isInBridge: boolean

  // Beat tracking
  currentBeat: number
  currentBar: number

  // Actions
  initialize: () => Promise<void>
  play: (zoneId?: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
  requestTransition: (targetZoneId?: string) => void
  getStatus: () => SequencerStatus | null
}

const AudioContext = createContext<AudioContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const sequencerRef = useRef<Sequencer | null>(null)

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)

  // Playback state
  const [isInitialized, setIsInitialized] = useState(false)
  const [state, setState] = useState<SequencerState>('idle')
  const [currentZone, setCurrentZone] = useState<string | null>(null)
  const [isInBridge, setIsInBridge] = useState(false)

  // Beat tracking
  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentBar, setCurrentBar] = useState(0)

  // Derived state
  const isPlaying = state === 'playing' || state === 'transitioning'
  const isPaused = state === 'paused'

  // Initialize sequencer on mount
  useEffect(() => {
    const sequencer = new Sequencer({
      onStateChange: (newState) => {
        setState(newState)
      },
      onLoadProgress: (progress) => {
        setLoadProgress(progress)
        if (progress >= 100) {
          setIsLoaded(true)
        }
      },
      onZoneChange: (zoneId) => {
        setCurrentZone(zoneId)
        setIsInBridge(false)
      },
      onBeat: (beat, bar) => {
        setCurrentBeat(beat)
        setCurrentBar(bar)
      },
      onTransitionStart: () => {
        // Will be in bridge soon
      },
    })

    sequencerRef.current = sequencer

    // Start loading audio immediately
    sequencer.load()

    return () => {
      sequencer.destroy()
    }
  }, [])

  // Track bridge state from status updates
  useEffect(() => {
    if (!sequencerRef.current) return

    const checkBridge = setInterval(() => {
      const status = sequencerRef.current?.getStatus()
      if (status) {
        setIsInBridge(status.isInBridge)
      }
    }, 100)

    return () => clearInterval(checkBridge)
  }, [])

  // Initialize and start playback (called when user clicks boot screen)
  const initialize = useCallback(async () => {
    if (!sequencerRef.current || isInitialized) return

    // Play the intro zone
    sequencerRef.current.play('intro')
    setIsInitialized(true)
  }, [isInitialized])

  // Playback controls
  const play = useCallback((zoneId?: string) => {
    sequencerRef.current?.play(zoneId)
  }, [])

  const pause = useCallback(() => {
    sequencerRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    sequencerRef.current?.resume()
  }, [])

  const stop = useCallback(() => {
    sequencerRef.current?.stop()
    setIsInitialized(false)
  }, [])

  const requestTransition = useCallback((targetZoneId?: string) => {
    sequencerRef.current?.requestTransition(targetZoneId)
  }, [])

  const getStatus = useCallback(() => {
    return sequencerRef.current?.getStatus() || null
  }, [])

  const value: AudioContextValue = {
    // Loading
    isLoaded,
    loadProgress,

    // Playback
    isInitialized,
    isPlaying,
    isPaused,
    state,

    // Zone
    currentZone,
    isInBridge,

    // Beat
    currentBeat,
    currentBar,

    // Actions
    initialize,
    play,
    pause,
    resume,
    stop,
    requestTransition,
    getStatus,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext)

  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }

  return context
}

// ============================================================================
// ZONE TRIGGER HOOK
// Use this in sector components to trigger zone transitions
// ============================================================================

export function useZoneTrigger(
  zoneId: string,
  options?: {
    triggerOnEnter?: boolean
    triggerOnScroll?: boolean
  },
) {
  const { currentZone, requestTransition } = useAudio()

  const triggerTransition = useCallback(() => {
    if (currentZone !== zoneId) {
      requestTransition(zoneId)
    }
  }, [currentZone, zoneId, requestTransition])

  return {
    isActive: currentZone === zoneId,
    triggerTransition,
  }
}
