# 🚀 Guia Rápido - Integração Gemini

## Sobre Este Projeto

Plataforma de aprendizado contínuo para servidores públicos da cidade do Recife com:
- ✅ Geração dinâmica de quizzes com IA (Gemini)
- ✅ Assistente de aprendizado (chat com IA)
- ✅ Fases progressivas com spaced repetition
- ✅ Sistema de badges e reconhecimento

## Setup Rápido

### 1. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
echo "GEMINI_API_KEY=your_key_here" > .env
echo "PORT=3001" >> .env
echo "FRONTEND_URL=http://localhost:3002" >> .env

# Iniciar servidor
npm run dev
```

### 2. Configurar Frontend

```bash
cd ../plataforma-web-v3

# Instalar dependências
npm install

# Configurar .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:3001" > .env.local

# Iniciar servidor
npm run dev
```

### 3. Acessar Plataforma

- Frontend: http://localhost:3002
- Backend: http://localhost:3001/health

## Obtendo Gemini API Key

1. Acesse: https://ai.google.dev/
2. Clique em "Get API Key"
3. Crie um novo projeto
4. Copie a chave gerada
5. Adicione ao arquivo `.env` do backend

## Testando Integração

### Teste 1: Geração de Quiz
```bash
curl -X GET http://localhost:3001/api/quiz/course-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Teste 2: Chat com IA
```bash
curl -X POST http://localhost:3001/api/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseTitle": "Ética no Serviço Público",
    "messages": [
      {"role": "user", "content": "O que é ética?"}
    ]
  }'
```

## Arquitetura

```
projeto-pfcs/
├── backend/
│   ├── src/
│   │   ├── lib/gemini.ts          ← Lógica de IA
│   │   ├── routes/
│   │   │   ├── quiz.ts            ← Geração de questões
│   │   │   └── ai-chat.ts         ← Chat com assistente
│   │   └── index.ts
│   ├── package.json
│   └── .env                       ← Variáveis secretas
│
└── plataforma-web-v3/
    ├── app/
    │   ├── quiz/[courseId]/       ← Tela de quiz
    │   └── learn/[courseId]/      ← Tela de aprendizado
    ├── components/
    │   └── AIChat.tsx             ← Chat UI
    ├── lib/
    │   └── db.ts                  ← Cliente HTTP
    ├── package.json
    └── .env.local                 ← Variáveis públicas
```

## Fluxo de Dados

### Quiz
```
Usuário clica em "Iniciar Quiz"
    ↓
GET /api/quiz/:courseId
    ↓
Backend gera questões com Gemini
    ↓
Frontend exibe quiz
    ↓
Usuário responde
    ↓
POST /api/quiz/:courseId com respostas
    ↓
Backend calcula score e salva resultado
    ↓
Frontend mostra resultado + badges
```

### Chat
```
Usuário digita mensagem
    ↓
POST /api/ai-chat
    ↓
Backend envia para Gemini com contexto do curso
    ↓
Gemini responde
    ↓
Frontend mostra resposta
    ↓
Usuário continua conversa
```

## Debugging

### Backend Logs
```bash
# Terminal 1: Ver logs em tempo real
npm run dev

# Terminal 2: Fazer requisição
curl -X GET http://localhost:3001/api/quiz/course-123 \
  -H "Authorization: Bearer token"
```

### Frontend Logs
```bash
# Abrir DevTools no navegador
F12 → Console

# Verificar requisições
F12 → Network → Filter "ai-chat" ou "quiz"
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `GEMINI_API_KEY não configurado` | Verificar .env no backend |
| Quiz não gera questões | Verificar GEMINI_API_KEY válida |
| Chat não responde | Verificar logs do backend, aguardar timeout |
| CORS error | Verificar FRONTEND_URL no backend |
| Frontend não conecta | Verificar NEXT_PUBLIC_BACKEND_URL |

## Próximos Passos

1. **Testar localmente**
   - Criar uma conta
   - Acessar um curso
   - Iniciar quiz
   - Fazer perguntas no chat

2. **Personalizar Prompts**
   - Editar `src/lib/gemini.ts`
   - Modificar `DIFFICULTY_INSTRUCTIONS` para suas necessidades
   - Testar geração de questões

3. **Adicionar mais Funcionalidades**
   - Exportar questões como PDF
   - Histórico de desempenho
   - Recomendações personalizadas
   - Análise de gaps de aprendizado

## Suporte

Para problemas ou dúvidas:
1. Verificar logs no console
2. Consultar [GEMINI_INTEGRATION.md](./GEMINI_INTEGRATION.md)
3. Revisar código em `backend/src/lib/gemini.ts`

## Variáveis de Ambiente

### Backend (.env)
```env
GEMINI_API_KEY=sk_...                    # Obrigatório
PORT=3001                                # Padrão: 3001
FRONTEND_URL=http://localhost:3002       # Para CORS
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Performance

- **Geração de Quiz**: ~2-5 segundos (Gemini)
- **Resposta do Chat**: ~1-3 segundos (Gemini)
- **Fallback automático**: Se Gemini falhar, usa questões estáticas

## Segurança

✅ GEMINI_API_KEY nunca é exposto ao frontend
✅ Validação rigorosa de inputs
✅ CORS configurado
✅ Autenticação JWT obrigatória
✅ Rate limiting recomendado (não implementado)

## Recursos Adicionais

- [Google Gemini Documentation](https://ai.google.dev/docs)
- [Prompt Engineering Best Practices](https://ai.google.dev/docs/guides/prompt_best_practices)
- [Rate Limiting & Pricing](https://ai.google.dev/pricing)
