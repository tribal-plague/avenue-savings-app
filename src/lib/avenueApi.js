async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with ${response.status}`)
  }
  return payload
}

export const httpAvenueApi = {
  async session() {
    return request('/api/session')
  },
  async login(email, password) {
    return request('/api/auth/login', { method: 'POST', body: { email, password } })
  },
  async signup(name, email, password) {
    return request('/api/auth/signup', { method: 'POST', body: { name, email, password } })
  },
  async logout() {
    return request('/api/auth/logout', { method: 'POST', body: {} })
  },
}

export let avenueApi = httpAvenueApi

export function setAvenueApiForTests(api) {
  if (import.meta.env?.MODE !== 'test' && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    throw new Error('setAvenueApiForTests can only be used in tests.')
  }
  avenueApi = api
}
