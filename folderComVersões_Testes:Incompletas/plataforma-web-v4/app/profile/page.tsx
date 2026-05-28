'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getUserBadges, getCourses, getQuizHistory } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Badge, Course, QuizAttempt } from '@/types'

const SEAL_ICONS: Record<string, string> = {
  complete: '🏆',
  progress: '🎖️',
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [history, setHistory] = useState<QuizAttempt[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    Promise.all([getUserBadges(), getCourses(), getQuizHistory()])
      .then(([b, c, h]) => { setBadges(b); setCourses(c); setHistory(h) })
      .finally(() => setFetching(false))
  }, [user, loading, router])

  const courseMap = new Map(courses.map((c) => [c.id, c]))
  const complete = badges.filter((b) => b.type === 'complete')
  const inProgress = badges.filter((b) => b.type === 'progress')
  const capibas = complete.length * 100 + inProgress.length * 50

  if (loading || !user) return null

  return (
    <>
      <Navbar />
      <div className="page-narrow">
        <div className="profile-hero">
          <div className="profile-avatar">
            {user.name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
          </div>
          <div className="profile-name">{user.name ?? 'Servidor'}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-sub">{user.secretaria}</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{capibas}</div>
            <div className="stat-label">🦔 Capibas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--ok)' }}>{complete.length}</div>
            <div className="stat-label">Cursos concluídos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warn)' }}>{history.length}</div>
            <div className="stat-label">Quizzes feitos</div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Selos conquistados</h2>
          {fetching ? (
            <div className="loader">Carregando…</div>
          ) : badges.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '20px 0' }}>
              <p>Faça quizzes para conquistar selos!</p>
            </div>
          ) : (
            <div className="seals-grid">
              {badges.map((b) => {
                const course = courseMap.get(b.course_id)
                return (
                  <div className="seal-item" key={b.id}>
                    <div className={`seal-circle ${b.type}`}>
                      {SEAL_ICONS[b.type]}
                      {b.type === 'complete' && <div className="seal-crown">👑</div>}
                    </div>
                    <span className="seal-name">{course?.title ?? 'Curso'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Histórico de quizzes</h2>
            <div className="stack">
              {history.slice(0, 8).map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{courseMap.get(a.course_id)?.title ?? 'Curso'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(a.taken_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span style={{
                    fontWeight: 700, fontSize: 15,
                    color: (a.score ?? 0) >= (a.total ?? 1) * 0.8 ? 'var(--ok)' : 'var(--warn)'
                  }}>
                    {a.score}/{a.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
