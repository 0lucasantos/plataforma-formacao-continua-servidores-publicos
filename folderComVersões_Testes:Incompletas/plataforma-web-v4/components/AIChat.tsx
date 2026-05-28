'use client'
import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '@/lib/db'
import type { ChatMessage } from '@/types'

export default function AIChat({ courseTitle }: { courseTitle: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Olá! Sou seu assistente de aprendizado para o curso "${courseTitle}". Como posso ajudar?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const { reply } = await sendChatMessage(courseTitle, next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Ocorreu um erro. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-screen">
      <div className="chat-header">🤖 Assistente IA — {courseTitle}</div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg${m.role === 'user' ? ' user' : ''}`}>
            {m.role === 'assistant' && <div className="chat-bot-icon">🤖</div>}
            <div className={`chat-bubble${m.role === 'user' ? ' user' : ''}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg">
            <div className="chat-bot-icon">🤖</div>
            <div className="chat-bubble" style={{ color: 'var(--muted)' }}>Digitando…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Faça uma pergunta sobre o curso…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}>➤</button>
      </div>
    </div>
  )
}
