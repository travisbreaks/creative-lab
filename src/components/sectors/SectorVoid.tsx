'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// ============================================================================
// HYPERSPACE STARS - Streaming past the camera
// ============================================================================

const STAR_COUNT = 500

function HyperspaceStars() {
  const pointsRef = useRef<THREE.Points>(null)
  const velocityRef = useRef(0)

  // Generate star positions along Z-axis tunnel
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    const spd = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Spread stars in a cylinder around the view
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 8

      pos[i * 3] = Math.cos(angle) * radius // x
      pos[i * 3 + 1] = Math.sin(angle) * radius // y
      pos[i * 3 + 2] = Math.random() * 100 - 50 // z (depth)

      spd[i] = 0.5 + Math.random() * 1.5 // Individual speed multiplier
    }

    return { positions: pos, speeds: spd }
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array

    // Move stars toward camera (negative Z)
    for (let i = 0; i < STAR_COUNT; i++) {
      posArray[i * 3 + 2] -= speeds[i] * velocityRef.current * delta * 60

      // Reset stars that pass the camera
      if (posArray[i * 3 + 2] < -50) {
        posArray[i * 3 + 2] = 50
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  // Expose velocity control
  useEffect(() => {
    const updateVelocity = () => {
      // Get scroll progress from GSAP
      const trigger = ScrollTrigger.getById('void-trigger')
      if (trigger) {
        velocityRef.current = trigger.progress * 2 // Accelerate as we go deeper
      }
    }

    gsap.ticker.add(updateVelocity)
    return () => gsap.ticker.remove(updateVelocity)
  }, [])

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.08} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ============================================================================
// SCENE
// ============================================================================

function Scene() {
  return (
    <>
      <HyperspaceStars />
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SectorVoid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const warningRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !textRef.current) return

    const ctx = gsap.context(() => {
      // Main fly-through timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'void-trigger',
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%', // Faster fly-through
          pin: true,
          scrub: 0,
          anticipatePin: 1,
        },
      })

      // Phase 1 (0-20%): Warning text pulses
      if (warningRef.current) {
        tl.to(
          warningRef.current,
          {
            opacity: 0,
            duration: 0.2,
          },
          0,
        )
      }

      // Phase 2 (0-100%): Text scales up exponentially - fly through effect
      tl.to(
        textRef.current,
        {
          scale: 50,
          opacity: 0,
          ease: 'expo.in', // Slow start, WHOOSH at the end
          duration: 1,
        },
        0,
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative h-screen bg-black overflow-hidden" style={{ userSelect: 'none' }}>
      {/* R3F Canvas - Hyperspace stars */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }} dpr={[1, 2]} gl={{ antialias: false, alpha: true }}>
          <Scene />
        </Canvas>
      </div>

      {/* Radial gradient overlay - tunnel effect */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, black 70%)',
        }}
      />

      {/* Sector Header */}
      <div className="absolute top-8 left-8 z-30">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Sector 4</div>
        <div className="text-[11px] tracking-[0.3em] text-red-500/70 uppercase">The Void</div>
      </div>

      {/* Depth indicator */}
      <div className="absolute top-8 right-8 z-30 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Critical Depth</div>
        <div className="font-mono text-sm text-red-400/70">-800m</div>
      </div>

      {/* Warning text - fades out */}
      <div ref={warningRef} className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="text-[10px] tracking-[0.5em] text-red-500/50 uppercase animate-pulse">
          ⚠ Point of No Return ⚠
        </div>
      </div>

      {/* Main fly-through text */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div
          ref={textRef}
          className="text-center"
          style={{
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        >
          <h2
            className="font-mono font-black text-[18vw] md:text-[20vw] leading-none tracking-[0.1em]"
            style={{
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 0 60px rgba(255,50,50,0.5), 0 0 120px rgba(255,0,0,0.3)',
            }}
          >
            VOID
          </h2>
        </div>
      </div>

      {/* Edge vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none z-25"
        style={{
          boxShadow: 'inset 0 0 200px 100px rgba(0,0,0,0.8)',
        }}
      />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] z-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Corner Brackets - red tinted for danger zone */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-red-900/50 z-30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-red-900/50 z-30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-900/50 z-30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-900/50 z-30" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </section>
  )
}
