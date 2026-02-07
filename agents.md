# Creative Lab (HIGGS-BOSON) — Agent Context

**Updated**: 2026-02-07 | **Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP (ScrollTrigger, Flip, CustomEase), Lenis, R3F, Three.js, Howler

## What This Is

Experimental creative sandbox. The current experiment is **HIGGS-BOSON** — a vertical scroll-driven "particle collider" where scroll depth = time travel through 6 sectors. Each sector demonstrates a different web interaction technique (velocity distortion, pinned scrollytelling, GSAP Flip layouts, typography flythroughs, liquid shaders). Aesthetic: clinical, dark, precise — like a particle physics lab control room.

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout + providers (ScrollVelocity, Audio)
│   ├── page.tsx                # Home — composes 6 sectors in scroll flow
│   └── globals.css             # Global styles, Lenis overrides, scanline overlay
├── contexts/
│   ├── ScrollVelocityContext.tsx  # Core physics engine (Lenis + GSAP integration)
│   └── AudioContext.tsx          # Audio management (Howler)
├── config/
│   ├── audio.ts                # Audio file configuration
│   └── assets.ts               # Asset path constants
├── hooks/
│   └── useMobile.ts            # Mobile detection
├── components/
│   ├── sectors/
│   │   ├── SectorEmitter.tsx      # Sector 0: Hero entry point
│   │   ├── SectorVelocity.tsx     # Sector 1: Velocity-reactive log entries
│   │   ├── SectorAperture.tsx     # Sector 2: Pinned iris breach + R3F canvas
│   │   ├── SectorLattice.tsx      # Sector 3: GSAP Flip isotope card grid
│   │   ├── SectorVoid.tsx         # Sector 4: Typography flythrough tunnel
│   │   └── SectorSingularity.tsx  # Sector 5: Liquid shader gallery + terminal
│   ├── systems/
│   │   ├── BootSequence.tsx       # Initialization animation
│   │   └── Sequencer.tsx          # Animation orchestrator
│   ├── Oscilloscope.tsx        # Waveform feedback visualization
│   ├── VelocityHUD.tsx         # Speed/scroll display
│   ├── SectionWrapper.tsx      # Glass container component
│   └── SmoothScroll.tsx        # Scroll handler wrapper
└── lib/
    └── utils.ts                # Helper functions
```

## Core System: ScrollVelocityContext

The physics engine that powers everything. Wraps Lenis smooth scroll + GSAP interpolation.

```typescript
useScrollVelocity() → {
  velocity: number           // Raw Lenis velocity
  smoothVelocity: number     // GSAP-interpolated
  speed: number              // Absolute magnitude
  normalizedSpeed: number    // 0-1 clamped
  scroll: number             // Scroll position (px)
  progress: number           // 0-1 page progress
  direction: -1 | 0 | 1     // Up / Idle / Down
  isScrolling: boolean
  lenis: Lenis | null        // Direct Lenis reference
}
```

Lenis config: `duration: 0.5s`, `wheelMultiplier: 2.5`, `touchMultiplier: 3`

## Sector Breakdown

| Sector | Name | Technique | Key Detail |
|--------|------|-----------|------------|
| 0 | Emitter | Hero entry | Boot sequence animation |
| 1 | Velocity | Spaghettification | 20 log entries skew/scale based on scroll velocity |
| 2 | Aperture | Pinned scrollytelling | 150vh scrub, clip-path iris, R3F wireframe icosahedron, live counter 99.7%→0% |
| 3 | Lattice | GSAP Flip grid | 6 bento cards, chaos-to-order entrance, velocity-based vibration |
| 4 | Void | Typography tunnel | Parallax text flythrough |
| 5 | Singularity | Liquid shaders | Gallery + terminal interface |

## Styling

- **Colors**: amber-400/500, cyan-400, emerald-400, purple-400, rose-400, orange-400
- **Motion**: GSAP ScrollTrigger with scrub lag for heavy, physical feel
- **Effects**: Scanline overlay, corner brackets, glass cards, vignette
- **CSS**: Lenis overrides in `globals.css`

## Dependencies (Key)

- `gsap` — ScrollTrigger, Flip, CustomEase plugins
- `lenis` — Smooth scroll physics
- `@react-three/fiber` + `@react-three/drei` + `three` — 3D scenes
- `howler` — Audio playback

## Known Limitations

- **Local dev only** — not deployed anywhere
- **Heavy** — multiple GSAP plugins + R3F + Lenis = large bundle
- **Mobile needs work** — `useMobile` hook exists but sector adaptations may be incomplete
- **Next.js 16 + React Compiler** — bleeding edge, may have quirks

## Development

```bash
npm run dev --workspace=creative-lab   # http://localhost:3000
npm run build --workspace=creative-lab
```
