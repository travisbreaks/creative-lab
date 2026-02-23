'use client'

import { Float } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// ============================================================================
// HIGGS FIELD ARTIFACT - Wireframe geometry that rotates slowly
// ============================================================================

function HiggsFieldArtifact() {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15
      meshRef.current.rotation.y = time * 0.2
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.x = time * 0.15
      wireframeRef.current.rotation.y = time * 0.2
    }

    if (glowRef.current) {
      glowRef.current.rotation.x = -time * 0.08
      glowRef.current.rotation.z = time * 0.12
      const pulse = 1 + Math.sin(time * 3) * 0.08
      glowRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        {/* Core icosahedron */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>

        {/* Wireframe overlay */}
        <lineSegments ref={wireframeRef}>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(1.5, 1)]} />
          <lineBasicMaterial color="#fbbf24" transparent opacity={0.7} />
        </lineSegments>

        {/* Outer glow ring */}
        <mesh ref={glowRef}>
          <torusGeometry args={[2.2, 0.02, 16, 100]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
        </mesh>

        {/* Inner structure */}
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.5} />
        </mesh>

        {/* Orbiting particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <OrbitingParticle key={i} index={i} />
        ))}
      </group>
    </Float>
  )
}

function OrbitingParticle({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const radius = 2.2 + (index % 4) * 0.4
  const speed = 0.4 + index * 0.08
  const offset = (index / 12) * Math.PI * 2

  useFrame((state) => {
    const time = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.x = Math.cos(time * speed + offset) * radius
      ref.current.position.z = Math.sin(time * speed + offset) * radius
      ref.current.position.y = Math.sin(time * speed * 2.5 + offset) * 0.8
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
    </mesh>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SectorAperture() {
  const containerRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const containmentRef = useRef<HTMLDivElement>(null)
  const ringsRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const [containment, setContainment] = useState(99.7)
  const hasFlashedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || !maskRef.current || !textRef.current) return

    const container = containerRef.current
    const mask = maskRef.current
    const text = textRef.current
    const rings = ringsRef.current

    // Smooth, satisfying timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '+=100%', // Faster breach
        pin: true,
        scrub: 0.3, // Snappier response
        anticipatePin: 1,
        onUpdate: (self) => {
          // Animate containment percentage down
          const newContainment = 99.7 - self.progress * 99.7
          setContainment(Math.max(0, newContainment))

          // Trigger breach flash when containment hits critical (near 0)
          if (self.progress > 0.95 && !hasFlashedRef.current && flashRef.current) {
            hasFlashedRef.current = true

            // THE BREACH EVENT - violent whiteout flash
            gsap
              .timeline()
              .set(flashRef.current, { opacity: 0, visibility: 'visible' })
              .to(flashRef.current, {
                opacity: 1,
                duration: 0.05,
                ease: 'power4.in',
              })
              .to(flashRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out',
              })
              .set(flashRef.current, { visibility: 'hidden' })

            // Camera shake effect on the container
            gsap
              .timeline()
              .to(container, {
                x: -8,
                duration: 0.05,
                ease: 'none',
              })
              .to(container, {
                x: 8,
                duration: 0.05,
                ease: 'none',
              })
              .to(container, {
                x: -5,
                duration: 0.05,
                ease: 'none',
              })
              .to(container, {
                x: 5,
                duration: 0.05,
                ease: 'none',
              })
              .to(container, {
                x: -2,
                duration: 0.05,
                ease: 'none',
              })
              .to(container, {
                x: 0,
                duration: 0.05,
                ease: 'none',
              })
          }

          // Reset flash state when scrolling back up
          if (self.progress < 0.9) {
            hasFlashedRef.current = false
          }
        },
      },
    })

    // Clip-path opens smoothly
    tl.fromTo(
      mask,
      { clipPath: 'circle(0% at 50% 50%)' },
      {
        clipPath: 'circle(150% at 50% 50%)',
        duration: 1,
        ease: 'power3.inOut', // Smooth acceleration and deceleration
      },
    )

    // Text fades and floats up
    tl.to(
      text,
      {
        opacity: 0,
        y: -100,
        scale: 0.85,
        duration: 0.5,
        ease: 'power2.inOut',
      },
      0,
    )

    // Rings pulse and expand
    if (rings) {
      tl.to(
        rings,
        {
          scale: 1.5,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.in',
        },
        0.2,
      )
    }

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill()
      })
    }
  }, [])

  // Determine containment color based on level
  const getContainmentColor = () => {
    if (containment > 50) return 'text-emerald-500'
    if (containment > 20) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-[#050505]">
      {/* R3F Canvas - Behind everything */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <HiggsFieldArtifact />
            <fog attach="fog" args={['#050505', 5, 15]} />
          </Suspense>
        </Canvas>

        {/* Depth indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center mt-48">
            <div className="text-[10px] tracking-[0.5em] text-amber-500/40 uppercase mb-4">Higgs Field Active</div>
            <div className="font-mono text-6xl md:text-8xl text-white/5 tracking-tighter">-100m</div>
          </div>
        </div>
      </div>

      {/* The Mask Layer */}
      <div ref={maskRef} className="absolute inset-0 z-10 bg-[#050505]" style={{ clipPath: 'circle(0% at 50% 50%)' }} />

      {/* Surface Layer - Iris texture */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Radial lines */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              repeating-conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg,
                rgba(255,255,255,0.2) 0.5deg,
                transparent 1deg
              )
            `,
          }}
        />

        {/* Concentric rings - animated */}
        <div ref={ringsRef} className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3, 4, 5, 6].map((ring) => (
            <div
              key={ring}
              className="absolute rounded-full border border-amber-500/20"
              style={{
                width: `${ring * 15}%`,
                height: `${ring * 15}%`,
                animation: `pulse-ring ${2 + ring * 0.5}s ease-in-out infinite`,
                animationDelay: `${ring * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Center Text */}
      <div ref={textRef} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.5em] text-amber-500/60 uppercase mb-8 animate-pulse">
            ⚠ Breach Protocol Initiated
          </div>

          <h2 className="font-mono text-5xl md:text-7xl lg:text-8xl text-[#e5e5e5] tracking-tight mb-6 leading-none">
            CONTAINMENT
            <br />
            <span className="text-amber-500/90">FIELD</span>
          </h2>

          <div className="text-lg md:text-xl tracking-[0.3em] text-neutral-500 uppercase">Sector 1 // Depth -100m</div>

          <div className="mt-16 flex flex-col items-center gap-3">
            <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase">Scroll to Breach</div>
            <div className="relative">
              <div className="w-px h-10 bg-gradient-to-b from-amber-500/60 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500/60 animate-ping" />
            </div>
          </div>
        </div>
      </div>

      {/* Corner HUD */}
      <div className="absolute top-8 left-8 z-40">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Sector 1</div>
        <div className="text-[11px] tracking-[0.3em] text-amber-500/70 uppercase">The Containment Iris</div>
      </div>

      <div className="absolute top-8 right-8 z-40 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Field Status</div>
        <div
          className={`font-mono text-lg transition-colors duration-300 ${containment > 50 ? 'text-amber-500/80' : containment > 20 ? 'text-orange-500' : 'text-red-500 animate-pulse'}`}
        >
          {containment > 50 ? 'STABLE' : containment > 20 ? 'UNSTABLE' : 'CRITICAL'}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-40">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Depth</div>
        <div className="font-mono text-2xl text-[#e5e5e5]/80 tabular-nums">-100m</div>
      </div>

      {/* Containment percentage - THE STAR */}
      <div ref={containmentRef} className="absolute bottom-8 right-8 z-40 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Containment</div>
        <div className={`font-mono text-3xl tabular-nums transition-colors duration-200 ${getContainmentColor()}`}>
          {containment.toFixed(1)}%
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-neutral-800 z-40" />
      <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-neutral-800 z-40" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-neutral-800 z-40" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-neutral-800 z-40" />

      {/* Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-50 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* BREACH FLASH - Full screen whiteout */}
      <div
        ref={flashRef}
        className="fixed inset-0 z-[100] pointer-events-none bg-white"
        style={{ visibility: 'hidden', opacity: 0 }}
      />

      {/* Keyframes */}
      <style jsx>{`
        @keyframes pulse-ring {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.02);
          }
        }
      `}</style>
    </section>
  )
}
