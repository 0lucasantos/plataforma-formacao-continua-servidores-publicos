import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import {
  findCourse,
  findTodayAttempt,
  createQuizAttempt,
  completeQuizAttempt,
  upsertBadge,
} from '../lib/store'
import { generateQuizQuestions } from '../lib/gemini'
import type { BadgeType } from '../../types'

const router = Router()

router.get('/:courseId', requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = String(req.params['courseId'])
  const course = findCourse(courseId)
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

  const existing = findTodayAttempt(req.user!.userId, courseId)

  if (existing?.completed) return res.json({ taken_today: true, attempt: existing })
  if (existing) return res.json({ taken_today: false, attempt: existing, questions: existing.questions })

  try {
    const questions = await generateQuizQuestions(
      course.title,
      course.description,
      course.num_questions ?? 5
    )
    const attempt = createQuizAttempt(req.user!.userId, courseId, questions)

    return res.json({ taken_today: false, attempt, questions })
  } catch (error) {
    console.error('Erro ao gerar perguntas:', error)
    return res.status(500).json({ error: 'Erro ao gerar perguntas do quiz' })
  }
})

router.post('/:courseId', requireAuth, (req: AuthRequest, res: Response) => {
  const courseId = String(req.params['courseId'])
  const course = findCourse(courseId)
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

  const attempt = findTodayAttempt(req.user!.userId, courseId)
  if (!attempt) return res.status(400).json({ error: 'Quiz não iniciado' })
  if (attempt.completed) return res.status(409).json({ error: 'Quiz já realizado hoje' })

  const { answers } = req.body as { answers: number[] }
  const total = attempt.questions.length
  const score = attempt.questions.filter((q, i) => q.correct_index === answers[i]).length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const thresholdComplete = course.threshold_complete ?? 80
  const thresholdProgress = course.threshold_progress ?? 50

  let badge_type: BadgeType | 'none' = 'none'
  if (pct >= thresholdComplete) badge_type = 'complete'
  else if (pct >= thresholdProgress) badge_type = 'progress'

  completeQuizAttempt(attempt.id, answers, score, total, badge_type)
  if (badge_type !== 'none') upsertBadge(req.user!.userId, courseId, badge_type)

  return res.json({ score, total, pct, badge_type, questions: attempt.questions, answers })
})

export default router
