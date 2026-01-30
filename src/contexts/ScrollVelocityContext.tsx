'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger)

// ============================================================================
// TYPES
// ============================================================================

interface ScrollState {
  /** Raw velocity from Lenis (-∞ to +∞, positive = scrolling down) */
  velocity: number
  /** Smoothed velocity using GSAP interpolation */
  smoothVelocity: number
  /** Absolute velocity magnitude (always positive) */
  speed: number
  /** Normalized speed (0-1 range, clamped) */
  normalizedSpeed: number
  /** Current scroll position in pixels */
  scroll: number
  /** Scroll progress (0-1) */
  progress: number
  /** Scroll direction: 1 = down, -1 = up, 0 = stopped */
  direction: -1 | 0 | 1
  /** Whether the user is actively scrolling */
  isScrolling: boolean
}

interface ScrollVelocityContextValue extends ScrollState {
  /** Reference to the Lenis instance for programmatic control */
  lenis: Lenis | null
}

// ============================================================================
// CONTEXT
// ============================================================================

const ScrollVelocityContext = createContext<ScrollVelocityContextValue | null>(
  null
)

// ============================================================================
// PROVIDER
// ============================================================================

interface ScrollVelocityProviderProps {
  children: ReactNode
  /** Smoothing factor for velocity interpolation (0-1, lower = smoother) */
  smoothing?: number
  /** Maximum velocity to consider for normalization */
  maxVelocity?: number
  /** Lenis configuration overrides */
  lenisOptions?: Partial<ConstructorParameters<typeof Lenis>[0]>
}

export function ScrollVelocityProvider({
  children,
  smoothing = 0.1,
  maxVelocity = 10,
  lenisOptions = {},
}: ScrollVelocityProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const smoothVelocityRef = useRef({ value: 0 })
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scrollState, setScrollState] = useState<ScrollState>({
    velocity: 0,
    smoothVelocity: 0,
    speed: 0,
    normalizedSpeed: 0,
    scroll: 0,
    progress: 0,
    direction: 0,
    isScrolling: false,
  })

  // Update scroll state with new values
  const updateScrollState = useCallback(
    (lenis: Lenis) => {
      const velocity = lenis.velocity
      const scroll = lenis.scroll
      const progress = lenis.progress

      // GSAP smoothing for velocity
      gsap.to(smoothVelocityRef.current, {
        value: velocity,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      })

      const smoothVelocity = smoothVelocityRef.current.value
      const speed = Math.abs(smoothVelocity)
      const normalizedSpeed = Math.min(speed / maxVelocity, 1)

      // Determine direction
      let direction: -1 | 0 | 1 = 0
      if (velocity > 0.01) direction = 1
      else if (velocity < -0.01) direction = -1

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Set scrolling state with debounce for stop detection
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollState((prev) => ({
          ...prev,
          isScrolling: false,
          direction: 0,
        }))
      }, 150)

      setScrollState({
        velocity,
        smoothVelocity,
        speed,
        normalizedSpeed,
        scroll,
        progress,
        direction,
        isScrolling: true,
      })
    },
    [maxVelocity]
  )

  useEffect(() => {
    // Initialize Lenis with merged options
    // FIGHTER JET config: fast, aggressive, arcade mode
    const lenis = new Lenis({
      duration: 0.5, // Stops fast
      easing: (t) => 1 - Math.pow(1 - t, 4), // Quartic - quicker response curve
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 2.5, // TURBO - 2.5x speed per flick
      touchMultiplier: 3, // Electric trackpad feel
      ...lenisOptions,
    })

    lenisRef.current = lenis

    // Connect Lenis scroll to GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update()
      updateScrollState(lenis)
    })

    // Sync GSAP ticker to Lenis RAF
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    // Expose lenis globally for debugging
    if (typeof window !== 'undefined') {
      ;(window as Window & { lenis?: Lenis }).lenis = lenis
    }

    // Cleanup
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      lenis.destroy()
      gsap.ticker.remove(tickerCallback)
    }
  }, [lenisOptions, updateScrollState])

  const contextValue: ScrollVelocityContextValue = {
    ...scrollState,
    lenis: lenisRef.current,
  }

  return (
    <ScrollVelocityContext.Provider value={contextValue}>
      {children}
    </ScrollVelocityContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useScrollVelocity(): ScrollVelocityContextValue {
  const context = useContext(ScrollVelocityContext)

  if (!context) {
    throw new Error(
      'useScrollVelocity must be used within a ScrollVelocityProvider'
    )
  }

  return context
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ScrollVelocityContext }
export type { ScrollState, ScrollVelocityContextValue }
