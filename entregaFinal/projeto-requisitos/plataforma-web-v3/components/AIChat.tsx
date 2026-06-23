'use client'
import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '@/lib/db'
import type { ChatMessage } from '@/types'

interface AIChatProps {
  courseTitle: string
}

/**
 * Componente de chat com assistente de IA
 * 
 * Oferece interação em tempo real com um tutor de IA especializado
 * no conteúdo do curso específico.
 * 
 * Props:
 *   - courseTitle: Título do curso para contexto da IA
 */
export default function AIChat({ courseTitle }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Olá! Sou seu assistente de aprendizado para o curso "${courseTitle}". Pergunte-me qualquer coisa sobre o conteúdo! 📚`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll para a mensagem mais recente
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Limpar erro ao começar a digitar
  useEffect(() => {
    if (error && input.trim()) {
      setError(null)
    }
  }, [input, error])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    
    const text = input.trim()
    if (!text || loading) return

    // Validar comprimento máximo
    if (text.length > 2000) {
      setError('Sua mensagem é muito longa. Máximo de 2000 caracteres.')
      return
    }

    // Adicionar mensagem do usuário ao histórico
    const userMessage: ChatMessage = { role: 'user', content: text }
    const next: ChatMessage[] = [...messages, userMessage]
    
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Enviar para API com limite de timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao processar resposta')), 30000)
      )

      const responsePromise = sendChatMessage(courseTitle, next)
      const { reply } = await Promise.race([responsePromise, timeoutPromise])

      // Adicionar resposta ao histórico
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar mensagem'
      
      console.error('[AIChat] Erro:', errorMessage)
      setError(errorMessage)
      
      // Remover a mensagem do usuário se houve erro
      setMessages((prev) => prev.slice(0, -1))
      
      // Restaurar input
      setInput(text)
    } finally {
      setLoading(false)
      // Focar no input novamente
      inputRef.current?.focus()
    }
  }

  return (
    <div className="chatbot-screen">
      {/* Header */}
      <div className="chatbot-header">
        <h2>✦ Learn Your Way</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Aprenda do seu jeito — tire dúvidas sobre {courseTitle}
        </p>
      </div>

      {/* Mensagens */}
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'user-message' : 'bot-message'}>
            {msg.role === 'assistant' && <div className="bot-icon">✦</div>}
            <div className={`message-bubble${msg.role === 'user' ? ' user' : ''}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Indicador de digitação */}
        {loading && (
          <div className="bot-message">
            <div className="bot-icon">✦</div>
            <div className="message-bubble" style={{ color: 'var(--muted)' }}>
              <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>
                Digitando...
              </span>
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && (
          <div className="bot-message">
            <div className="bot-icon" style={{ color: 'var(--danger, #d32f2f)' }}>⚠</div>
            <div className="message-bubble" style={{ color: 'var(--danger, #d32f2f)', borderColor: 'rgba(211, 47, 47, 0.2)' }}>
              {error}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chatbot-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre o curso..."
          disabled={loading}
          maxLength={2000}
          aria-label="Mensagem para o assistente de IA"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          title={loading ? 'Processando...' : 'Enviar mensagem'}
          aria-label="Enviar mensagem"
        >
          ↑
        </button>
      </form>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
