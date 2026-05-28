import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret'

export interface TokenPayload {
  userId: string
  email: string
  role: 'servidor' | 'admin'
  exp: number
}

export function createToken(payload: Omit<TokenPayload, 'exp'>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, sig] = token.split('.')
    const expected = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
    if (!timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) return null
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
