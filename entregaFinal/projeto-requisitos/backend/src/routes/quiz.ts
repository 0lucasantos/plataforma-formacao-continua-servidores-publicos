import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import {
  findCourse,
  findAttemptByDateAndPhase,
  createQuizAttempt,
  completeQuizAttempt,
  listCompletedAttemptsByCourse,
  upsertBadge,
  resolveToday,
} from '../lib/store'
import { generateQuizQuestions } from '../lib/gemini'
import type { BadgeType } from '../../types'

const router = Router()

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay)
}

router.get('/:courseId', requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = String(req.params.courseId)
  const simulatedDate = req.headers['x-simulated-date']
  const today = resolveToday(Array.isArray(simulatedDate) ? simulatedDate[0] : simulatedDate)

  try {
    const course = findCourse(courseId)
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

    const phases = course.phases ?? []
    if (phases.length === 0) {
      return res.status(422).json({
        error: 'Este curso não possui fases configuradas. Edite o curso no painel admin e adicione pelo menos uma fase.',
        course,
      })
    }

    const completedAttempts = listCompletedAttemptsByCourse(req.user!.userId, courseId)
    const passedPhaseIndices = new Set<number>()

    for (const attempt of completedAttempts) {
      const phase = phases[attempt.phase_index]
      if (phase && typeof attempt.pct === 'number' && attempt.pct >= phase.threshold) {
        passedPhaseIndices.add(attempt.phase_index)
      }
    }

    let currentPhaseIndex = 0
    for (let i = 0; i < phases.length; i++) {
      if (!passedPhaseIndices.has(i)) {
        currentPhaseIndex = i
        break
      }

      if (i === phases.length - 1) {
        return res.status(200).json({
          course,
          course_completed: true,
          taken_today: true,
          passed: true,
          message: 'Parabéns! Você concluiu todas as fases deste curso.',
        })
      }
    }

    const currentPhase = phases[currentPhaseIndex]

    const todayAttempt = findAttemptByDateAndPhase(
      req.user!.userId,
      courseId,
      currentPhaseIndex,
      today
    )

    if (todayAttempt?.completed) {
      const attemptPct = todayAttempt.pct ?? 0
      const passed = attemptPct >= currentPhase.threshold

      if (passed) {
        const nextPhaseIndex = currentPhaseIndex + 1
        const nextPhase = phases[nextPhaseIndex] ?? null
        const elapsed = daysBetween(todayAttempt.date, today)
        const daysUntilUnlock = nextPhase
          ? Math.max(0, currentPhase.cooldown_days - elapsed)
          : null

        return res.status(200).json({
          course,
          taken_today: true,
          passed: true,
          attempt: todayAttempt,
          phase_index: currentPhaseIndex,
          phase: currentPhase,
          next_phase_index: nextPhaseIndex < phases.length ? nextPhaseIndex : null,
          days_until_next_phase: daysUntilUnlock,
        })
      }

      return res.status(403).json({
        error: 'Você já realizou o quiz desta fase hoje e não atingiu a nota mínima. Tente novamente amanhã.',
        course,
        taken_today: true,
        passed: false,
        retry_after: 'tomorrow',
      })
    }

    if (todayAttempt && !todayAttempt.completed) {
      return res.json({
        course,
        taken_today: false,
        attempt: todayAttempt,
        questions: todayAttempt.questions,
        phase_index: currentPhaseIndex,
        phase: currentPhase,
      })
    }

    if (currentPhaseIndex > 0) {
      const prevPhaseIndex = currentPhaseIndex - 1
      const prevPhase = phases[prevPhaseIndex]

      const lastPassedAttempt = completedAttempts.find((a) => {
        const phase = phases[a.phase_index]
        return (
          a.phase_index === prevPhaseIndex &&
          phase &&
          typeof a.pct === 'number' &&
          a.pct >= phase.threshold
        )
      })

      if (lastPassedAttempt) {
        const passedDate = lastPassedAttempt.date
        const elapsed = daysBetween(passedDate, today)
        const required = prevPhase.cooldown_days

        if (elapsed < required) {
          const daysRemaining = required - elapsed
          const unlockDate = new Date(passedDate)
          unlockDate.setDate(unlockDate.getDate() + required)

          return res.status(403).json({
            error: `Você precisa aguardar ${daysRemaining} dia(s) para desbloquear a próxima fase.`,
            course,
            cooldown_days_remaining: daysRemaining,
            unlocks_on: unlockDate.toISOString().slice(0, 10),
            next_phase_difficulty: currentPhase.difficulty,
          })
        }
      }
    }

    console.log(`[Quiz] Gerando questões para ${courseId} (fase ${currentPhaseIndex}, ${currentPhase.difficulty})`)

    const questions = await generateQuizQuestions(
      course.title,
      course.description,
      currentPhase.num_questions,
      currentPhase.difficulty
    )

    // Proteção contra chamada duplicada em dev/React StrictMode:
    // se outra requisição criou a tentativa enquanto o Gemini respondia, reutiliza a existente.
    const existingAttempt = findAttemptByDateAndPhase(
      req.user!.userId,
      courseId,
      currentPhaseIndex,
      today
    )

    if (existingAttempt && !existingAttempt.completed) {
      return res.json({
        course,
        taken_today: false,
        attempt: existingAttempt,
        questions: existingAttempt.questions,
        phase_index: currentPhaseIndex,
        phase: currentPhase,
      })
    }

    const attempt = createQuizAttempt(
      req.user!.userId,
      courseId,
      currentPhaseIndex,
      questions,
      today
    )

    console.log(`[Quiz] ✓ Questões geradas: ${questions.length} questões`)

    return res.json({
      course,
      taken_today: false,
      attempt,
      questions,
      phase_index: currentPhaseIndex,
      phase: currentPhase,
    })
  } catch (error) {
    console.error(`[Quiz] Erro ao processar GET ${courseId}:`, error instanceof Error ? error.message : String(error))
    return res.status(500).json({
      error: 'Erro ao processar quiz. Tente novamente mais tarde.',
      details: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : String(error))
        : undefined,
    })
  }
})

router.post('/:courseId', requireAuth, (req: AuthRequest, res: Response) => {
  const courseId = String(req.params.courseId)

  try {
    const simulatedDate = req.headers['x-simulated-date']
    const today = resolveToday(Array.isArray(simulatedDate) ? simulatedDate[0] : simulatedDate)

    const course = findCourse(courseId)
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

    const phases = course.phases ?? []
    if (phases.length === 0) {
      return res.status(422).json({
        error: 'Este curso não possui fases configuradas. Edite o curso no painel admin e adicione pelo menos uma fase.',
        course,
      })
    }

    const completedAttempts = listCompletedAttemptsByCourse(req.user!.userId, courseId)
    const passedPhaseIndices = new Set<number>()

    for (const attempt of completedAttempts) {
      const phase = phases[attempt.phase_index]
      if (phase && typeof attempt.pct === 'number' && attempt.pct >= phase.threshold) {
        passedPhaseIndices.add(attempt.phase_index)
      }
    }

    let currentPhaseIndex = 0
    for (let i = 0; i < phases.length; i++) {
      if (!passedPhaseIndices.has(i)) {
        currentPhaseIndex = i
        break
      }
    }

    const currentPhase = phases[currentPhaseIndex]

    const attempt = findAttemptByDateAndPhase(
      req.user!.userId,
      courseId,
      currentPhaseIndex,
      today
    )

    if (!attempt) {
      return res.status(400).json({ error: 'Quiz não iniciado. Inicie o quiz antes de enviar respostas.' })
    }

    if (attempt.completed) {
      return res.status(409).json({ error: 'Este quiz já foi respondido hoje.' })
    }

    const { answers } = req.body as { answers?: unknown }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Campo "answers" deve ser um array de números.' })
    }

    if (answers.length !== attempt.questions.length) {
      return res.status(400).json({
        error: `Número de respostas inválido. Esperado: ${attempt.questions.length}, recebido: ${answers.length}.`,
      })
    }

    if (!answers.every((a) => typeof a === 'number' && a >= 0 && a <= 3)) {
      return res.status(400).json({ error: 'Cada resposta deve ser um número entre 0 e 3.' })
    }

    const total = attempt.questions.length
    const score = attempt.questions.filter((q, i) => q.correct_index === answers[i]).length
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const passed = pct >= currentPhase.threshold

    let badge_type: BadgeType | 'none' = 'none'
    if (passed) {
      if (currentPhaseIndex === 0) badge_type = 'progress'
      if (currentPhaseIndex === phases.length - 1) badge_type = 'complete'
    }

    completeQuizAttempt(attempt.id, answers, score, total, pct, badge_type)

    if (badge_type !== 'none') {
      upsertBadge(req.user!.userId, courseId, badge_type)
    }

    console.log(`[Quiz] Resultado: ${score}/${total} (${pct}%) - Badge: ${badge_type}`)

    const nextPhaseIndex = passed ? currentPhaseIndex + 1 : currentPhaseIndex
    const nextPhase = phases[nextPhaseIndex] ?? null
    const unlockDate = passed && nextPhase
      ? (() => {
          const d = new Date(today)
          d.setDate(d.getDate() + currentPhase.cooldown_days)
          return d.toISOString().slice(0, 10)
        })()
      : null

    return res.json({
      score,
      total,
      pct,
      passed,
      badge_type,
      phase_index: currentPhaseIndex,
      phase: currentPhase,
      next_phase_index: nextPhase ? nextPhaseIndex : null,
      next_phase_unlocks_on: unlockDate,
      questions: attempt.questions,
      answers,
    })
  } catch (error) {
    console.error(`[Quiz] Erro ao processar POST ${courseId}:`, error instanceof Error ? error.message : String(error))
    return res.status(500).json({
      error: 'Erro ao processar resultado do quiz. Tente novamente mais tarde.',
      details: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : String(error))
        : undefined,
    })
  }
})

export default router
