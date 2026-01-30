'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, shaderMaterial } from '@react-three/drei'
import { useScrollVelocity } from '@/contexts/ScrollVelocityContext'
import { useMobile } from '@/hooks/useMobile'
import { ASSETS } from '@/config/assets'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'

// ============================================================================
// LIQUID DISTORTION SHADER
// ============================================================================

const LiquidMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uDistortion: 0,
    uRgbShift: 0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uDistortion;

    void main() {
      vUv = uv;

      vec3 pos = position;

      // Vertical wave distortion based on scroll velocity
      float wave = sin(pos.y * 3.0 + uTime * 2.0) * uDistortion * 0.1;
      pos.x += wave;

      // Horizontal ripple
      float ripple = sin(pos.x * 5.0 + uTime * 3.0) * uDistortion * 0.05;
      pos.y += ripple;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uDistortion;
    uniform float uRgbShift;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      // Wobble effect
      float wobbleX = sin(uv.y * 10.0 + uTime * 2.0) * uDistortion * 0.02;
      float wobbleY = cos(uv.x * 10.0 + uTime * 2.5) * uDistortion * 0.02;

      uv.x += wobbleX;
      uv.y += wobbleY;

      // RGB Shift / Chromatic Aberration
      float shift = uRgbShift * 0.01;

      float r = texture2D(uTexture, uv + vec2(shift, 0.0)).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, uv - vec2(shift, 0.0)).b;

      vec4 color = vec4(r, g, b, 1.0);

      // Slight vignette
      float vignette = 1.0 - length(vUv - 0.5) * 0.5;
      color.rgb *= vignette;

      gl_FragColor = color;
    }
  `
)

extend({ LiquidMaterial })

// TypeScript declaration for the custom material
declare module '@react-three/fiber' {
  interface ThreeElements {
    liquidMaterial: any
  }
}

// ============================================================================
// LIQUID IMAGE PLANE
// ============================================================================

interface LiquidImageProps {
  position: [number, number, number]
  scale: [number, number, number]
  textureUrl: string
  index: number
  isMobile: boolean
}

function LiquidImage({
  position,
  scale,
  textureUrl,
  index,
  isMobile,
}: LiquidImageProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  const { normalizedSpeed, isScrolling } = useScrollVelocity()

  // Load texture
  const texture = useTexture(textureUrl)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  // Lower segments on mobile for performance
  const segments = isMobile ? 16 : 32

  useFrame((state) => {
    if (!materialRef.current) return

    const time = state.clock.elapsedTime

    // Update shader uniforms
    materialRef.current.uTime = time + index * 0.5 // Offset per image

    // Distortion based on velocity - idle has gentle ripple
    // Reduce distortion intensity on mobile
    const distortionMultiplier = isMobile ? 1.5 : 3
    const targetDistortion = isScrolling
      ? normalizedSpeed * distortionMultiplier
      : 0.2
    materialRef.current.uDistortion = THREE.MathUtils.lerp(
      materialRef.current.uDistortion,
      targetDistortion,
      0.1
    )

    // RGB shift at high speeds (disabled on mobile for performance)
    const targetRgbShift =
      !isMobile && normalizedSpeed > 0.5 ? normalizedSpeed * 2 : 0
    materialRef.current.uRgbShift = THREE.MathUtils.lerp(
      materialRef.current.uRgbShift,
      targetRgbShift,
      0.1
    )
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <planeGeometry args={[1, 1, segments, segments]} />
      <liquidMaterial
        ref={materialRef}
        uTexture={texture}
        uTime={0}
        uDistortion={0.2}
        uRgbShift={0}
        transparent
      />
    </mesh>
  )
}

// ============================================================================
// PLACEHOLDER TEXTURE GENERATOR (Procedural)
// ============================================================================

function generatePlaceholderDataUrl(index: number): string {
  // Generate different colored gradient placeholders
  const colors = [
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#1a1a1a', '#2d2d2d', '#3d3d3d'],
    ['#0d1b2a', '#1b263b', '#415a77'],
    ['#10002b', '#240046', '#3c096c'],
  ]

  const gradient = colors[index % colors.length]

  // Create an SVG data URL
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient[0]};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${gradient[1]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient[2]};stop-opacity:1" />
        </linearGradient>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.3" />
      <text x="50%" y="50%" font-family="monospace" font-size="24" fill="rgba(255,255,255,0.1)" text-anchor="middle" dominant-baseline="middle">
        EXPERIMENT ${index + 1}
      </text>
    </svg>
  `)}`
}

// ============================================================================
// GALLERY SCENE
// ============================================================================

interface GallerySceneProps {
  isMobile: boolean
}

function GalleryScene({ isMobile }: GallerySceneProps) {
  const { viewport } = useThree()

  // Calculate responsive sizing
  const imageWidth = Math.min(viewport.width * 0.4, 3)
  const imageHeight = imageWidth * 1.2
  const gap = 0.3

  // Use real textures from ASSETS, with fallback to placeholders
  const images = useMemo(
    () => [
      {
        position: [-imageWidth / 2 - gap / 2, imageHeight / 2 + gap / 2, 0] as [
          number,
          number,
          number,
        ],
        url: ASSETS.failures[0] || generatePlaceholderDataUrl(0),
      },
      {
        position: [imageWidth / 2 + gap / 2, imageHeight / 2 + gap / 2, 0] as [
          number,
          number,
          number,
        ],
        url: ASSETS.failures[1] || generatePlaceholderDataUrl(1),
      },
      {
        position: [
          -imageWidth / 2 - gap / 2,
          -imageHeight / 2 - gap / 2,
          0,
        ] as [number, number, number],
        url: ASSETS.failures[2] || generatePlaceholderDataUrl(2),
      },
      {
        position: [imageWidth / 2 + gap / 2, -imageHeight / 2 - gap / 2, 0] as [
          number,
          number,
          number,
        ],
        url: ASSETS.failures[3] || generatePlaceholderDataUrl(3),
      },
    ],
    [imageWidth, imageHeight, gap]
  )

  return (
    <>
      <ambientLight intensity={0.8} />
      {images.map((img, i) => (
        <Suspense key={i} fallback={null}>
          <LiquidImage
            position={img.position}
            scale={[imageWidth, imageHeight, 1]}
            textureUrl={img.url}
            index={i}
            isMobile={isMobile}
          />
        </Suspense>
      ))}
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SectorSingularity() {
  const { normalizedSpeed } = useScrollVelocity()
  const isMobile = useMobile()

  const handleReturnToSurface = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
      {/* Sector Header */}
      <div className="absolute top-8 left-8 z-20">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Sector 5
        </div>
        <div className="text-[11px] tracking-[0.3em] text-purple-500/70 uppercase">
          The Singularity
        </div>
      </div>

      {/* Depth indicator */}
      <div className="absolute top-8 right-8 z-20 text-right">
        <div className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-1">
          Maximum Depth
        </div>
        <div className="font-mono text-sm text-purple-400/70">-1000m</div>
      </div>

      {/* Section Title */}
      <div className="pt-24 pb-8 text-center z-10 relative">
        <div className="text-[10px] tracking-[0.5em] text-purple-500/40 uppercase mb-4">
          Failed Experiments Archive
        </div>
        <h2 className="font-mono text-4xl md:text-5xl text-white/90 tracking-tight mb-4">
          THE SINGULARITY
        </h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Where all paths converge. Scroll to disturb the field.
        </p>
      </div>

      {/* R3F Canvas - Liquid Gallery */}
      <div className="relative h-[80vh] w-full">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{ antialias: !isMobile, alpha: true }}
        >
          <Suspense fallback={null}>
            <GalleryScene isMobile={isMobile} />
          </Suspense>
        </Canvas>

        {/* Distortion intensity indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="backdrop-blur-md bg-black/40 border border-purple-500/20 rounded px-4 py-2">
            <div className="text-[9px] tracking-[0.3em] text-neutral-500 uppercase mb-1 text-center">
              Field Distortion
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                  style={{ width: `${Math.min(normalizedSpeed * 100, 100)}%` }}
                />
              </div>
              <div className="font-mono text-xs text-purple-400 tabular-nums w-12">
                {(normalizedSpeed * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="py-20 text-center border-t border-purple-500/10 bg-black">
        <div className="text-[10px] tracking-[0.5em] text-red-500/60 uppercase mb-6 animate-pulse">
          ⚠ Terminal Connection Severed
        </div>

        <p className="text-sm text-neutral-600 mb-8 max-w-md mx-auto">
          You have reached the bottom of the collider shaft.
          <br />
          All experiments concluded.
        </p>

        <button
          onClick={handleReturnToSurface}
          className="group relative px-8 py-3 border border-purple-500/30 text-purple-400 text-sm tracking-wider uppercase transition-all hover:border-purple-500/60 hover:bg-purple-500/5"
        >
          <span className="relative z-10">↑ Return to Surface</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="mt-12 font-mono text-xs text-neutral-700">
          DEPTH: -1000m // STATUS: OFFLINE // SIGNAL: LOST
        </div>
      </div>

      {/* Corner Brackets - purple tinted */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-purple-900/50 z-10" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-900/50 z-10" />

      {/* Scanline Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.01] z-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </section>
  )
}
