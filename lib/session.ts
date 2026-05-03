export const SESSION_COOKIE = 'fx_session'
const SECRET = process.env.SESSION_SECRET ?? 'fx-journal-dev-secret-change-in-prod'

export interface SessionPayload {
  u: number   // userId
  n: string   // username
  e: number   // expiry ms
}

async function getKey() {
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const data = JSON.stringify(payload)
  const key = await getKey()
  const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
  return btoa(data) + '.' + sig
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const b64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const data = atob(b64)
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0))
    const key = await getKey()
    const valid = await globalThis.crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const payload: SessionPayload = JSON.parse(data)
    if (Date.now() > payload.e) return null
    return payload
  } catch {
    return null
  }
}
