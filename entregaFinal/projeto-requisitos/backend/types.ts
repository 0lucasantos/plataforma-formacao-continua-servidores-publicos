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
  threshold: number      // Percentual mínimo para passar (ex: 70)
  cooldown_days: number  // Dias de espera antes de tentar a próxima fase
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  published: boolean
  phases: CoursePhase[]
  created_at: string
  modules?: Module[]
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
  phase_index: number   // Índice da fase (0, 1, 2…) a que esta tentativa pertence
  date: string
  questions: GeneratedQuestion[]
  answers?: number[]
  score?: number
  total?: number
  pct?: number
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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}