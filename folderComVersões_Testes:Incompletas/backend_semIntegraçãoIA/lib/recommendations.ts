import { supabase } from './supabase'
import type { Course } from '../types'

// TODO: substituir por integração com LearnYourWay (Google Labs)
// A função deve receber o perfil do usuário (secretaria, interesses)
// e retornar cursos ordenados por relevância personalizada.
export async function getRecommendedCourses(
  _userId: string,
  limit = 6
): Promise<Course[]> {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
