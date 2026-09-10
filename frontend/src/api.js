const API_BASE = import.meta.env.VITE_API_URL || 'https://followapp-lvri.onrender.com'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json()
}

export const api = {
  listPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) =>
    request('/patients', { method: 'POST', body: JSON.stringify(data) }),

  listClinicians: () => request('/clinicians'),
  createClinician: (data) =>
    request('/clinicians', { method: 'POST', body: JSON.stringify(data) }),

  createConsultation: (data) =>
    request('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  listConsultations: () => request('/consultations'),

  getContinuitySummary: (patientId) =>
    request(`/patients/${patientId}/continuity-summary`),

  completeFollowUpTask: (taskId) =>
    request(`/follow-up-tasks/${taskId}/complete`, { method: 'PATCH' }),
}
