import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function PatientsList() {
  const [patients, setPatients] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone_number: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    setLoading(true)
    setError(null)
    try {
      const list = await api.listPatients()
      setPatients(list)

      // Fetch each patient's continuity summary for the worklist counts.
      const entries = await Promise.all(
        list.map(async (p) => {
          try {
            const summary = await api.getContinuitySummary(p.id)
            return [p.id, summary]
          } catch {
            return [p.id, null]
          }
        }),
      )
      setSummaries(Object.fromEntries(entries))
    } catch (err) {
      setError(
        'Could not reach the FollowApp API. If it has been idle, it may take up to a minute to wake up — try again shortly.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePatient(e) {
    e.preventDefault()
    if (!form.full_name.trim()) return
    setSaving(true)
    try {
      await api.createPatient({
        full_name: form.full_name,
        phone_number: form.phone_number || null,
        email: form.email || null,
      })
      setForm({ full_name: '', phone_number: '', email: '' })
      setShowForm(false)
      await loadPatients()
    } catch (err) {
      setError('Could not save this patient. Check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">
            {patients.length} patient{patients.length === 1 ? '' : 's'} under care
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New patient'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="section-title">New patient</h2>
          <form onSubmit={handleCreatePatient}>
            <div className="field">
              <label>Full name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. Naledi Dlamini"
                required
              />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="e.g. 0821234567"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="optional"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save patient'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading patients…</div>
      ) : patients.length === 0 ? (
        <div className="worklist">
          <div className="empty-state">
            <h2 className="section-title">No patients yet</h2>
            <p>Add your first patient to begin tracking their care.</p>
          </div>
        </div>
      ) : (
        <div className="worklist">
          <div className="worklist-row header">
            <span>Patient</span>
            <span>Contact</span>
            <span>Overdue</span>
            <span>Pending</span>
            <span>Completed</span>
          </div>
          {patients.map((p) => {
            const s = summaries[p.id]
            return (
              <Link key={p.id} to={`/patients/${p.id}`} className="worklist-row">
                <span className="patient-name">{p.full_name}</span>
                <span className="patient-meta">{p.phone_number || '—'}</span>
                <span className="status-count">
                  <span className="status-dot overdue" />
                  {s ? s.overdue : '–'}
                </span>
                <span className="status-count">
                  <span className="status-dot pending" />
                  {s ? s.pending : '–'}
                </span>
                <span className="status-count">
                  <span className="status-dot completed" />
                  {s ? s.completed : '–'}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
