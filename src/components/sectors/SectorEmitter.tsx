'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'
import { useMobile } from '@/hooks/useMobile'

// ============================================================================
// PARTICLE SPHERE - Instanced Mesh
// ============================================================================

const PARTICLE_COUNT_DESKTOP = 2000
const PARTICLE_COUNT_MOBILE = 500

interface ParticleSphereProps {
  particleCount: number
}

function ParticleSphere({ particleCount }: ParticleSphereProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { normalizedSpeed } = useScrollVelocity()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate initial positions on a sphere
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for even spacing
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi

      const radius = 2.5
      const x = radius * Math.cos(theta) * Math.sin(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(phi)

      temp.push({
        position: new THREE.Vector3(x, y, z),
        originalPosition: new THREE.Vector3(x, y, z),
        scale: 0.5 + Math.random() * 0.5,
        speed: 0.5 + Math.random() * 0.5,
      })
    }
    return temp
  }, [particleCount])

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.getElapsedTime()
    const explosionFactor = Math.min(normalizedSpeed * 3, 1) // Clamp at 1

    particles.forEach((particle, i) => {
      const { originalPosition, scale, speed: particleSpeed } = particle

      // Base rotation
      const rotationAngle = time * 0.1 * particleSpeed
      const rotatedX = originalPosition.x * Math.cos(rotationAngle) - originalPosition.z * Math.sin(rotationAngle)
      const rotatedZ = originalPosition.x * Math.sin(rotationAngle) + originalPosition.z * Math.cos(rotationAngle)

      // Explosion effect based on scroll velocity
      const explosionScale = 1 + explosionFactor * 2
      const noiseX = Math.sin(time * 2 + i * 0.1) * explosionFactor * 0.5
      const noiseY = Math.cos(time * 2 + i * 0.15) * explosionFactor * 0.5
      const noiseZ = Math.sin(time * 2 + i * 0.2) * explosionFactor * 0.5

      dummy.position.set(
        rotatedX * explosionScale + noiseX,
        originalPosition.y * explosionScale + noiseY,
        rotatedZ * explosionScale + noiseZ,
      )

      // Particles get smaller as they explode
      const dynamicScale = scale * (1 - explosionFactor * 0.5)
      dummy.scale.setScalar(dynamicScale)

      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true

    // Fade opacity based on explosion
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.6 - explosionFactor * 0.4
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  )
}

// ============================================================================
// GLOW RING - Atmospheric effect
// ============================================================================

function GlowRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const { normalizedSpeed } = useScrollVelocity()

  useFrame((state) => {
    if (!ringRef.current) return
    const time = state.clock.getElapsedTime()

    // Pulse effect
    const pulse = 1 + Math.sin(time * 2) * 0.05
    const explosionScale = 1 + normalizedSpeed * 0.5
    ringRef.current.scale.setScalar(pulse * explosionScale)

    // Rotate slowly
    ringRef.current.rotation.z = time * 0.1

    // Fade on explosion
    const material = ringRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.15 - normalizedSpeed * 0.1
  })

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[2.8, 3, 64]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ============================================================================
// INNER CORE - Glowing center
// ============================================================================

function InnerCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const { normalizedSpeed } = useScrollVelocity()

  useFrame((state) => {
    if (!coreRef.current) return
    const time = state.clock.getElapsedTime()

    // Breathing effect
    const breath = 1 + Math.sin(time * 3) * 0.1
    coreRef.current.scale.setScalar(breath * (1 + normalizedSpeed * 0.3))

    // Opacity pulses
    const material = coreRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.4 + Math.sin(time * 4) * 0.1 + normalizedSpeed * 0.2
  })

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
    </mesh>
  )
}

// ============================================================================
// SCENE WRAPPER
// ============================================================================

interface SceneProps {
  isMobile: boolean
}

function Scene({ isMobile }: SceneProps) {
  const particleCount = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP

  return (
    <>
      <ambientLight intensity={0.5} />
      <ParticleSphere particleCount={particleCount} />
      <GlowRing />
      <InnerCore />
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SectorEmitter() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { normalizedSpeed } = useScrollVelocity()
  const isMobile = useMobile()

  // Calculate text opacity based on scroll - fades as user scrolls down
  const textOpacity = Math.max(0, 1 - normalizedSpeed * 2)

  return (
    <section ref={sectionRef} className="relative h-screen bg-[#030303] overflow-hidden">
      {/* R3F Canvas - Particle Sphere */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{ antialias: !isMobile, alpha: true }}
        >
          <Scene isMobile={isMobile} />
        </Canvas>
      </div>

      {/* Background noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sector Header */}
      <div className="absolute top-8 left-8 z-20">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Sector 0</div>
        <div className="text-[11px] tracking-[0.3em] text-amber-500/70 uppercase">The Emitter</div>
      </div>

      {/* Status Readout */}
      <div className="absolute top-8 right-8 z-20 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">Surface Level</div>
        <div className="font-mono text-sm text-amber-400/70">DEPTH: 0m</div>
      </div>

      {/* Main Title - Center */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
        style={{ opacity: textOpacity, transition: 'opacity 0.1s ease-out' }}
      >
        <h1 className="text-[clamp(3rem,12vw,10rem)] font-light leading-[0.85] tracking-[-0.04em] text-center">
          <span className="bg-gradient-to-r from-amber-400 via-white to-cyan-400 bg-clip-text text-transparent">
            HIGGS
          </span>
          <span className="text-white/20 mx-2">—</span>
          <span className="bg-gradient-to-r from-cyan-400 via-white to-emerald-400 bg-clip-text text-transparent">
            BOSON
          </span>
        </h1>

        <p className="mt-8 text-lg text-white/40 max-w-lg mx-auto leading-relaxed tracking-wide text-center">
          The Component Collider
        </p>

        <p className="mt-4 text-sm text-amber-400/40 font-mono tracking-wider">
          Smashing code together at the speed of light
        </p>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
        style={{ opacity: textOpacity }}
      >
        <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase mb-4">Scroll to descend</span>

        {/* Animated arrow */}
        <div className="relative w-6 h-10 border border-white/20 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Depth markers on sides */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-px bg-white/10" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-px bg-white/10" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-neutral-800 z-10" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-neutral-800 z-10" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-neutral-800 z-10" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-neutral-800 z-10" />

      {/* Scanline Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] z-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Bottom fade into next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-10" />
    </section>
  )
}
