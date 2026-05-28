'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getUserBadges, getCourses, getQuizHistory } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Badge, Course, QuizAttempt } from '@/types'

const COURSE_ICONS: Record<string, string> = {
  Design: '🎨', Código: '⚡', Negócios: '💼', Dados: '📊',
  IA: '🤖', Gestão: '📋', Tecnologia: '💻', Saúde: '🏥', Direito: '⚖️',
}
function getCourseIcon(category: string) { return COURSE_ICONS[category] ?? '📚' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [history, setHistory] = useState<QuizAttempt[]>([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([getUserBadges(), getCourses(), getQuizHistory()]).then(([b, c, h]) => {
      setBadges(b)
      setCourses(c)
      setHistory(h)
    })
  }, [user])

  if (loading || !user) return null

  const completeBadges = badges.filter((b) => b.type === 'complete')
  const progressBadges = badges.filter((b) => b.type === 'progress')
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  const badgesWithCourse = badges.map((badge) => {
    const course = courseMap.get(badge.course_id)
    return { badge, course }
  })

  const courseHistory = courses
    .map((course) => ({ course, attempts: history.filter((a) => a.course_id === course.id) }))
    .filter((item) => item.attempts.length > 0)

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="main">
        <div className="profile-screen">
          <div className="profile-header-modern">
            <div className="profile-header-title">Meu Perfil</div>
          </div>

          <div className="profile-hero">
            <div className="avatar-large">{initials}</div>
            <div className="profile-name">{user.name ?? user.email.split('@')[0]}</div>
            <div className="profile-email">{user.email}</div>
            {user.secretaria && <div className="profile-sub">{user.secretaria}</div>}
            {user.matricula && <div className="profile-sub">Matrícula: {user.matricula}</div>}
          </div>

          <div className="stats-row">
            <div className="stat-chip">
              <div className="stat-num" style={{ color: 'var(--ok)' }}>{completeBadges.length}</div>
              <div className="stat-lbl">Selos ★</div>
            </div>
            <div className="stat-chip">
              <div className="stat-num" style={{ color: 'var(--warn)' }}>{progressBadges.length}</div>
              <div className="stat-lbl">Progresso ◑</div>
            </div>
            <div className="stat-chip">
              <div className="stat-num" style={{ color: 'var(--primary)' }}>{history.length}</div>
              <div className="stat-lbl">Quizzes</div>
            </div>
          </div>

          <div className="seals-section">
            <div className="seals-title">Coleção de selos</div>
            <div className="seals-grid">
              {badgesWithCourse.length ? badgesWithCourse.map(({ badge, course }) => (
                <div key={badge.id} className="seal">
                  <div className={`seal-icon ${badge.type === 'complete' ? 'seal-gold' : 'seal-prog'}`}>
                    {getCourseIcon(course?.category ?? '')}
                    {badge.type === 'complete' && <div className="seal-crown">★</div>}
                  </div>
                  <div className="seal-name">{course?.title ?? 'Curso'}</div>
                </div>
              )) : (
                <div className="empty">Nenhum selo conquistado ainda.</div>
              )}
            </div>
          </div>

          {courseHistory.length > 0 && (
            <div className="panel">
              <div className="section-title" style={{ marginBottom: 16 }}>
                <h2>Histórico por curso</h2>
              </div>
              <div className="stack">
                {courseHistory.map(({ course, attempts }) => (
                  <article key={course.id} className="post-card">
                    <h3>{course.title}</h3>
                    {attempts.slice(0, 5).map((a) => (
                      <p key={a.id} style={{ fontSize: 13, margin: '4px 0' }}>
                        {formatDate(a.taken_at)} — {a.score}/{a.total}{' '}
                        ({a.total ? Math.round((a.score! / a.total) * 100) : 0}%)
                        {a.badge_type === 'complete' && ' 🏅'}
                        {a.badge_type === 'progress' && ' ⭐'}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
