// ---------------------------------------------------------------------------
// fetchInterceptor.ts
//
// Intercepta o fetch global para injetar automaticamente o header
// x-simulated-date em toda requisição cujo path começa com /api/.
//
// Uso: importe este arquivo uma única vez no topo do layout ou _app:
//   import '@/lib/fetchInterceptor'
//
// O valor lido de localStorage['simulated_date'] é injetado apenas
// em ambiente browser — em SSR o fetch original é preservado intacto.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'simulated_date'
const API_PREFIX  = '/api/'

// Guarda referência ao fetch original para não criar loop infinito
const _originalFetch = globalThis.fetch

function getSimulatedDate(): string | null {
  // localStorage só existe no browser
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function shouldInject(input: RequestInfo | URL): boolean {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.pathname
      : input instanceof Request
      ? input.url
      : ''
  // Injeta apenas em rotas da nossa API
  return url.startsWith(API_PREFIX) || url.includes('/api/')
}

// Sobrescreve o fetch global
globalThis.fetch = function patchedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const simDate = getSimulatedDate()

  if (simDate && shouldInject(input)) {
    const headers = new Headers((init?.headers as HeadersInit) ?? {})

    // Só injeta se a rota ainda não enviou o header manualmente
    if (!headers.has('x-simulated-date')) {
      headers.set('x-simulated-date', simDate)
    }

    return _originalFetch(input, { ...init, headers })
  }

  return _originalFetch(input, init)
}
