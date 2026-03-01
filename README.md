# Creative Lab

HIGGS-BOSON: a vertical "particle collider" sandbox where the scrollbar controls depth and time. Descend through experimental sectors that react to scroll velocity with physics-driven animations, 3D artifacts, and isotope grids.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://travisbreaks.org/research/creative-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black)](https://threejs.org)

![creative-lab](https://assets.travisbreaks.com/github/creative-lab.png)

## Tech Stack

Next.js 16, React 19, GSAP (ScrollTrigger, Flip, CustomEase), Lenis, React Three Fiber, Tailwind CSS

## Features

- **Scroll-velocity physics engine**: a shared context exposes real-time scroll speed, direction, and smoothed velocity to all components via a custom `useScrollVelocity()` hook
- **Sector 0 (Event Horizon)**: 20 experiment log entries with spaghettification: text skews and stretches in real-time as scroll speed increases, snapping back to clarity on stop
- **Sector 1 (Containment Iris)**: pinned scroll section with an iris breach animation and a spinning R3F 3D artifact at center
- **Sector 2 (Lattice)**: GSAP Flip-powered isotope grid that rearranges on interaction
- **Glass containment UI**: frosted section wrappers with accent color borders, monospace typography, and clinical lab aesthetic

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build
```

---

Part of the [travisBREAKS](https://travisbreaks.org) portfolio.


<!-- v1.0.1 -->
