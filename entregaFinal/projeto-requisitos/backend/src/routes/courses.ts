import { Router, Response } from 'express'
import { requireAuth, requireAdmin, AuthRequest } from '../lib/auth'
import { listCourses, findCourse, insertCourse, patchCourse, removeCourse } from '../lib/store'
import type { CoursePhase, Course } from '../../types'

const router = Router()

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const all = req.user?.role === 'admin'
  return res.json(listCourses(all))
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, category, phases } = req.body as {
    title: string
    description: string
    category?: string
    phases?: CoursePhase[]
  }
  return res.status(201).json(insertCourse(title, description, category, phases))
})

router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const course = findCourse(String(req.params.id))
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })
  return res.json(course)
})

router.patch('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, category, published, phases } = req.body as {
    title?: string
    description?: string
    category?: string
    published?: boolean
    phases?: CoursePhase[]
  }
  const fields: Partial<Pick<Course, 'title' | 'description' | 'category' | 'published' | 'phases'>> = {}
  if (title !== undefined) fields.title = title
  if (description !== undefined) fields.description = description
  if (category !== undefined) fields.category = category
  if (published !== undefined) fields.published = published
  if (phases !== undefined) fields.phases = phases
  patchCourse(String(req.params.id), fields)
  return res.json({ ok: true })
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  removeCourse(String(req.params.id))
  return res.json({ ok: true })
})

export default router