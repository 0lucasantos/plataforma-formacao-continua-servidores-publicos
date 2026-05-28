import { Router, Response } from 'express'
import { requireAuth, requireAdmin, AuthRequest } from '../lib/auth'
import { findCourse, insertModule, findModule, removeModule } from '../lib/store'

const router = Router({ mergeParams: true })

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, content, order, questions } = req.body
  const mod = insertModule(String(req.params['courseId']), { title, content, order, questions: questions ?? [] })
  return res.status(201).json(mod)
})

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const course = findCourse(String(req.params['courseId']))
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })
  return res.json(course.modules ?? [])
})

export { router as modulesRouter }

export function moduleRoutes() {
  const r = Router()

  r.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const mod = findModule(String(req.params['id']))
    if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' })
    return res.json(mod)
  })

  r.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    removeModule(String(req.params['id']))
    return res.json({ ok: true })
  })

  return r
}
