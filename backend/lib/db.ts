import { supabase, supabaseAdmin } from './supabase'
import type { Course, CourseWithProgress, Metrics, Module, Progress, User } from '../types'

// =============================================================
// Auth
// =============================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ?? null
}

// =============================================================
// Cursos — Servidor
// =============================================================

export async function getCourses(): Promise<Course[]> {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const { data } = await supabase
    .from('courses')
    .select('*, modules(*)')
    .eq('id', courseId)
    .eq('published', true)
    .single()

  if (!data) return null

  data.modules = (data.modules ?? []).sort(
    (a: Module, b: Module) => a.order - b.order
  )

  return data
}

export async function getModule(moduleId: string): Promise<Module | null> {
  const { data } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  return data ?? null
}

// =============================================================
// Progresso — Servidor
// =============================================================

export async function getUserProgress(userId: string): Promise<Progress[]> {
  const { data } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)

  return data ?? []
}

export async function saveProgress(
  userId: string,
  moduleId: string,
  quizScore: number | null
): Promise<void> {
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: userId, module_id: moduleId, quiz_score: quizScore })

  if (error) throw error
}

export async function getCoursesWithProgress(
  userId: string
): Promise<CourseWithProgress[]> {
  const [courses, progress] = await Promise.all([
    getCourses(),
    getUserProgress(userId),
  ])

  const completedModuleIds = new Set(progress.map((p) => p.module_id))

  const coursesWithModules = await Promise.all(
    courses.map(async (course) => {
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id)

      const total = modules?.length ?? 0
      const completed = modules?.filter((m) =>
        completedModuleIds.has(m.id)
      ).length ?? 0

      return { ...course, total_modules: total, completed_modules: completed }
    })
  )

  return coursesWithModules
}

// =============================================================
// Cursos — Admin
// =============================================================

export async function getAllCourses(): Promise<Course[]> {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createCourse(
  title: string,
  description: string
): Promise<Course> {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({ title, description })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCourse(
  courseId: string,
  fields: Partial<Pick<Course, 'title' | 'description' | 'published'>>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('courses')
    .update(fields)
    .eq('id', courseId)

  if (error) throw error
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) throw error
}

// =============================================================
// Módulos — Admin
// =============================================================

export async function createModule(
  courseId: string,
  title: string,
  content: string,
  order: number,
  questions: Module['questions']
): Promise<Module> {
  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({ course_id: courseId, title, content, order, questions })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateModule(
  moduleId: string,
  fields: Partial<Pick<Module, 'title' | 'content' | 'order' | 'questions'>>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('modules')
    .update(fields)
    .eq('id', moduleId)

  if (error) throw error
}

export async function deleteModule(moduleId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) throw error
}

// =============================================================
// Métricas — Admin
// =============================================================

export async function getMetrics(): Promise<Metrics> {
  const [{ count: total_users }, { data: progressData }] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('progress').select('user_id, users(secretaria)'),
  ])

  const total_completions = progressData?.length ?? 0

  const bySecretaria: Record<string, number> = {}
  progressData?.forEach((row: any) => {
    const sec: string = row.users?.secretaria ?? 'Não informada'
    bySecretaria[sec] = (bySecretaria[sec] ?? 0) + 1
  })

  return {
    total_users: total_users ?? 0,
    total_completions,
    completions_by_secretaria: Object.entries(bySecretaria).map(
      ([secretaria, count]) => ({ secretaria, count })
    ),
  }
}
