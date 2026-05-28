import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import { listBadges } from '../lib/store'

const router = Router()

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json(listBadges(req.user!.userId))
})

export default router
