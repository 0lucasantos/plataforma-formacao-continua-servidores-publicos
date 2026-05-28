'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCourse, getQuizStatus, submitQuiz } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course, GeneratedQuestion, QuizResult } from '@/types'

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showGabarito, setShowGabarito] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    Promise.all([getCourse(courseId), getQuizStatus(courseId)])
      .then(([c, status]) => {
        if (!c) { router.replace('/catalog'); return }
        if (status.taken_today && !status.attempt?.completed) {
          router.replace(`/learn/${courseId}`)
          return
        }
        setCourse(c)
        setQuestions(status.questions ?? [])
      })
      .finally(() => setFetching(false))
  }, [courseId, user, loading, router])

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    try {
      const answers = questions.map((_, i) => selections[i] ?? -1)
      const r = await submitQuiz(courseId, answers)
      setResult(r)
    } finally {
      setSubmitting(false)
    }
  }

  function selectOption(idx: number) {
    setSelections((prev) => ({ ...prev, [currentStep]: idx }))
  }

  function nextStep() {
    if (currentStep < questions.length - 1) setCurrentStep((s) => s + 1)
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  if (loading || fetching || !course) return null

  if (result) {
    const badgeEmoji = result.badge_type === 'complete' ? '🏆' : result.badge_type === 'progress' ? '🎖️' : '📝'
    const badgeLabel = result.badge_type === 'complete' ? 'Selo Ouro' : result.badge_type === 'progress' ? 'Selo Progresso' : 'Participação'

    return (
      <div className="quiz-result-page">
        <div className="quiz-result-avatar">{badgeEmoji}</div>
        <h1 className="quiz-result-title">
          {result.badge_type !== 'none' ? 'Desafio concluído!' : 'Quiz finalizado!'}
        </h1>
        <p className="quiz-result-sub">
          Você acertou {result.score} de {result.total} questões
        </p>

        <div className="quiz-result-score-pill">
          <span className="dot" />
          {result.pct}% de aproveitamento
        </div>

        {result.badge_type !== 'none' && (
          <div className="quiz-result-badges">
            <div className="quiz-result-badge">
              <div className="quiz-result-badge-icon">{badgeEmoji}</div>
              <span>{badgeLabel}</span>
            </div>
          </div>
        )}

        <div className="quiz-result-actions">
          <button className="quiz-result-btn-primary" onClick={() => router.push(`/learn/${courseId}`)}>
            Ver conteúdo do curso →
          </button>
          <button
            className="quiz-result-btn-secondary"
            onClick={() => setShowGabarito(!showGabarito)}
          >
            {showGabarito ? 'Ocultar gabarito' : 'Ver gabarito'}
          </button>
          <button className="quiz-result-btn-secondary" onClick={() => router.push('/catalog')}>
            Voltar ao catálogo
          </button>
        </div>

        {showGabarito && (
          <div className="gabarito" style={{ width: '100%', maxWidth: 600, marginTop: 32 }}>
            {result.questions.map((q, qi) => (
              <div className="gabarito-item" key={q.id}>
                <div className="gabarito-q">{qi + 1}. {q.text}</div>
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correct_index
                  const isUserAnswer = result.answers[qi] === oi
                  let cls = 'gabarito-opt'
                  if (isCorrect) cls += ' correct'
                  else if (isUserAnswer && !isCorrect) cls += ' wrong'
                  return <div key={oi} className={cls}>{opt}</div>
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,.7)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>Gerando questões com IA…</p>
        </div>
      </div>
    )
  }

  const q = questions[currentStep]
  const selected = selections[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100
  const isLast = currentStep === questions.length - 1
  const allAnswered = questions.every((_, i) => selections[i] !== undefined)

  return (
    <div className="quiz-page">
      <div className="quiz-topbar">
        <button className="quiz-back-btn" onClick={() => router.push('/catalog')}>←</button>
        <span className="quiz-step-label">{currentStep + 1} / {questions.length}</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-content">
        <div className="quiz-course-tag">{course.title}</div>
        <div className="quiz-question-text">{q.text}</div>

        <div className="quiz-options">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              className={`quiz-option${selected === oi ? ' selected' : ''}`}
              onClick={() => selectOption(oi)}
            >
              <div className="quiz-option-dot" />
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-footer">
        <div style={{ display: 'flex', gap: 10 }}>
          {currentStep > 0 && (
            <button
              className="quiz-next-btn"
              style={{ background: 'rgba(255,255,255,.2)', color: 'white', flex: '0 0 auto', width: 52 }}
              onClick={prevStep}
            >
              ←
            </button>
          )}
          {!isLast ? (
            <button
              className="quiz-next-btn"
              style={{ flex: 1 }}
              disabled={selected === undefined}
              onClick={nextStep}
            >
              Próxima →
            </button>
          ) : (
            <button
              className="quiz-next-btn"
              style={{ flex: 1 }}
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Enviando…' : 'Concluir quiz'}
            </button>
          )}
        </div>

        <div className="quiz-ia-badge">
          <span className="quiz-ia-dot" />
          Questões geradas por IA
        </div>
      </div>
    </div>
  )
}
