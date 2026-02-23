import Oscilloscope from '@/components/Oscilloscope'
import SectorAperture from '@/components/sectors/SectorAperture'
import SectorEmitter from '@/components/sectors/SectorEmitter'
import SectorLattice from '@/components/sectors/SectorLattice'
import SectorSingularity from '@/components/sectors/SectorSingularity'
import SectorVelocity from '@/components/sectors/SectorVelocity'
import SectorVoid from '@/components/sectors/SectorVoid'

export default function Home() {
  return (
    <main>
      {/* Oscilloscope - living waveform feedback */}
      <Oscilloscope />

      {/* Sector 0: The Emitter - Surface/Entry hero with particle sphere */}
      <SectorEmitter />

      {/* Sector 1: The Velocity - Experiment logs that react to scroll speed */}
      <SectorVelocity />

      {/* Sector 2: The Aperture - Pinned scrollytelling iris breach */}
      <SectorAperture />

      {/* Sector 3: The Lattice - Horizontal isotope conveyor with physics */}
      <SectorLattice />

      {/* Sector 4: The Void - Fly-through typography gateway */}
      <SectorVoid />

      {/* Sector 5: The Singularity - Liquid shader gallery + terminal */}
      <SectorSingularity />
    </main>
  )
}
