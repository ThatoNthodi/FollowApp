import { getToken, clearToken } from './auth.js'

const API_BASE = import.meta.env.VITE_API_URL || 'https://followapp-lvri.onrender.com'

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Not authenticated')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json()
}

export const api = {
  login: async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    if (!res.ok) {
      throw new Error('Incorrect email or password')
    }
    return res.json()
  },
  getMe: () => request('/auth/me'),

  registerClinician: (data) => {
    return fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Could not create account')
      }
      return res.json()
    })
  },

  registerPatient: (data) => {
    return fetch(`${API_BASE}/auth/register-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Could not create account')
      }
      return res.json()
    })
  },

  getMyPortal: () => request('/me/portal'),

  listPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) =>
    request('/patients', { method: 'POST', body: JSON.stringify(data) }),

  createConsultation: (data) =>
    request('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  listConsultations: () => request('/consultations'),

  getContinuitySummary: (patientId) =>
    request(`/patients/${patientId}/continuity-summary`),

  completeFollowUpTask: (taskId) =>
    request(`/follow-up-tasks/${taskId}/complete`, { method: 'PATCH' }),

  sendReminder: (taskId) =>
    request(`/follow-up-tasks/${taskId}/send-reminder`, { method: 'POST' }),

  getPortalView: (patientId) => request(`/portal/${patientId}`),
}
