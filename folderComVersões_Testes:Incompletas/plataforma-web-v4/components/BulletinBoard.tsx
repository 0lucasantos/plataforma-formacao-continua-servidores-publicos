'use client'
import { useEffect, useState } from 'react'
import { getBulletinPosts } from '@/lib/db'
import type { BulletinPost } from '@/types'

export default function BulletinBoard({ courseId }: { courseId: string }) {
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBulletinPosts(courseId).then(setPosts).finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <div className="loader">Carregando mural…</div>

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 32 }}>📌</div>
        <p>Nenhum aviso publicado ainda.</p>
      </div>
    )
  }

  return (
    <div className="stack">
      {posts.map((p) => (
        <div className="post-card" key={p.id}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{p.title}</h3>
            <p>{p.content}</p>
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">Ver link →</a>}
            <div className="post-meta">
              {new Date(p.created_at).toLocaleDateString('pt-BR')}
              {p.expires_at && ` · expira ${new Date(p.expires_at).toLocaleDateString('pt-BR')}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
