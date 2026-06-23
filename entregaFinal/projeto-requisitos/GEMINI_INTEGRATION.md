# Integração com Gemini - Documentação Técnica

## Visão Geral

Este projeto implementa integração completa com o Google Gemini para gerar quizzes dinâmicos e fornecer um assistente de IA para apoio ao aprendizado em cursos de formação contínua para servidores públicos da cidade do Recife.

## Arquitetura

### Backend (Node.js + Express)

#### Arquivo: `src/lib/gemini.ts`

Módulo central que encapsula toda a lógica de interação com a API Gemini.

**Principais Funções:**

##### 1. `generateQuizQuestions()`
Gera questões de múltipla escolha dinâmicas para um quiz.

```typescript
generateQuizQuestions(
  courseTitle: string,           // Ex: "Ética no Serviço Público"
  courseDescription: string,     // Descrição detalhada do curso
  numQuestions: number,          // Quantidade desejada (1-100)
  difficulty: 'Fácil' | 'Médio' | 'Difícil'
): Promise<GeneratedQuestion[]>
```

**Características:**
- Valida inputs antes de usar
- Cria questões com 4 opções de resposta
- Adapta dificuldade conforme solicitado
- Usa fallback de questões estáticas se Gemini falhar
- Log detalhado de operações

**Exemplo de Uso:**
```typescript
const questions = await generateQuizQuestions(
  "Ética no Serviço Público",
  "Princípios éticos e valores na administração pública",
  5,
  "Médio"
)
// Retorna array de 5 questões com dificuldade média
```

**Prompts Dinâmicos:**
O sistema inclui instruções específicas para cada nível de dificuldade:

- **Fácil**: Questões conceituais diretas, vocabulário acessível, distratores claramente incorretos
- **Médio**: Aplicação prática com cenários do cotidiano, exige compreensão, distratores plausíveis
- **Difícil**: Questões analíticas, raciocínio crítico, múltiplas variáveis, distratores tecnicamente defensáveis

##### 2. `chatWithAI()`
Fornece chat interativo com um assistente de IA especializado.

```typescript
chatWithAI(
  courseTitle: string,           // Contexto do curso
  messages: ChatMessage[]        // Histórico de conversa
): Promise<string>
```

**Características:**
- Mantém histórico de conversa
- Contexto específico do curso
- Limite de tokens para evitar respostas muito longas
- Sistema de prompt especializado para educadores
- Tratamento robusto de erros

**Exemplo de Uso:**
```typescript
const conversation: ChatMessage[] = [
  { role: 'user', content: 'O que é ética?' },
  { role: 'assistant', content: 'Ética é...' },
  { role: 'user', content: 'Como isso se aplica no serviço público?' }
]

const response = await chatWithAI("Ética no Serviço Público", conversation)
```

##### 3. `testGeminiConnection()`
Valida a disponibilidade da API Gemini.

```typescript
testGeminiConnection(): Promise<boolean>
```

### Routes (Express)

#### `routes/quiz.ts`

Gerencia a geração e avaliação de quizzes.

**GET /api/quiz/:courseId**
- Gera questões usando Gemini
- Valida fases e lockouts
- Retorna questionário pronto para responder

**POST /api/quiz/:courseId**
- Recebe respostas do usuário
- Calcula score e percentual
- Atribui badges de progresso

#### `routes/ai-chat.ts`

Endpoint do assistente de IA.

**POST /api/ai-chat**
- Valida entrada (courseTitle, messages)
- Chama `chatWithAI()` do gemini.ts
- Retorna resposta JSON

### Frontend (Next.js + React)

#### Componente: `components/AIChat.tsx`

Interface do usuário para o chat com IA.

**Features:**
- Interface conversacional intuitiva
- Auto-scroll para mensagens recentes
- Indicador de digitação
- Tratamento de erros com feedback visual
- Limite de caracteres (2000)
- Timeout de 30 segundos

**Props:**
```typescript
{
  courseTitle: string  // Título do curso
}
```

**Exemplo de Uso:**
```jsx
<AIChat courseTitle="Ética no Serviço Público" />
```

#### API Client: `lib/db.ts`

Cliente HTTP para comunicação com backend.

**Função: `sendChatMessage()`**
```typescript
sendChatMessage(
  courseTitle: string,
  messages: ChatMessage[]
): Promise<{ reply: string }>
```

## Fluxo de Dados

### Geração de Quiz

```
User clicks "Iniciar Quiz"
    ↓
Frontend GET /api/quiz/:courseId
    ↓
Backend (quiz.ts):
  1. Valida fase atual
  2. Verifica locks (diário, cooldown)
  3. Chama generateQuizQuestions()
    ↓
Backend (gemini.ts):
  1. Valida inputs
  2. Cria prompt com contexto do curso
  3. Chama Gemini API
  4. Parseia JSON da resposta
  5. Valida questões
  6. Usa fallback se necessário
    ↓
Backend retorna questões
    ↓
Frontend exibe quiz
```

### Chat com IA

```
User digita mensagem
    ↓
Frontend POST /api/ai-chat
  {
    courseTitle: "...",
    messages: [...]
  }
    ↓
Backend (ai-chat.ts):
  1. Valida courseTitle (string não vazia)
  2. Valida messages (array não vazio)
  3. Limita histórico a últimas 20 mensagens
  4. Chama chatWithAI()
    ↓
Backend (gemini.ts):
  1. Converte histórico para formato Gemini
  2. Define system prompt contextualizado
  3. Inicializa chat com histórico
  4. Envia última mensagem
  5. Retorna resposta da IA
    ↓
Backend retorna { reply: "..." }
    ↓
Frontend adiciona mensagem ao histórico
    ↓
User vê resposta
```

## Configuração

### Variáveis de Ambiente

**Backend (.env)**
```
GEMINI_API_KEY=sk_...           # Chave de API do Google Gemini
PORT=3001                        # Porta do servidor
FRONTEND_URL=http://localhost:3002
NODE_ENV=development
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Obtendo GEMINI_API_KEY

1. Acesse: https://ai.google.dev/
2. Clique em "Get API Key"
3. Crie um novo projeto ou selecione existente
4. Gere chave de API
5. Copie para .env

### Dependências

**Backend**
```json
{
  "@google/generative-ai": "^0.21.0"
}
```

**Frontend**
```json
{
  "next": "16.2.6",
  "react": "19.2.4"
}
```

## Melhores Práticas Implementadas

### 1. Validação Robusta
- Inputs validados em todas as funções
- Mensagens de erro específicas
- Type safety com TypeScript

### 2. Tratamento de Erros
- Try-catch com fallback em generateQuizQuestions
- Logging detalhado em development
- Mensagens amigáveis ao usuário

### 3. Performance
- Limite de histórico (20 mensagens)
- Timeout de requisições (30s)
- Cache implícito via localStorage

### 4. Documentação
- JSDoc comments em todas as funções
- Exemplos de uso
- Fluxos claramente documentados

### 5. Acessibilidade
- Labels ARIA em elementos do chat
- Descrições em buttons
- Feedback visual para erros

### 6. Separação de Responsabilidades
- gemini.ts: Lógica de IA
- routes/: Endpoints HTTP
- components/: UI React
- lib/: Clientes HTTP

## Monitoramento e Debugging

### Logs

**Backend (console)**
```
[Gemini] Gerando 5 questões (Médio) para: "Ética"
[Gemini] ✓ 5 questões geradas com sucesso
[Chat] Nova mensagem para o curso: "Ética"
[Chat] ✓ Resposta gerada com sucesso (1243 caracteres)
[Quiz] Gerando questões para course-123 (fase 0, Médio)
[Quiz] ✓ Questões geradas: 5 questões
```

**Frontend Console**
```
[AIChat] Erro: Network error
[Chat] Processando chat para Ética (3 mensagens)
```

### Debugging Gemini

Ativar debug:
```bash
# Backend
DEBUG=true npm run dev

# Verificar conexão
curl -X GET http://localhost:3001/health
```

## Troubleshooting

### Gemini API retorna erro 403
- Verificar GEMINI_API_KEY
- Verificar se projeto no Google Cloud está ativo
- Verificar quota de API

### Chat não responde
- Verificar logs do backend
- Verificar timeout (30s)
- Verificar limite de histórico

### Quiz não gera questões
- Verificar course.phases está configurado
- Verificar GEMINI_API_KEY
- Aguardar usar fallback automático

### Erro de CORS
- Verificar FRONTEND_URL no backend
- Verificar NEXT_PUBLIC_BACKEND_URL no frontend

## Performance e Escalabilidade

### Otimizações Atuais
- Fallback automático reduz falhas
- Histórico limitado (20 msgs) economiza tokens
- Validação de inputs evita requisições inválidas

### Sugestões de Melhoria

1. **Cache de Questões**
   ```typescript
   // Armazenar questões geradas por 24h
   const cache = new Map<string, CacheEntry>()
   ```

2. **Rate Limiting**
   ```typescript
   // Limitar requisições por usuário
   const limiter = rateLimit({ windowMs: 60000, max: 10 })
   ```

3. **Streaming para Chat**
   ```typescript
   // Enviar respostas em chunks SSE
   res.writeHead(200, { 'Content-Type': 'text/event-stream' })
   ```

4. **Batch Processing**
   ```typescript
   // Gerar múltiplos quizzes em paralelo
   Promise.all([generateQuizQuestions(...), ...])
   ```

## Testes Recomendados

### Unit Tests (Jest)
```typescript
describe('generateQuizQuestions', () => {
  it('deve gerar exatamente N questões', async () => {
    const qs = await generateQuizQuestions('Curso', 'Desc', 5, 'Fácil')
    expect(qs).toHaveLength(5)
  })

  it('deve validar inputs', async () => {
    expect(() => generateQuizQuestions('', 'Desc', 5, 'Fácil')).toThrow()
  })
})
```

### Integration Tests
```typescript
describe('POST /api/ai-chat', () => {
  it('deve responder com assistente', async () => {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        courseTitle: 'Ética',
        messages: [{ role: 'user', content: 'Teste' }]
      })
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.reply).toBeTruthy()
  })
})
```

### E2E Tests
```typescript
describe('Quiz Flow', () => {
  it('deve gerar quiz e permitir responder', async () => {
    // 1. GET /api/quiz/course-123
    // 2. Verificar questões
    // 3. POST /api/quiz/course-123 com respostas
    // 4. Verificar resultado
  })
})
```

## Segurança

### Considerações Atuais
- GEMINI_API_KEY nunca é exposto ao frontend
- Mensagens validadas para evitar injeção
- CORS configurado para apenas FRONTEND_URL
- Autenticação via JWT (requireAuth middleware)

### Recomendações Adicionais
1. Rate limiting por usuário
2. Sanitizar inputs antes de enviar para Gemini
3. Audit logging de geração de questões
4. Versionamento de prompts

## Referências

- [Google Gemini API](https://ai.google.dev/)
- [Documentação da Biblioteca](https://github.com/google/generative-ai-js)
- [Melhorias de Prompts](https://ai.google.dev/docs/guides/prompt_best_practices)
- [Rate Limiting](https://ai.google.dev/pricing)
