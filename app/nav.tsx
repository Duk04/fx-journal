'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/trades', label: 'Trades' },
  { href: '/journal', label: 'Journal' },
  { href: '/stats', label: 'Stats' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <nav style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(10,14,26,0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            FX Journal
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {links.map(({ href, label }) => {
            const active = href === '/' ? path === '/' : path.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: active ? '#60a5fa' : 'rgba(226,232,240,0.6)',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            )
          })}
        </div>
        <Link href="/trades/new" style={{
          padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600,
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}>
          + New Trade
        </Link>
      </div>
    </nav>
  )
}
