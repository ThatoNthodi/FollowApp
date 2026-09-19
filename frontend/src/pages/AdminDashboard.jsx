import { useEffect, useState } from 'react'
import { api } from '../api.js'

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [clinicians, setClinicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadClinicians() {
    try {
      setLoading(true)
      setError('')
      const data = await api.adminListClinicians()
      setClinicians(data)
    } catch (err) {
      setError(err.message || 'Could not load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClinicians()
  }, [])

  const totalClinicians = clinicians.length
  const adminCount = clinicians.filter((c) => c.is_admin).length
  const totalPatients = clinicians.reduce(
    (sum, c) => sum + (c.patient_count || 0),
    0
  )
  const totalConsultations = clinicians.reduce(
    (sum, c) => sum + (c.consultation_count || 0),
    0
  )
  const overdueTasks = clinicians.reduce(
    (sum, c) => sum + (c.overdue_task_count || 0),
    0
  )
  const completedTasks = clinicians.reduce(
    (sum, c) => sum + (c.completed_task_count || 0),
    0
  )

  async function toggleAdmin(clinician) {
    try {
      if (clinician.is_admin) {
        await api.demoteClinician(clinician.id)
      } else {
        await api.promoteClinician(clinician.id)
      }

      await loadClinicians()
    } catch (err) {
      setError(err.message || 'Could not update clinician')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h1>FollowApp Admin</h1>
          <p className="admin-subtitle">
            Practice and platform activity overview.
          </p>
        </div>

        <button className="btn admin-refresh" onClick={loadClinicians}>
          Refresh
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading administration data...</div>
      ) : (
        <>
          <section className="admin-stats">
            <StatCard label="Clinicians" value={totalClinicians} />
            <StatCard label="Administrators" value={adminCount} />
            <StatCard label="Patients" value={totalPatients} />
            <StatCard label="Consultations" value={totalConsultations} />
            <StatCard label="Overdue follow-ups" value={overdueTasks} />
            <StatCard label="Completed follow-ups" value={completedTasks} />
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <p className="admin-eyebrow">CLINICIAN MANAGEMENT</p>
                <h2>Clinicians</h2>
              </div>
              <span className="admin-count">
                {clinicians.length} total
              </span>
            </div>

            {clinicians.length === 0 ? (
              <div className="admin-empty">
                No clinicians have been registered yet.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Clinician</th>
                      <th>Practice number</th>
                      <th>Patients</th>
                      <th>Consultations</th>
                      <th>Overdue</th>
                      <th>Completed</th>
                      <th>Access</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {clinicians.map((clinician) => (
                      <tr key={clinician.id}>
                        <td>
                          <div className="admin-clinician-name">
                            {clinician.full_name}
                          </div>
                          <div className="admin-clinician-email">
                            {clinician.email}
                          </div>
                        </td>

                        <td>{clinician.practice_number || '—'}</td>
                        <td>{clinician.patient_count}</td>
                        <td>{clinician.consultation_count}</td>
                        <td>{clinician.overdue_task_count}</td>
                        <td>{clinician.completed_task_count}</td>

                        <td>
                          <span
                            className={
                              clinician.is_admin
                                ? 'admin-badge admin-badge-admin'
                                : 'admin-badge'
                            }
                          >
                            {clinician.is_admin ? 'Admin' : 'Clinician'}
                          </span>
                        </td>

                        <td>
                          <button
                            className="btn admin-action"
                            onClick={() => toggleAdmin(clinician)}
                          >
                            {clinician.is_admin
                              ? 'Remove admin'
                              : 'Make admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
