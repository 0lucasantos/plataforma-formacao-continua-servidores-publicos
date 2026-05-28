'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCourse } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'

export default function NewCoursePage() {
  const { user, loading } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [thresholdComplete, setThresholdComplete] = useState(80)
  const [thresholdProgress, setThresholdProgress] = useState(50)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const course = await createCourse(title, description, category, numQuestions, thresholdComplete, thresholdProgress)
    router.push(`/admin/courses/${course.id}`)
  }

  if (loading || !user) return null

  return (
    <div className="app-shell">
      <main className="main" style={{ maxWidth: 680 }}>
        <Link href="/admin" style={{ color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: 20 }}>
          ← Voltar
        </Link>

        <div className="panel">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <h2>Novo curso</h2>
            <p>Preencha os dados para criar uma nova formação.</p>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="field wide">
              <label>Título *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="field wide">
              <label>Descrição</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field">
              <label>Categoria</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Gestão, Tecnologia..." />
            </div>

            <div className="field">
              <label>Perguntas</label>
              <input type="number" min={1} max={20} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} />
            </div>

            <div className="field">
              <label>Conclusão (%)</label>
              <input type="number" min={1} max={100} value={thresholdComplete} onChange={(e) => setThresholdComplete(Number(e.target.value))} />
            </div>

            <div className="field">
              <label>Progresso (%)</label>
              <input type="number" min={1} max={100} value={thresholdProgress} onChange={(e) => setThresholdProgress(Number(e.target.value))} />
            </div>

            <div className="wide">
              <button className="button" type="submit" disabled={saving || !title} style={{ width: '100%', marginTop: 8 }}>
                {saving ? 'Criando...' : 'Criar curso'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
