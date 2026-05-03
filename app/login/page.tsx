'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('Invalid username or password')
        return
      }
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
          }}>
            <TrendingUp size={26} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>FX Journal</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text" required autoFocus autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)}
              className="input" placeholder="trader1"
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{
              fontSize: '0.82rem', color: '#b91c1c', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 8, padding: '0.5rem 0.75rem', margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '0.65rem', fontSize: '0.9rem', marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            <LogIn size={15} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
}
