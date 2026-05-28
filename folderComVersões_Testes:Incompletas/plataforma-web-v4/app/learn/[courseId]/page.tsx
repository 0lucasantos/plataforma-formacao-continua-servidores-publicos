'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BulletinBoard from '@/components/BulletinBoard'
import AIChat from '@/components/AIChat'
import { getCourse, getCourseModules } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course, Module } from '@/types'

type Tab = 'content' | 'modules' | 'bulletin' | 'chat'

export default function LearnPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    Promise.all([getCourse(courseId), getCourseModules(courseId)])
      .then(([c, mods]) => {
        if (!c) { router.replace('/catalog'); return }
        setCourse(c)
        setModules(mods)
      })
      .finally(() => setFetching(false))
  }, [courseId, user, loading, router])

  if (loading || fetching || !course) return null

  return (
    <>
      <Navbar />
      <div className="page-narrow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => router.back()}>← Voltar</button>
          <h1 className="page-title" style={{ margin: 0, fontSize: 20 }}>{course.title}</h1>
        </div>

        <div className="tab-bar">
          {[
            { key: 'content', label: 'Conteúdo' },
            { key: 'modules', label: `Módulos (${modules.length})` },
            { key: 'bulletin', label: 'Mural' },
            { key: 'chat', label: '🤖 IA' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`tab-btn${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key as Tab)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <div className="card">
            <p style={{ margin: 0, lineHeight: 1.7 }}>{course.description}</p>
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/quiz/${courseId}`)}
              >
                Fazer quiz do curso →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          modules.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 32 }}>📂</div>
              <p>Nenhum módulo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="stack">
              {modules.sort((a, b) => a.order - b.order).map((mod, idx) => (
                <div className="card" key={mod.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <strong style={{ fontSize: 15 }}>{mod.title}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {mod.content}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'bulletin' && <BulletinBoard courseId={courseId} />}
        {activeTab === 'chat' && <AIChat courseTitle={course.title} />}
      </div>
    </>
  )
}
