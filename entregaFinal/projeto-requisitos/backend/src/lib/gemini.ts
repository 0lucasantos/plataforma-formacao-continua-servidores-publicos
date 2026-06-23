import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ChatMessage, GeneratedQuestion } from '../../types'

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY não configurado no .env')
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
  },
})

const DIFFICULTY_INSTRUCTIONS: Record<'Fácil' | 'Médio' | 'Difícil', string> = {
  'Fácil': `
NÍVEL DE DIFICULDADE: FÁCIL
- Elabore questões conceituais diretas sobre os fundamentos do tema
- Use vocabulário acessível e linguagem clara
- Cada questão deve ter uma resposta correta inequívoca
- Os distratores (respostas erradas) devem ser claramente incorretos para quem estudou o conteúdo básico`,

  'Médio': `
NÍVEL DE DIFICULDADE: MÉDIO
- Elabore questões de aplicação prática com cenários do cotidiano do servidor público
- As questões devem exigir compreensão, não apenas memorização
- Inclua distratores plausíveis que representem confusões comuns
- Ao menos metade das questões deve apresentar situações-problema reais`,

  'Difícil': `
NÍVEL DE DIFICULDADE: DIFÍCIL
- Elabore questões analíticas e de julgamento que exijam raciocínio crítico
- Apresente situações-problema complexas com múltiplas variáveis
- Todos os distratores devem ser tecnicamente defensáveis à primeira vista
- O candidato deve distinguir a resposta correta por profundidade de conhecimento, não por eliminação óbvia`,
}

const FALLBACK_POOL: Array<{ text: string; options: string[]; correct_index: number }> = [
  {
    text: 'Quais são os princípios constitucionais que regem a Administração Pública brasileira?',
    options: [
      'Legalidade, impessoalidade, moralidade, publicidade e eficiência',
      'Legalidade, hierarquia, disciplina, eficiência e publicidade',
      'Moralidade, discricionariedade, publicidade, hierarquia e legalidade',
      'Eficiência, legalidade, impessoalidade, discricionariedade e hierarquia',
    ],
    correct_index: 0,
  },
  {
    text: 'O que significa o princípio da legalidade para o servidor público?',
    options: [
      'Pode fazer tudo que a lei não proíbe',
      'Só pode fazer o que a lei expressamente autoriza',
      'Pode agir por iniciativa própria quando a lei for omissa',
      'Deve seguir apenas as ordens do superior hierárquico',
    ],
    correct_index: 1,
  },
  {
    text: 'O que é ética no serviço público?',
    options: [
      'Conjunto de normas que regem apenas o comportamento externo do servidor',
      'Conjunto de valores e princípios morais que orientam a conduta do servidor em prol do interesse público',
      'Regras disciplinares aplicadas apenas em casos de desvio de conduta',
      'Normas de etiqueta e protocolo no ambiente de trabalho',
    ],
    correct_index: 1,
  },
  {
    text: 'O que caracteriza o interesse público no serviço público?',
    options: [
      'O interesse da maioria dos servidores da instituição',
      'O interesse do governo federal em detrimento dos estados',
      'O bem comum da coletividade, que deve prevalecer sobre interesses particulares',
      'O interesse do partido político que está no poder',
    ],
    correct_index: 2,
  },
  {
    text: 'Qual é a principal finalidade da avaliação de desempenho no serviço público?',
    options: [
      'Punir servidores com baixo rendimento',
      'Subsidiar promoções e progressões baseadas no mérito e identificar necessidades de capacitação',
      'Reduzir o quadro de pessoal da instituição',
      'Comparar servidores para distribuição de bônus salariais',
    ],
    correct_index: 1,
  },
  {
    text: 'O que é accountability na gestão pública?',
    options: [
      'Controle financeiro exclusivo do Tribunal de Contas',
      'Responsabilização, transparência e prestação de contas dos agentes públicos perante a sociedade',
      'Auditoria interna realizada pela própria instituição',
      'Sistema de punição para servidores que cometem irregularidades',
    ],
    correct_index: 1,
  },
  {
    text: 'O que significa gestão por competências no setor público?',
    options: [
      'Selecionar servidores apenas com base em títulos acadêmicos',
      'Identificar, desenvolver e aplicar conhecimentos, habilidades e atitudes necessários ao alcance dos objetivos institucionais',
      'Avaliar servidores exclusivamente pelos resultados numéricos produzidos',
      'Limitar as atribuições do servidor às tarefas descritas no edital do concurso',
    ],
    correct_index: 1,
  },
  {
    text: 'O que é planejamento estratégico em organizações públicas?',
    options: [
      'Elaboração do orçamento anual da instituição',
      'Processo que define missão, visão, objetivos e metas de longo prazo alinhados ao interesse público',
      'Plano de carreira dos servidores elaborado pelo RH',
      'Cronograma de execução de obras e serviços públicos',
    ],
    correct_index: 1,
  },
  {
    text: 'O que caracteriza a impessoalidade na Administração Pública?',
    options: [
      'O servidor deve tratar todos os cidadãos de forma diferenciada conforme sua posição social',
      'A Administração deve agir sem favoritismos, atendendo a todos com isonomia e voltada ao interesse público',
      'O servidor não deve se identificar nos atos administrativos',
      'A proibição de servidores atenderem parentes no serviço público',
    ],
    correct_index: 1,
  },
  {
    text: 'O que é o princípio da eficiência na Administração Pública?',
    options: [
      'Realizar o maior número de tarefas possível independente da qualidade',
      'Prestar serviços públicos com qualidade, rapidez e economicidade, maximizando resultados com os recursos disponíveis',
      'Reduzir ao máximo os custos da administração, mesmo que isso afete a qualidade dos serviços',
      'Cumprir metas numéricas estabelecidas pelo governo sem considerar o impacto social',
    ],
    correct_index: 1,
  },
]

function generateFallbackQuestions(numQuestions: number): GeneratedQuestion[] {
  const { randomUUID } = require('crypto')
  const shuffled = [...FALLBACK_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(numQuestions, FALLBACK_POOL.length)).map((item) => ({
    id: randomUUID(),
    ...item,
  }))
}

export async function generateQuizQuestions(
  courseTitle: string,
  courseDescription: string,
  numQuestions: number,
  difficulty: 'Fácil' | 'Médio' | 'Difícil'
): Promise<GeneratedQuestion[]> {
  if (!courseTitle?.trim()) {
    throw new Error('courseTitle é obrigatório')
  }
  if (typeof numQuestions !== 'number' || numQuestions < 1 || numQuestions > 100) {
    throw new Error('numQuestions deve estar entre 1 e 100')
  }
  if (!['Fácil', 'Médio', 'Difícil'].includes(difficulty)) {
    throw new Error('difficulty deve ser: Fácil, Médio ou Difícil')
  }

  const { randomUUID } = await import('crypto')
  const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[difficulty]

  const prompt = `
Você é um especialista em educação e avaliação. Gere exatamente ${numQuestions} questões de múltipla escolha em português para um curso de formação contínua para servidores públicos.

Curso: "${courseTitle}"
Descrição: "${courseDescription}"
${difficultyInstruction}

REGRAS OBRIGATÓRIAS:
1. Gere EXATAMENTE ${numQuestions} questões
2. Cada questão deve ter EXATAMENTE 4 opções de resposta (A, B, C, D)
3. As questões devem ser relevantes para o contexto de formação de servidores públicos
4. Indique o índice da resposta correta (0 = primeira opção, 1 = segunda, 2 = terceira, 3 = quarta)
5. Siga rigorosamente o nível de dificuldade especificado acima
6. Evite questões duplicadas ou muito similares
7. Use linguagem clara e objetiva

Responda APENAS em JSON válido, sem explicações, sem blocos de código markdown. Formato exato:
[
  {
    "text": "Enunciado da questão?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct_index": 1
  }
]
`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta do Gemini')
    }

    const questions = JSON.parse(jsonMatch[0]) as Array<{
      text: string
      options: string[]
      correct_index: number
    }>

    const normalized = questions
      .slice(0, numQuestions)
      .filter((q) => q.text?.trim() && Array.isArray(q.options) && q.options.length >= 4)
      .map((q) => ({
        id: randomUUID(),
        text: q.text.trim(),
        options: q.options.slice(0, 4),
        correct_index: Math.min(Math.max(Math.floor(q.correct_index ?? 0), 0), 3),
      }))

    return normalized.length > 0 ? normalized : generateFallbackQuestions(numQuestions)
  } catch (error) {
    console.error('[Gemini] Erro ao gerar perguntas:', error)
    return generateFallbackQuestions(numQuestions)
  }
}

export async function chatWithAI(
  courseTitle: string,
  messages: ChatMessage[]
): Promise<string> {
  if (!courseTitle?.trim()) {
    throw new Error('courseTitle é obrigatório')
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages deve ser um array não vazio')
  }

  const historyRaw = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  const firstUserIdx = historyRaw.findIndex((m) => m.role === 'user')
  const history = firstUserIdx >= 0 ? historyRaw.slice(firstUserIdx) : []

  const systemPrompt = `Você é um tutor de educação especializado em formação contínua para servidores públicos.
Está orientando um aprendiz no curso: "${courseTitle}"

Suas responsabilidades:
- Fornecer explicações claras e concisas sobre o conteúdo do curso
- Incentivar o aprendizado prático e reflexivo
- Conectar o conteúdo com aplicações reais no serviço público
- Ser empático, paciente e apoiador
- Manter as respostas focadas no assunto do curso
- Limitar respostas a no máximo 2-3 parágrafos para melhor compreensão

Sempre responda em português e de forma profissional.`

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  })

  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text()
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const result = await model.generateContent('Responda com uma palavra: OK')
    return !!result.response.text()
  } catch (error) {
    console.error('[Gemini] Indisponível:', error)
    return false
  }
}
