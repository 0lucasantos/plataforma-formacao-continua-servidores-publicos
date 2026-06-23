import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import { chatWithAI } from '../lib/gemini'
import type { ChatMessage } from '../../types'

const router = Router()

/**
 * POST /api/ai-chat
 *
 * Chat interativo com assistente de IA especializado em cursos
 *
 * Body:
 *   - courseTitle (string): Título do curso para contexto da IA
 *   - messages (ChatMessage[]): Histórico da conversa
 *
 * Respostas:
 *   - 200: { reply: string } - Resposta da IA
 *   - 400: Validação de entrada falhou
 *   - 500: Erro interno
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { courseTitle, messages } = req.body as {
      courseTitle?: unknown
      messages?: unknown
    }

    // Validar inputs
    if (typeof courseTitle !== 'string' || !courseTitle.trim()) {
      return res.status(400).json({ error: 'courseTitle deve ser uma string não vazia' })
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages deve ser um array não vazio' })
    }

    // Validar estrutura das mensagens
    const validMessages = messages.every(
      (msg): msg is ChatMessage =>
        typeof msg === 'object' &&
        msg !== null &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
    )

    if (!validMessages) {
      return res.status(400).json({
        error: 'Cada mensagem deve ter role (user|assistant) e content (string não vazia)',
      })
    }

    // Limitar histórico para evitar tokens excessivos
    const maxHistoryLength = 20
    const trimmedMessages = messages.slice(-maxHistoryLength)

    console.log(`[Chat] Processando chat para ${courseTitle} (${messages.length} mensagens)`)
    
    const reply = await chatWithAI(courseTitle, trimmedMessages as ChatMessage[])
    
    return res.json({ reply })
  } catch (error) {
    console.error('[Chat] Erro ao processar:', error instanceof Error ? error.message : String(error))
    return res.status(500).json({
      error: 'Erro ao processar mensagem. Tente novamente mais tarde.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    })
  }
})

export default router
