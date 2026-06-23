'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BulletinBoard from '@/components/BulletinBoard'
import AIChat from '@/components/AIChat'
import { getCourse, getCourseModules } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course, Module } from '@/types'
import { ChevronLeft } from "lucide-react"

type Tab = 'modules' | 'bulletin' | 'chat'

export default function LearnPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [tab, setTab] = useState<Tab>('modules')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getCourse(courseId).then((c) => {
      if (!c) { router.replace('/catalog'); return }
      setCourse(c)
    })
    getCourseModules(courseId).then((mods) =>
      setModules([...mods].sort((a, b) => Number(a.order) - Number(b.order)))
    )
  }, [courseId, user])

  if (loading || !user || !course) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'modules', label: 'Módulos' },
    { id: 'bulletin', label: '📌 Mural' },
    { id: 'chat', label: '✦ Learn Your Way' },
  ]

  return (
    <div className="app-shell">
      <main className="main">
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
        <div className="section-header">
          <div className="section-title">
            <h2>{course.title}</h2>
            <p>{course.description}</p>
          </div>
        </div>

        <div className="course-detail-tabs">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              className={`course-detail-tab ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'modules' && (
          <div className="panel">
            <div className="section-title">
              <h2>Módulos</h2>
              <p>{modules.length ? `${modules.length} módulo${modules.length > 1 ? 's' : ''} nesta formação.` : 'Ainda não há módulos cadastrados.'}</p>
            </div>
            <div className="stack" style={{ marginTop: 16 }}>
              {modules.length ? modules.map((mod) => (
                <article key={mod.id} className="post-card">
                  <h3>{mod.order}. {mod.title}</h3>
                  <p>{mod.content}</p>
                </article>
              )) : <div className="empty">Sem módulos por enquanto.</div>}
            </div>
          </div>
        )}

        {tab === 'bulletin' && (
          <div className="panel">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <h2>Mural</h2>
              <p>Avisos e materiais complementares do curso.</p>
            </div>
            <BulletinBoard courseId={courseId} />
          </div>
        )}

        {tab === 'chat' && (
          <AIChat courseTitle={course.title} />
        )}
      </main>
      
    </div>
  )
}
