import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'

function emptyTask() {
  return { description: '', due_date: '', requires_clinician_review: false }
}

export default function PatientDetail() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [summary, setSummary] = useState(null)
  const [clinicians, setClinicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [clinicianId, setClinicianId] = useState('')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [tasks, setTasks] = useState([emptyTask()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [patientId])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [p, s, c] = await Promise.all([
        api.getPatient(patientId),
        api.getContinuitySummary(patientId),
        api.listClinicians(),
      ])
      setPatient(p)
      setSummary(s)
      setClinicians(c)
      if (c.length > 0 && !clinicianId) setClinicianId(c[0].id)
    } catch (err) {
      setError('Could not load this patient. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  function updateTask(index, field, value) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    )
  }

  function addTaskRow() {
    setTasks((prev) => [...prev, emptyTask()])
  }

  function removeTaskRow(index) {
    setTasks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateConsultation(e) {
    e.preventDefault()
    if (!clinicianId) return
    setSaving(true)
    setError(null)
    try {
      const followUpTasks = tasks
        .filter((t) => t.description.trim())
        .map((t) => ({
          description: t.description,
          due_date: t.due_date ? `${t.due_date}T09:00:00` : null,
          requires_clinician_review: t.requires_clinician_review,
        }))

      await api.createConsultation({
        patient_id: patientId,
        clinician_id: clinicianId,
        condition: condition || null,
        notes: notes || null,
        follow_up_tasks: followUpTasks,
      })

      setCondition('')
      setNotes('')
      setTasks([emptyTask()])
      setShowForm(false)
      await loadAll()
    } catch (err) {
      setError('Could not save this consultation. Check the fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      await api.completeFollowUpTask(taskId)
      await loadAll()
    } catch {
      setError('Could not update that task.')
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <>
      <Link to="/" className="back-link">
        ← All patients
      </Link>

      {error && <div className="error-banner">{error}</div>}

      {patient && (
        <div className="page-header">
          <div>
            <h1 className="page-title">{patient.full_name}</h1>
            <p className="page-subtitle">
              {patient.phone_number || 'No phone on file'}
              {patient.email ? ` · ${patient.email}` : ''}
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New consultation'}
          </button>
        </div>
      )}

      {summary && (
        <div className="card">
          <h2 className="section-title">Continuity summary</h2>
          <div className="summary-row">
            <div className="summary-stat overdue">
              <div className="value">{summary.overdue}</div>
              <div className="label">Overdue</div>
            </div>
            <div className="summary-stat pending">
              <div className="value">{summary.pending}</div>
              <div className="label">Pending</div>
            </div>
            <div className="summary-stat completed">
              <div className="value">{summary.completed}</div>
              <div className="label">Completed</div>
            </div>
          </div>
        </div>
      )}

      {summary && summary.overdue_tasks.length > 0 && (
        <div className="card">
          <h2 className="section-title">Overdue tasks</h2>
          {summary.overdue_tasks.map((t) => (
            <div className="task-row" key={t.id}>
              <div className="task-desc">
                <span className="status-dot overdue" />
                {t.description}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="task-due">
                  Due {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                </span>
                <button className="btn btn-ghost" onClick={() => handleCompleteTask(t.id)}>
                  Mark complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="section-title">New consultation</h2>
          <form onSubmit={handleCreateConsultation}>
            <div className="field">
              <label>Clinician</label>
              {clinicians.length === 0 ? (
                <p className="patient-meta">
                  No clinicians on file yet — add one via the API first.
                </p>
              ) : (
                <select
                  value={clinicianId}
                  onChange={(e) => setClinicianId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--hairline)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14.5,
                  }}
                >
                  {clinicians.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="field">
              <label>Condition</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Hypertension"
              />
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Consultation notes…"
              />
            </div>

            <div className="field">
              <label>Follow-up tasks</label>
              {tasks.map((task, i) => (
                <div className="task-input-row" key={i}>
                  <input
                    type="text"
                    placeholder="e.g. Repeat blood pressure check"
                    value={task.description}
                    onChange={(e) => updateTask(i, 'description', e.target.value)}
                  />
                  <input
                    type="date"
                    value={task.due_date}
                    onChange={(e) => updateTask(i, 'due_date', e.target.value)}
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeTaskRow(i)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost" onClick={addTaskRow}>
                + Add task
              </button>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || clinicians.length === 0}
              style={{ marginTop: 8 }}
            >
              {saving ? 'Saving…' : 'Save consultation'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
