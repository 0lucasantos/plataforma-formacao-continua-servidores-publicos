import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import { listProgress, upsertProgress } from '../lib/store'

const router = Router()

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json(listProgress(req.user!.userId))
})

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { moduleId, quizScore } = req.body
  upsertProgress(req.user!.userId, moduleId, quizScore ?? null)
  return res.json({ ok: true })
})

export default router
