import type { Module, Question } from '../types'

// TODO: substituir por geração procedural via IA (Claude / LearnLM)
// A função deve receber o conteúdo do módulo e gerar perguntas automaticamente.
// Por enquanto retorna as perguntas cadastradas manualmente pelo admin.
export async function getQuestions(module: Module): Promise<Question[]> {
  return module.questions
}

export function gradeQuiz(
  questions: Question[],
  answers: number[]
): { score: number; total: number; passed: boolean } {
  const correct = questions.filter(
    (q, i) => q.correct_index === answers[i]
  ).length

  return {
    score: correct,
    total: questions.length,
    passed: questions.length === 0 || correct / questions.length >= 0.6,
  }
}
