import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import BootSequence from '@/components/systems/BootSequence'
import { AudioProvider } from '@/contexts/AudioContext'
import { ScrollVelocityProvider } from '@/contexts/ScrollVelocityContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'HIGGS-BOSON | Component Collider',
  description: 'A vertical laboratory for smashing code together',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}>
        <AudioProvider>
          <ScrollVelocityProvider>
            <BootSequence>{children}</BootSequence>
          </ScrollVelocityProvider>
        </AudioProvider>
      </body>
    </html>
  )
}
