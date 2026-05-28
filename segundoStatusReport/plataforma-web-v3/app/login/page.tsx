'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/db'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.push('/catalog')
    } catch {
      setError('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-view">
      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-header">
            <div className="brand-mark">A+</div>
            <h1>Aprenda+</h1>
            <p>Entre para continuar aprendendo</p>
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="alert">{error}</div>}

          <button className="button full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="divider"><span>ou continue com</span></div>

          <button className="button secondary full" type="button" style={{ width: '100%' }}>
            🔴 Entrar com Conecta Recife
          </button>

          <p className="register-text">
            Não tem conta?{' '}
            <button type="button" className="link-button">Cadastre-se</button>
          </p>
        </form>
      </section>
    </main>
  )
}
