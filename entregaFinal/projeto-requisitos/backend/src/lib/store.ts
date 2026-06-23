import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { Course, CoursePhase, Module, Progress, Badge, BadgeType, QuizAttempt, GeneratedQuestion, BulletinPost } from '../../types'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

interface DB {
  courses: Course[]
  progress: Progress[]
  quiz_attempts: QuizAttempt[]
  badges: Badge[]
  bulletin_posts: BulletinPost[]
}

function read(): DB {
  if (!fs.existsSync(DB_PATH)) {
    return { courses: [], progress: [], quiz_attempts: [], badges: [], bulletin_posts: [] }
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Partial<DB>
  return {
    courses: raw.courses ?? [],
    progress: raw.progress ?? [],
    quiz_attempts: raw.quiz_attempts ?? [],
    badges: raw.badges ?? [],
    bulletin_posts: raw.bulletin_posts ?? [],
  }
}

function write(db: DB) {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// ---- Time Travel ----
//
// Prioridade de resolução de "hoje" (YYYY-MM-DD, fuso BRT):
//   1. Parâmetro explícito `simulatedDate`  — vem do header x-simulated-date nas rotas
//   2. Variável de ambiente DATE_OVERRIDE    — útil em scripts de CI/seeds
//   3. Date.now() real ajustado para BRT    — comportamento de produção
//
// Usar o parâmetro explícito nas rotas evita estado global mutável
// que poderia vazar entre requisições concorrentes.

export function resolveToday(simulatedDate?: string | null): string {
  if (simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)) {
    return simulatedDate
  }
  if (process.env.DATE_OVERRIDE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.DATE_OVERRIDE)) {
    return process.env.DATE_OVERRIDE
  }
  // BRT = UTC-3
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Mantida por compatibilidade com código legado que não passou pelo refactor
function todayBRT(): string {
  return resolveToday()
}

// ---- Courses ----

export function listCourses(all = false): Course[] {
  const { courses } = read()
  return all ? courses : courses.filter((c) => c.published)
}

export function findCourse(id: string): Course | null {
  return read().courses.find((c) => c.id === id) ?? null
}

export function insertCourse(
  title: string,
  description: string,
  category = '',
  phases: CoursePhase[] = []
): Course {
  const db = read()
  const course: Course = {
    id: randomUUID(),
    title,
    description,
    category,
    published: false,
    phases,
    modules: [],
    created_at: new Date().toISOString(),
  }
  db.courses.push(course)
  write(db)
  return course
}

export function patchCourse(
  id: string,
  fields: Partial<Pick<Course, 'title' | 'description' | 'category' | 'published' | 'phases'>>
): void {
  const db = read()
  const i = db.courses.findIndex((c) => c.id === id)
  if (i < 0) return
  db.courses[i] = { ...db.courses[i], ...fields }
  write(db)
}

export function removeCourse(id: string): void {
  const db = read()
  db.courses = db.courses.filter((c) => c.id !== id)
  db.quiz_attempts = db.quiz_attempts.filter((a) => a.course_id !== id)
  db.badges = db.badges.filter((b) => b.course_id !== id)
  db.bulletin_posts = db.bulletin_posts.filter((bp) => bp.course_id !== id)
  write(db)
}

// ---- Modules ----

export function insertModule(courseId: string, data: Omit<Module, 'id' | 'course_id' | 'created_at'>): Module {
  const db = read()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) throw new Error('Course not found')
  const mod: Module = { ...data, id: randomUUID(), course_id: courseId, created_at: new Date().toISOString() }
  course.modules = [...(course.modules ?? []), mod]
  write(db)
  return mod
}

export function findModule(id: string): Module | null {
  return read().courses.flatMap((c) => c.modules ?? []).find((m) => m.id === id) ?? null
}

export function removeModule(id: string): void {
  const db = read()
  db.courses = db.courses.map((c) => ({ ...c, modules: (c.modules ?? []).filter((m) => m.id !== id) }))
  write(db)
}

// ---- Progress (legado) ----

export function listProgress(userId: string): Progress[] {
  return read().progress.filter((p) => p.user_id === userId)
}

export function upsertProgress(userId: string, moduleId: string, quizScore: number | null): void {
  const db = read()
  const i = db.progress.findIndex((p) => p.user_id === userId && p.module_id === moduleId)
  const entry: Progress = {
    id: i >= 0 ? db.progress[i].id : randomUUID(),
    user_id: userId,
    module_id: moduleId,
    quiz_score: quizScore,
    completed_at: new Date().toISOString(),
  }
  if (i >= 0) db.progress[i] = entry
  else db.progress.push(entry)
  write(db)
}

// ---- Quiz Attempts ----

/**
 * Busca uma tentativa do usuário para o curso na data fornecida e fase fornecida.
 * `today` deve ser obtido via resolveToday() na camada de rota.
 */
export function findAttemptByDateAndPhase(
  userId: string,
  courseId: string,
  phaseIndex: number,
  today: string
): QuizAttempt | null {
  return (
    read().quiz_attempts.find(
      (a) =>
        a.user_id === userId &&
        a.course_id === courseId &&
        a.phase_index === phaseIndex &&
        a.date === today
    ) ?? null
  )
}

/**
 * Retorna todas as tentativas completadas de um usuário para um curso,
 * ordenadas da mais recente para a mais antiga.
 */
export function listCompletedAttemptsByCourse(userId: string, courseId: string): QuizAttempt[] {
  return read()
    .quiz_attempts.filter(
      (a) => a.user_id === userId && a.course_id === courseId && a.completed
    )
    .sort((a, b) => b.taken_at.localeCompare(a.taken_at))
}

/**
 * Cria uma nova tentativa de quiz.
 * `today` e `phaseIndex` são fornecidos explicitamente pela rota.
 */
export function createQuizAttempt(
  userId: string,
  courseId: string,
  phaseIndex: number,
  questions: GeneratedQuestion[],
  today: string
): QuizAttempt {
  const db = read()
  const attempt: QuizAttempt = {
    id: randomUUID(),
    user_id: userId,
    course_id: courseId,
    phase_index: phaseIndex,
    date: today,
    questions,
    completed: false,
    taken_at: new Date().toISOString(),
  }
  db.quiz_attempts.push(attempt)
  write(db)
  return attempt
}

export function completeQuizAttempt(
  attemptId: string,
  answers: number[],
  score: number,
  total: number,
  pct: number,
  badge_type: BadgeType | 'none'
): void {
  const db = read()
  const i = db.quiz_attempts.findIndex((a) => a.id === attemptId)
  if (i < 0) return
  db.quiz_attempts[i] = {
    ...db.quiz_attempts[i],
    answers,
    score,
    total,
    pct,
    badge_type,
    completed: true,
  }
  write(db)
}

export function listAttemptsByUser(userId: string): QuizAttempt[] {
  return read()
    .quiz_attempts.filter((a) => a.user_id === userId && a.completed)
    .sort((a, b) => b.taken_at.localeCompare(a.taken_at))
}

// ---- Badges ----

export function listBadges(userId: string): Badge[] {
  return read().badges.filter((b) => b.user_id === userId)
}

const BADGE_RANK: Record<BadgeType, number> = { complete: 2, progress: 1 }

export function upsertBadge(userId: string, courseId: string, type: BadgeType): Badge {
  const db = read()
  const i = db.badges.findIndex((b) => b.user_id === userId && b.course_id === courseId)
  if (i >= 0) {
    const existing = db.badges[i]
    if (BADGE_RANK[type] <= BADGE_RANK[existing.type]) return existing
    db.badges[i] = { ...existing, type, earned_at: new Date().toISOString() }
    write(db)
    return db.badges[i]
  }
  const badge: Badge = {
    id: randomUUID(),
    user_id: userId,
    course_id: courseId,
    type,
    earned_at: new Date().toISOString(),
  }
  db.badges.push(badge)
  write(db)
  return badge
}

// ---- Bulletin Posts ----

export function listBulletinPosts(courseId: string): BulletinPost[] {
  const now = new Date().toISOString()
  return read()
    .bulletin_posts.filter((p) => p.course_id === courseId && (!p.expires_at || p.expires_at > now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function insertBulletinPost(
  courseId: string,
  title: string,
  content: string,
  url?: string,
  expires_at?: string
): BulletinPost {
  const db = read()
  const post: BulletinPost = {
    id: randomUUID(),
    course_id: courseId,
    title,
    content,
    url,
    expires_at,
    created_at: new Date().toISOString(),
  }
  db.bulletin_posts.push(post)
  write(db)
  return post
}

export function removeBulletinPost(id: string): void {
  const db = read()
  db.bulletin_posts = db.bulletin_posts.filter((p) => p.id !== id)
  write(db)
}