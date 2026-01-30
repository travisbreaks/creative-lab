// ============================================================================
// AUDIO CONFIGURATION
// Variable-length musical score at 132 BPM
// "Cold Start" Architecture - Immediate energy, no intro lag
// ============================================================================

export const BPM = 132
export const BEAT_MS = (60 / BPM) * 1000 // ~454.5ms per beat
export const BAR_MS = BEAT_MS * 4 // ~1818ms per bar (4 beats per bar)

// Grid quantization - transitions happen on 4-bar boundaries
export const GRID_BARS = 4
export const GRID_MS = BAR_MS * GRID_BARS

// Crossfade duration for direct switches (no bridge)
export const CROSSFADE_MS = 500

// ============================================================================
// ZONE TYPES
// ============================================================================

export type ZoneType = 'start' | 'loop' | 'outro'

export interface BridgeConfig {
  src: string
  bars: number // Variable: 2, 4, or 8 bars
}

export interface ZoneConfig {
  id: string
  src: string
  bars: number
  type: ZoneType
  bridge: BridgeConfig | null // null = quantized crossfade instead
  next: string | null
  triggerAt: number // Scroll position (0-1) that triggers transition to next
}

// ============================================================================
// THE SCORE - Cold Start Architecture
// Starts immediately with energy, no intro waiting
// ============================================================================

export const SCORE: ZoneConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE - Starts immediately on initialize
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'surface',
    src: '/music/01_beats_come_in.mp3',
    bars: 16,
    type: 'start',
    bridge: null, // Direct quantized crossfade to next
    next: 'lattice',
    triggerAt: 0.1, // Early trigger at ~10% scroll (Aperture entry)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LATTICE - First full loop
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'lattice',
    src: '/music/02_beats.mp3',
    bars: 32,
    type: 'loop',
    bridge: { src: '/music/sizzle_02_4bars.mp3', bars: 4 },
    next: 'lattice2',
    triggerAt: 0.25,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LATTICE 2 - Second beat variation
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'lattice2',
    src: '/music/03_beats_2.mp3',
    bars: 32,
    type: 'loop',
    bridge: { src: '/music/sizzle_03_4bars.mp3', bars: 4 },
    next: 'void',
    triggerAt: 0.4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VOID - Building intensity
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'void',
    src: '/music/04_beats_progression.mp3',
    bars: 32,
    type: 'loop',
    bridge: { src: '/music/sizzle_04_8bars.mp3', bars: 8 }, // LONG 8-BAR BRIDGE
    next: 'singularity',
    triggerAt: 0.55,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SINGULARITY - Peak energy (28 bars)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'singularity',
    src: '/music/05_main_progression.mp3',
    bars: 28,
    type: 'loop',
    bridge: { src: '/music/sizzle_05_4bars.mp3', bars: 4 },
    next: 'singularity2',
    triggerAt: 0.7,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SINGULARITY 2 - Continuing peak (30 bars)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'singularity2',
    src: '/music/06_progression_2.mp3',
    bars: 30,
    type: 'loop',
    bridge: { src: '/music/sizzle_06_2bars.mp3', bars: 2 }, // SHORT 2-BAR BRIDGE
    next: 'singularity3',
    triggerAt: 0.82,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SINGULARITY 3 - Final progression (24 bars)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'singularity3',
    src: '/music/07_progression_3.mp3',
    bars: 24,
    type: 'loop',
    bridge: null, // Direct transition to outro
    next: 'outro',
    triggerAt: 0.92,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OUTRO - Final 8 bars, ends the experience
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'outro',
    src: '/music/08_outro.mp3',
    bars: 8,
    type: 'outro',
    bridge: null,
    next: null,
    triggerAt: 1.0, // End of page
  },
]

// ============================================================================
// ZONE TO SECTOR MAPPING
// Maps visual sectors to audio zones
// ============================================================================

export const SECTOR_ZONE_MAP: Record<string, string> = {
  'sector-emitter': 'surface',
  'sector-velocity': 'surface',
  'sector-aperture': 'lattice',
  'sector-lattice': 'void',
  'sector-void': 'singularity',
  'sector-singularity': 'singularity3',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get zone by ID
 */
export function getZone(id: string): ZoneConfig | undefined {
  return SCORE.find((zone) => zone.id === id)
}

/**
 * Get zone by index
 */
export function getZoneByIndex(index: number): ZoneConfig | undefined {
  return SCORE[index]
}

/**
 * Get zone index by ID
 */
export function getZoneIndex(id: string): number {
  return SCORE.findIndex((zone) => zone.id === id)
}

/**
 * Get the starting zone (first in SCORE)
 */
export function getStartZone(): ZoneConfig {
  return SCORE[0]
}

/**
 * Get zone for a given scroll position (0-1)
 */
export function getZoneForScrollPosition(scrollProgress: number): ZoneConfig {
  // Find the zone whose triggerAt we've passed but haven't passed the next
  for (let i = SCORE.length - 1; i >= 0; i--) {
    if (scrollProgress >= SCORE[i].triggerAt) {
      return SCORE[i]
    }
  }
  return SCORE[0]
}

/**
 * Get all unique audio sources for preloading
 */
export function getAllAudioSources(): string[] {
  const sources: string[] = []

  SCORE.forEach((zone) => {
    sources.push(zone.src)
    if (zone.bridge) {
      sources.push(zone.bridge.src)
    }
  })

  return [...new Set(sources)] // Deduplicate
}

/**
 * Calculate milliseconds for a given number of bars
 */
export function barsToMs(bars: number): number {
  return bars * BAR_MS
}

/**
 * Calculate the next grid-aligned position (in ms) from current position
 */
export function getNextGridPosition(currentMs: number): number {
  const currentBar = Math.floor(currentMs / BAR_MS)
  const nextGridBar = Math.ceil((currentBar + 1) / GRID_BARS) * GRID_BARS
  return nextGridBar * BAR_MS
}

/**
 * Get bars until next grid position (for countdown display)
 */
export function getBarsToNextGrid(currentMs: number): number {
  const currentBar = currentMs / BAR_MS
  const barsIntoGrid = currentBar % GRID_BARS
  const barsRemaining = GRID_BARS - barsIntoGrid
  return Math.ceil(barsRemaining)
}

/**
 * Get milliseconds until next grid position
 */
export function getMsToNextGrid(currentMs: number): number {
  const currentBar = currentMs / BAR_MS
  const barsIntoGrid = currentBar % GRID_BARS
  const barsRemaining = GRID_BARS - barsIntoGrid

  // If we're exactly on a grid, return full grid duration
  if (barsRemaining === GRID_BARS) {
    return 0 // Already on grid, can switch now
  }

  return barsRemaining * BAR_MS
}

/**
 * Check if we can skip ahead multiple zones (fast descent)
 */
export function canFastDescend(
  currentZoneId: string,
  targetZoneId: string
): boolean {
  const currentIndex = getZoneIndex(currentZoneId)
  const targetIndex = getZoneIndex(targetZoneId)
  return targetIndex > currentIndex + 1 // Skipping more than one zone
}

// Type exports
export type { ZoneConfig as Zone }
