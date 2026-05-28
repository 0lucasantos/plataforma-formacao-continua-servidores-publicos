import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'
import { chatWithAI } from '../lib/gemini'
import type { ChatMessage } from '../../types'

const router = Router()

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { courseTitle, messages } = req.body as {
    courseTitle: string
    messages: ChatMessage[]
  }

  if (!courseTitle || !messages || messages.length === 0) {
    return res.status(400).json({ error: 'courseTitle e messages são obrigatórios' })
  }

  try {
    const reply = await chatWithAI(courseTitle, messages)
    return res.json({ reply })
  } catch (error) {
    console.error('Erro ao processar chat:', error)
    return res.status(500).json({ error: 'Erro ao processar mensagem da IA' })
  }
})

export default router
