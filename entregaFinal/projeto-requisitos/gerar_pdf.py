from fpdf import FPDF

AZUL = (27, 79, 155)
AZUL_CLARO = (41, 105, 176)
CINZA_FUNDO = (245, 245, 245)
AMARELO_AVISO = (255, 249, 230)
VERDE_LOGIN = (220, 245, 220)
BRANCO = (255, 255, 255)
PRETO = (30, 30, 30)

from fpdf.enums import XPos, YPos

class PDF(FPDF):
    def header(self):
        self.set_fill_color(*AZUL)
        self.rect(0, 0, 210, 16, 'F')
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(*BRANCO)
        self.set_y(4)
        self.cell(0, 8, 'Aprenda+ - Guia de Execucao do Projeto', align='C',
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(8)
        self.set_text_color(*PRETO)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f'Pagina {self.page_no()}', align='C')

    def secao(self, titulo):
        self.ln(4)
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_font('Helvetica', 'B', 11)
        self.cell(0, 8, f'  {titulo}', fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*PRETO)
        self.ln(2)

    def subsecao(self, titulo):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*AZUL_CLARO)
        self.ln(2)
        self.cell(0, 6, titulo, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*PRETO)

    def paragrafo(self, texto):
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5.5, texto)
        self.ln(1)

    def caixa_codigo(self, linhas):
        self.set_fill_color(*CINZA_FUNDO)
        self.set_draw_color(200, 200, 200)
        self.set_font('Courier', '', 9)
        x = self.get_x()
        y = self.get_y()
        altura = len(linhas) * 5 + 6
        self.rect(x, y, 180, altura, 'FD')
        self.set_xy(x + 3, y + 3)
        for linha in linhas:
            self.cell(174, 5, linha, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_x(x + 3)
        self.ln(3)

    def aviso(self, linhas_texto, cor_fundo=None, cor_borda=None):
        if cor_fundo is None:
            cor_fundo = AMARELO_AVISO
        if cor_borda is None:
            cor_borda = (200, 180, 100)
        self.set_fill_color(*cor_fundo)
        self.set_draw_color(*cor_borda)
        self.set_font('Helvetica', '', 9)
        x = self.get_x()
        y = self.get_y()
        texto = '\n'.join(linhas_texto) if isinstance(linhas_texto, list) else linhas_texto
        linhas = self.multi_cell(174, 5, texto, split_only=True)
        altura = len(linhas) * 5 + 6
        self.rect(x, y, 180, altura, 'FD')
        self.set_xy(x + 4, y + 3)
        self.multi_cell(172, 5, texto)
        self.ln(3)

    def tabela(self, cabecalho, linhas, larguras):
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_draw_color(180, 180, 180)
        for i, col in enumerate(cabecalho):
            self.cell(larguras[i], 7, col, border=1, fill=True)
        self.ln()
        self.set_text_color(*PRETO)
        for j, row in enumerate(linhas):
            fill_color = (248, 248, 248) if j % 2 == 0 else BRANCO
            self.set_fill_color(*fill_color)
            self.set_font('Courier', '', 8)
            for i, cell in enumerate(row):
                self.cell(larguras[i], 6, cell, border=1, fill=True)
            self.ln()
        self.set_font('Helvetica', '', 10)
        self.ln(3)

    def tabela_login(self, linhas):
        cabecalho = ['Perfil', 'E-mail', 'Senha']
        larguras = [45, 85, 50]
        self.set_font('Helvetica', 'B', 10)
        self.set_fill_color(*AZUL)
        self.set_text_color(*BRANCO)
        self.set_draw_color(120, 160, 120)
        for i, col in enumerate(cabecalho):
            self.cell(larguras[i], 8, col, border=1, fill=True)
        self.ln()
        self.set_text_color(*PRETO)
        for row in linhas:
            self.set_fill_color(*VERDE_LOGIN)
            self.set_font('Helvetica', 'B', 9)
            self.cell(larguras[0], 7, row[0], border=1, fill=True)
            self.set_font('Courier', '', 9)
            self.cell(larguras[1], 7, row[1], border=1, fill=True)
            self.set_font('Courier', 'B', 9)
            self.cell(larguras[2], 7, row[2], border=1, fill=True)
            self.ln()
        self.set_font('Helvetica', '', 10)
        self.ln(3)


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(15, 22, 15)

# ─────────────────────────────────────────────
# PAGINA 1 - Visao Geral + Estrutura de Pastas
# ─────────────────────────────────────────────
pdf.add_page()

pdf.secao('Visao Geral do Projeto')
pdf.paragrafo(
    'Aprenda+ e uma plataforma de aprendizado continuo para servidores publicos da Prefeitura do Recife. '
    'O projeto e dividido em duas partes que devem ser executadas em paralelo:'
)
pdf.set_font('Helvetica', '', 10)
pdf.cell(5)
pdf.cell(0, 5, '* Backend  - servidor Express (Node.js + TypeScript), porta 3001',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.cell(5)
pdf.cell(0, 5, '* Frontend - aplicacao Next.js, porta 3002',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.secao('Pre-requisitos')
pdf.paragrafo('Antes de comecar, certifique-se de ter instalado:')
prereqs = [
    ('1', 'Node.js versao 18 ou superior  ->  https://nodejs.org'),
    ('2', 'npm (ja incluido com o Node.js)'),
    ('3', 'Uma chave de API do Google Gemini  ->  https://ai.google.dev/'),
]
for num, texto in prereqs:
    pdf.set_fill_color(*AZUL)
    pdf.set_text_color(*BRANCO)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.cell(7, 6, num, fill=True, align='C')
    pdf.set_text_color(*PRETO)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 6, f'  {texto}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.aviso([
    'Dica: para verificar sua versao do Node.js, execute no terminal:',
    'node --version',
    'O resultado deve ser v18.x.x ou superior.',
])

pdf.secao('Estrutura de Pastas')
pdf.caixa_codigo([
    'projeto-requisitos/',
    '+-backend/                <- API REST (Express + TypeScript)',
    '| +-src/',
    '| | +-index.ts            <- Ponto de entrada do servidor',
    '| | +-lib/gemini.ts       <- Integracao com a IA Gemini',
    '| | +-routes/             <- Rotas da API',
    '| +-data/db.json          <- Banco de dados em arquivo (auto-criado)',
    '| +-env.example           <- Modelo para variaveis de ambiente',
    '| +-package.json',
    '|',
    '+-plataforma-web-v3/      <- Interface web (Next.js)',
    '  +-app/                  <- Paginas da aplicacao',
    '  +-components/           <- Componentes React',
    '  +-env.local.example     <- Modelo para variaveis de ambiente',
    '  +-package.json',
])

# ─────────────────────────────────────────────
# PAGINA 2 - Passo a Passo (Backend)
# ─────────────────────────────────────────────
pdf.add_page()

pdf.secao('Passo a Passo para Rodar o Projeto')
pdf.subsecao('Parte 1 - Configurar e Rodar o Backend (Terminal 1)')
pdf.paragrafo('Execute os comandos abaixo em um terminal, dentro da pasta do projeto:')

pdf.caixa_codigo(['# 1. Entre na pasta do backend', 'cd backend'])
pdf.caixa_codigo(['# 2. Instale as dependencias (apenas na primeira vez)', 'npm install'])
pdf.caixa_codigo(['# 3. Crie o arquivo de configuracao a partir do modelo', 'cp .env.example .env'])

pdf.paragrafo('Agora abra o arquivo backend/.env em um editor de texto e preencha os valores:')

pdf.tabela(
    ['Variavel', 'Valor padrao', 'Descricao'],
    [
        ['PORT',           '3001',                    'Porta do servidor backend'],
        ['FRONTEND_URL',   'http://localhost:3002',   'URL do frontend para CORS (frontend roda na 3002)'],
        ['JWT_SECRET',     'chave-secreta-longa',     'Chave para assinar tokens JWT'],
        ['ADMIN_EMAIL',    'admin@plataforma.com',    'E-mail da conta administrador'],
        ['ADMIN_PASSWORD', 'admin123',                'Senha da conta administrador'],
        ['DEMO_EMAIL',     'servidor@plataforma.com', 'E-mail da conta demo (servidor)'],
        ['DEMO_PASSWORD',  'servidor123',             'Senha da conta demo (servidor)'],
        ['GEMINI_API_KEY', 'sua-chave-aqui',          'Chave da API do Google Gemini'],
    ],
    [44, 56, 80],
)

pdf.aviso([
    'IMPORTANTE - A variavel GEMINI_API_KEY e obrigatoria para que a geracao de quizzes',
    'e o assistente de IA funcionem. Obtenha sua chave gratuita em https://ai.google.dev/',
])

pdf.caixa_codigo(['# 4. Inicie o servidor de desenvolvimento', 'npm run dev'])
pdf.paragrafo('O backend estara disponivel em:  http://localhost:3001')
pdf.paragrafo('Para confirmar que esta rodando, acesse:  http://localhost:3001/health')

# ─────────────────────────────────────────────
# PAGINA 3 - Chave da API do Gemini
# ─────────────────────────────────────────────
pdf.add_page()

pdf.secao('Configurando a Chave da API do Google Gemini')
pdf.aviso([
    'ATENCAO: Apenas chaves de API de contas PAGAS do Google Cloud funcionam neste projeto.',
    'Chaves geradas em contas gratuitas (Free Tier) nao sao aceitas e resultarao em erro.',
    'E necessario ter faturamento ativo no Google Cloud para que a API responda corretamente.',
], cor_fundo=(255, 235, 235), cor_borda=(200, 100, 100))
pdf.paragrafo(
    'A chave da API do Gemini (GEMINI_API_KEY) e necessaria para que a geracao de quizzes '
    'e o assistente de IA funcionem. Siga os passos abaixo para obter e configurar sua chave.'
)

pdf.subsecao('Passo 1 - Acessar o Google AI Studio')
pdf.paragrafo('Abra o navegador e acesse o Google AI Studio:')
pdf.caixa_codigo(['https://aistudio.google.com/'])
pdf.paragrafo('Faca login com a conta Google vinculada ao seu projeto no Google Cloud com faturamento ativo.')

pdf.subsecao('Passo 2 - Gerar a Chave de API')
prereqs2 = [
    ('1', 'Na pagina inicial do AI Studio, clique em "Get API key" no menu lateral esquerdo'),
    ('2', 'Clique no botao azul "Create API key"'),
    ('3', 'Selecione "Create API key in new project" (ou escolha um projeto existente do Google Cloud)'),
    ('4', 'A chave sera gerada no formato: AIzaSy... (comeca com "AIza")'),
    ('5', 'Clique em "Copy" para copiar a chave. Guarde-a em local seguro!'),
]
for num, texto in prereqs2:
    pdf.set_fill_color(*AZUL)
    pdf.set_text_color(*BRANCO)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.cell(7, 6, num, fill=True, align='C')
    pdf.set_text_color(*PRETO)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 6, f'  {texto}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.aviso([
    'SEGURANCA: Nunca compartilhe sua chave de API publicamente. Nao a coloque em',
    'repositorios Git publicos (o .env ja esta no .gitignore para protege-la).',
], cor_fundo=(255, 235, 235), cor_borda=(200, 100, 100))

pdf.subsecao('Passo 3 - Adicionar a Chave ao Arquivo .env')
pdf.paragrafo('Abra o arquivo backend/.env (criado no passo anterior) e localize a linha:')
pdf.caixa_codigo(['GEMINI_API_KEY=sua-chave-aqui'])
pdf.paragrafo('Substitua "sua-chave-aqui" pela chave copiada. Exemplo:')
pdf.caixa_codigo(['GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567'])
pdf.paragrafo('Salve o arquivo. Nao coloque espacos nem aspas ao redor da chave.')

pdf.subsecao('Passo 4 - Verificar se a Chave Esta Funcionando')
pdf.paragrafo('Apos iniciar o backend (npm run dev), teste a conexao com o Gemini:')
pdf.caixa_codigo([
    '# Verificar saude do backend',
    'curl http://localhost:3001/health',
    '',
    '# Resposta esperada:',
    '# { "status": "ok" }',
])
pdf.ln(1)
pdf.paragrafo('Se o backend responder { "status": "ok" }, o servidor esta rodando. Para testar o Gemini, acesse a plataforma e gere um quiz.')

pdf.aviso([
    'Alternativa visual: acesse http://localhost:3002, entre em qualquer curso e clique',
    'em "Gerar Quiz" ou abra o chat de IA. Se funcionar, a chave esta configurada.',
], cor_fundo=(230, 240, 255), cor_borda=(100, 140, 200))

pdf.subsecao('Erros Comuns com a Chave do Gemini')
pdf.tabela(
    ['Erro / Sintoma', 'Causa Provavel', 'Solucao'],
    [
        ['Quiz nao gera questoes',    'Chave ausente ou errada',      'Verifique GEMINI_API_KEY no .env'],
        ['Erro 400 Bad Request',      'Chave invalida ou malformada', 'Regere a chave no AI Studio'],
        ['Erro 403 Forbidden',        'Projeto Google Cloud inativo', 'Ative a API no Google Cloud'],
        ['Erro 429 Too Many Requests','Cota gratuita esgotada',       'Aguarde 1 minuto ou atualize o plano'],
        ['gemini: "disconnected"',    'Chave nao definida no .env',   'Adicione a chave e reinicie o backend'],
        ['Chat de IA nao responde',   'Timeout ou chave invalida',    'Verifique logs: npm run dev'],
    ],
    [52, 52, 76],
)

pdf.subsecao('Requisito: Conta Paga no Google Cloud')
pdf.aviso([
    'IMPORTANTE: A API do Gemini utilizada neste projeto exige uma conta com faturamento ativo.',
    'Contas gratuitas (Free Tier) retornam erro e nao conseguem gerar quizzes nem usar o chat de IA.',
    'Voce precisa ativar o faturamento no Google Cloud antes de gerar a chave.',
], cor_fundo=(255, 235, 235), cor_borda=(200, 100, 100))
pdf.paragrafo('Para ativar o faturamento no Google Cloud:')
prereqs3 = [
    ('1', 'Acesse: https://console.cloud.google.com/billing'),
    ('2', 'Clique em "Criar conta de faturamento" e informe os dados de pagamento'),
    ('3', 'Vincule a conta de faturamento ao projeto onde a chave sera gerada'),
    ('4', 'Volte ao AI Studio e gere a chave normalmente (Passo 2 acima)'),
]
for num, texto in prereqs3:
    pdf.set_fill_color(*AZUL)
    pdf.set_text_color(*BRANCO)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.cell(7, 6, num, fill=True, align='C')
    pdf.set_text_color(*PRETO)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 6, f'  {texto}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(2)

pdf.subsecao('Parte 2 - Configurar e Rodar o Frontend (Terminal 2)')
pdf.paragrafo('Abra um NOVO terminal (mantenha o backend rodando) e execute:')

pdf.caixa_codigo(['# 1. Entre na pasta do frontend', 'cd plataforma-web-v3'])
pdf.caixa_codigo(['# 2. Instale as dependencias (apenas na primeira vez)', 'npm install'])
pdf.caixa_codigo([
    '# 3. Crie o arquivo de configuracao',
    'cp .env.local.example .env.local',
    '',
    '# O arquivo .env.local deve conter:',
    '# NEXT_PUBLIC_BACKEND_URL=http://localhost:3001',
])

# ─────────────────────────────────────────────
# PAGINA 3 - Contas de Login + Atalhos
# ─────────────────────────────────────────────
pdf.add_page()

pdf.caixa_codigo(['# 4. Inicie o servidor de desenvolvimento', 'npm run dev'])
pdf.paragrafo('O frontend estara disponivel em:  http://localhost:3002')

# ── CONTAS DE LOGIN - destaque na pagina 3 ──
pdf.secao('Contas de Acesso para Teste')
pdf.paragrafo(
    'Apos iniciar o projeto, acesse http://localhost:3002 e faca login com uma das contas abaixo. '
    'Esses valores correspondem as variaveis ADMIN_* e DEMO_* do arquivo backend/.env:'
)

pdf.tabela_login([
    ['Servidor / Aluno', 'servidor@plataforma.com', 'servidor123'],
    ['Administrador',    'admin@plataforma.com',    'admin123'],
])

pdf.aviso(
    [
        'Dica: se voce alterou ADMIN_PASSWORD ou DEMO_PASSWORD no backend/.env, use a senha',
        'que definiu la. Os valores acima sao os padroes do arquivo .env.example.',
    ],
    cor_fundo=(230, 240, 255),
    cor_borda=(100, 140, 200),
)

pdf.secao('Atalhos pela Raiz do Projeto')
pdf.paragrafo(
    'Na pasta raiz (projeto-requisitos/) ha um package.json com scripts de atalho. '
    'Voce pode usar os comandos abaixo em vez de entrar em cada subpasta:'
)
pdf.caixa_codigo(['# Rodar o backend', 'npm run backend'])
pdf.caixa_codigo(['# Rodar o frontend v3', 'npm run frontend:v3'])
pdf.aviso([
    'Atencao: estes atalhos precisam ser executados em terminais separados, assim como',
    'o metodo manual. O backend deve ser iniciado antes do frontend.',
])

# ─────────────────────────────────────────────
# PAGINA 4 - Banco de Dados + Solucao de Problemas
# ─────────────────────────────────────────────
pdf.add_page()

pdf.secao('Banco de Dados')
pdf.paragrafo(
    'O projeto usa um arquivo JSON como banco de dados, localizado em backend/data/db.json. '
    'Este arquivo e criado automaticamente na primeira execucao.'
)
pdf.ln(2)
pdf.paragrafo('Para resetar todos os dados (usuarios, progresso, etc.), apague o arquivo:')
pdf.caixa_codigo(['rm backend/data/db.json'])
pdf.paragrafo('Na proxima vez que o servidor iniciar, o banco sera recriado do zero.')

pdf.secao('Solucao de Problemas Comuns')
pdf.tabela(
    ['Problema', 'Solucao'],
    [
        ['Porta 3001 ja em uso',          'Altere PORT no backend/.env ou: lsof -ti:3001 | xargs kill'],
        ['Porta 3002 ja em uso',          'Altere o script "dev" em plataforma-web-v3/package.json'],
        ['GEMINI_API_KEY nao configurada','Verifique se backend/.env existe e tem a chave'],
        ['Quiz nao gera questoes',        'Confirme que GEMINI_API_KEY e valida no Google AI Studio'],
        ['Erro de CORS',                  'Verifique FRONTEND_URL no backend/.env'],
        ['Frontend nao conecta',          'Verifique NEXT_PUBLIC_BACKEND_URL no .env.local'],
        ['npm install falha',             'Verifique Node.js: node --version (precisa ser >= 18)'],
        ['Modulo nao encontrado',         'Delete node_modules, rode npm install novamente'],
    ],
    [70, 110],
)

pdf.secao('Verificando se Tudo Esta Funcionando')
pdf.paragrafo('Com backend e frontend rodando, teste os endpoints manualmente:')
pdf.caixa_codigo([
    '# Checar saude do backend',
    'curl http://localhost:3001/health',
    '',
    '# Fazer login como servidor e obter token',
    'curl -X POST http://localhost:3001/api/auth/login \\',
    '  -H "Content-Type: application/json" \\',
    "  -d '{\"email\":\"servidor@plataforma.com\",\"password\":\"servidor123\"}'",
    '',
    '# Fazer login como administrador',
    'curl -X POST http://localhost:3001/api/auth/login \\',
    '  -H "Content-Type: application/json" \\',
    "  -d '{\"email\":\"admin@plataforma.com\",\"password\":\"admin123\"}'",
])

pdf.ln(2)
pdf.paragrafo('No navegador, acesse http://localhost:3002 para ver a interface da plataforma.')
pdf.ln(3)
pdf.set_font('Helvetica', 'I', 9)
pdf.set_text_color(100, 100, 100)
pdf.multi_cell(0, 5,
    'Para mais detalhes sobre a integracao com o Gemini, consulte GEMINI_INTEGRATION.md na raiz do projeto.\n'
    'Para duvidas sobre as rotas da API, consulte os arquivos em backend/src/routes/.'
)

pdf.output('/Users/emabesoone/Downloads/plataforma-formacao-continua-servidores-publicos/entregaFinal/projeto-requisitos/Manual-De-Instalacao.pdf')
print("PDF gerado com sucesso!")
