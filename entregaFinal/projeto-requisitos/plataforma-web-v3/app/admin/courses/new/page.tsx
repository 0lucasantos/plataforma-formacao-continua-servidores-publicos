'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  createCourse, getCourse, updateCourse,
  getCourseModules, createModule, deleteModule,
  getBulletinPosts, createBulletinPost, deleteBulletinPost,
} from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import PhasesEditor from '@/components/PhasesEditor'
import { ChevronLeft } from "lucide-react"
import type { Course, Module, BulletinPost, CoursePhase } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminCoursePage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [course, setCourse]   = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [posts, setPosts]     = useState<BulletinPost[]>([])
  const [notice, setNotice]   = useState('')

  // ---- Campos do curso ----
  const [editTitle, setEditTitle]       = useState('')
  const [editDesc, setEditDesc]         = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPhases, setEditPhases]     = useState<CoursePhase[]>([])
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseError, setCourseError]   = useState('')

  // ---- Campos de módulo ----
  const [modTitle, setModTitle]     = useState('')
  const [modContent, setModContent] = useState('')
  const [modOrder, setModOrder]     = useState(1)
  const [savingMod, setSavingMod]   = useState(false)

  // ---- Campos de aviso ----
  const [postTitle, setPostTitle]     = useState('')
  const [postContent, setPostContent] = useState('')
  const [postUrl, setPostUrl]         = useState('')
  const [postExpires, setPostExpires] = useState('')
  const [savingPost, setSavingPost]   = useState(false)

  // Redireciona não-admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/catalog')
  }, [user, loading, router])

  // Carrega dados do curso (apenas se houver id, ou seja, se for edição)
  useEffect(() => {
    if (user?.role !== 'admin') return
    if (!id || id === 'new') {
      // Modo criação: inicializa com valores vazios
      setCourse({ id: 'new', title: '', description: '', category: '', published: false, created_at: '', phases: [] } as any)
      return
    }
    // Modo edição: carrega o curso existente
    Promise.all([getCourse(id), getCourseModules(id), getBulletinPosts(id)]).then(([c, mods, p]) => {
      if (!c) return
      setCourse(c)
      setModules([...mods].sort((a, b) => Number(a.order) - Number(b.order)))
      setPosts(p)
      setEditTitle(c.title)
      setEditDesc(c.description)
      setEditCategory(c.category ?? '')
      setEditPhases(c.phases ?? [])
    })
  }, [id, user])

  // ---- Handlers ----

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault()
    setCourseError('')
    if (!course) return
    if (editPhases.length === 0) {
      setCourseError('O curso precisa ter ao menos uma fase configurada.')
      return
    }
    setSavingCourse(true)
    try {
      if (!id || id === 'new') {
        // Criar novo curso
        const newCourse = await createCourse(editTitle, editDesc, editCategory, 5, 80, 50)
        // Atualizar com fases
        await updateCourse(newCourse.id, {
          title: editTitle,
          description: editDesc,
          category: editCategory,
          phases: editPhases,
        })
        setNotice('Curso criado com sucesso.')
        router.push(`/admin/courses/${newCourse.id}`)
      } else {
        // Atualizar curso existente
        await updateCourse(id, {
          title: editTitle,
          description: editDesc,
          category: editCategory,
          phases: editPhases,
        })
        setCourse((prev) =>
          prev
            ? { ...prev, title: editTitle, description: editDesc, category: editCategory, phases: editPhases }
            : prev
        )
        setNotice('Curso salvo com sucesso.')
      }
    } finally {
      setSavingCourse(false)
    }
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault()
    if (!modTitle || !modContent) return
    setSavingMod(true)
    const mod = await createModule(id, modTitle, modContent, modOrder, [])
    setModules((prev) => [...prev, mod].sort((a, b) => Number(a.order) - Number(b.order)))
    setModTitle(''); setModContent('')
    setSavingMod(false)
    setNotice('Módulo criado.')
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Excluir este módulo?')) return
    await deleteModule(id, moduleId)
    setModules((prev) => prev.filter((m) => m.id !== moduleId))
    setNotice('Módulo excluído.')
  }

  async function handleAddPost(e: React.FormEvent) {
    e.preventDefault()
    if (!postTitle || !postContent) return
    setSavingPost(true)
    let url = postUrl.trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`
    const post = await createBulletinPost(
      id, postTitle, postContent,
      url || undefined,
      postExpires ? new Date(postExpires).toISOString() : undefined
    )
    setPosts((prev) => [post, ...prev])
    setPostTitle(''); setPostContent(''); setPostUrl(''); setPostExpires('')
    setSavingPost(false)
    setNotice('Aviso publicado.')
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Excluir este aviso?')) return
    await deleteBulletinPost(id, postId)
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setNotice('Aviso excluído.')
  }

  if (loading || !user || !course) return null

  return (
    <div className="app-shell">
      <main className="main" style={{ maxWidth: 760 }}>
        <div className="admin-page">

          {/* Breadcrumb */}
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'block',
                marginBottom: 8,
              }}
            >
              <ChevronLeft size={30} />
            </button>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{course.title}</h1>
          </div>

          {notice && <div className="notice">{notice}</div>}

          {/* ---- Configurações do curso ---- */}
          <div className="panel">
            <div className="section-title" style={{ marginBottom: 0 }}>
              <h2>Configurações do curso</h2>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="admin-form">
                <div className="field wide">
                  <label>Título</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </div>
                <div className="field wide">
                  <label>Descrição</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
                <div className="field">
                  <label>Categoria</label>
                  <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                </div>
              </div>

              {/* Editor de fases */}
              <div style={{ marginTop: 28 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Fases de avaliação</p>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      Adicione, remova ou reordene as fases do quiz progressivo.
                    </p>
                  </div>
                  {editPhases.length > 0 && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '4px 12px',
                        borderRadius: 999,
                        background: 'rgba(0,129,244,.1)',
                        color: 'var(--primary)',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {editPhases.length} {editPhases.length === 1 ? 'fase' : 'fases'}
                    </span>
                  )}
                </div>
                <PhasesEditor phases={editPhases} onChange={setEditPhases} />
              </div>

              {courseError && <div className="alert" style={{ marginTop: 16 }}>{courseError}</div>}

            </form>
          </div>


        </div>

        <div
            style={{
              position: 'sticky',
              bottom: 16,
              marginTop: 24,
              zIndex: 10,
            }}
          >
            <button
              className="button"
              onClick={handleSaveCourse}
              disabled={savingCourse}
              style={{
                width: '100%',
                height: 52,
                fontWeight: 700,
              }}
            >
              {savingCourse ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
      <Navbar user={user} />       
      </main>
    </div>
  )
}
