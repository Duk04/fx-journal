import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from './lib/session'

// Middleware runs in the Edge runtime — only check cookie presence here.
// Full HMAC verification happens in API routes via cookies() (Node.js).
const PUBLIC = ['/login', '/api/auth/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  if (!request.cookies.has(SESSION_COOKIE)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
