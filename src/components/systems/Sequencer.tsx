'use client'

import { Howl } from 'howler'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BAR_MS,
  BPM,
  barsToMs,
  CROSSFADE_MS,
  canFastDescend,
  getBarsToNextGrid,
  getMsToNextGrid,
  getStartZone,
  getZone,
  getZoneIndex,
  SCORE,
  type ZoneConfig,
} from '@/config/audio'

// ============================================================================
// TYPES
// ============================================================================

export type SequencerState = 'idle' | 'loading' | 'ready' | 'playing' | 'transitioning' | 'paused'

export interface SequencerStatus {
  state: SequencerState
  currentZone: string | null
  nextZone: string | null
  currentBar: number
  currentBeat: number
  barsUntilTransition: number | null
  isInBridge: boolean
  bridgeBars: number | null
  bridgeProgress: number
  isCrossfading: boolean
}

export interface SequencerCallbacks {
  onStateChange?: (state: SequencerState) => void
  onZoneChange?: (zoneId: string) => void
  onBeat?: (beat: number, bar: number) => void
  onTransitionStart?: (fromZone: string, toZone: string, bridgeBars: number) => void
  onTransitionComplete?: (toZone: string) => void
  onLoadProgress?: (progress: number) => void
}

// ============================================================================
// SEQUENCER CLASS
// Cold Start Architecture - Immediate energy, quantized transitions
// ============================================================================

export class Sequencer {
  private sounds: Map<string, Howl> = new Map()
  private currentSound: Howl | null = null
  private nextSound: Howl | null = null // For crossfade
  private bridgeSound: Howl | null = null
  private currentZone: ZoneConfig | null = null
  private pendingTransition: string | null = null
  private transitionTimeout: NodeJS.Timeout | null = null
  private state: SequencerState = 'idle'
  private callbacks: SequencerCallbacks = {}
  private beatInterval: NodeJS.Timeout | null = null
  private currentBeat = 0
  private currentBar = 0
  private isInBridge = false
  private isCrossfading = false
  private bridgeStartTime = 0
  private currentBridgeBars = 0
  private loadedCount = 0
  private totalToLoad = 0

  constructor(callbacks?: SequencerCallbacks) {
    this.callbacks = callbacks || {}
  }

  // ==========================================================================
  // LOADING
  // ==========================================================================

  async load(): Promise<void> {
    this.setState('loading')

    const sources = this.getAllSources()
    this.totalToLoad = sources.length
    this.loadedCount = 0

    const loadPromises = sources.map((src) => this.loadSound(src))
    await Promise.all(loadPromises)

    this.setState('ready')
  }

  private getAllSources(): string[] {
    const sources: string[] = []
    SCORE.forEach((zone) => {
      sources.push(zone.src)
      if (zone.bridge) {
        sources.push(zone.bridge.src)
      }
    })
    return [...new Set(sources)]
  }

  private loadSound(src: string): Promise<void> {
    return new Promise((resolve) => {
      const sound = new Howl({
        src: [src],
        preload: true,
        html5: true,
        onload: () => {
          this.loadedCount++
          this.callbacks.onLoadProgress?.((this.loadedCount / this.totalToLoad) * 100)
          resolve()
        },
        onloaderror: (_id, error) => {
          console.warn(`Failed to load ${src}:`, error)
          this.loadedCount++
          this.callbacks.onLoadProgress?.((this.loadedCount / this.totalToLoad) * 100)
          resolve()
        },
      })

      this.sounds.set(src, sound)
    })
  }

  // ==========================================================================
  // PLAYBACK CONTROL
  // ==========================================================================

  /**
   * Start playback - defaults to first zone (surface)
   */
  play(zoneId?: string): void {
    const targetZone = zoneId ? getZone(zoneId) : getStartZone()

    if (!targetZone) {
      console.error('Zone not found:', zoneId)
      return
    }

    this.startZone(targetZone)
  }

  pause(): void {
    if (this.currentSound) {
      this.currentSound.pause()
    }
    if (this.bridgeSound) {
      this.bridgeSound.pause()
    }
    if (this.nextSound) {
      this.nextSound.pause()
    }
    this.stopBeatTracking()
    this.setState('paused')
  }

  resume(): void {
    if (this.currentSound) {
      this.currentSound.play()
      this.startBeatTracking()
      this.setState('playing')
    }
  }

  stop(): void {
    this.clearPendingTransition()

    if (this.currentSound) {
      this.currentSound.stop()
    }
    if (this.bridgeSound) {
      this.bridgeSound.stop()
    }
    if (this.nextSound) {
      this.nextSound.stop()
    }
    this.stopBeatTracking()
    this.currentZone = null
    this.pendingTransition = null
    this.isInBridge = false
    this.isCrossfading = false
    this.setState('idle')
  }

  // ==========================================================================
  // ZONE MANAGEMENT
  // ==========================================================================

  private startZone(zone: ZoneConfig, startFromZero: boolean = true): void {
    const sound = this.sounds.get(zone.src)
    if (!sound) {
      console.warn('Sound not loaded:', zone.src)
      // Try next zone if this one fails
      if (zone.next) {
        const nextZone = getZone(zone.next)
        if (nextZone) {
          setTimeout(() => this.startZone(nextZone), 100)
        }
      }
      return
    }

    // Stop current playback
    if (this.currentSound && this.currentSound !== sound) {
      this.currentSound.stop()
    }

    this.currentZone = zone
    this.currentSound = sound
    this.currentBeat = 0
    this.currentBar = 0
    this.isInBridge = false
    this.isCrossfading = false
    this.pendingTransition = null

    // Configure looping - loops unless it's outro
    sound.loop(zone.type !== 'outro')

    // Set up end handler for outro
    sound.off('end')
    if (zone.type === 'outro') {
      sound.on('end', () => this.handleOutroEnd())
    }

    // Start from beginning
    if (startFromZero) {
      sound.seek(0)
    }
    sound.volume(1)
    sound.play()

    this.startBeatTracking()
    this.setState('playing')
    this.callbacks.onZoneChange?.(zone.id)
  }

  private handleOutroEnd(): void {
    this.stop()
  }

  // ==========================================================================
  // QUANTIZED TRANSITION LOGIC
  // ==========================================================================

  /**
   * Request transition to a specific zone or next in sequence
   */
  requestTransition(targetZoneId?: string): void {
    if (!this.currentZone || this.isInBridge || this.isCrossfading) return

    const target = targetZoneId || this.currentZone.next
    if (!target) return

    // Already transitioning to this zone
    if (this.pendingTransition === target) return

    // Can't go backwards or to same zone
    const currentIndex = getZoneIndex(this.currentZone.id)
    const targetIndex = getZoneIndex(target)
    if (targetIndex <= currentIndex) return

    // Check for fast descent (skipping multiple zones)
    if (canFastDescend(this.currentZone.id, target)) {
      this.handleFastDescent(target)
      return
    }

    // Normal transition - wait for grid
    this.scheduleTransition(target)
  }

  /**
   * Schedule a transition at the next 4-bar grid point
   */
  private scheduleTransition(targetZoneId: string): void {
    this.clearPendingTransition()

    this.pendingTransition = targetZoneId
    this.setState('transitioning')

    // Calculate time to next grid
    const currentPosition = this.currentSound?.seek() || 0
    const currentMs = currentPosition * 1000
    const msToWait = getMsToNextGrid(currentMs)

    const bridgeBars = this.currentZone?.bridge?.bars || 0
    this.callbacks.onTransitionStart?.(this.currentZone!.id, targetZoneId, bridgeBars)

    // If we're already on a grid point, execute immediately
    if (msToWait === 0 || msToWait < 100) {
      this.executeTransition(targetZoneId)
      return
    }

    // Schedule transition at grid point
    this.transitionTimeout = setTimeout(() => {
      this.executeTransition(targetZoneId)
    }, msToWait)
  }

  /**
   * Execute the transition - either bridge or crossfade
   */
  private executeTransition(targetZoneId: string): void {
    if (!this.currentZone) return

    if (this.currentZone.bridge) {
      // Use bridge/sizzle transition
      this.executeBridgeTransition(targetZoneId)
    } else {
      // Use quantized crossfade (no bridge)
      this.executeQuantizedCrossfade(targetZoneId)
    }
  }

  /**
   * Quantized Crossfade - for transitions without a bridge
   * Fast, imperceptible fade exactly on the grid point
   */
  private executeQuantizedCrossfade(targetZoneId: string): void {
    const nextZone = getZone(targetZoneId)
    if (!nextZone) return

    const nextSound = this.sounds.get(nextZone.src)
    if (!nextSound) {
      console.warn('Next sound not loaded:', nextZone.src)
      return
    }

    this.isCrossfading = true
    this.nextSound = nextSound

    // Prepare next track
    nextSound.seek(0)
    nextSound.volume(0)
    nextSound.loop(nextZone.type !== 'outro')
    nextSound.play()

    // Crossfade: fade out current, fade in next
    if (this.currentSound) {
      this.currentSound.fade(1, 0, CROSSFADE_MS)
    }
    nextSound.fade(0, 1, CROSSFADE_MS)

    // Complete transition after crossfade
    setTimeout(() => {
      // Stop old track
      if (this.currentSound && this.currentSound !== nextSound) {
        this.currentSound.stop()
      }

      // Update state
      this.currentZone = nextZone
      this.currentSound = nextSound
      this.nextSound = null
      this.currentBeat = 0
      this.currentBar = 0
      this.isCrossfading = false
      this.pendingTransition = null

      // Set up outro handler if needed
      nextSound.off('end')
      if (nextZone.type === 'outro') {
        nextSound.on('end', () => this.handleOutroEnd())
      }

      this.setState('playing')
      this.callbacks.onZoneChange?.(nextZone.id)
      this.callbacks.onTransitionComplete?.(targetZoneId)
    }, CROSSFADE_MS)
  }

  /**
   * Bridge Transition - play sizzle/transition sound before next zone
   */
  private executeBridgeTransition(targetZoneId: string): void {
    if (!this.currentZone?.bridge) {
      this.executeQuantizedCrossfade(targetZoneId)
      return
    }

    const bridge = this.currentZone.bridge
    const bridgeSound = this.sounds.get(bridge.src)

    if (!bridgeSound) {
      console.warn('Bridge not loaded:', bridge.src)
      this.executeQuantizedCrossfade(targetZoneId)
      return
    }

    // Quick fade out current
    if (this.currentSound) {
      this.currentSound.fade(1, 0, 150)
      setTimeout(() => {
        this.currentSound?.stop()
      }, 150)
    }

    // Start bridge
    this.isInBridge = true
    this.bridgeStartTime = Date.now()
    this.currentBridgeBars = bridge.bars
    this.bridgeSound = bridgeSound
    bridgeSound.seek(0)
    bridgeSound.loop(false)
    bridgeSound.volume(1)

    bridgeSound.off('end')
    bridgeSound.on('end', () => {
      this.isInBridge = false
      this.bridgeSound = null
      this.currentBridgeBars = 0

      // Start next zone
      const nextZone = getZone(targetZoneId)
      if (nextZone) {
        this.currentZone = nextZone
        this.pendingTransition = null
        this.startZone(nextZone)
        this.callbacks.onTransitionComplete?.(targetZoneId)
      }
    })

    bridgeSound.play()
  }

  /**
   * Fast Descent - user scrolled rapidly, skip to target immediately
   */
  private handleFastDescent(targetZoneId: string): void {
    this.clearPendingTransition()

    // Find the target zone
    const targetZone = getZone(targetZoneId)
    if (!targetZone) return

    this.pendingTransition = targetZoneId
    this.setState('transitioning')

    // Calculate time to next grid (shorter wait for fast descent)
    const currentPosition = this.currentSound?.seek() || 0
    const currentMs = currentPosition * 1000
    let msToWait = getMsToNextGrid(currentMs)

    // Cap wait time for fast descent - max 2 bars
    const maxWait = BAR_MS * 2
    if (msToWait > maxWait) {
      msToWait = msToWait % BAR_MS // Wait for next bar instead
    }

    this.callbacks.onTransitionStart?.(this.currentZone!.id, targetZoneId, 0)

    // Quick transition
    if (msToWait < 100) {
      this.executeQuantizedCrossfade(targetZoneId)
    } else {
      this.transitionTimeout = setTimeout(() => {
        this.executeQuantizedCrossfade(targetZoneId)
      }, msToWait)
    }
  }

  /**
   * Clear any pending transition
   */
  private clearPendingTransition(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
      this.transitionTimeout = null
    }
  }

  /**
   * Cancel transition and return to playing state
   */
  cancelTransition(): void {
    this.clearPendingTransition()
    this.pendingTransition = null
    if (this.state === 'transitioning' && !this.isInBridge && !this.isCrossfading) {
      this.setState('playing')
    }
  }

  // ==========================================================================
  // BEAT TRACKING
  // ==========================================================================

  private startBeatTracking(): void {
    this.stopBeatTracking()

    const beatMs = (60 / BPM) * 1000

    this.beatInterval = setInterval(() => {
      this.currentBeat++

      if (this.currentBeat >= 4) {
        this.currentBeat = 0
        this.currentBar++

        // Reset bar count at zone boundary for looping zones
        if (this.currentZone?.type === 'loop' && this.currentZone.bars) {
          if (this.currentBar >= this.currentZone.bars) {
            this.currentBar = 0
          }
        }
      }

      this.callbacks.onBeat?.(this.currentBeat, this.currentBar)
    }, beatMs)
  }

  private stopBeatTracking(): void {
    if (this.beatInterval) {
      clearInterval(this.beatInterval)
      this.beatInterval = null
    }
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  private setState(state: SequencerState): void {
    this.state = state
    this.callbacks.onStateChange?.(state)
  }

  getStatus(): SequencerStatus {
    let barsUntilTransition: number | null = null
    let bridgeProgress = 0

    if (this.pendingTransition && this.currentSound && !this.isInBridge && !this.isCrossfading) {
      const currentMs = (this.currentSound.seek() || 0) * 1000
      barsUntilTransition = getBarsToNextGrid(currentMs)
    }

    if (this.isInBridge && this.currentBridgeBars > 0) {
      const elapsed = Date.now() - this.bridgeStartTime
      const bridgeDuration = barsToMs(this.currentBridgeBars)
      bridgeProgress = Math.min(elapsed / bridgeDuration, 1)
    }

    return {
      state: this.state,
      currentZone: this.currentZone?.id || null,
      nextZone: this.pendingTransition,
      currentBar: this.currentBar,
      currentBeat: this.currentBeat,
      barsUntilTransition,
      isInBridge: this.isInBridge,
      bridgeBars: this.currentBridgeBars || null,
      bridgeProgress,
      isCrossfading: this.isCrossfading,
    }
  }

  getState(): SequencerState {
    return this.state
  }

  getCurrentZone(): string | null {
    return this.currentZone?.id || null
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy(): void {
    this.stop()
    this.sounds.forEach((sound) => sound.unload())
    this.sounds.clear()
  }
}

// ============================================================================
// REACT HOOK FOR SEQUENCER
// ============================================================================

export function useSequencer(callbacks?: SequencerCallbacks) {
  const sequencerRef = useRef<Sequencer | null>(null)
  const [state, setState] = useState<SequencerState>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [currentZone, setCurrentZone] = useState<string | null>(null)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentBar, setCurrentBar] = useState(0)
  const [isInBridge, setIsInBridge] = useState(false)
  const [isCrossfading, setIsCrossfading] = useState(false)

  useEffect(() => {
    const seq = new Sequencer({
      ...callbacks,
      onStateChange: (newState) => {
        setState(newState)
        callbacks?.onStateChange?.(newState)
      },
      onLoadProgress: (progress) => {
        setLoadProgress(progress)
        callbacks?.onLoadProgress?.(progress)
      },
      onZoneChange: (zoneId) => {
        setCurrentZone(zoneId)
        setIsInBridge(false)
        setIsCrossfading(false)
        callbacks?.onZoneChange?.(zoneId)
      },
      onBeat: (beat, bar) => {
        setCurrentBeat(beat)
        setCurrentBar(bar)
        callbacks?.onBeat?.(beat, bar)
      },
    })

    sequencerRef.current = seq

    return () => {
      seq.destroy()
    }
  }, [])

  // Track transition states
  useEffect(() => {
    if (!sequencerRef.current) return

    const checkStatus = setInterval(() => {
      const status = sequencerRef.current?.getStatus()
      if (status) {
        setIsInBridge(status.isInBridge)
        setIsCrossfading(status.isCrossfading)
      }
    }, 50)

    return () => clearInterval(checkStatus)
  }, [])

  const load = useCallback(async () => {
    await sequencerRef.current?.load()
  }, [])

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
  }, [])

  const requestTransition = useCallback((targetZoneId?: string) => {
    sequencerRef.current?.requestTransition(targetZoneId)
  }, [])

  const cancelTransition = useCallback(() => {
    sequencerRef.current?.cancelTransition()
  }, [])

  const getStatus = useCallback(() => {
    return sequencerRef.current?.getStatus() || null
  }, [])

  return {
    state,
    loadProgress,
    currentZone,
    currentBeat,
    currentBar,
    isInBridge,
    isCrossfading,
    load,
    play,
    pause,
    resume,
    stop,
    requestTransition,
    cancelTransition,
    getStatus,
  }
}
