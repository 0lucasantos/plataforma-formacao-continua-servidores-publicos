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

export default function CourseCard({ course }: Props) {
  const router = useRouter()

  function handleClick() {
    router.push(`/courses/${course.id}`)
  }

  const badge = course.badge
  const icon = getCourseIcon(course.category)

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
          {badge?.type === 'complete' && (
            <div className="quiz-done-message">Concluído ★</div>
          )}
          {badge?.type === 'progress' && (
            <div className="quiz-pending-message">Em progresso ◑</div>
          )}
          {!badge && (
            <div className="quiz-pending-message">Quiz diário pendente</div>
          )}
        </div>
      </div>
    </article>
  )
}
