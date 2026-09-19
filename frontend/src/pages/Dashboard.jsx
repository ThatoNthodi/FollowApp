import { useEffect, useState } from 'react'
import { api } from '../api.js'

function formatRelativeTime(isoString) {
  const then = new Date(isoString)
  const diffMs = Date.now() - then.getTime()
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

const ACTION_LABELS = {
  login: 'logged in',
  patient_created: 'added a patient',
  consultation_created: 'logged a consultation',
  task_status_changed: 'updated a follow-up task',
  ai_conversation_flagged: 'AI conversation flagged for review',
  ai_conversation_reviewed: 'reviewed a flagged AI conversation',
  clinician_promoted: 'promoted a clinician to admin',
  clinician_demoted: 'removed admin access from a clinician',
}

function describeActivity(entry) {
  const label = ACTION_LABELS[entry.action] || entry.action.replaceAll('_', ' ')
  const who = entry.actor_type === 'system' ? 'System' : entry.actor_type === 'clinician' ? 'A clinician' : 'A patient'
  return `${who} ${label}`
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getDashboard()
      setData(result)
    } catch (err) {
      setError(
        'Could not load the dashboard. If the API has been idle, it may take up to a minute to wake up — try again shortly.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Practice dashboard</h1>
          </div>
        </div>
        <p className="page-subtitle">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Practice dashboard</h1>
          </div>
        </div>
        <div className="error-banner">{error}</div>
      </div>
    )
  }

  const totalTasks = data.pending_task_count + data.overdue_task_count + data.completed_task_count
  const completionPct = Math.round(data.task_completion_rate * 100)

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Practice dashboard</h1>
          <p className="page-subtitle">
            {data.clinician_count} clinician{data.clinician_count === 1 ? '' : 's'} ·{' '}
            {data.patient_count} patient{data.patient_count === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-value">{data.patient_count}</p>
          <p className="stat-label">Patients</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.consultation_count}</p>
          <p className="stat-label">Consultations</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.clinician_count}</p>
          <p className="stat-label">
            Clinicians{data.admin_count ? ` (${data.admin_count} admin)` : ''}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{completionPct}%</p>
          <p className="stat-label">Task completion rate</p>
        </div>
        <div className="stat-card stat-card-warn">
          <p className="stat-value">{data.overdue_task_count}</p>
          <p className="stat-label">Overdue tasks</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.pending_task_count}</p>
          <p className="stat-label">Pending tasks</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.completed_task_count}</p>
          <p className="stat-label">Completed tasks</p>
        </div>
        <div className={data.ai_conversations_pending_review ? 'stat-card stat-card-warn' : 'stat-card'}>
          <p className="stat-value">{data.ai_conversations_pending_review}</p>
          <p className="stat-label">AI conversations pending review</p>
        </div>
      </div>

      {totalTasks === 0 && (
        <p className="page-subtitle" style={{ marginTop: -8, marginBottom: 20 }}>
          No follow-up tasks recorded yet.
        </p>
      )}

      <div className="card">
        <h2 className="section-title">Recent activity</h2>
        {data.recent_activity.length === 0 ? (
          <p className="page-subtitle">No activity recorded yet.</p>
        ) : (
          <ul className="activity-list">
            {data.recent_activity.map((entry) => (
              <li key={entry.id} className="activity-row">
                <span>{describeActivity(entry)}</span>
                <span className="activity-time">{formatRelativeTime(entry.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
