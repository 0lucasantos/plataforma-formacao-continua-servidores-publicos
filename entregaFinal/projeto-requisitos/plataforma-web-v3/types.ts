export type Role = 'servidor' | 'admin'

export interface User {
  id: string
  email: string
  name?: string
  secretaria: string
  matricula?: string
  role: Role
  created_at: string
}

export interface CoursePhase {
  id: string
  difficulty: 'Fácil' | 'Médio' | 'Difícil'
  num_questions: number
  threshold: number
  cooldown_days: number
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  published: boolean
  num_questions: number
  threshold_complete: number
  threshold_progress: number
  created_at: string
  modules?: Module[]
  modules_count?: number
  phases?: CoursePhase[]
}

export interface Module {
  id: string
  course_id: string
  title: string
  order: number
  content: string
  questions: Question[]
  created_at: string
}

export interface Question {
  id: string
  text: string
  options: string[]
  correct_index: number
}

export interface Progress {
  id: string
  user_id: string
  module_id: string
  quiz_score: number | null
  completed_at: string
}

export interface CourseWithProgress extends Course {
  total_modules: number
  completed_modules: number
}

export type BadgeType = 'complete' | 'progress'

export interface Badge {
  id: string
  user_id: string
  course_id: string
  type: BadgeType
  earned_at: string
}

export interface GeneratedQuestion {
  id: string
  text: string
  options: string[]
  correct_index: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  course_id: string
  date: string
  questions: GeneratedQuestion[]
  answers?: number[]
  score?: number
  total?: number
  badge_type?: BadgeType | 'none'
  completed: boolean
  taken_at: string
}

export interface BulletinPost {
  id: string
  course_id: string
  title: string
  content: string
  url?: string
  expires_at?: string
  created_at: string
}

export interface CourseWithBadge extends Course {
  badge?: Badge | null
}

export interface QuizResult {
  score: number
  total: number
  pct: number
  passed: boolean
  badge_type: BadgeType | 'none'
  phase: CoursePhase
  phase_index: number
  next_phase_index: number | null
  next_phase_unlocks_on: string | null
  questions: GeneratedQuestion[]
  answers: number[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
