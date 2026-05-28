import Link from 'next/link'
import type { CourseWithBadge } from '@/types'

const ICON_MAP: Record<string, string> = {
  'Saúde': '🏥',
  'Gestão': '📊',
  'Tecnologia': '💻',
  'Direito': '⚖️',
  'Educação': '📚',
  'Finanças': '💰',
  'Comunicação': '📢',
  'Meio Ambiente': '🌿',
  'Urbanismo': '🏗️',
  'Assistência Social': '🤝',
}

function getIcon(category: string): string {
  return ICON_MAP[category] ?? '📋'
}

export default function CourseCard({ course }: { course: CourseWithBadge }) {
  const badgeType = course.badge?.type

  return (
    <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
      <div className="course-card">
        <div className="course-icon-circle">
          {getIcon(course.category)}
          {badgeType && (
            <div className={`course-badge-dot${badgeType === 'progress' ? ' progress' : ''}`}>
              {badgeType === 'complete' ? '✓' : '…'}
            </div>
          )}
        </div>

        <p className="course-card-title">{course.title}</p>

        {course.category && (
          <span className="course-cat-chip">{course.category}</span>
        )}

        <span className={`course-status${badgeType === 'complete' ? ' done' : badgeType === 'progress' ? ' pending' : ''}`}>
          {badgeType === 'complete'
            ? '✓ Concluído'
            : badgeType === 'progress'
              ? '⏳ Em progresso'
              : 'Disponível'}
        </span>
      </div>
    </Link>
  )
}
