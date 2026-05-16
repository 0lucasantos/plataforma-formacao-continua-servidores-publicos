import { Router, Request, Response } from 'express'
import { createToken, verifyToken } from '../lib/token'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return res.json({ token: createToken({ userId: 'admin', email, role: 'admin' }) })
  }

  if (email === process.env.DEMO_EMAIL && password === process.env.DEMO_PASSWORD) {
    return res.json({ token: createToken({ userId: 'demo', email, role: 'servidor' }) })
  }

  return res.status(401).json({ error: 'Credenciais inválidas' })
})

router.get('/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token inválido' })

  return res.json({
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    secretaria: '',
    created_at: new Date().toISOString(),
  })
})

export default router
