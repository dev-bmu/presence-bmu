import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Splash } from '@/components/Splash'

export const metadata: Metadata = {
  title: 'Presence BMU',
  description: 'Sistem presensi karyawan PT Brawijaya Multi Usaha',
  manifest: '/manifest.json',
  applicationName: 'Presence BMU',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Presence BMU' },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
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
