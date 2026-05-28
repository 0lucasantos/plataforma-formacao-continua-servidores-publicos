import type {
  Course,
  CourseWithBadge,
  Badge,
  Module,
  Progress,
  User,
  BulletinPost,
  QuizAttempt,
  QuizResult,
  ChatMessage,
} from '../types'

function token(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const t = token()
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ---- Auth ----

export async function signIn(email: string, password: string): Promise<void> {
  const { token: t } = await api<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('auth_token', t)
}

export function signOut(): void {
  localStorage.removeItem('auth_token')
}

export async function getCurrentUser(): Promise<User | null> {
  if (!token()) return null
  return api<User>('/api/auth/me').catch(() => null)
}

// ---- Cursos ----

export async function getCourses(): Promise<Course[]> {
  return api('/api/courses')
}

export async function getCourse(id: string): Promise<Course | null> {
  return api<Course>(`/api/courses/${id}`).catch(() => null)
}

export async function getCourseModules(courseId: string): Promise<Module[]> {
  return api<Module[]>(`/api/courses/${courseId}/modules`).catch(() => [])
}

export async function getModule(id: string): Promise<Module | null> {
  return api<Module>(`/api/modules/${id}`).catch(() => null)
}

// ---- Badges ----

export async function getUserBadges(): Promise<Badge[]> {
  return api<Badge[]>('/api/badges')
}

export async function getCoursesWithBadge(): Promise<CourseWithBadge[]> {
  const [courses, badges] = await Promise.all([getCourses(), getUserBadges()])
  const badgeMap = new Map(badges.map((b) => [b.course_id, b]))
  return courses.map((course) => ({
    ...course,
    badge: badgeMap.get(course.id) ?? null,
  }))
}

// ---- Quiz ----

export async function getQuizStatus(courseId: string): Promise<{
  taken_today: boolean
  attempt?: QuizAttempt
  questions?: import('../types').GeneratedQuestion[]
}> {
  return api(`/api/quiz/${courseId}`)
}

export async function submitQuiz(courseId: string, answers: number[]): Promise<QuizResult> {
  return api(`/api/quiz/${courseId}`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export async function getQuizHistory(): Promise<QuizAttempt[]> {
  return api<QuizAttempt[]>('/api/quiz-history')
}

// ---- Bulletin Board ----

export async function getBulletinPosts(courseId: string): Promise<BulletinPost[]> {
  return api<BulletinPost[]>(`/api/bulletin/${courseId}`)
}

export async function createBulletinPost(
  courseId: string,
  title: string,
  content: string,
  url?: string,
  expires_at?: string
): Promise<BulletinPost> {
  return api(`/api/bulletin/${courseId}`, {
    method: 'POST',
    body: JSON.stringify({ title, content, url, expires_at }),
  })
}

export async function deleteBulletinPost(courseId: string, postId: string): Promise<void> {
  await api(`/api/bulletin/${courseId}/${postId}`, { method: 'DELETE' })
}

// ---- AI Chat ----

export async function sendChatMessage(
  courseTitle: string,
  messages: ChatMessage[]
): Promise<{ reply: string }> {
  return api('/api/ai-chat', {
    method: 'POST',
    body: JSON.stringify({ courseTitle, messages }),
  })
}

// ---- Progresso ----

export async function getUserProgress(): Promise<Progress[]> {
  return api('/api/progress')
}

export async function saveProgress(moduleId: string, quizScore: number | null): Promise<void> {
  await api('/api/progress', { method: 'POST', body: JSON.stringify({ moduleId, quizScore }) })
}

// ---- Admin ----

export async function getAllCourses(): Promise<Course[]> {
  return api('/api/courses')
}

export async function createCourse(
  title: string,
  description: string,
  category = '',
  num_questions = 5,
  threshold_complete = 80,
  threshold_progress = 50
): Promise<Course> {
  return api('/api/courses', {
    method: 'POST',
    body: JSON.stringify({ title, description, category, num_questions, threshold_complete, threshold_progress }),
  })
}

export async function updateCourse(
  id: string,
  fields: Partial<Pick<Course, 'title' | 'description' | 'category' | 'published' | 'num_questions' | 'threshold_complete' | 'threshold_progress'>>
): Promise<void> {
  await api(`/api/courses/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
}

export async function deleteCourse(id: string): Promise<void> {
  await api(`/api/courses/${id}`, { method: 'DELETE' })
}

export async function createModule(
  courseId: string,
  title: string,
  content: string,
  order: number,
  questions: Module['questions']
): Promise<Module> {
  return api(`/api/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify({ title, content, order, questions }),
  })
}

export async function deleteModule(courseId: string, moduleId: string): Promise<void> {
  await api(`/api/modules/${moduleId}`, { method: 'DELETE' })
}
