# Creative Lab

HIGGS-BOSON: a vertical "particle collider" sandbox where the scrollbar controls depth and time. Descend through six experimental sectors that react to scroll velocity with physics-driven animations, 3D artifacts, an isotope conveyor, and a shader gallery.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black)](https://threejs.org)

![creative-lab](https://assets.travisbreaks.com/github/creative-lab.png)

## Tech Stack

Next.js 16, React 19, GSAP (ScrollTrigger), Lenis, React Three Fiber, Tailwind CSS

## Features

- **Scroll-velocity physics engine**: a shared context exposes real-time scroll speed, direction, and smoothed velocity to all components via a custom `useScrollVelocity()` hook
- **Sector 0 (The Emitter)**: surface entry hero with a particle sphere
- **Sector 1 (The Velocity)**: 20 experiment log entries with spaghettification: text skews and stretches in real-time as scroll speed increases, snapping back to clarity on stop
- **Sector 2 (The Aperture)**: pinned scrollytelling section with an iris breach animation and a spinning R3F 3D artifact at center
- **Sector 3 (The Lattice)**: horizontal isotope conveyor, pinned and scrubbed by scroll (GSAP ScrollTrigger), with physics
- **Sector 4 (The Void)**: fly-through typography gateway
- **Sector 5 (The Singularity)**: liquid shader gallery and terminal
- **Glass containment UI**: frosted section wrappers with accent color borders, monospace typography, and clinical lab aesthetic

The sector list follows `src/app/page.tsx`; the components' own on-screen labels lag behind it in places.

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build
```

---

Part of the [travisBREAKS](https://travisbreaks.org) portfolio.
