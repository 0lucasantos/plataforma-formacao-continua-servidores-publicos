'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getCurrentUser } from '@/lib/db'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) router.replace(u.role === 'admin' ? '/admin' : '/catalog')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      const u = await getCurrentUser()
      router.replace(u?.role === 'admin' ? '/admin' : '/catalog')
    } catch {
      setError('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">A+</div>
          <div className="login-logo-text">
            <strong>Aprenda+</strong>
            <span>Prefeitura do Recife</span>
          </div>
        </div>

        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-sub">Entre com sua conta institucional para continuar</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">E-mail institucional</label>
            <input
              className="form-input"
              type="email"
              placeholder="seu@recife.pe.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="login-divider">ou</div>

        <div className="login-footer">
          Acesso demo — servidor:{' '}
          <button onClick={() => { setEmail('servidor@plataforma.com'); setPassword('servidor123') }}>
            preencher
          </button>
        </div>
      </div>
    </div>
  )
}
