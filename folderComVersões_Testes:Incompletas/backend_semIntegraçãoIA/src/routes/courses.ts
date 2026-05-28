import { Router, Response } from 'express'
import { requireAuth, requireAdmin, AuthRequest } from '../lib/auth'
import { listCourses, findCourse, insertCourse, patchCourse, removeCourse } from '../lib/store'

const router = Router()

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const all = req.user?.role === 'admin'
  return res.json(listCourses(all))
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, category, num_questions, threshold_complete, threshold_progress } = req.body
  return res.status(201).json(insertCourse(title, description, category, num_questions, threshold_complete, threshold_progress))
})

router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const course = findCourse(String(req.params.id))
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })
  return res.json(course)
})

router.patch('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  patchCourse(String(req.params.id), req.body)
  return res.json({ ok: true })
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  removeCourse(String(req.params.id))
  return res.json({ ok: true })
})

export default router
