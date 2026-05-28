'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuizStatus } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'

export default function CourseRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    getQuizStatus(id)
      .then((status) => {
        if (status.taken_today) router.replace(`/learn/${id}`)
        else router.replace(`/quiz/${id}`)
      })
      .catch(() => router.replace(`/quiz/${id}`))
  }, [id, user, loading])

  return null
}
