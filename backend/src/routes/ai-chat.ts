import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../lib/auth'

// PLACEHOLDER — substituir por integração com Gemini API
// Formato esperado: { courseTitle: string, messages: { role: 'user'|'assistant', content: string }[] }
const router = Router()

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { courseTitle, messages } = req.body
  const lastMessage = messages?.at(-1)?.content ?? ''

  const reply = `[IA em desenvolvimento] Você perguntou sobre "${courseTitle}": "${lastMessage}". Em breve a IA estará disponível para guiar seu aprendizado de forma personalizada.`

  return res.json({ reply })
})

export default router
