'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getCourse, getQuizStatus, submitQuiz } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { Course, GeneratedQuestion, QuizResult } from '@/types'

type Step = 'loading' | 'quiz' | 'result'

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>('loading')
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([getCourse(courseId), getQuizStatus(courseId)]).then(([c, status]) => {
      if (!c) { router.replace('/catalog'); return }
      setCourse(c)
      if (status.taken_today) { router.replace(`/learn/${courseId}`); return }
      const qs = status.questions ?? []
      setQuestions(qs)
      setStep('quiz')
    })
  }, [courseId, user])

  async function handleNext() {
    if (selections[currentStep] === undefined) {
      setNotice('Selecione uma resposta antes de continuar.')
      return
    }
    setNotice('')

    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1)
      return
    }

    setSubmitting(true)
    try {
      const answers = questions.map((_, i) => selections[i] ?? -1)
      const res = await submitQuiz(courseId, answers)
      setResult(res)
      setStep('result')
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Erro ao enviar o quiz.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) return null

  if (step === 'loading') {
    return (
      <div className="app-shell">
        <div className="loader">Carregando quiz...</div>
      </div>
    )
  }

  if (step === 'result' && result && course) {
    const badgeClass =
      result.badge_type === 'complete' ? 'complete' :
      result.badge_type === 'progress' ? 'progress' : 'none'

    return (
      <div className="app-shell">
        <Navbar user={user} />
        <main className="main" style={{ maxWidth: 720 }}>
          <Link href="/catalog" style={{ color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: 20 }}>
            ← Voltar ao catálogo
          </Link>

          <div className={`quiz-result-card ${badgeClass}`}>
            <div className="quiz-result-icon">
              {result.badge_type === 'complete' && '🏅'}
              {result.badge_type === 'progress' && '⭐'}
              {result.badge_type === 'none' && '📚'}
            </div>
            <p className="quiz-result-title">
              {result.badge_type === 'complete' && 'Parabéns! Selo de Conclusão!'}
              {result.badge_type === 'progress' && 'Bom progresso! Selo conquistado.'}
              {result.badge_type === 'none' && 'Continue estudando!'}
            </p>
            <p className="quiz-result-sub">
              Você acertou {result.score}/{result.total} ({result.pct}%)
            </p>
          </div>

          <div className="stack" style={{ marginBottom: 28 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Gabarito</h2>
            {result.questions.map((q, qi) => {
              const userAnswer = result.answers[qi]
              const correct = q.correct_index
              return (
                <div key={q.id} className="gabarito-item">
                  <p>{qi + 1}. {q.text}</p>
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === correct
                    const isWrong = oi === userAnswer && oi !== correct
                    return (
                      <div
                        key={oi}
                        className={`gabarito-option${isCorrect ? ' correct' : isWrong ? ' wrong' : ''}`}
                      >
                        {opt}
                        {isCorrect && ' ✓'}
                        {isWrong && ' ✗'}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <button className="button full" onClick={() => router.push(`/learn/${courseId}`)}>
            Ir para a Área de Aprendizado →
          </button>
        </main>
      </div>
    )
  }

  const current = questions[currentStep]
  const progress = Math.round(((currentStep + 1) / questions.length) * 100)
  const isLast = currentStep === questions.length - 1

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="main">
        <div className="quiz-screen">
          <div className="quiz-header">
            <div className="quiz-title-area">
              <div className="quiz-course-tag">{course?.category || 'Formação'}</div>
              <div className="quiz-heading">Quiz diário</div>
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-info">
              <span>Questão {currentStep + 1} de {questions.length}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="question-card">
            <div className="q-number">QUESTÃO {String(currentStep + 1).padStart(2, '0')}</div>
            <div className="q-text">{current.text}</div>
          </div>

          <div className="options-list">
            {current.options.map((opt, oi) => (
              <div
                key={oi}
                className={`option ${selections[currentStep] === oi ? 'selected' : ''}`}
                onClick={() => setSelections((prev) => ({ ...prev, [currentStep]: oi }))}
              >
                <div className="option-dot" />
                <div className="option-text">{opt}</div>
              </div>
            ))}
          </div>

          {notice && <div className="alert" style={{ marginTop: 16 }}>{notice}</div>}

          <div className="quiz-footer">
            <button className="next-btn" onClick={handleNext} disabled={submitting}>
              {submitting ? 'Enviando...' : isLast ? 'Finalizar →' : 'Próxima →'}
            </button>
            <div className="ia-badge">
              <div className="ia-dot" />
              <span>Gerado por IA · único a cada acesso</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
