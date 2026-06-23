'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuizStatus } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'

// GET /api/quiz/:courseId pode retornar:
//   { course_completed: true }                      → redireciona para /learn
//   { taken_today: true, passed: true }             → redireciona para /learn
//   { taken_today: true, passed: false }            → redireciona para /quiz (bloqueio diário)
//   { taken_today: false, attempt, questions, ... } → redireciona para /quiz (perguntas)
//   HTTP 403 com cooldown_days_remaining            → redireciona para /quiz (cooldown)

export default function CourseRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return

    getQuizStatus(id)
      .then((status) => {
        // Curso 100% concluído ou já passou no quiz de hoje → tela de conteúdo
        if (status.course_completed) { router.replace(`/learn/${id}`); return }
        if (status.taken_today && status.passed) { router.replace(`/learn/${id}`); return }
        // Qualquer outro estado (bloqueio diário, cooldown, quiz aberto) → tela do quiz
        router.replace(`/quiz/${id}`)
      })
      .catch(() => router.replace(`/quiz/${id}`))
  }, [id, user, loading])

  return null
}
