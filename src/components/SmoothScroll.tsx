'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger)

interface SmoothScrollProps {
  children: React.ReactNode
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    })

    lenisRef.current = lenis

    // Connect Lenis scroll to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Sync GSAP ticker to Lenis RAF
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    // Disable lag smoothing for buttery animations
    gsap.ticker.lagSmoothing(0)

    // Expose lenis globally for debugging
    if (typeof window !== 'undefined') {
      ;(window as Window & { lenis?: Lenis }).lenis = lenis
    }

    // Cleanup
    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000)
      })
    }
  }, [])

  return <>{children}</>
}
