'use client'
// ---------------------------------------------------------------------------
// DevTimeBar — Barra de Time Travel para desenvolvimento
//
// Visível apenas quando NODE_ENV === 'development' (controlado no layout.tsx).
// Salva a data simulada em localStorage['simulated_date'] (YYYY-MM-DD).
// O fetch global é interceptado em fetchInterceptor.ts para injetar
// o header x-simulated-date automaticamente em todas as chamadas à API.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'simulated_date'

function todayISO() {
  // Retorna hoje em YYYY-MM-DD no fuso local
  return new Date().toISOString().slice(0, 10)
}

export default function DevTimeBar() {
  const [date, setDate] = useState<string>('')
  const [active, setActive] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Lê o valor persitido ao montar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) { setDate(stored); setActive(true) }
  }, [])

  function handleChange(value: string) {
    setDate(value)
    if (value) {
      localStorage.setItem(STORAGE_KEY, value)
      setActive(true)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setActive(false)
    }
    // Dispara evento para que outros componentes (ex: tab ativa em outra aba) reajam
    window.dispatchEvent(new Event('simulated-date-changed'))
  }

  function handleSimulateTomorrow() {
    const base = active && date ? new Date(date + 'T12:00:00') : new Date()
    base.setDate(base.getDate() + 1)
    const next = base.toISOString().slice(0, 10)
    handleChange(next)
  }

  function handleReset() {
    handleChange('')
    setDate('')
  }

  // Barra colapsada — apenas um chip com ⏱ e a data ativa
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        title="Abrir Time Travel"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 999,
          border: '1px solid',
          borderColor: active ? 'rgba(245,158,11,.5)' : 'rgba(100,116,139,.3)',
          background: active ? 'rgba(245,158,11,.12)' : 'rgba(248,250,252,.95)',
          color: active ? '#b45309' : 'var(--muted)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(15,23,42,.08)',
          transition: 'all .2s ease',
        }}
      >
        <span>⏱</span>
        <span>{active ? date : 'Dev'}</span>
      </button>
    )
  }

  return (
    <div
      role="complementary"
      aria-label="Barra de simulação de data (desenvolvimento)"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 18,
        border: '1px solid',
        borderColor: active ? 'rgba(245,158,11,.4)' : 'var(--line)',
        background: active
          ? 'rgba(255,251,235,.97)'
          : 'rgba(255,255,255,.97)',
        backdropFilter: 'blur(12px)',
        boxShadow: active
          ? '0 8px 24px rgba(245,158,11,.14)'
          : '0 8px 24px rgba(15,23,42,.08)',
        transition: 'border-color .2s ease, box-shadow .2s ease',
        fontSize: 13,
        maxWidth: 480,
      }}
    >
      {/* Indicador e label */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? 'var(--warn)' : '#cbd5e1',
          flexShrink: 0,
          transition: 'background .2s ease',
        }}
      />
      <span style={{ fontWeight: 700, color: active ? '#92400e' : 'var(--muted)', whiteSpace: 'nowrap' }}>
        {active ? '⏱ Time Travel' : '⏱ Dev'}
      </span>

      {/* Input de data */}
      <input
        type="date"
        value={date}
        min="2020-01-01"
        max="2099-12-31"
        onChange={(e) => handleChange(e.target.value)}
        style={{
          height: 34,
          padding: '0 10px',
          border: '1px solid',
          borderColor: active ? 'rgba(245,158,11,.5)' : 'var(--line)',
          borderRadius: 10,
          background: 'white',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color .2s ease',
        }}
        title="Simular data para testes de cooldown"
      />

      {/* Botão +1 dia */}
      <button
        onClick={handleSimulateTomorrow}
        title="Avançar 1 dia"
        style={{
          height: 34,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'white',
          color: 'var(--ink)',
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          transition: 'background .15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
      >
        +1 dia
      </button>

      {/* Botão resetar — só aparece quando ativo */}
      {active && (
        <button
          onClick={handleReset}
          title="Voltar para data real"
          style={{
            height: 34,
            padding: '0 12px',
            borderRadius: 10,
            border: '1px solid rgba(239,68,68,.3)',
            background: 'rgba(254,242,242,.8)',
            color: 'var(--danger)',
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Resetar
        </button>
      )}

      {/* Botão colapsar */}
      <button
        onClick={() => setCollapsed(true)}
        title="Minimizar"
        style={{
          height: 28,
          width: 28,
          borderRadius: 8,
          border: '1px solid var(--line)',
          background: 'white',
          color: 'var(--muted)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: 2,
        }}
      >
        ×
      </button>
    </div>
  )
}
