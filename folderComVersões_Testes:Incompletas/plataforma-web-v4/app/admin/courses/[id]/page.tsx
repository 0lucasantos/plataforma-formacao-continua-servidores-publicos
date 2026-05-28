'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import {
  getCourse, updateCourse,
  getCourseModules, createModule, deleteModule,
  getBulletinPosts, createBulletinPost, deleteBulletinPost,
} from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course, Module, BulletinPost, Question } from '@/types'

const CATEGORIES = ['Saúde', 'Gestão', 'Tecnologia', 'Direito', 'Educação', 'Finanças', 'Comunicação', 'Meio Ambiente', 'Urbanismo', 'Assistência Social']
type Tab = 'details' | 'modules' | 'bulletin'

function emptyQ(): Question { return { id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correct_index: 0 } }

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [tab, setTab] = useState<Tab>('details')
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Details form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [numQ, setNumQ] = useState(5)
  const [threshC, setThreshC] = useState(80)
  const [threshP, setThreshP] = useState(50)

  // New module form
  const [modTitle, setModTitle] = useState('')
  const [modContent, setModContent] = useState('')
  const [modQuestions, setModQuestions] = useState<Question[]>([emptyQ()])

  // Bulletin form
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postUrl, setPostUrl] = useState('')

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!loading && user?.role !== 'admin') { router.replace('/catalog'); return }
    if (!user) return
    Promise.all([getCourse(id), getCourseModules(id), getBulletinPosts(id)])
      .then(([c, mods, ps]) => {
        if (!c) { router.replace('/admin'); return }
        setCourse(c)
        setTitle(c.title); setDescription(c.description); setCategory(c.category)
        setNumQ(c.num_questions); setThreshC(c.threshold_complete); setThreshP(c.threshold_progress)
        setModules(mods)
        setPosts(ps)
      })
      .finally(() => setFetching(false))
  }, [id, user, loading, router])

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      await updateCourse(id, { title, description, category, num_questions: numQ, threshold_complete: threshC, threshold_progress: threshP })
      setMsg('Curso atualizado!')
    } catch { setMsg('Erro ao salvar.') } finally { setSaving(false) }
  }

  async function addModule(e: React.FormEvent) {
    e.preventDefault()
    const valid = modQuestions.every((q) => q.text && q.options.every((o) => o))
    if (!valid) { alert('Preencha todas as perguntas e opções.'); return }
    const mod = await createModule(id, modTitle, modContent, modules.length + 1, modQuestions)
    setModules((prev) => [...prev, mod])
    setModTitle(''); setModContent(''); setModQuestions([emptyQ()])
  }

  async function handleDeleteModule(modId: string) {
    if (!confirm('Deletar módulo?')) return
    await deleteModule(id, modId)
    setModules((prev) => prev.filter((m) => m.id !== modId))
  }

  async function addPost(e: React.FormEvent) {
    e.preventDefault()
    const p = await createBulletinPost(id, postTitle, postContent, postUrl || undefined)
    setPosts((prev) => [p, ...prev])
    setPostTitle(''); setPostContent(''); setPostUrl('')
  }

  async function handleDeletePost(postId: string) {
    await deleteBulletinPost(id, postId)
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function updateQ(qi: number, field: string, value: unknown) {
    setModQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q))
  }
  function updateOpt(qi: number, oi: number, val: string) {
    setModQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q))
  }

  if (loading || fetching || !course) return null

  return (
    <>
      <Navbar />
      <div className="page-narrow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => router.push('/admin')}>← Voltar</button>
          <h1 className="page-title" style={{ margin: 0, fontSize: 20 }}>Editar: {course.title}</h1>
        </div>

        <div className="tab-bar">
          {([['details','Detalhes'],['modules',`Módulos (${modules.length})`],['bulletin','Mural']] as const).map(([k, label]) => (
            <button key={k} className={`tab-btn${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="card">
            <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {msg && <div className={msg.includes('Erro') ? 'alert-error' : 'alert-success'}>{msg}</div>}
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-input form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Sem categoria</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Nº questões</label>
                  <input className="form-input" type="number" min={1} max={20} value={numQ} onChange={(e) => setNumQ(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Selo Ouro</label>
                  <input className="form-input" type="number" min={1} max={100} value={threshC} onChange={(e) => setThreshC(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Progresso</label>
                  <input className="form-input" type="number" min={1} max={100} value={threshP} onChange={(e) => setThreshP(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'modules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {modules.sort((a, b) => a.order - b.order).map((mod, idx) => (
              <div className="card" key={mod.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{mod.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{mod.content?.slice(0, 80)}…</p>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{mod.questions?.length ?? 0} questões</span>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteModule(mod.id)}>Excluir</button>
              </div>
            ))}

            <div className="card" style={{ borderStyle: 'dashed' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>+ Novo módulo</h3>
              <form onSubmit={addModule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Título do módulo</label>
                  <input className="form-input" value={modTitle} onChange={(e) => setModTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Conteúdo</label>
                  <textarea className="form-input form-textarea" value={modContent} onChange={(e) => setModContent(e.target.value)} required />
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  <strong style={{ fontSize: 14 }}>Questões do módulo</strong>
                  {modQuestions.map((q, qi) => (
                    <div key={qi} style={{ marginTop: 12, padding: 12, background: 'var(--line-2)', borderRadius: 'var(--radius)' }}>
                      <div className="form-group" style={{ marginBottom: 8 }}>
                        <label className="form-label">Pergunta {qi + 1}</label>
                        <input className="form-input" value={q.text} onChange={(e) => updateQ(qi, 'text', e.target.value)} required />
                      </div>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <input type="radio" name={`correct-${qi}`} checked={q.correct_index === oi} onChange={() => updateQ(qi, 'correct_index', oi)} />
                          <input className="form-input" style={{ flex: 1 }} value={opt} placeholder={`Opção ${oi + 1}`} onChange={(e) => updateOpt(qi, oi, e.target.value)} required />
                        </div>
                      ))}
                      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Selecione o botão da resposta correta</p>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => setModQuestions((prev) => [...prev, emptyQ()])}
                  >
                    + Adicionar pergunta
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">Adicionar módulo</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'bulletin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>+ Novo aviso</h3>
              <form onSubmit={addPost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input className="form-input" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Conteúdo</label>
                  <textarea className="form-input form-textarea" value={postContent} onChange={(e) => setPostContent(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Link (opcional)</label>
                  <input className="form-input" type="url" value={postUrl} placeholder="https://…" onChange={(e) => setPostUrl(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">Publicar aviso</button>
                </div>
              </form>
            </div>

            {posts.map((p) => (
              <div className="post-card" key={p.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{p.title}</h3>
                  <p>{p.content}</p>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">Ver link →</a>}
                  <div className="post-meta">{new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeletePost(p.id)}>Excluir</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
