// Small fetch wrapper. Every request goes to /api/... which Vite proxies to the backend.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

const post = (path, body = {}) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const PRIORITIES = ['Low', 'Medium', 'High']
export const CATEGORIES = ['Study', 'Work', 'Personal', 'Health', 'Other']

export const api = {
  getTasks: (params = {}) => request('/tasks?' + new URLSearchParams(params)),
  getStats: () => request('/tasks/stats'),
  createTask: (task) => post('/tasks', task),
  updateTask: (id, task) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  toggleComplete: (id) => request(`/tasks/${id}/complete`, { method: 'PATCH' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
}

export const ai = {
  status: () => request('/ai/status'),
  suggest: (title, description = '') => post('/ai/suggest', { title, description }),
  breakDown: (title, description = '') => post('/ai/break-down', { title, description }),
  dailyPlan: () => post('/ai/daily-plan'),
  ask: (question) => post('/ai/ask', { question }),
}
