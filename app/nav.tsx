'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, BookOpen, BarChart2, Plus, Calculator, LogOut } from 'lucide-react'

const links = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/trades',    label: 'Trades',     icon: TrendingUp },
  { href: '/journal',   label: 'Journal',    icon: BookOpen },
  { href: '/stats',     label: 'Stats',      icon: BarChart2 },
  { href: '/lot-size',  label: 'Lot Calc',   icon: Calculator },
]

export default function NavBar({ username }: { username: string }) {
  const path = usePathname()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(7,9,15,0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
      }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #00c4ee, #0ea5c9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0,196,238,0.4)',
            flexShrink: 0,
          }}>
            <TrendingUp size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em',
            color: '#e2eaf2',
          }}>
            FX Journal
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.125rem' }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? path === '/' : path.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '0.38rem 0.8rem',
                borderRadius: 7,
                fontSize: '0.8rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: active ? 'rgba(0,196,238,0.1)' : 'transparent',
                color: active ? '#00c4ee' : 'rgba(196,210,224,0.55)',
                border: active ? '1px solid rgba(0,196,238,0.2)' : '1px solid transparent',
              }}>
                <Icon size={13} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Username */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '0.28rem 0.65rem',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c4ee, #0ea5c9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 800, color: '#fff',
              flexShrink: 0, boxShadow: '0 0 8px rgba(0,196,238,0.3)',
            }}>
              {username[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(196,210,224,0.7)' }}>{username}</span>
          </div>

          <Link href="/trades/new" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.38rem 0.85rem' }}>
            <Plus size={13} strokeWidth={2.5} />
            New Trade
          </Link>

          <button onClick={logout} className="btn btn-ghost" style={{ padding: '0.38rem 0.55rem', border: '1px solid rgba(255,255,255,0.08)' }} title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </nav>
  )
}
