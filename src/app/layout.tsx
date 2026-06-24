import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Splash } from '@/components/Splash'

export const metadata: Metadata = {
  title: 'Presence BMU',
  description: 'Sistem presensi karyawan PT Brawijaya Multi Usaha',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Presence BMU' }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0c2444'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <Splash />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
