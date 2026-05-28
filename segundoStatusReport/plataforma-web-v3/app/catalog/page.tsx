'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CourseCard from '@/components/CourseCard'
import { getCoursesWithBadge, getUserBadges, getQuizHistory } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { CourseWithBadge } from '@/types'

export default function CatalogPage() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<CourseWithBadge[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [quizCount, setQuizCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getCoursesWithBadge().then(setCourses)
    getQuizHistory().then((h) => setQuizCount(h.length))
  }, [user])

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean))).sort()],
    [courses]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return courses.filter((c) => {
      const matchText = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      const matchCat = category === 'Todos' || c.category === category
      return matchText && matchCat
    })
  }, [courses, search, category])

  const completedCount = courses.filter((c) => c.badge?.type === 'complete').length
  const publishedCount = courses.filter((c) => c.published).length

  if (loading || !user) return null

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="main">
        <section className="courses-page">
          <div className="courses-top">
            <h1>Explorar</h1>
          </div>

          <div className="metrics">
            <div className="metric">
              <span>Cursos disponíveis</span>
              <strong>{courses.length}</strong>
            </div>
            <div className="metric">
              <span>Publicados</span>
              <strong>{publishedCount}</strong>
            </div>
            <div className="metric">
              <span>Quizzes feitos</span>
              <strong>{quizCount}</strong>
            </div>
            <div className="metric">
              <span>Concluídos</span>
              <strong>{completedCount}</strong>
            </div>
          </div>

          <div className="search-input">
            <span>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cursos..."
            />
          </div>

          <div className="categories-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>🔍</p>
              <p>Nenhum curso encontrado.</p>
              {(search || category !== 'Todos') && (
                <button
                  className="link-button"
                  style={{ marginTop: 12, display: 'block' }}
                  onClick={() => { setSearch(''); setCategory('Todos') }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="courses-grid">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
