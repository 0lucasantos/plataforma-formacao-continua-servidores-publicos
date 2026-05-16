import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from './token'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) { res.status(401).json({ error: 'Não autorizado' }); return }
  const payload = verifyToken(token)
  if (!payload) { res.status(401).json({ error: 'Token inválido ou expirado' }); return }
  req.user = payload
  next()
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') { res.status(403).json({ error: 'Apenas administradores' }); return }
    next()
  })
}
