import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import NavBar from './nav'
import { getSession } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'FX Journal',
  description: 'AI-powered forex trading journal',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="en">
      <body style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Providers>
          {session && <NavBar username={session.n} />}
          <main style={{ maxWidth: session ? 1200 : '100%', margin: '0 auto', padding: session ? '2rem 1.5rem' : '0' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
