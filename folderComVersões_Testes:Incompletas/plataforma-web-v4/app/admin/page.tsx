'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getAllCourses, deleteCourse, updateCourse } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course } from '@/types'

const ICON_MAP: Record<string, string> = {
  'Saúde': '🏥', 'Gestão': '📊', 'Tecnologia': '💻', 'Direito': '⚖️',
  'Educação': '📚', 'Finanças': '💰', 'Comunicação': '📢', 'Meio Ambiente': '🌿',
}
function getIcon(cat: string) { return ICON_MAP[cat] ?? '📋' }

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!loading && user?.role !== 'admin') { router.replace('/catalog'); return }
    if (!user) return
    getAllCourses().then(setCourses).finally(() => setFetching(false))
  }, [user, loading, router])

  async function handleDelete(id: string) {
    if (!confirm('Deletar este curso?')) return
    await deleteCourse(id)
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleToggle(course: Course) {
    await updateCourse(course.id, { published: !course.published })
    setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, published: !c.published } : c))
  }

  if (loading || !user) return null

  const published = courses.filter((c) => c.published).length

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Administração</h1>
            <p className="page-sub">Gerencie cursos e conteúdos da plataforma</p>
          </div>
          <Link href="/admin/courses/new">
            <button className="btn btn-primary">+ Novo curso</button>
          </Link>
        </div>

        <div className="metrics-row" style={{ marginBottom: 24 }}>
          <div className="metric-card">
            <div className="value">{courses.length}</div>
            <div className="label">Total de cursos</div>
          </div>
          <div className="metric-card">
            <div className="value">{published}</div>
            <div className="label">Publicados</div>
          </div>
          <div className="metric-card">
            <div className="value">{courses.length - published}</div>
            <div className="label">Rascunhos</div>
          </div>
          <div className="metric-card">
            <div className="value">{Array.from(new Set(courses.map((c) => c.category))).length}</div>
            <div className="label">Categorias</div>
          </div>
        </div>

        {fetching ? (
          <div className="loader">Carregando cursos…</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32 }}>📚</div>
            <p>Nenhum curso cadastrado. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="stack">
            {courses.map((c) => (
              <div className="course-row" key={c.id}>
                <div className="course-row-icon">{getIcon(c.category)}</div>
                <div className="course-row-info">
                  <p className="course-row-title">{c.title}</p>
                  <p className="course-row-sub">{c.category || 'Sem categoria'} · {c.num_questions} questões</p>
                </div>
                <span className={`status-pill ${c.published ? 'published' : 'draft'}`}>
                  {c.published ? 'Publicado' : 'Rascunho'}
                </span>
                <div className="course-row-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => handleToggle(c)}>
                    {c.published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <Link href={`/admin/courses/${c.id}`}>
                    <button className="btn btn-sm btn-secondary">Editar</button>
                  </Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
