'use client'
import { useEffect, useState } from 'react'
import { getBulletinPosts } from '@/lib/db'
import type { BulletinPost } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BulletinBoard({ courseId }: { courseId: string }) {
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBulletinPosts(courseId)
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return <div className="loader">Carregando avisos...</div>
  }

  if (posts.length === 0) {
    return (
      <div className="empty">
        <p style={{ fontSize: 36, margin: '0 0 12px' }}>📌</p>
        <p>Nenhuma publicação ainda.</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>O administrador postará notícias e materiais aqui.</p>
      </div>
    )
  }

  return (
    <div className="stack">
      {posts.map((post) => (
        <article key={post.id} className="post-card bulletin-post">
          <div>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 8, color: 'var(--primary)', fontWeight: 700 }}
              >
                🔗 Acessar recurso
              </a>
            )}
            {post.expires_at && (
              <p className="post-meta">Disponível até {formatDate(post.expires_at)}</p>
            )}
            <p className="post-meta" style={{ color: 'var(--muted)' }}>{formatDate(post.created_at)}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
