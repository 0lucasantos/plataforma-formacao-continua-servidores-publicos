'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  getCourse, updateCourse,
  getCourseModules, createModule, deleteModule,
  getBulletinPosts, createBulletinPost, deleteBulletinPost,
} from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import { ChevronLeft } from "lucide-react"
import type { Course, Module, BulletinPost, CoursePhase } from '@/types'
import PhasesEditor from '@/components/PhasesEditor'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminCoursePage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [notice, setNotice] = useState('')
  const [phases, setPhases] = useState<CoursePhase[]>([])

  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editNumQ, setEditNumQ] = useState(5)
  const [editThreshComplete, setEditThreshComplete] = useState(80)
  const [editThreshProgress, setEditThreshProgress] = useState(50)
  const [savingCourse, setSavingCourse] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const [modTitle, setModTitle] = useState('')
  const [modContent, setModContent] = useState('')
  const [modOrder, setModOrder] = useState(1)
  const [savingMod, setSavingMod] = useState(false)

  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [postExpires, setPostExpires] = useState('')
  const [savingPost, setSavingPost] = useState(false)

  function handleExitWithoutSaving() {
    router.back()
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/catalog')
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role !== 'admin') return
    Promise.all([getCourse(id), getCourseModules(id), getBulletinPosts(id)]).then(([c, mods, p]) => {
      if (!c) return
      setCourse(c)
      setModules([...mods].sort((a, b) => Number(a.order) - Number(b.order)))
      setPosts(p)
      setEditTitle(c.title)
      setEditDesc(c.description)
      setEditCategory(c.category ?? '')
      setEditNumQ(c.num_questions ?? 5)
      setEditThreshComplete(c.threshold_complete ?? 80)
      setEditThreshProgress(c.threshold_progress ?? 50)

       // CARREGAR FASES
      setPhases(c.phases ?? [])
    })
  }, [id, user])

  async function handleSaveCourse(e?: React.FormEvent) {
    e?.preventDefault()
    if (!course) return
    setSavingCourse(true)
    await updateCourse(id, { title: editTitle, description: editDesc, category: editCategory, num_questions: editNumQ, threshold_complete: editThreshComplete, threshold_progress: editThreshProgress })
    setSavingCourse(false)
    setCourse((prev) => prev ? { ...prev, title: editTitle, description: editDesc, category: editCategory, num_questions: editNumQ, threshold_complete: editThreshComplete, threshold_progress: editThreshProgress } : prev)
    setNotice('Curso salvo.')

    await updateCourse(id, {
      title: editTitle,
      description: editDesc,
      category: editCategory,
      num_questions: editNumQ,
      threshold_complete: editThreshComplete,
      threshold_progress: editThreshProgress,

      phases, // ← adicionar isso
    })

    setCourse(prev =>
      prev
        ? {
            ...prev,
            title: editTitle,
            description: editDesc,
            category: editCategory,
            num_questions: editNumQ,
            threshold_complete: editThreshComplete,
            threshold_progress: editThreshProgress,
            phases,
          }
        : prev
    )
    setHasUnsavedChanges(false)
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault()
    if (!modTitle || !modContent) return
    setSavingMod(true)
    const mod = await createModule(id, modTitle, modContent, modOrder, [])
    setModules((prev) => [...prev, mod].sort((a, b) => Number(a.order) - Number(b.order)))
    setModTitle('')
    setModContent('')
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
    const post = await createBulletinPost(id, postTitle, postContent, url || undefined, postExpires ? new Date(postExpires).toISOString() : undefined)
    setPosts((prev) => [post, ...prev])
    setPostTitle('')
    setPostContent('')
    setPostUrl('')
    setPostExpires('')
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
        <button
          type="button"
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowExitModal(true)
            } else {
              router.replace('/admin')
            }
          }}
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
        <div className="admin-page">
            <p className="admin-page-top-title"><strong>{course.title}</strong></p>
          

          {notice && <div className="notice">{notice}</div>}

          {/* Editar curso */}
          <div className="panel">
            <div className="section-title" style={{ marginBottom: 0 }}>
              <h2>Configurações do curso</h2>
            </div>
            <form className="admin-form" onSubmit={handleSaveCourse}>
              <div className="field wide">
                <label>Título</label>
                <input value={editTitle} onChange={(e) => {
                  setEditTitle(e.target.value)
                  setHasUnsavedChanges(true)
                }} required />
              </div>
              <div className="field wide">
                <label>Descrição</label>
                <textarea value={editDesc} onChange={(e) => {
                  setEditDesc(e.target.value)
                  setHasUnsavedChanges(true)
                }} />
              </div>
              <div className="field wide">
                <label>Categoria</label>
                <input value={editCategory} onChange={(e) => {
                  setEditCategory(e.target.value)
                  setHasUnsavedChanges(true)
                }} />
              </div>
              
            </form>
          </div>

          <div className="panel">
            <div className="section-title">
              <h2>Fases do Quiz</h2>
              <p>Configure a progressão do aprendizado.</p>
            </div>

            <PhasesEditor
              phases={phases}
              onChange={(newPhases) => {
                setPhases(newPhases)
                setHasUnsavedChanges(true)
              }}
            />
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 16,
              marginTop: 1,
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
              {savingCourse ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>

          {/* Módulos */}
          <div className="panel">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <h2>Módulos</h2>
              <p>Gerencie os módulos desta formação.</p>
            </div>

            <div className="stack" style={{ marginBottom: 20 }}>
              {modules.length ? modules.map((mod) => (
                <article key={mod.id} className="post-card bulletin-post">
                  <div>
                    <h3>{mod.order}. {mod.title}</h3>
                    <p>{mod.content}</p>
                  </div>
                  <button className="button danger compact" onClick={() => handleDeleteModule(mod.id)}>Excluir</button>
                </article>
              )) : <div className="empty">Nenhum módulo cadastrado.</div>}
            </div>

            <form className="admin-form" onSubmit={handleAddModule}>
              <div className="field">
                <label>Ordem</label>
                <input type="number" min={1} value={modOrder} onChange={(e) => {
                  setModOrder(Number(e.target.value))
                  
                }} />
              </div>
              <div className="field">
                <label>Título *</label>
                <input value={modTitle} onChange={(e) => {
                  setModTitle(e.target.value)
                  
                }} required />
              </div>
              <div className="field wide">
                <label>Conteúdo *</label>
                <textarea value={modContent} onChange={(e) => {
                  setModContent(e.target.value)
                
                }} required />
              </div>
              <div className="wide">
                <button className="button" type="submit" disabled={savingMod || !modTitle} style={{ marginTop: 8 }}>
                  {savingMod ? 'Criando...' : 'Criar módulo'}
                </button>
              </div>
            </form>
          </div>

          {/* Bulletin Board */}
          <div className="panel">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <h2>Bulletin Board</h2>
              <p>Publique avisos e materiais para os alunos.</p>
            </div>

            <div className="stack" style={{ marginBottom: 20 }}>
              {posts.length ? posts.map((post) => (
                <article key={post.id} className="post-card bulletin-post">
                  <div>
                    <h3>{post.title}</h3>
                    <p>{post.content}</p>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 13 }}>{post.url}</a>
                    )}
                    <p className="post-meta">{formatDate(post.created_at)}</p>
                  </div>
                  <button className="button danger compact" onClick={() => handleDeletePost(post.id)}>Excluir</button>
                </article>
              )) : <div className="empty">Nenhum aviso publicado.</div>}
            </div>

            <form className="admin-form" onSubmit={handleAddPost}>
              <div className="field">
                <label>Título *</label>
                <input value={postTitle} onChange={(e) => {
                  setPostTitle(e.target.value)
                 
                }} required />
              </div>
              <div className="field">
                <label>Expira em</label>
                <input type="datetime-local" value={postExpires} onChange={(e) => {
                  setPostExpires(e.target.value)
                  
                }} />
              </div>
              <div className="field wide">
                <label>Conteúdo *</label>
                <textarea value={postContent} onChange={(e) => {
                  setPostContent(e.target.value)
                
                }} required />
              </div>
              <div className="field wide">
                <label>URL (opcional)</label>
                <input type="text" value={postUrl} onChange={(e) => {
                  setPostUrl(e.target.value)
                
                }} placeholder="www.exemplo.com" />
              </div>
              <div className="wide">
                <button className="button" type="submit" disabled={savingPost || !postTitle} style={{ marginTop: 8 }}>
                  {savingPost ? 'Publicando...' : 'Publicar aviso'}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </main>
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Sair sem salvar?</h3>

            <p>
              Existem alterações não salvas.
              Se sair agora, elas serão perdidas.
            </p>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setShowExitModal(false)}
              >
                Continuar editando
              </button>

              <button
                className="button danger"
                onClick={handleExitWithoutSaving}
              >
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar user={user} />
    </div>
  )
}
