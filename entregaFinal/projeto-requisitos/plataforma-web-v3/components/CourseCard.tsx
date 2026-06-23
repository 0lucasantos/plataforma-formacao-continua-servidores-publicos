'use client'
import { useRouter } from 'next/navigation'
import type { CourseWithBadge } from '@/types'

const COURSE_ICONS: Record<string, string> = {
  Design: '🎨',
  Código: '⚡',
  Negócios: '💼',
  Dados: '📊',
  IA: '🤖',
  Gestão: '📋',
  Tecnologia: '💻',
  Saúde: '🏥',
  Direito: '⚖️',
}

function getCourseIcon(category: string) {
  return COURSE_ICONS[category] ?? '📚'
}

interface Props {
  course: CourseWithBadge
}

// Deriva o estado da progressão de fases a partir dos dados do curso e badge.
// badge === 'complete'  → todas as fases concluídas
// badge === 'progress'  → pelo menos uma fase aprovada, mas não a última
// badge === undefined   → nenhuma fase aprovada ainda
function getProgressLabel(course: CourseWithBadge): { text: string; className: string } {
  const totalPhases = course.phases?.length ?? 0

  if (course.badge?.type === 'complete') {
    return { text: 'Concluído ★', className: 'quiz-done-message' }
  }
  if (course.badge?.type === 'progress') {
    const label = totalPhases > 0 ? `Em progresso · ${totalPhases} fases` : 'Em progresso ◑'
    return { text: label, className: 'quiz-pending-message' }
  }
  const label = totalPhases > 0 ? `Quiz diário · ${totalPhases} fases` : 'Quiz diário pendente'
  return { text: label, className: 'quiz-pending-message' }
}

export default function CourseCard({ course }: Props) {
  const router = useRouter()

  function handleClick() {
    router.push(`/courses/${course.id}`)
  }

  const badge = course.badge
  const icon = getCourseIcon(course.category)
  const { text: progressText, className: progressClass } = getProgressLabel(course)

  return (
    <article
      className="course-modern-card clickable-course-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="course-card-top">
        <div className="course-icon">{icon}</div>

        {badge?.type === 'complete' && (
          <div className="featured-badge" title="Selo de conclusão">
            <span>★</span>
          </div>
        )}
        {badge?.type === 'progress' && (
          <div className="featured-badge progress" title="Selo de progresso">
            <span>◑</span>
          </div>
        )}
        {!badge && <span />}
      </div>

      <div className="course-card-content">
        <h3>{course.title}</h3>
        <span className="course-category">{course.category || 'Geral'}</span>
      </div>

      <div className="course-card-footer">
        <div>
          {course.modules_count !== undefined && (
            <span>{course.modules_count} módulos</span>
          )}
          <div className={progressClass}>{progressText}</div>
        </div>

        {/* Indicador de fases — apenas quando há fases configuradas */}
        {(course.phases?.length ?? 0) > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
            title={`${course.phases!.length} fases`}
          >
            {course.phases!.map((_, i) => {
              // Fase passada: badge complete = todas; badge progress = ao menos 1ª
              const passed =
                badge?.type === 'complete' ||
                (badge?.type === 'progress' && i === 0)
              return (
                <span
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: passed ? 'var(--ok)' : 'var(--line)',
                    border: passed ? 'none' : '1.5px solid #cbd5e1',
                    flexShrink: 0,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
