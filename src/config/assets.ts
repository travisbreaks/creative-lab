// ============================================================================
// ASSET CONFIGURATION
// High-fidelity assets for production build
// ============================================================================

export const ASSETS = {
  // Sector 3: The Lattice - Isotope imagery
  isotopes: [
    '/assets/isotope-1.jpg',
    '/assets/isotope-2.jpg',
    '/assets/isotope-3.jpg',
    '/assets/isotope-4.jpg',
    '/assets/isotope-5.jpg',
  ],

  // Sector 5: The Singularity - Failed experiment textures
  failures: [
    '/assets/failure-1.jpg',
    '/assets/failure-2.jpg',
    '/assets/failure-3.jpg',
    '/assets/failure-4.jpg',
  ],
} as const

// Type exports for strict typing
export type IsotopeAsset = (typeof ASSETS.isotopes)[number]
export type FailureAsset = (typeof ASSETS.failures)[number]
