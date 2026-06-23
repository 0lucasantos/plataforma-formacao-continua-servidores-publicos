'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuizData, submitQuiz } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import type { GeneratedQuestion, CoursePhase } from '@/types'
import { ChevronLeft } from 'lucide-react';
import Link from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos dos estados da tela
// ---------------------------------------------------------------------------

type QuizState =
  | { kind: 'loading' }
  | { kind: 'cooldown';    daysRemaining: number; unlocksOn: string; phaseDifficulty: string }
  | { kind: 'daily-lock';  retryAfter: string }
  | { kind: 'questions';   attemptId: string; questions: GeneratedQuestion[]; phase: CoursePhase; phaseIndex: number; courseTitle: string }
  | {
      kind: 'result'
      score: number
      total: number
      pct: number
      passed: boolean
      badgeType: string
      nextPhaseUnlocksOn: string | null
      nextPhaseIndex: number | null
      phase: CoursePhase
      questions: GeneratedQuestion[]
      answers: number[]
      courseTitle: string
    }
  | { kind: 'error';       message: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const DIFFICULTY_LABEL: Record<string, string> = {
  'Fácil':  '🟢 Fácil',
  'Médio':  '🟡 Médio',
  'Difícil':'🔴 Difícil',
}

// ---------------------------------------------------------------------------
// Sub-tela: Carregando
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="quiz-gate-screen">
      <div className="quiz-gate-card">
        <div className="quiz-gate-icon">⏳</div>
        <p style={{ color: 'var(--muted)', fontWeight: 700 }}>Preparando seu quiz...</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-tela: Cooldown (fase bloqueada por repetição espaçada)
// ---------------------------------------------------------------------------

function CooldownScreen({
  daysRemaining,
  unlocksOn,
  phaseDifficulty,
  courseTitle,
  onBack,
}: {
  daysRemaining: number
  unlocksOn: string
  phaseDifficulty: string
  courseTitle: string
  onBack: () => void
}) {
  return (
    <div className="quiz-gate-screen">
      <div className="quiz-gate-card cooldown-card">

        <div className="cooldown-status">
          Fase bloqueada
        </div>

        <p className="quiz-gate-course">
          {courseTitle}
        </p>

        <h2 className="cooldown-title">
          Próxima fase indisponível no momento
        </h2>

        <p className="cooldown-text">
          A próxima etapa
          <strong>
            {' '}({DIFFICULTY_LABEL[phaseDifficulty] ?? phaseDifficulty}){' '}
          </strong>
          será liberada em
          <strong>
            {' '}
            {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
          </strong>
          , respeitando o processo de aprendizagem por repetição espaçada.
        </p>

        <div className="cooldown-date-card">
          <span className="cooldown-date-label">
            Disponível a partir de
          </span>

          <strong className="cooldown-date">
            {formatDate(unlocksOn)}
          </strong>
        </div>

        <p className="cooldown-helper">
          Enquanto isso, revise os módulos do curso para reforçar o aprendizado.
        </p>

        <div className="quiz-gate-actions">
          <button className="button" onClick={onBack}>
            Continuar para o curso
          </button>
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-tela: Trava diária (falhou hoje, tente amanhã)
// ---------------------------------------------------------------------------

function DailyLockScreen({
  courseTitle,
  onBack,
}: {
  courseTitle: string
  onBack: () => void
}) {
  return (
    <div className="quiz-gate-screen">
      <div className="quiz-gate-card daily-lock-card">

        <div className="daily-lock-status">
          Quiz indisponível
        </div>

        <p className="quiz-gate-course">
          {courseTitle}
        </p>

        <h2 className="daily-lock-title">
          Tente novamente amanhã
        </h2>

        <p className="daily-lock-text">
          Você já realizou o quiz desta fase hoje e não atingiu a
          pontuação mínima necessária para avançar.
        </p>

        <div className="daily-lock-alert">
          <span className="daily-lock-alert-title">
            Próxima tentativa
          </span>

          <p className="daily-lock-alert-text">
            Um novo quiz estará disponível amanhã.
          </p>
        </div>

        <div className="daily-lock-tip">
          <strong>Dica:</strong> revise os módulos do curso e utilize
          o tutor de IA para reforçar o aprendizado antes da próxima tentativa.
        </div>

        <div className="quiz-gate-actions">
          <button className="button" onClick={onBack}>
            Continuar para o curso
          </button>
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-tela: Perguntas
// ---------------------------------------------------------------------------

function QuestionsScreen({
  attemptId,
  questions,
  phase,
  phaseIndex,
  courseTitle,
  onComplete,
  onExit,
}: {
  attemptId: string
  questions: GeneratedQuestion[]
  phase: CoursePhase
  phaseIndex: number
  courseTitle: string
  onComplete: (answers: number[]) => void
  onExit: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [submitting, setSubmitting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const q = questions[current]
  const selected = answers[current]
  const isLast = current === questions.length - 1
  const progress = Math.round(((current + 1) / questions.length) * 100)

  function selectOption(idx: number) {
    setAnswers((prev) => { const next = [...prev]; next[current] = idx; return next })
  }

  function handleNext() {
    if (selected === -1) return
    if (!isLast) { setCurrent((c) => c + 1); return }
    setSubmitting(true)
    onComplete(answers)
  }

  return (
    <div className="quiz-screen">
      {/* Cabeçalho */}
      <div className="quiz-header-modern">
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
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

        <span className="quiz-breadcrumb">
          Cursos / {courseTitle}
        </span>

        <h1 className="quiz-heading">
          Fase {phaseIndex + 1}
        </h1>

        <div className="quiz-meta">
          <span className="quiz-badge">
            {DIFFICULTY_LABEL[phase.difficulty] ?? phase.difficulty}
          </span>

        </div>
      </div>

      {/* Barra de progresso */}
      <div className="progress-bar-wrap">
        <div className="progress-info">
          <span>Questão {current + 1} de {questions.length}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card da questão */}
      <div className="question-card">
        <p className="q-number">QUESTÃO {current + 1}</p>
        <p className="q-text">{q.text}</p>
        <p className="q-instruction">Selecione a resposta correta</p>

        <div className="options-list">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`option${selected === i ? ' selected' : ''}`}
              onClick={() => selectOption(i)}
              disabled={submitting}
            >
              <span className="option-dot" />
              <span className="option-text">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="quiz-footer">
          <button
            className="next-btn"
            onClick={handleNext}
            disabled={selected === -1 || submitting}
          >
            {submitting ? 'Enviando...' : isLast ? 'Finalizar quiz' : 'Próxima questão'}
          </button>

          <div className="ia-badge">
            <span className="ia-dot" />
            <span>Questões geradas por IA · Gemini 2.0 Flash</span>
          </div>
        </div>
      
      {/* Modal de confirmação de saída */}
      {showExitModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Sair do quiz?</h3>

              <p>
                Se você sair agora, perderá o progresso desta tentativa
                e precisará iniciar o quiz novamente.
              </p>

              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setShowExitModal(false)}
                >
                  Continuar respondendo
                </button>

                <button
                  className="button danger"
                  onClick={onExit}
                >
                  Sair do quiz
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
  )
}

// ---------------------------------------------------------------------------
// Sub-tela: Resultado
// ---------------------------------------------------------------------------

function ResultScreen({
  score, total, pct, passed, badgeType,
  nextPhaseUnlocksOn, nextPhaseIndex,
  phase, questions, answers,
  courseTitle, onBack,
}: {
  score: number; total: number; pct: number; passed: boolean
  badgeType: string; nextPhaseUnlocksOn: string | null; nextPhaseIndex: number | null
  phase: CoursePhase; questions: GeneratedQuestion[]; answers: number[]
  courseTitle: string; onBack: () => void
}) {
  const isComplete = badgeType === 'complete'
  const isProgress = badgeType === 'progress'

  // Determina aparência do card de resultado
  const resultClass = isComplete ? 'complete' : isProgress ? 'progress' : 'none'
  const resultIcon  = isComplete ? '🏆' : isProgress ? '⭐' : passed ? '✅' : '📝'
  const resultTitle = isComplete
    ? 'Curso concluído!'
    : isProgress
    ? 'Fase aprovada!'
    : passed
    ? 'Fase aprovada!'
    : 'Não foi dessa vez'
  const resultSub = isComplete
    ? `Parabéns! Você concluiu todas as fases de "${courseTitle}".`
    : passed
    ? `Você acertou ${score} de ${total} questões (${pct}%).`
    : `Você acertou ${score} de ${total} questões (${pct}%). Nota mínima: ${phase.threshold}%.`

  return (
    <div className="quiz-screen">
      {/* Card principal de resultado */}
      <div className={`quiz-result-card ${resultClass}`}>
        <div className="quiz-result-status">
          {passed ? 'Aprovado' : 'Não aprovado'}
        </div>
        <h2 className="quiz-result-title">{resultTitle}</h2>
        <p className="quiz-result-sub">{resultSub}</p>

        {/* Badge conquistada */}
        {(isComplete || isProgress) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 999,
              background: isComplete
                ? 'linear-gradient(135deg, #ffe27a, #ffbf00)'
                : 'linear-gradient(135deg, #dbeafe, #60a5fa)',
              fontWeight: 700,
              fontSize: 14,
              color: isComplete ? '#78350f' : '#1e3a5f',
            }}
          >
            {isComplete ? '★ Selo de Conclusão conquistado!' : '◑ Selo de Progresso conquistado!'}
          </div>
        )}

        {/* Próxima fase desbloqueada em X dias */}
        {passed && nextPhaseIndex !== null && nextPhaseUnlocksOn && (
          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              background: 'rgba(0,129,244,.08)',
              border: '1px solid rgba(0,129,244,.2)',
              borderRadius: 14,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
              🔒 Próxima fase (Fase {nextPhaseIndex + 1})
            </p>
            <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
              Disponível em{' '}
              <strong>{formatDate(nextPhaseUnlocksOn)}</strong>
              {' '}— o intervalo consolida o aprendizado!
            </p>
          </div>
        )}

        {/* Tente amanhã (falhou) */}
        {!passed && (
          <div
            style={{
              marginTop: 20,
              padding: '14px 18px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 14,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#c2410c' }}>
              ⏰ Tente novamente amanhã
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7c2d12', lineHeight: 1.5 }}>
              Revise os módulos e use o tutor de IA para se preparar melhor.
            </p>
          </div>
        )}
      </div>

      {/* Gabarito */}
      <h3 style={{ fontWeight: 800, marginBottom: 14 }}>Gabarito</h3>
      <div className="stack" style={{ gap: 12 }}>
        {questions.map((q, i) => {
          const userAnswer = answers[i]
          const correct = q.correct_index
          const hit = userAnswer === correct
          return (
            <div key={i} className="gabarito-item">
              <p>{i + 1}. {q.text}</p>
              {q.options.map((opt, j) => {
                let cls = 'gabarito-option'
                if (j === correct) cls += ' correct'
                else if (j === userAnswer && !hit) cls += ' wrong'
                return <div key={j} className={cls}>{opt}</div>
              })}
            </div>
          )
        })}
      </div>

      {/* Ações */}
      <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="button" onClick={onBack}>
          Continuar para o curso
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<QuizState>({ kind: 'loading' })
  const [courseTitle, setCourseTitle] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }

    getQuizData(courseId)
      .then((data) => {
        // Salva o título do curso para usar em todas as sub-telas
        if (data.course?.title) setCourseTitle(data.course.title)

        // Curso já finalizado — redireciona para conteúdo
        if (data.course_completed) {
          router.replace(`/learn/${courseId}`)
          return
        }

        // Passou hoje — redireciona para conteúdo
        if (data.taken_today && data.passed) {
          router.replace(`/learn/${courseId}`)
          return
        }

        // Falhou hoje — trava diária
        if (data.taken_today && !data.passed) {
          setState({ kind: 'daily-lock', retryAfter: 'tomorrow' })
          return
        }

        // Cooldown entre fases (API retornou 403 com cooldown_days_remaining)
        if (data.cooldown_days_remaining != null) {
          setState({
            kind: 'cooldown',
            daysRemaining: data.cooldown_days_remaining,
            unlocksOn: data.unlocks_on ?? '',
            phaseDifficulty: data.next_phase_difficulty ?? '',
          })
          return
        }

        // Quiz disponível
        if (data.questions && data.attempt) {
          setState({
            kind: 'questions',
            attemptId: data.attempt.id,
            questions: data.questions,
            phase: data.phase,
            phaseIndex: data.phase_index ?? 0,
            courseTitle: data.course?.title ?? 'Curso',
          })
          return
        }

        setState({ kind: 'error', message: 'Não foi possível carregar o quiz. Tente novamente.' })
      })
      .catch((err: any) => {
        // HTTP 403 vindo diretamente como erro do fetch
        const d = err?.data ?? {}
        if (d.cooldown_days_remaining != null) {
          setState({
            kind: 'cooldown',
            daysRemaining: d.cooldown_days_remaining as number,
            unlocksOn: (d.unlocks_on as string) ?? '',
            phaseDifficulty: (d.next_phase_difficulty as string) ?? '',
          })
          return
        }
        if (d.retry_after === 'tomorrow') {
          setState({ kind: 'daily-lock', retryAfter: 'tomorrow' })
          return
        }
        // Erro 422: curso não tem fases configuradas
        if (err?.status === 422) {
          setState({ kind: 'error', message: d.error ?? 'Este curso não possui fases configuradas.' })
          return
        }
        setState({ kind: 'error', message: 'Erro ao carregar o quiz. Tente novamente mais tarde.' })
      })
  }, [courseId, user, authLoading])

  async function handleComplete(answers: number[]) {
    if (state.kind !== 'questions') return
    const { attemptId, courseTitle } = state

    try {
      const result = await submitQuiz(courseId, { attempt_id: attemptId, answers })
      setState({
        kind: 'result',
        score: result.score,
        total: result.total,
        pct: result.pct,
        passed: result.passed,
        badgeType: result.badge_type,
        nextPhaseUnlocksOn: result.next_phase_unlocks_on ?? null,
        nextPhaseIndex: result.next_phase_index ?? null,
        phase: result.phase,
        questions: result.questions,
        answers: result.answers,
        courseTitle,
      })
    } catch {
      setState({ kind: 'error', message: 'Erro ao enviar respostas. Tente novamente.' })
    }
  }

  function handleBack() {
    router.replace(`/learn/${courseId}`)
  }

  // ---------------------------------------------------------------------------
  // Render condicional por estado
  // ---------------------------------------------------------------------------

  if (authLoading || state.kind === 'loading') return <LoadingScreen />

  if (state.kind === 'error') {
    return (
      <div className="quiz-gate-screen">
        <div className="quiz-gate-card">
          <div className="quiz-gate-icon">⚠️</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{state.message}</p>
          <div className="quiz-gate-actions">
            <button className="button secondary" onClick={handleBack}>Continuar para o curso</button>
            <button className="button" onClick={() => { setState({ kind: 'loading' }) }}>Tentar novamente</button>
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'cooldown') {
    return (
      <CooldownScreen
        daysRemaining={state.daysRemaining}
        unlocksOn={state.unlocksOn}
        phaseDifficulty={state.phaseDifficulty}
        courseTitle={courseTitle}
        onBack={handleBack}
      />
    )
  }

  if (state.kind === 'daily-lock') {
    return <DailyLockScreen courseTitle={courseTitle} onBack={handleBack} />
  }

  if (state.kind === 'questions') {
    return (
      <QuestionsScreen
        attemptId={state.attemptId}
        questions={state.questions}
        phase={state.phase}
        phaseIndex={state.phaseIndex}
        courseTitle={state.courseTitle}
        onComplete={handleComplete}
        onExit={() => router.push('/catalog')}
      />
    )
  }

  if (state.kind === 'result') {
    return (
      <ResultScreen
        score={state.score}
        total={state.total}
        pct={state.pct}
        passed={state.passed}
        badgeType={state.badgeType}
        nextPhaseUnlocksOn={state.nextPhaseUnlocksOn}
        nextPhaseIndex={state.nextPhaseIndex}
        phase={state.phase}
        questions={state.questions}
        answers={state.answers}
        courseTitle={state.courseTitle}
        onBack={handleBack}
      />
    )
  }

  return null
}
