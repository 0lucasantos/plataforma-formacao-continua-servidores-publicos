const API_URL = localStorage.getItem('aprendamais_api_url') || 'http://localhost:3001'

const state = {
  token: localStorage.getItem('aprendamais_token') || '',
  user: null,
  view: 'courses',
  courses: [],
  badges: [],
  history: [],
  selectedCourse: null,
  courseDetailTab: 'modules',
  modules: [],
  posts: [],
  bulletinCourseId: '',
  bulletinPosts: [],
  bulletinLoading: false,
  quiz: null,
  answers: {},
  notice: '',
  loading: false,
  search: '',
  selectedCategory: 'Todos',
  quizGate: null,
  quizStep: 0,
  quizSelections: {},
  adminCourseId: '',
}

// Icones provisorios por categoria, para criar um visual sem depender de imagens externas, por enquanto.
// Seguindo o design do figma.
const COURSE_ICONS = {
  Design: '🎨',
  Código: '⚡',
  Negócios: '💼',
  Dados: '📊',
  IA: '🤖',
  Gestão: '📋',
  Tecnologia: '🤖',
}

function getCourseIcon(category) {
  return COURSE_ICONS[category] || '📚'
}

const app = document.querySelector('#app')

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (state.token) headers.Authorization = `Bearer ${state.token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.error || 'Não foi possível concluir a operação.')
  }

  return data
}

function setNotice(message) {
  state.notice = message
  render()
}

function button(label, attrs = '') {
  return `<button class="button" ${attrs}>${label}</button>`
}

function secondaryButton(label, attrs = '') {
  return `<button class="button secondary" ${attrs}>${label}</button>`
}

async function boot() {
  if (!state.token) {
    renderLogin()
    return
  }

  state.loading = true
  renderShell()

  try {
    state.user = await api('/api/auth/me')
    await loadDashboard()
  } catch (error) {
    localStorage.removeItem('aprendamais_token')
    state.token = ''
    state.user = null
    state.notice = error.message
  } finally {
    state.loading = false
    render()
  }
}

async function loadDashboard() {
  const [courses, badges, history] = await Promise.all([
    api('/api/courses'),
    api('/api/badges'),
    api('/api/quiz-history'),
  ])

  state.courses = courses
  state.badges = badges
  state.history = history
}

async function login(email, password) {
  state.loading = true
  renderLogin()

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    state.token = data.token
    localStorage.setItem('aprendamais_token', data.token)
    state.notice = ''
    await boot()
  } catch (error) {
    state.notice = error.message
    state.loading = false
    renderLogin()
  }
}

function logout() {
  localStorage.removeItem('aprendamais_token')
  state.token = ''
  state.user = null
  state.view = 'courses'
  state.selectedCourse = null
  state.courseDetailTab = 'modules'
  renderLogin()
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-view">
      <section class="login-panel modern-login">
        <form class="login-form" id="loginForm">
          
          <div class="login-header">
            <div class="brand-mark">A+</div>

            <h1>Aprenda+</h1>
            <p>Entre para continuar aprendendo</p>
          </div>

          <div class="field">
            <label for="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autocomplete="username"
              required
            />
          </div>

          <div class="field">
            <label for="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              autocomplete="current-password"
              required
            />
          </div>

          ${
            state.notice
              ? `<div class="alert">${escapeHtml(state.notice)}</div>`
              : ''
          }

          <button class="button full" type="submit">
            ${state.loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div class="divider">
            <span>ou continue com</span>
          </div>

          <button
            class="button secondary full conecta-button"
            type="button"
          >
            🔴 Entrar com Conecta Recife
          </button>

          <p class="register-text">
            Não tem conta?
            <button type="button" class="link-button">
              Cadastre-se
            </button>
          </p>

        </form>
      </section>
    </main>
  `

  document
    .querySelector('#loginForm')
    .addEventListener('submit', (event) => {
      event.preventDefault()

      const form = new FormData(event.currentTarget)

      login(
        form.get('email'),
        form.get('password')
      )
    })
}

function render() {
  if (!state.token || !state.user) renderLogin()
  else renderShell()
}

function renderShell() {
  const tabs = [
    ['courses', 'Cursos'],
    ['bulletin', 'Bulletin Board'],
    ['profile', 'Perfil'],
    ['badges', 'Conquistas'],
    ['history', 'Histórico'],
  ]

  if (state.user?.role === 'admin') tabs.push(['admin', 'Admin'])

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-left">
          <div class="brand-mark">A+</div>
          <div class="topbar-title">
            <strong>Aprenda+</strong>
            <span>${escapeHtml(state.user?.email || '')} · ${escapeHtml(state.user?.role || '')}</span>
          </div>
        </div>
        <nav class="tabs" aria-label="Navegação">
          ${tabs.map(([id, label]) => `<button class="tab ${state.view === id ? 'active' : ''}" data-view="${id}">${label}</button>`).join('')}
        </nav>
        <div class="topbar-actions">
          ${secondaryButton('Atualizar', 'type="button" data-action="refresh"')}
          ${secondaryButton('Sair', 'type="button" data-action="logout"')}
        </div>
      </header>
      <main class="main">
        ${state.loading ? '<div class="loader">Carregando...</div>' : renderCurrentView()}
      </main>
    </div>
  `

  document.querySelectorAll('[data-view]').forEach((item) => {
    item.addEventListener('click', async () => {
      state.view = item.dataset.view
      state.selectedCourse = null
      state.courseDetailTab = 'modules'
      state.notice = ''
      if (state.view === 'bulletin') await ensureBulletinLoaded()
      render()
    })
  })

  document.querySelector('[data-action="logout"]').addEventListener('click', logout)
  document.querySelector('[data-action="refresh"]').addEventListener('click', async () => {
    state.loading = true
    render()
    try {
      await loadDashboard()
      if (state.view === 'bulletin') await loadBulletin(state.bulletinCourseId || state.courses[0]?.id, false)
    } catch (error) {
      state.notice = error.message
    } finally {
      state.loading = false
      render()
    }
  })

  bindViewEvents()
}

function renderCurrentView() {
  if (state.quizGate) return renderQuizGate()
  if (state.selectedCourse) return renderCourseDetail()
  if (state.view === 'bulletin') return renderBulletin()
  if (state.view === 'badges') return renderBadges()
  if (state.view === 'history') return renderHistory()
  if (state.view === 'admin') return renderAdmin()
  if (state.view === 'profile') return renderProfile()
  return renderCourses()
}

function renderMetrics() {
  const completed = state.badges.filter((badge) => badge.type === 'complete').length
  const attempts = state.history.length
  const published = state.courses.filter((course) => course.published).length
  return `
    <div class="metrics">
      <div class="metric"><span>Cursos disponíveis</span><strong>${state.courses.length}</strong></div>
      <div class="metric"><span>Publicados</span><strong>${published}</strong></div>
      <div class="metric"><span>Quizzes feitos</span><strong>${attempts}</strong></div>
      <div class="metric"><span>Concluídos</span><strong>${completed}</strong></div>
    </div>
  `
}

function renderProfile() {
  const completedBadges =
    state.badges.filter(
      (badge) => badge.type === 'complete'
    ).length

  const progressBadges =
    state.badges.filter(
      (badge) => badge.type === 'progress'
    ).length

  const quizzes =
    state.history.length

  const badgeCourses = state.badges.map((badge) => {
    const course = state.courses.find(
      (item) => item.id === badge.course_id
    )

    return {
      icon: getCourseIcon(course?.category),
      name: course?.title || 'Curso',
      type: badge.type,
    }
  })

  const initials =
    (
      state.user?.email?.slice(0, 2) || 'AP'
    ).toUpperCase()

  return `
    <section class="profile-screen">

      <div class="profile-header-modern">

        <div class="profile-header-title">
          Meu Perfil
        </div>

        <button class="profile-edit-btn">
          EDITAR
        </button>

      </div>

      <div class="profile-hero">

        <div class="avatar-large">
          ${escapeHtml(initials)}
        </div>

        <div class="profile-name">
          ${
            escapeHtml(
              state.user?.name ||
              state.user?.email?.split('@')[0] ||
              'Usuário'
            )
          }
        </div>

        <div class="profile-email">
          ${escapeHtml(state.user?.email)}
        </div>

      </div>

      <div class="stats-row">

        <div class="stat-chip">

          <div
            class="stat-num"
            style="color: #16a34a;"
          >
            ${completedBadges}
          </div>

          <div class="stat-lbl">
            Selos ★
          </div>

        </div>

        <div class="stat-chip">

          <div
            class="stat-num"
            style="color: #f59e0b;"
          >
            ${progressBadges}
          </div>

          <div class="stat-lbl">
            Progresso ◑
          </div>

        </div>

        <div class="stat-chip">

          <div
            class="stat-num"
            style="color: var(--primary);"
          >
            ${quizzes}
          </div>

          <div class="stat-lbl">
            Quizzes
          </div>

        </div>

      </div>

      <div class="seals-section">

        <div class="seals-title">
          Coleção de selos
        </div>

        <div class="seals-grid">

          ${
            badgeCourses.length
              ? badgeCourses.map((badge) => `
                <div class="seal">

                  <div class="
                    seal-icon
                    ${
                      badge.type === 'complete'
                        ? 'seal-gold'
                        : 'seal-prog'
                    }
                  ">

                    ${badge.icon}

                    ${
                      badge.type === 'complete'
                        ? `
                          <div class="seal-crown">
                            ★
                          </div>
                        `
                        : ''
                    }

                  </div>

                  <div class="seal-name">
                    ${escapeHtml(badge.name)}
                  </div>

                </div>
              `).join('')
              : `
                <div class="empty">
                  Nenhum selo conquistado ainda.
                </div>
              `
          }

        </div>

      </div>

    </section>
  `
}

function getTodayQuizAttempt(courseId) {
  return state.history.find((attempt) => {
    const sameCourse =
      attempt.course_id === courseId

    const today =
      new Date(attempt.taken_at)
        .toDateString() ===
      new Date().toDateString()

    return sameCourse && today
  })
}

function renderCourses() {
  const categories = [
    'Todos',
    ...new Set(
      state.courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ]

  const filteredCourses = state.courses.filter((course) => {
    const matchesSearch =
      course.title
        .toLowerCase()
        .includes(state.search.toLowerCase())

    const matchesCategory =
      state.selectedCategory === 'Todos' ||
      course.category === state.selectedCategory

    return matchesSearch && matchesCategory
  })

  setTimeout(bindCourseEvents)

  return `
    <section class="courses-page">

      <div class="courses-top">
        <div>
          <h1>Explorar</h1>
        </div>
      </div>

      <div class="search-input">
          <span>⌕</span>

          <input
            id="searchCourses"
            type="text"
            placeholder="Buscar cursos..."
            value="${escapeHtml(state.search)}"
          />
      </div>

      <div class="categories-row">
        ${categories.map((category) => `
          <button
            class="category-chip ${
              state.selectedCategory === category
                ? 'active'
                : ''
            }"
            data-category="${category}"
          >
            ${escapeHtml(category)}
          </button>
        `).join('')}
      </div>

      <div class="courses-grid">

        ${
          filteredCourses.length
            ? filteredCourses
                .map(renderCourseCard)
                .join('')
            : `
              <div class="empty">
                Nenhum curso encontrado.
              </div>
            `
        }

      </div>

    </section>
  `
}

function renderCourseCard(course) {

  const icon =
    getCourseIcon(course.category)

  const badge =
    state.badges.find(
      (item) =>
        item.course_id === course.id
    )

  const todayAttempt =
    getTodayQuizAttempt(course.id)

  return `
    <article
      class="course-modern-card clickable-course-card"
      data-course="${course.id}"
    >

      <div class="course-card-top">

        <div class="course-icon">
          ${icon}
        </div>

        ${
          badge
            ? `
              <div class="
                featured-badge
                ${
                  badge.type === 'complete'
                    ? 'complete'
                    : 'progress'
                }
              ">
                <span>
                  ${
                    badge.type === 'complete'
                      ? '★'
                      : '◑'
                  }
                </span>
              </div>
            `
            : '<span></span>'
        }

      </div>

      <div class="course-card-content">

        <h3>
          ${escapeHtml(course.title)}
        </h3>

        <span class="course-category">
          ${course.category || 'Geral'}
        </span>

      </div>

      <div class="course-card-footer">

        <div class="course-card-info">

          <span>
            ${course.modules_count || 0}
            módulos
          </span>

          ${
            todayAttempt
              ? `
                <div class="quiz-done-message">
                  ${todayAttempt.score}/${todayAttempt.total}
                  pontos • volte amanhã
                </div>
              `
              : `
                <div class="quiz-pending-message">
                  Quiz diário pendente
                </div>
              `
          }

        </div>

      </div>

    </article>
  `
}
function bindCourseEvents() {
  const searchInput =
    document.querySelector('#searchCourses')

  if (searchInput) {
      searchInput.addEventListener('input', (event) => {
      state.search = event.target.value

      render()

      const input =
        document.querySelector('#searchCourses')

      if (input) {
        input.focus()

        input.setSelectionRange(
          state.search.length,
          state.search.length
        )
      }
    })
  }

 

  document
  .querySelectorAll(
    '[data-delete-module]'
  )
  .forEach((buttonEl) => {

    buttonEl.addEventListener(
      'click',
      () =>
        deleteModule(
          state.adminCourseId,
          buttonEl.dataset.deleteModule
        )
    )
  })

  document
      .querySelectorAll('[data-category]')
      .forEach((buttonEl) => {
        buttonEl.addEventListener('click', () => {
          state.selectedCategory =
            buttonEl.dataset.category

          render()
        })
      })

    document
      .querySelectorAll('[data-course]')
      .forEach((buttonEl) => {
        buttonEl.addEventListener('click', () => {
          openCourse(buttonEl.dataset.course)
        })
      })

  if (nextQuestion) {

    nextQuestion.addEventListener(
      'click',
      async () => {

        const questions =
          state.quiz.questions || []

        const selected =
          state.quizSelections[
            state.quizStep
          ]

        if (
          selected === undefined
        ) {
          state.notice =
            'Selecione uma resposta.'
          render()
          return
        }

        // ultima questao
        if (
          state.quizStep ===
          questions.length - 1
        ) {

          const answers =
            questions.map(
              (_, index) =>
                state.quizSelections[index]
            )

          try {

            const result =
              await api(
                `/api/quiz/${state.selectedCourse.id}`,
                {
                  method: 'POST',
                  body: JSON.stringify({
                    answers,
                  }),
                }
              )

            state.notice =
              `Resultado: ${result.score}/${result.total}`

            await loadDashboard()

            state.quiz =
              await api(
                `/api/quiz/${state.selectedCourse.id}`
              )

            state.courseDetailTab =
              'modules'

          } catch (error) {

            state.notice =
              error.message
          }

          render()

          if (
                selectedAdminCourse &&
                !state.modules.length &&
                !state.loading
              ) {

                setTimeout(async () => {

                  try {

                    state.modules =
                      await api(
                        `/api/courses/${selectedAdminCourse.id}/modules`
                      )

                    state.posts =
                      await api(
                        `/api/bulletin/${selectedAdminCourse.id}`
                      )

                    render()

                  } catch (error) {

                    state.notice =
                      error.message

                    render()
                  }

                })
              }

          return
        }

        state.quizStep++

        render()
      }
    )
  }
}

function renderQuizGate() {
  const course = state.quizGate.course

  return `
    <section class="quiz-gate-screen">

      <div class="quiz-gate-card">

        <div class="quiz-gate-icon">
          🧠
        </div>

        <div class="quiz-gate-course">
          ${escapeHtml(course.title)}
        </div>

        <h1>
          Quiz diário obrigatório
        </h1>

        <p>
          Para acessar este curso você precisa
          concluir o quiz diário relacionado.
        </p>

        <div class="quiz-gate-actions">

          <button
            class="button"
            data-action="start-gated-quiz"
          >
            Iniciar quiz
          </button>

          <button
            class="button secondary"
            data-action="cancel-gated-quiz"
          >
            Voltar
          </button>

        </div>

      </div>

    </section>
  `
}

function renderCourseDetail() {
  const course = state.selectedCourse
  const tabs = [
    ['quiz', 'Quiz'],
    ['modules', 'Módulos'],
    ['bulletin', 'Bulletin Board'],
    ['chat', 'Learn Your Way (em breve)'],
  ]

  return `
    <section>
      <div class="section-header">
        <div class="section-title">
          <h2>${escapeHtml(course.title)}</h2>
          <p>${escapeHtml(course.description)}</p>
        </div>
        ${secondaryButton('Voltar', 'type="button" data-action="back"')}
      </div>
      ${state.notice ? `<div class="alert">${escapeHtml(state.notice)}</div>` : ''}
      <div class="course-detail-tabs">
        ${tabs.map(([id, label]) => `
          <button
            class="course-detail-tab ${state.courseDetailTab === id ? 'active' : ''}"
            type="button"
            data-course-tab="${id}"
          >
            ${label}
          </button>
        `).join('')}
      </div>
      ${renderCourseDetailTab()}
    </section>
  `
}

function renderCourseDetailTab() {
  const course = state.selectedCourse

  if (state.courseDetailTab === 'quiz') {
    return `
      <section class="panel">
        <div class="section-header">
          <div class="section-title">
            <h2>Quiz diário</h2>
            <p>${state.quiz?.taken_today ? 'Quiz já realizado hoje.' : 'Uma tentativa por dia para este curso.'}</p>
          </div>
          ${button(state.quiz ? 'Recarregar' : 'Iniciar', `type="button" data-action="quiz" data-id="${course.id}"`)}
        </div>
        ${renderQuiz()}
      </section>
    `
  }

  if (state.courseDetailTab === 'chat') {

    return `
      <section class="chatbot-screen">

        <div class="chatbot-header">

          <div>
            <h2>
              ✦ Learn Your Way
            </h2>
          </div>

        </div>

        <div class="chatbot-messages">

          <div class="bot-message">

            <div class="bot-icon">
              ✦
            </div>

            <div class="message-bubble">

              Olá! Vamos continuar com
              ${escapeHtml(state.selectedCourse.title)}.

              Com base no seu quiz de hoje,
              você teve dificuldade com
              hierarquia visual.

              Quer explorar isso agora?

            </div>

          </div>

          <div class="user-message">

            <div class="message-bubble user">

              Sim! Me explica melhor
              com exemplos

            </div>

          </div>

          <div class="bot-message">

            <div class="bot-icon">
              ✦
            </div>

            <div class="message-bubble">

              Perfeito!

              Hierarquia visual é como
              guiamos o olhar do usuário.

              Pense em 3 camadas:

              <br /><br />

              • Título → principal<br />
              • Subtítulo → apoio<br />
              • Corpo → detalhe

              <br /><br />

              Quer ver como aplicar isso
              em cards?

            </div>

          </div>

        </div>

        <div class="chatbot-input">

          <input
            type="text"
            placeholder="Pergunte algo..."
          />

          <button>
            ↑
          </button>

        </div>

      </section>
    `
  }

  if (state.courseDetailTab === 'bulletin') {
    return `
      <section class="panel">
        <div class="section-title">
          <h2>Bulletin Board</h2>
          <p>Atualizações e links do curso.</p>
        </div>
        ${renderBulletinPostList(state.posts, course.id)}
      </section>
    `
  }

  return `
    <section class="panel">
      <div class="section-title">
        <h2>Módulos</h2>
        <p>${state.modules.length ? 'Conteúdo cadastrado para esta formação.' : 'Ainda não há módulos cadastrados.'}</p>
      </div>
      <div class="stack" style="margin-top:14px">
        ${state.modules.length ? state.modules.map((module) => `
          <article class="post-card">
            <h3>${escapeHtml(module.order)}. ${escapeHtml(module.title)}</h3>
            <p>${escapeHtml(module.content)}</p>
          </article>
        `).join('') : '<div class="empty">Sem módulos por enquanto.</div>'}
      </div>
    </section>
  `
}

function renderBulletin() {
  const activeCourseId = state.bulletinCourseId || state.courses[0]?.id || ''

  return `
    <section>
      <div class="section-header">
        <div class="section-title">
          <h2>Bulletin Board</h2>
          <p>Avisos, materiais complementares e links publicados por curso.</p>
        </div>
      </div>
      ${state.notice ? `<div class="alert">${escapeHtml(state.notice)}</div>` : ''}
      <div class="categories-row bulletin-course-tabs">
        ${state.courses.map((course) => `
          <button
            class="category-chip ${activeCourseId === course.id ? 'active' : ''}"
            type="button"
            data-bulletin-course="${course.id}"
          >
            ${escapeHtml(course.title)}
          </button>
        `).join('')}
      </div>
      <section class="panel bulletin-panel">
        ${state.bulletinLoading ? '<div class="loader">Carregando avisos...</div>' : renderBulletinPostList(state.bulletinPosts, activeCourseId)}
      </section>
    </section>
  `
}

function renderBulletinPostList(posts, courseId) {
  return `
    <div class="stack" style="margin-top:14px">
      ${posts.length ? posts.map((post) => `
        <article class="post-card bulletin-post">
          <div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.content)}</p>
            ${post.url ? `<p><a href="${escapeHtml(post.url)}" target="_blank" rel="noreferrer">${escapeHtml(post.url)}</a></p>` : ''}
            ${post.expires_at ? `<p class="post-meta">Expira em ${new Date(post.expires_at).toLocaleString('pt-BR')}</p>` : ''}
          </div>
          ${state.user?.role === 'admin' ? `<button class="button danger compact" type="button" data-delete-bulletin="${post.id}" data-course-id="${courseId}">Excluir</button>` : ''}
        </article>
      `).join('') : '<div class="empty">Nenhum aviso ativo.</div>'}
    </div>
  `
}

function renderQuiz() {

  if (!state.quiz)
    return '<div class="empty">Quiz indisponível.</div>'

  if (state.quiz.taken_today) {

    const attempt =
      state.quiz.attempt

    return `
      <div class="quiz-finished">

        <h2>
          Quiz concluído hoje
        </h2>

        <p>
          Você fez
          ${attempt.score}/${attempt.total}
          pontos.
        </p>

        <span>
          Volte amanhã para uma nova tentativa.
        </span>

      </div>
    `
  }

  const questions =
    state.quiz.questions || []

  const current =
    questions[state.quizStep]

  const progress =
    (
      (
        (state.quizStep + 1) /
        questions.length
      ) * 100
    ).toFixed(0)

  return `
    <div class="screen quiz-screen">

      <div class="quiz-header">

        <div class="quiz-title-area">

          <div class="quiz-course-tag">
            ${escapeHtml(
              state.selectedCourse.category
            )}
          </div>

          <div class="quiz-heading">
            Quiz diário
          </div>

        </div>

      </div>

      <div class="progress-bar-wrap">

        <div class="progress-info">

          <span>
            Questão
            ${state.quizStep + 1}
            de
            ${questions.length}
          </span>

        </div>

        <div class="progress-track">

          <div
            class="progress-fill"
            style="
              width:${progress}%
            "
          ></div>

        </div>

      </div>

      <div class="question-card">

        <div class="q-number">
          QUESTÃO
          ${String(
            state.quizStep + 1
          ).padStart(2, '0')}
        </div>

        <div class="q-text">
          ${escapeHtml(current.text)}
        </div>

      </div>

      <div class="options-list">

        ${current.options.map(
          (option, index) => `
            <div
              class="
                option
                ${
                  state.quizSelections[
                    state.quizStep
                  ] === index
                    ? 'selected'
                    : ''
                }
              "
              data-option="${index}"
            >

              <div class="option-dot"></div>

              <div class="option-text">
                ${escapeHtml(option)}
              </div>

            </div>
          `
        ).join('')}

      </div>

      <div class="quiz-footer">

        <button
          class="next-btn"
          data-action="next-question"
        >
          ${
            state.quizStep ===
            questions.length - 1
              ? 'Finalizar →'
              : 'Próxima →'
          }
        </button>

        <div class="ia-badge">

          <div class="ia-dot"></div>

          <span>
            Gerado por IA • único a cada acesso
          </span>

        </div>

      </div>

    </div>
  `
}

function renderBadges() {
  return `
    <section>
      <div class="section-title">
        <h2>Conquistas</h2>
        <p>Selos obtidos em quizzes de cursos.</p>
      </div>
      <div class="stack" style="margin-top:18px">
        ${state.badges.length ? state.badges.map((badge) => {
          const course = state.courses.find((item) => item.id === badge.course_id)
          return `
            <article class="history-row">
              <h3>${escapeHtml(course?.title || 'Curso removido')}</h3>
              <p>${badge.type === 'complete' ? 'Conclusão' : 'Progresso'} · ${new Date(badge.earned_at).toLocaleString('pt-BR')}</p>
            </article>
          `
        }).join('') : '<div class="empty">Nenhuma conquista registrada ainda.</div>'}
      </div>
    </section>
  `
}

function renderHistory() {
  return `
    <section>
      <div class="section-title">
        <h2>Histórico</h2>
        <p>Tentativas de quiz concluídas.</p>
      </div>
      <div class="stack" style="margin-top:18px">
        ${state.history.length ? state.history.map((attempt) => {
          const course = state.courses.find((item) => item.id === attempt.course_id)
          return `
            <article class="history-row">
              <h3>${escapeHtml(course?.title || 'Curso removido')}</h3>
              <p>${attempt.score}/${attempt.total} pontos · ${escapeHtml(attempt.badge_type || 'none')} · ${new Date(attempt.taken_at).toLocaleString('pt-BR')}</p>
            </article>
          `
        }).join('') : '<div class="empty">Nenhuma tentativa concluída.</div>'}
      </div>
    </section>
  `
}

function renderAdmin() {

  if (
    !state.adminCourseId &&
    state.courses.length
  ) {

    state.adminCourseId =
      state.courses[0].id
  }

  if (state.user?.role !== 'admin') {
    return `
      <div class="empty">
        Área restrita.
      </div>
    `
  }

  if (
  !state.adminCourseId &&
  state.courses.length
) {

  state.adminCourseId =
    state.courses[0].id
}

const selectedAdminCourse =
  state.courses.find(
    (course) =>
      String(course.id) ===
      String(state.adminCourseId)
  )

  return `
    <section class="admin-page">

      <div class="section-header">

        <div class="section-title">

          <h2>
            Painel Admin
          </h2>

          <p>
            Gerencie cursos, módulos e bulletin board.
          </p>

        </div>

      </div>

      ${
        state.notice
          ? `
            <div class="alert">
              ${escapeHtml(state.notice)}
            </div>
          `
          : ''
      }

      <!-- CRIAR CURSO -->

      <div class="panel">

        <div class="section-title">

          <h2>
            Novo curso
          </h2>

          <p>
            Crie novos cursos para a plataforma.
          </p>

        </div>

        <form
          class="admin-form"
          id="courseForm"
        >

          <div class="field wide">
            <label>Título</label>
            <input
              name="title"
              required
            />
          </div>

          <div class="field wide">
            <label>Descrição</label>

            <textarea
              name="description"
              required
            ></textarea>
          </div>

          <div class="field">
            <label>Categoria</label>
            <input name="category" />
          </div>

          <div class="field">
            <label>Perguntas</label>

            <input
              name="num_questions"
              type="number"
              min="1"
              max="7"
              value="5"
            />
          </div>

          <div class="field">
            <label>Conclusão (%)</label>

            <input
              name="threshold_complete"
              type="number"
              min="0"
              max="100"
              value="80"
            />
          </div>

          <div class="field">
            <label>Progresso (%)</label>

            <input
              name="threshold_progress"
              type="number"
              min="0"
              max="100"
              value="50"
            />
          </div>

          <div class="wide">

            <button
              class="button"
              type="submit"
            >
              Criar curso
            </button>

          </div>

        </form>

      </div>

      <!-- SELETOR DE CURSO -->

      <div
        class="panel"
        style="margin-top:24px"
      >

        <div class="section-title">

          <h2>
            Gerenciar curso
          </h2>

          <p>
            Escolha um curso para editar.
          </p>

        </div>

        <div class="admin-course-selector">

          ${
            state.courses.map((course) => `

              <button
                class="
                  admin-select-course
                  ${
                    selectedAdminCourse?.id === course.id
                      ? 'active'
                      : ''
                  }
                "
                data-admin-course="${course.id}"
              >

                <div class="admin-select-left">

                  <div class="admin-course-icon">
                    ${getCourseIcon(course.category)}
                  </div>

                  <div>

                    <strong>
                      ${escapeHtml(course.title)}
                    </strong>

                    <span>
                      ${
                        escapeHtml(
                          course.category || 'Geral'
                        )
                      }
                    </span>

                  </div>

                </div>

                <div class="
                  admin-course-status
                  ${
                    course.published
                      ? 'published'
                      : 'draft'
                  }
                ">

                  ${
                    course.published
                      ? 'Publicado'
                      : 'Rascunho'
                  }

                </div>

              </button>

            `).join('')
          }

        </div>

      </div>

      ${
        selectedAdminCourse
          ? `

            <!-- AÇÕES CURSO -->

            <div
              class="panel"
              style="margin-top:24px"
            >

              <div class="section-title">

                <h2>
                  ${escapeHtml(
                    selectedAdminCourse.title
                  )}
                </h2>

                <p>
                  Gerencie este curso.
                </p>

              </div>

              <div class="admin-course-actions">

                <button
                  class="
                    button
                    ${
                      selectedAdminCourse.published
                        ? 'secondary'
                        : ''
                    }
                  "
                  type="button"
                  data-publish="${selectedAdminCourse.id}"
                  data-value="${
                    !selectedAdminCourse.published
                  }"
                >

                  ${
                    selectedAdminCourse.published
                      ? 'Despublicar'
                      : 'Publicar'
                  }

                </button>

                <button
                  class="button danger"
                  type="button"
                  data-delete="${selectedAdminCourse.id}"
                >
                  Excluir curso
                </button>

              </div>

            </div>

            <!-- MODULOS -->

            <div
              class="panel"
              style="margin-top:24px"
            >

              <div class="section-title">

                <h2>
                  Módulos
                </h2>

                <p>
                  Gerencie os módulos do curso.
                </p>

              </div>

              <form
                class="admin-form"
                id="moduleForm"
              >

                <input
                  type="hidden"
                  name="courseId"
                  value="${selectedAdminCourse.id}"
                />

                <div class="field">
                  <label>Ordem</label>

                  <input
                    name="order"
                    type="number"
                    value="1"
                  />
                </div>

                <div class="field">
                  <label>Título</label>

                  <input
                    name="title"
                    required
                  />
                </div>

                <div class="field wide">

                  <label>Conteúdo</label>

                  <textarea
                    name="content"
                    required
                  ></textarea>

                </div>

                <div class="wide">

                  <button
                    class="button"
                    type="submit"
                  >
                    Criar módulo
                  </button>

                </div>

              </form>

              <div class="stack">

                ${
                  state.modules.length
                    ? state.modules.map((module) => `

                      <article class="post-card">

                        <div>

                          <h3>
                            ${module.order}.
                            ${escapeHtml(module.title)}
                          </h3>

                          <p>
                            ${escapeHtml(module.content)}
                          </p>

                        </div>

                        <button
                          class="button danger compact"
                          data-delete-module="${module.id}"
                        >
                          Excluir
                        </button>

                      </article>

                    `).join('')
                    : `
                      <div class="empty">
                        Nenhum módulo.
                      </div>
                    `
                }

              </div>

            </div>

            <!-- BULLETIN -->

            <div
              class="panel"
              style="margin-top:24px"
            >

              <div class="section-title">

                <h2>
                  Bulletin Board
                </h2>

                <p>
                  Gerencie avisos do curso.
                </p>

              </div>

              <form
                class="admin-form"
                id="bulletinForm"
              >

                <input
                  type="hidden"
                  name="courseId"
                  value="${selectedAdminCourse.id}"
                />

                <div class="field">
                  <label>Título</label>

                  <input
                    name="title"
                    required
                  />
                </div>

                <div class="field">
                  <label>Expira em</label>

                  <input
                    name="expires_at"
                    type="datetime-local"
                  />
                </div>

                <div class="field wide">

                  <label>Conteúdo</label>

                  <textarea
                    name="content"
                    required
                  ></textarea>

                </div>

                <div class="field wide">

                  <label>URL</label>

                  <input
                    name="url"
                    type="text"
                    placeholder="www.exemplo.com"
                  />

                </div>

                <div class="wide">

                  <button
                    class="button"
                    type="submit"
                  >
                    Publicar aviso
                  </button>

                </div>

              </form>

              <div class="stack">

                ${
                  (state.posts || []).length
                    ? (state.posts || []).map((post) => `

                      <article class="post-card">

                        <div>

                          <h3>
                            ${escapeHtml(post.title)}
                          </h3>

                          <p>
                            ${escapeHtml(post.content)}
                          </p>

                        </div>

                        <button
                          class="button danger compact"
                          data-delete-bulletin="${post.id}"
                          data-course-id="${selectedAdminCourse.id}"
                        >
                          Excluir
                        </button>

                      </article>

                    `).join('')
                    : `
                      <div class="empty">
                        Nenhum aviso.
                      </div>
                    `
                }

              </div>

            </div>

          `
          : ''
      }

    </section>
  `
}

function bindViewEvents() {

  // =========================
  // ABRIR CURSO
  // =========================

  document
    .querySelectorAll('[data-course]')
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () => openCourse(
          buttonEl.dataset.course
        )
      )
    })

  // =========================
  // VOLTAR
  // =========================

  const back =
    document.querySelector(
      '[data-action="back"]'
    )

  if (back) {

    back.addEventListener(
      'click',
      () => {

        state.selectedCourse = null
        state.courseDetailTab = 'modules'
        state.quiz = null
        state.answers = {}
        state.notice = ''
        state.quizStep = 0
        state.quizSelections = {}

        render()
      }
    )
  }

  // =========================
  // TABS DO CURSO
  // =========================

  document
    .querySelectorAll('[data-course-tab]')
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () => {

          const nextTab =
            buttonEl.dataset.courseTab

          if (
            state.quiz &&
            !state.quiz.taken_today &&
            nextTab !== 'quiz'
          ) {

            state.notice =
              'Finalize o quiz diário para liberar o conteúdo do curso.'

            render()

            return
          }

          state.courseDetailTab =
            nextTab

          state.notice = ''

          render()
        }
      )
    })

  // =========================
  // QUIZ GATE
  // =========================

  const startGateQuiz =
    document.querySelector(
      '[data-action="start-gated-quiz"]'
    )

  if (startGateQuiz) {

    startGateQuiz.addEventListener(
      'click',
      () => {

        state.selectedCourse =
          state.quizGate.course

        state.modules =
          state.quizGate.modules

        state.posts =
          state.quizGate.posts

        state.quiz =
          state.quizGate.quiz

        state.quizGate = null

        state.courseDetailTab =
          'quiz'

        state.quizStep = 0

        state.quizSelections = {}

        state.notice = ''

        render()
      }
    )
  }

  const cancelGateQuiz =
    document.querySelector(
      '[data-action="cancel-gated-quiz"]'
    )

  if (cancelGateQuiz) {

    cancelGateQuiz.addEventListener(
      'click',
      () => {

        state.quizGate = null

        render()
      }
    )
  }

  // =========================
  // QUIZ OPTIONS
  // =========================

  document
    .querySelectorAll('[data-option]')
    .forEach((optionEl) => {

      optionEl.addEventListener(
        'click',
        () => {

          state.quizSelections[
            state.quizStep
          ] =
            Number(
              optionEl.dataset.option
            )

          render()
        }
      )
    })

  // =========================
  // NEXT QUESTION
  // =========================

  const nextQuestion =
    document.querySelector(
      '[data-action="next-question"]'
    )

  if (nextQuestion) {

    nextQuestion.addEventListener(
      'click',
      async () => {

        const questions =
          state.quiz.questions || []

        const selected =
          state.quizSelections[
            state.quizStep
          ]

        if (
          selected === undefined
        ) {

          state.notice =
            'Selecione uma resposta.'

          render()

          return
        }

        if (
          state.quizStep ===
          questions.length - 1
        ) {

          const answers =
            questions.map(
              (_, index) =>
                state.quizSelections[index]
            )

          try {

            const result =
              await api(
                `/api/quiz/${state.selectedCourse.id}`,
                {
                  method: 'POST',
                  body: JSON.stringify({
                    answers,
                  }),
                }
              )

            state.notice =
              `Resultado: ${result.score}/${result.total}`

            await loadDashboard()

            state.quiz =
              await api(
                `/api/quiz/${state.selectedCourse.id}`
              )

            state.courseDetailTab =
              'modules'

          } catch (error) {

            state.notice =
              error.message
          }

          render()

          return
        }

        state.quizStep++

        render()
      }
    )
  }

  // =========================
  // QUIZ BUTTON
  // =========================

  const quizButton =
    document.querySelector(
      '[data-action="quiz"]'
    )

  if (quizButton) {

    quizButton.addEventListener(
      'click',
      () => loadQuiz(
        quizButton.dataset.id
      )
    )
  }

  // =========================
  // BULLETIN
  // =========================

  document
    .querySelectorAll(
      '[data-bulletin-course]'
    )
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () => loadBulletin(
          buttonEl.dataset.bulletinCourse
        )
      )
    })

  // =========================
  // ADMIN SELECT COURSE
  // =========================

  document
    .querySelectorAll('[data-admin-course]')
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        async () => {

          const courseId =
            buttonEl.dataset.adminCourse

          if (!courseId) return

          state.adminCourseId =
            String(courseId)

          state.loading = true

          render()

          try {

            const [
              modules,
              posts,
            ] = await Promise.all([

              api(
                `/api/courses/${courseId}/modules`
              ),

              api(
                `/api/bulletin/${courseId}`
              ),

            ])

            state.modules = modules

            state.posts = posts

            state.notice = ''

          } catch (error) {

            state.notice =
              error.message

          } finally {

            state.loading = false

            render()
          }
        }
      )
    })

  // =========================
  // ADMIN FORMS
  // =========================

  const courseForm =
    document.querySelector('#courseForm')

  if (courseForm) {

    courseForm.addEventListener(
      'submit',
      createCourse
    )
  }

  const moduleForm =
    document.querySelector('#moduleForm')

  if (moduleForm) {

    moduleForm.addEventListener(
      'submit',
      createModule
    )
  }

  const bulletinForm =
    document.querySelector('#bulletinForm')

  if (bulletinForm) {

    bulletinForm.addEventListener(
      'submit',
      createBulletinPost
    )
  }

  // =========================
  // PUBLICAR / DESPUBLICAR
  // =========================

  document
    .querySelectorAll('[data-publish]')
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () =>
          patchCourse(
            buttonEl.dataset.publish,
            {
              published:
                buttonEl.dataset.value ===
                'true',
            }
          )
      )
    })

  // =========================
  // EXCLUIR CURSO
  // =========================

  document
    .querySelectorAll('[data-delete]')
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () =>
          deleteCourse(
            buttonEl.dataset.delete
          )
      )
    })

  // =========================
  // EXCLUIR MÓDULO
  // =========================

  document
    .querySelectorAll(
      '[data-delete-module]'
    )
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () =>
          deleteModule(
            state.adminCourseId,
            buttonEl.dataset.deleteModule
          )
      )
    })

  // =========================
  // EXCLUIR BULLETIN
  // =========================

  document
    .querySelectorAll(
      '[data-delete-bulletin]'
    )
    .forEach((buttonEl) => {

      buttonEl.addEventListener(
        'click',
        () =>
          deleteBulletinPost(
            buttonEl.dataset.courseId,
            buttonEl.dataset.deleteBulletin
          )
      )
    })
}

async function openCourse(id) {
  state.loading = true
  render()

  try {
    const [
      course,
      modules,
      posts,
      quiz,
    ] = await Promise.all([
      api(`/api/courses/${id}`),
      api(`/api/courses/${id}/modules`),
      api(`/api/bulletin/${id}`),
      api(`/api/quiz/${id}`),
    ])

    // se nao fez o quiz hoje
    if (!quiz.taken_today) {

      state.quizGate = {
        course,
        modules,
        posts,
        quiz,
      }

      state.selectedCourse = null

      state.notice = ''

      return
    }

    // se ja fez
    state.selectedCourse = course

    state.modules =
      modules.sort(
        (a, b) =>
          Number(a.order || 0) -
          Number(b.order || 0)
      )

    state.posts = posts

    state.quiz = quiz

    state.courseDetailTab = 'modules'

    state.notice = ''

  } catch (error) {
    state.notice = error.message
  } finally {
    state.loading = false
    render()
  }
}

async function ensureBulletinLoaded() {
  const courseId = state.bulletinCourseId || state.courses[0]?.id
  if (!courseId) return
  if (state.bulletinCourseId === courseId && state.bulletinPosts.length) return
  await loadBulletin(courseId, false)
}

async function loadBulletin(courseId, shouldRender = true) {
  if (!courseId) {
    state.bulletinPosts = []
    state.bulletinLoading = false
    return
  }

  state.bulletinCourseId = courseId
  state.bulletinLoading = true
  if (shouldRender) render()

  try {
    state.bulletinPosts = await api(`/api/bulletin/${courseId}`)
    state.notice = ''
  } catch (error) {
    state.notice = error.message
  } finally {
    state.bulletinLoading = false
    if (shouldRender) render()
  }
}

async function loadQuiz(courseId) {
  state.notice = ''
  try {
    state.quiz = await api(`/api/quiz/${courseId}`)
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function submitQuiz(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const questions = state.quiz.questions || []
  const answers = questions.map((_, index) => Number(form.get(`q${index}`)))

  try {
    const result = await api(`/api/quiz/${state.selectedCourse.id}`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
    state.notice = `Resultado: ${result.score}/${result.total} (${result.pct}%). Selo: ${result.badge_type}.`
    await loadDashboard()
    state.quiz = await api( `/api/quiz/${state.selectedCourse.id}` )
    state.courseDetailTab = 'modules'
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function createCourse(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const payload = {
    title: form.get('title'),
    description: form.get('description'),
    category: form.get('category'),
    num_questions: Number(form.get('num_questions')),
    threshold_complete: Number(form.get('threshold_complete')),
    threshold_progress: Number(form.get('threshold_progress')),
  }

  try {
    await api('/api/courses', { method: 'POST', body: JSON.stringify(payload) })
    state.notice = 'Curso criado.'
    await loadDashboard()
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function createModule(event) {

  event.preventDefault()

  const form =
    new FormData(event.currentTarget)

  const courseId =
    form.get('courseId')

  const payload = {
    title: form.get('title'),
    content: form.get('content'),
    order: Number(form.get('order')),
    questions: [],
  }

  try {

    await api(
      `/api/courses/${courseId}/modules`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    state.notice =
      'Módulo criado.'

    state.modules =
      await api(
        `/api/courses/${courseId}/modules`
      )

    event.currentTarget.reset()

  } catch (error) {

    state.notice =
      error.message
  }

  render()
}

async function deleteModule(courseId, moduleId) {

  if (!confirm('Excluir este módulo?'))
    return

  try {

    await api(
      `/api/courses/${courseId}/modules/${moduleId}`,
      {
        method: 'DELETE',
      }
    )

    state.notice =
      'Módulo excluído.'

    state.modules =
      state.modules.filter(
        (module) =>
          module.id !== moduleId
      )

  } catch (error) {

    state.notice =
      error.message
  }

  render()
}

async function createBulletinPost(event) {
  event.preventDefault()
  const formEl = event.currentTarget
  const form = new FormData(formEl)
  const courseId = form.get('courseId')
  const expiresAt = form.get('expires_at')
  
  let url = form.get('url')?.trim()

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

  const payload = {
    title: form.get('title'),
    content: form.get('content'),
    url: url || undefined,
    expires_at: expiresAt
      ? new Date(expiresAt).toISOString()
      : undefined,
  }

  try {
    await api(`/api/bulletin/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    state.notice = 'Aviso publicado.'
    formEl.reset()
    if (state.bulletinCourseId === courseId) await loadBulletin(courseId, false)
    if (state.selectedCourse?.id === courseId) state.posts = await api( `/api/bulletin/${courseId}`)
    if (state.adminCourseId === courseId) { state.posts = await api( `/api/bulletin/${courseId}`
    )
}
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function deleteBulletinPost(courseId, postId) {
  if (!confirm('Excluir este aviso?')) return

  try {
    await api(`/api/bulletin/${courseId}/${postId}`, { method: 'DELETE' })
    state.notice = 'Aviso excluído.'
    if (state.bulletinCourseId === courseId) await loadBulletin(courseId, false)
    if (state.selectedCourse?.id === courseId) state.posts = state.posts.filter((post) => post.id !== postId)
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function patchCourse(id, fields) {
  try {
    await api(`/api/courses/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
    state.notice = 'Curso atualizado.'
    await loadDashboard()
  } catch (error) {
    state.notice = error.message
  }
  render()
}

async function deleteCourse(id) {
  if (!confirm('Excluir este curso?')) return

  try {
    await api(`/api/courses/${id}`, { method: 'DELETE' })
    state.notice = 'Curso excluído.'
    await loadDashboard()
  } catch (error) {
    state.notice = error.message
  }
  render()
}

boot()
