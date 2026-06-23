'use client'
// ---------------------------------------------------------------------------
// PhasesEditor — componente reutilizável para criar/editar o array de fases
// Usado tanto em new/page.tsx quanto em [id]/page.tsx
// Respeita 100% o design system: .admin-form, .field, .button, .panel, .notice
// ---------------------------------------------------------------------------
import type { CoursePhase } from '@/types'
import { randomUUID } from 'crypto' // tree-shaken no browser pelo Next.js

const DIFFICULTY_OPTIONS = [
  { value: 'Fácil',   label: '🟢 Fácil'   },
  { value: 'Médio',   label: '🟡 Médio'   },
  { value: 'Difícil', label: '🔴 Difícil' },
] as const

type Difficulty = 'Fácil' | 'Médio' | 'Difícil'

// Fase "em branco" com valores sensatos
function emptyPhase(order: number): CoursePhase {
  return {
    id: `phase-${Date.now()}-${order}`,
    difficulty: 'Fácil',
    num_questions: 5,
    threshold: 70,
    cooldown_days: 1,
  }
}

interface Props {
  phases: CoursePhase[]
  onChange: (phases: CoursePhase[]) => void
}

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: StepperProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 46,
        border: '1px solid #D1D5DB',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(15,23,42,.05)',
      }}
    >
      <button
        type="button"
        disabled={value <= min}
        onClick={() =>
          onChange(Math.max(min, value - 1))
        }
        style={{
          width: 44,
          height: '100%',
          border: 'none',
          borderRight: '1px solid #E5E7EB',
          background: 'transparent',
          color: '#1474FF',
          fontSize: 22,
          fontWeight: 700,
          cursor: value <= min ? 'not-allowed' : 'pointer',
          opacity: value <= min ? 0.4 : 1,
        }}
      >
        −
      </button>

      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 16,
          color: '#0F172A',
        }}
      >
        {value}
      </div>

      <button
        type="button"
        disabled={value >= max}
        onClick={() =>
          onChange(Math.min(max, value + 1))
        }
        style={{
          width: 44,
          height: '100%',
          border: 'none',
          borderLeft: '1px solid #E5E7EB',
          background: 'transparent',
          color: '#1474FF',
          fontSize: 22,
          fontWeight: 700,
          cursor: value >= max ? 'not-allowed' : 'pointer',
          opacity: value >= max ? 0.4 : 1,
        }}
      >
        +
      </button>
    </div>
  )
}

export default function PhasesEditor({ phases, onChange }: Props) {
  function add() {
    onChange([...phases, emptyPhase(phases.length + 1)])
  }

  function remove(index: number) {
    onChange(phases.filter((_, i) => i !== index))
  }

  function update<K extends keyof CoursePhase>(index: number, key: K, value: CoursePhase[K]) {
    onChange(phases.map((p, i) => i === index ? { ...p, [key]: value } : p))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...phases]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === phases.length - 1) return
    const next = [...phases]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {phases.length === 0 && (
        <div className="empty" style={{ padding: '20px 24px' }}>
          Nenhuma fase configurada. Clique em "Adicionar fase" para começar.
        </div>
      )}

      {phases.map((phase, i) => (
        <div
          key={phase.id}
          style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 5,
              borderColor: '#1474FF',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            }}
        >
          {/* Cabeçalho da fase */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Número de ordem */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00AEEF, #0078D4)',
                  boxShadow: '0 4px 10px rgba(0, 156, 222, .25)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                Fase {i + 1}
              </span>
              {/* Chip de dificuldade */}
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    phase.difficulty === 'Fácil'   ? 'rgba(22,163,74,.12)'  :
                    phase.difficulty === 'Médio'   ? 'rgba(245,158,11,.12)' :
                    'rgba(239,68,68,.12)',
                  color:
                    phase.difficulty === 'Fácil'   ? '#15803d'  :
                    phase.difficulty === 'Médio'   ? '#b45309'  :
                    '#b91c1c',
                }}
              >
                {DIFFICULTY_OPTIONS.find((d) => d.value === phase.difficulty)?.label ?? phase.difficulty}
              </span>
            </div>

            {/* Ações: mover + excluir */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                title="Mover para cima"
                style={{
                  height: 32, width: 32, borderRadius: 9,
                  border: '1px solid var(--line)', background: 'white',
                  color: i === 0 ? '#cbd5e1' : 'var(--muted)',
                  fontSize: 14, cursor: i === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >↑</button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === phases.length - 1}
                title="Mover para baixo"
                style={{
                  height: 32, width: 32, borderRadius: 9,
                  border: '1px solid var(--line)', background: 'white',
                  color: i === phases.length - 1 ? '#cbd5e1' : 'var(--muted)',
                  fontSize: 14, cursor: i === phases.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >↓</button>
              <button
                type="button"
                onClick={() => remove(i)}
                title="Remover fase"
                style={{
                  height: 32, padding: '0 12px', borderRadius: 9,
                  border: '1px solid rgba(239,68,68,.3)',
                  background: 'rgba(254,242,242,.8)',
                  color: 'var(--danger)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >Remover</button>
            </div>
          </div>

          {/* Grid de campos — reutiliza admin-form sem o margin-top padrão */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 14,
            }}
          >
            {/* Dificuldade */}
            <div className="field" style={{ margin: 0 }}>
              <label>Dificuldade</label>
              <select
                value={phase.difficulty}
                onChange={(e) =>
                  update(i, 'difficulty', e.target.value as Difficulty)
                }
                style={{
                  width: '100%',
                  height: 46,
                  padding: '0 42px 0 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 14,
                  background: '#fff',
                  color: '#0F172A',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',

                  // Remove aparência padrão do navegador
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',

                  // Seta personalizada
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%231474FF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5 8 5 5 5-5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '18px',

                  transition: 'all .2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1474FF'
                  e.currentTarget.style.boxShadow =
                    '0 0 0 4px rgba(20,116,255,.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de questões */}
            <div className="field" style={{ margin: 0 }}>
              <label>Questões</label>

              <Stepper
                value={phase.num_questions}
                min={1}
                max={30}
                onChange={(value) =>
                  update(i, 'num_questions', value)
                }
              />
            </div>

            {/* Threshold (%) */}
            <div className="field" style={{ margin: 0 }}>
              <label>Mínimo (%)</label>

              <Stepper
                value={phase.threshold}
                min={1}
                max={100}
                onChange={(value) =>
                  update(i, 'threshold', value)
                }
              />
            </div>

            {/* Cooldown dias */}
            <div className="field" style={{ margin: 0 }}>
              <label>Cooldown (dias)</label>

              <Stepper
                value={phase.cooldown_days}
                min={0}
                max={365}
                onChange={(value) =>
                  update(i, 'cooldown_days', value)
                }
              />
            </div>
          </div>
        </div>
      ))}

      {/* Botão adicionar fase */}
      <button
        type="button"
        onClick={add}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 44,
          borderRadius: 5,
          border: '2px dashed #009CDE',
          background: 'rgba(0,156,222,.04)',
          color: '#009CDE',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          transition: 'border-color .18s ease, background .18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            'rgba(0,156,222,.10)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#009CDE'
          e.currentTarget.style.background =
            'rgba(0,156,222,.04)'
        }}
      >
        + Adicionar fase
      </button>
    </div>
  )
}
