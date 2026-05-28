'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CourseCard from '@/components/CourseCard'
import { getCoursesWithBadge } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { CourseWithBadge } from '@/types'

const ALL = 'Todos'

export default function CatalogPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithBadge[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getCoursesWithBadge()
      .then((all) => setCourses(all.filter((c) => c.published)))
      .finally(() => setFetching(false))
  }, [user])

  const categories = [ALL, ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))]

  const visible = courses.filter((c) => {
    const matchesCat = activeCategory === ALL || c.category === activeCategory
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const done = courses.filter((c) => c.badge?.type === 'complete').length
  const inProgress = courses.filter((c) => c.badge?.type === 'progress').length
  const available = courses.length

  if (loading || !user) return null

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header" style={{ flexDirection: 'column', gap: 6 }}>
          <h1 className="page-title">Olá, {user.name?.split(' ')[0] ?? 'servidor'} 👋</h1>
          <p className="page-sub">Continue sua jornada de aprendizado</p>
        </div>

        <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <div className="metric-card">
            <div className="value">{available}</div>
            <div className="label">Cursos disponíveis</div>
          </div>
          <div className="metric-card">
            <div className="value">{done}</div>
            <div className="label">Concluídos</div>
          </div>
          <div className="metric-card">
            <div className="value">{inProgress}</div>
            <div className="label">Em andamento</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar cursos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chips-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {fetching ? (
          <div className="loader">Carregando cursos…</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32 }}>🔍</div>
            <p>Nenhum curso encontrado.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {visible.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </>
  )
}
