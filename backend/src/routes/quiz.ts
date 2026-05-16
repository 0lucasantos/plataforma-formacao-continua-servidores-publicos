import { Router, Response } from 'express'
import { randomUUID } from 'crypto'
import { requireAuth, AuthRequest } from '../lib/auth'
import {
  findCourse,
  findTodayAttempt,
  createQuizAttempt,
  completeQuizAttempt,
  upsertBadge,
} from '../lib/store'
import type { GeneratedQuestion, BadgeType } from '../../types'

const router = Router()

// Placeholder — substituir pela integração com Gemini API
function generatePlaceholderQuestions(courseTitle: string, numQuestions: number): GeneratedQuestion[] {
  const base: GeneratedQuestion[] = [
    {
      id: randomUUID(),
      text: `Qual é o principal objetivo do curso "${courseTitle}"?`,
      options: [
        'Desenvolver habilidades relacionadas ao tema do curso',
        'Apenas cumprir requisitos burocráticos',
        'Substituir treinamentos presenciais sem agregar valor',
        'Nenhuma das alternativas',
      ],
      correct_index: 0,
    },
    {
      id: randomUUID(),
      text: `No contexto do curso "${courseTitle}", qual postura é mais adequada?`,
      options: [
        'Aprendizado passivo, apenas lendo o conteúdo',
        'Aprendizado ativo, aplicando o conhecimento na prática',
        'Ignorar o conteúdo e finalizar rapidamente',
        'Copiar respostas de colegas',
      ],
      correct_index: 1,
    },
    {
      id: randomUUID(),
      text: `Como o conhecimento adquirido em "${courseTitle}" beneficia o serviço público?`,
      options: [
        'Não gera benefício direto',
        'Melhora a qualidade do atendimento ao cidadão',
        'Apenas satisfaz exigências da chefia',
        'Serve apenas para promoção funcional',
      ],
      correct_index: 1,
    },
    {
      id: randomUUID(),
      text: `Qual é a melhor forma de aplicar o que foi aprendido em "${courseTitle}"?`,
      options: [
        'Guardar o conhecimento para si mesmo',
        'Compartilhar e aplicar no dia a dia de trabalho',
        'Esperar ordens superiores para aplicar',
        'Aplicar apenas em situações emergenciais',
      ],
      correct_index: 1,
    },
    {
      id: randomUUID(),
      text: `Por que a formação contínua, como o curso "${courseTitle}", é importante?`,
      options: [
        'Não é importante para servidores públicos',
        'Mantém os profissionais atualizados e melhora a qualidade dos serviços',
        'É obrigatória apenas para novos servidores',
        'Serve somente para aumentar salário',
      ],
      correct_index: 1,
    },
    {
      id: randomUUID(),
      text: `Qual atitude demonstra comprometimento com os temas abordados em "${courseTitle}"?`,
      options: [
        'Finalizar o quiz sem estudar',
        'Buscar aprofundamento nos recursos indicados',
        'Delegar o aprendizado a colegas',
        'Ignorar o bulletin board do curso',
      ],
      correct_index: 1,
    },
    {
      id: randomUUID(),
      text: `Sobre a aplicação prática de "${courseTitle}" no trabalho, é correto afirmar:`,
      options: [
        'O conhecimento deve ficar restrito à plataforma',
        'Deve ser integrado às rotinas e processos da secretaria',
        'Só deve ser usado em projetos especiais',
        'Não há como aplicar no cotidiano',
      ],
      correct_index: 1,
    },
  ]

  const shuffled = [...base].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(numQuestions, shuffled.length))
}

router.get('/:courseId', requireAuth, (req: AuthRequest, res: Response) => {
  const courseId = String(req.params['courseId'])
  const course = findCourse(courseId)
  if (!course) return res.status(404).json({ error: 'Curso não encontrado' })

  const existing = findTodayAttempt(req.user!.userId, courseId)

  if (existing?.completed) return res.json({ taken_today: true, attempt: existing })
  if (existing) return res.json({ taken_today: false, attempt: existing, questions: existing.questions })

  const questions = generatePlaceholderQuestions(course.title, course.num_questions ?? 5)
  const attempt = createQuizAttempt(req.user!.userId, courseId, questions)

  return res.json({ taken_today: false, attempt, questions })
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
