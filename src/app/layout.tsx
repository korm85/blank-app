import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Boys For Goals',
  description: 'World Cup 2026 Betting — Oz, Boris, Vitali, Edi & Michael',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Boys For Goals',
    description: 'World Cup 2026 betting with the boys',
    type: 'website',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0F' },
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex flex-col min-h-dvh">
            <Header />
            <main className="flex-1 pb-24 pt-16">
              {children}
            </main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
