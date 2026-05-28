'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createCourse } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'

const CATEGORIES = ['Saúde', 'Gestão', 'Tecnologia', 'Direito', 'Educação', 'Finanças', 'Comunicação', 'Meio Ambiente', 'Urbanismo', 'Assistência Social']

export default function NewCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [numQ, setNumQ] = useState(5)
  const [threshComplete, setThreshComplete] = useState(80)
  const [threshProgress, setThreshProgress] = useState(50)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
    if (!loading && user?.role !== 'admin') router.replace('/catalog')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) { setError('Título e descrição são obrigatórios.'); return }
    setSaving(true)
    setError('')
    try {
      await createCourse(title, description, category, numQ, threshComplete, threshProgress)
      router.push('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar curso.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <>
      <Navbar />
      <div className="page-narrow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => router.back()}>← Voltar</button>
          <h1 className="page-title" style={{ margin: 0, fontSize: 20 }}>Novo curso</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Título do curso</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Gestão de Pessoas na Administração Pública" required />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-input form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva os objetivos e conteúdos do curso…" required />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Sem categoria</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="admin-form-grid">
              <div className="form-group">
                <label className="form-label">Nº de questões</label>
                <input className="form-input" type="number" min={1} max={20} value={numQ} onChange={(e) => setNumQ(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">% p/ Selo Ouro</label>
                <input className="form-input" type="number" min={1} max={100} value={threshComplete} onChange={(e) => setThreshComplete(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">% p/ Progresso</label>
                <input className="form-input" type="number" min={1} max={100} value={threshProgress} onChange={(e) => setThreshProgress(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Criar curso'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
