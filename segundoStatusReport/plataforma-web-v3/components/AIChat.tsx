'use client'
import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '@/lib/db'
import type { ChatMessage } from '@/types'

export default function AIChat({ courseTitle }: { courseTitle: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Olá! Sou seu assistente de aprendizado para o curso "${courseTitle}". Pergunte-me qualquer coisa sobre o conteúdo!`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const { reply } = await sendChatMessage(courseTitle, next)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, não foi possível responder agora. Tente novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chatbot-screen">
      <div className="chatbot-header">
        <h2>✦ Learn Your Way</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Aprenda do seu jeito — tire dúvidas sobre {courseTitle}
        </p>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'user-message' : 'bot-message'}>
            {msg.role === 'assistant' && <div className="bot-icon">✦</div>}
            <div className={`message-bubble${msg.role === 'user' ? ' user' : ''}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="bot-message">
            <div className="bot-icon">✦</div>
            <div className="message-bubble" style={{ color: 'var(--muted)' }}>
              Digitando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre o curso..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>↑</button>
      </form>
    </div>
  )
}
