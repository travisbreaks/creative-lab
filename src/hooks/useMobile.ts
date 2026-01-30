'use client'

import { useState, useEffect } from 'react'

// ============================================================================
// MOBILE DETECTION HOOK
// Safety valve for performance optimization on mobile devices
// ============================================================================

const MOBILE_BREAKPOINT = 768

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check initial viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Run on mount
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}

export default useMobile
