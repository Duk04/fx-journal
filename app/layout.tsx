import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import NavBar from './nav'

export const metadata: Metadata = {
  title: 'FX Journal',
  description: 'AI-powered forex trading journal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0e1a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Providers>
          <NavBar />
          <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
