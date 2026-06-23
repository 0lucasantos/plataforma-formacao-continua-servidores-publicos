'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getAllCourses, updateCourse, deleteCourse } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course } from '@/types'

const COURSE_ICONS: Record<string, string> = {
  Design: '🎨', Código: '⚡', Negócios: '💼', Dados: '📊',
  IA: '🤖', Gestão: '📋', Tecnologia: '💻', Saúde: '🏥', Direito: '⚖️',
}
function getCourseIcon(category: string) { return COURSE_ICONS[category] ?? '📚' }

// Chip discreto mostrando o número de fases do curso
function PhasesChip({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          background: 'rgba(239,68,68,.1)',
          color: '#b91c1c',
          whiteSpace: 'nowrap',
        }}
        title="Nenhuma fase configurada"
      >
        Sem fases
      </span>
    )
  }
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: 'rgba(0,129,244,.1)',
        color: 'var(--primary)',
        whiteSpace: 'nowrap',
      }}
      title={`${count} ${count === 1 ? 'fase configurada' : 'fases configuradas'}`}
    >
      {count} {count === 1 ? 'fase' : 'fases'}
    </span>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [notice, setNotice]   = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/catalog')
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') getAllCourses().then(setCourses)
  }, [user])

  async function handleToggle(course: Course) {
    try {
      await updateCourse(course.id, { published: !course.published })
      setCourses((prev) =>
        prev.map((c) => c.id === course.id ? { ...c, published: !c.published } : c)
      )
      setNotice(`Curso "${course.title}" ${!course.published ? 'publicado' : 'despublicado'}.`)
    } catch {
      setNotice('Erro ao atualizar curso.')
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir o curso "${title}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteCourse(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
      setNotice('Curso excluído.')
    } catch {
      setNotice('Erro ao excluir curso.')
    }
  }

  if (loading || !user || user.role !== 'admin') return null

  return (
    <div className="app-shell">
      <main className="main">
        <div className="admin-page">

          <div className="section-header">
            <div className="section-title">
              <h2>Painel Admin</h2>
              <p>Gerencie cursos, módulos e bulletin board.</p>
            </div>
            <Link
              href="/admin/courses/new"
              className="button"
              style={{ minHeight: 44, padding: '0 18px', display: 'inline-flex', alignItems: 'center' }}
            >
              + Novo curso
            </Link>
          </div>

          {notice && <div className="notice">{notice}</div>}

          <div className="panel">
            <div className="section-title" style={{ marginBottom: 20 }}>
              <h2>Cursos</h2>
              <p>Escolha um curso para gerenciar.</p>
            </div>

            {courses.length === 0 ? (
              <div className="empty">Nenhum curso criado ainda.</div>
            ) : (
              <div className="admin-course-selector">
                {courses.map((course) => {
                  const phaseCount = course.phases?.length ?? 0
                  return (
                    <div key={course.id} className="admin-select-course">
                      {/* Lado esquerdo: ícone + nome + fases */}
                      <div className="admin-select-left">
                        <div className="admin-course-icon">
                          {getCourseIcon(course.category)}
                        </div>
                        <div>
                          <strong>{course.title}</strong>
                          <span>{course.category || 'Geral'}</span>
                        </div>
                        {/* Chip de fases — discreto, junto ao título */}
                        <PhasesChip count={phaseCount} />
                      </div>

                      {/* Lado direito: status + ações */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div
                          className={`admin-course-status ${course.published ? 'published' : 'draft'}`}
                        >
                          {course.published ? 'Publicado' : 'Rascunho'}
                        </div>
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="button secondary"
                          style={{
                            minHeight: 38, padding: '0 14px',
                            display: 'inline-flex', alignItems: 'center', fontSize: 13,
                          }}
                        >
                          Editar
                        </Link>
                        <button
                          className="button secondary"
                          style={{ minHeight: 38, padding: '0 14px', fontSize: 13 }}
                          onClick={() => handleToggle(course)}
                        >
                          {course.published ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          className="button danger compact"
                          onClick={() => handleDelete(course.id, course.title)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>
      <Navbar user={user} />
    </div>
    
  )
}
