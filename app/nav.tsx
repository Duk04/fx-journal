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
      borderBottom: '1px solid #e2e8f0',
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}>FX</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Journal
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '0.125rem' }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? path === '/' : path.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#2563eb' : '#64748b',
                border: active ? '1px solid #bfdbfe' : '1px solid transparent',
              }}>
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Username badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.3rem 0.65rem', borderRadius: 8,
            background: '#f1f5f9', border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {username[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{username}</span>
          </div>

          <Link href="/trades/new" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}>
            <Plus size={14} strokeWidth={2.5} />
            New Trade
          </Link>

          <button onClick={logout} className="btn btn-ghost" style={{ padding: '0.4rem 0.55rem' }} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
