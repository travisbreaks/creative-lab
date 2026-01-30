# HIGGS-BOSON: The Component Collider

## Project Overview

A high-end sandbox portfolio site functioning as a vertical "particle collider" simulation. The scroll bar controls "Depth/Time" as users descend through experimental sectors. Built with the "God Stack" for maximum motion fidelity.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React Compiler + TypeScript
- **Styling:** Tailwind CSS v4
- **Motion:** GSAP (ScrollTrigger, Flip, CustomEase)
- **Scroll Physics:** Lenis (smooth scroll synced with GSAP ticker)
- **3D/WebGL:** React Three Fiber + Drei + Three.js
- **Utilities:** clsx, tailwind-merge

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with ScrollVelocityProvider
│   ├── page.tsx            # Composes all sectors + experiment levels
│   └── globals.css         # Global styles, Lenis overrides, CSS variables
├── contexts/
│   └── ScrollVelocityContext.tsx  # Physics engine - exposes scroll velocity to all components
├── components/
│   ├── SmoothScroll.tsx    # (DEPRECATED - now in ScrollVelocityContext)
│   ├── SectionWrapper.tsx  # Glass containment unit with accent colors
│   ├── sectors/            # NEW: Main interactive sectors
│   │   ├── SectorVelocity.tsx   # Sector 0: Velocity-reactive experiment logs
│   │   ├── SectorAperture.tsx   # Sector 1: Pinned iris breach with R3F artifact
│   │   └── SectorLattice.tsx    # Sector 2: GSAP Flip isotope grid
│   └── experiments/        # Legacy experiment placeholders
│       ├── Level1_Emitter.tsx
│       ├── Level2_TimeDilation.tsx
│       ├── Level3_Lattice.tsx
│       └── Level4_FluidDynamics.tsx
└── lib/
    └── utils.ts            # cn() helper for className merging
```

## Core Systems

### 1. ScrollVelocityContext (The Physics Engine)

Located at `src/contexts/ScrollVelocityContext.tsx`

Wraps the entire app and exposes scroll physics via `useScrollVelocity()` hook:

- `velocity` - Raw velocity from Lenis
- `smoothVelocity` - GSAP-interpolated for buttery animations
- `speed` - Absolute magnitude
- `normalizedSpeed` - 0-1 range, clamped
- `direction` - 1 (down), -1 (up), 0 (stopped)
- `isScrolling` - Debounced active state
- `scroll` / `progress` - Position data
- `lenis` - Direct Lenis instance access

**Lenis Config (Fighter Jet Mode):**

```typescript
{
  duration: 0.5,
  easing: (t) => 1 - Math.pow(1 - t, 4), // Quartic
  wheelMultiplier: 2.5,
  touchMultiplier: 3,
}
```

### 2. Sector Components

#### Sector 0: SectorVelocity (The Event Horizon)

- 20 "Experiment Log" entries with clinical monospace typography
- **Spaghettification Effect:** Text skews and stretches based on scroll velocity
- Uses `useScrollVelocity()` to read real-time speed
- High speed = `skewY` + `scaleY` distortion, Stop = snap back to clarity

#### Sector 1: SectorAperture (The Containment Iris)

- Full-screen "CONTAINMENT FIELD" typography
- **Pinned Scrollytelling:** Pin for 150vh, scrub: 0.5 for heavy door feel
- **Clip-path Breach:** Circle mask expands from center, revealing R3F canvas
- **Live Counter:** Containment % drops 99.7% → 0% synced to scroll progress
- **R3F Higgs Field:** Wireframe icosahedron with orbiting particles
- Status changes: STABLE → UNSTABLE → CRITICAL

#### Sector 2: SectorLattice (The Specimens)

- 6 isotope cards in responsive bento grid
- **Chaos-to-Order Entrance:** Cards scatter, then snap into grid with `back.out` bounce
- **Velocity Reactivity:** Cards vibrate and glow when scrolling fast
- **Sequential Scanning:** Green ring cycles through cards
- **GSAP Flip Expansion:** Click card to expand full-screen with smooth layout animation
- **Parallax:** Cards drift based on position while scrolling through

## Design System

### Color Palette (Particle Collision Theme)

- **Background:** #050505 / #0a0a0a (deep black)
- **Amber/Gold:** amber-400/500 - particle trails, primary accent, containment
- **Cyan:** cyan-400 - detector beams, secondary accent
- **Emerald:** emerald-400/500 - data readouts, lattice, tertiary accent
- **Purple:** purple-400 - exotic matter
- **Rose:** rose-400 - positronium
- **Orange:** orange-400 - graviton
- **Text:** #e5e5e5 (white/90), various opacities

### Typography

- Large display: `font-mono`, `text-5xl md:text-7xl lg:text-8xl`, `tracking-tight`
- HUD labels: `text-[10px]`, `tracking-[0.4em]`, `uppercase`
- Data readouts: `font-mono`, `tabular-nums`
- Body: `text-lg`, `tracking-wide`, `leading-relaxed`

### Components

- **Corner Brackets:** `border-l-2 border-t-2 border-neutral-800` on all 4 corners
- **Scanline Overlay:** Repeating gradient for CRT effect
- **Glass Cards:** `backdrop-blur-sm` with colored borders

## Animation Guidelines

### ScrollTrigger Timing

- **Quick interactions:** `scrub: true` (instant)
- **Heavy/dramatic:** `scrub: 0.5` (slight lag)
- **Pin duration:** 100-150% for punchy, 200%+ for cinematic

### GSAP Easings

- Entrance: `back.out(1.2)` for bounce
- Smooth transitions: `power3.inOut`
- Fast response: `power2.out`
- Heavy doors: `power3.inOut` with scrub lag

### Velocity Thresholds

- `normalizedSpeed > 0.3` - Start showing effects
- `normalizedSpeed > 0.5` - Strong effects
- `normalizedSpeed > 0.8` - Maximum intensity

## CSS Critical Rules

```css
/* Lenis overrides */
html {
  scroll-behavior: auto !important;
}
html.lenis,
html.lenis body {
  height: auto;
}

/* Prevent selection during scroll play */
body {
  user-select: none;
}
```

## Dev Commands

```bash
cd /Users/travisbonnet/code/CODE/creative-lab
npm run dev      # Start on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Key Files to Read First

1. `src/contexts/ScrollVelocityContext.tsx` - Core scroll physics engine
2. `src/components/sectors/SectorAperture.tsx` - Pinned scrollytelling example
3. `src/components/sectors/SectorLattice.tsx` - GSAP Flip + velocity reactivity
4. `src/components/sectors/SectorVelocity.tsx` - Velocity-based transforms
5. `src/app/globals.css` - CSS variables and Lenis overrides

## Rules for This Project

1. **Motion:** GSAP for orchestration, Lenis handles scroll physics via context
2. **Performance:** GPU-optimized transforms/opacity only, no layout thrashing
3. **Structure:** Client components for interactivity, layouts as server components
4. **Aesthetic:** "High-end particle physics lab" - clinical, dark, precise
5. **Modularity:** Each sector is self-contained and demonstrates one technique
6. **Fun Factor:** Scrolling should feel like a game, not a commute
7. **Velocity Context:** Always use `useScrollVelocity()` for scroll-reactive effects

## Sector Depths

- Sector 0 (Event Horizon): Surface
- Sector 1 (Aperture): -100m
- Sector 2 (Lattice): -200m
