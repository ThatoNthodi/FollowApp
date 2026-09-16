import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function PatientPortal() {
  const [view, setView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aiMessage, setAiMessage] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleAskAI = async () => {
    const message = aiMessage.trim()

    if (!message || aiLoading) {
      return
    }

    setAiLoading(true)
    setAiResponse(null)

    try {
      const response = await api.askAI(message)
      setAiResponse(response)
      setAiMessage('')
    } catch (err) {
      setAiResponse({
        answer: 'We could not reach the AI assistant right now. Please try again shortly.',
        requires_human_review: true,
      })
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    api
      .getMyPortal()
      .then(setView)
      .catch(() =>
        setError(
          'We could not load your care plan right now. Please check the link or try again shortly.',
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="portal-screen">
        <div className="portal-card">
          <div className="loading">Loading your care plan…</div>
        </div>
      </div>
    )
  }

  if (error || !view) {
    return (
      <div className="portal-screen">
        <div className="portal-card">
          <div className="error-banner">{error || 'Something went wrong.'}</div>
        </div>
      </div>
    )
  }

  const { patient, summary, consultations } = view
  const firstName = patient.full_name.split(' ')[0]

  return (
    <div className="portal-screen">
      <div className="portal-card">
        <img src="/logo-icon.png" alt="" className="portal-logo" />
        <h1 className="portal-title">Hi {firstName}</h1>
        <p className="portal-subtitle">Here's where things stand with your care.</p>

        <div className="portal-summary">
          <div className="summary-stat overdue">
            <div className="value">{summary.overdue}</div>
            <div className="label">Needs attention</div>
          </div>
          <div className="summary-stat pending">
            <div className="value">{summary.pending}</div>
            <div className="label">Upcoming</div>
          </div>
          <div className="summary-stat completed">
            <div className="value">{summary.completed}</div>
            <div className="label">Done</div>
          </div>
        </div>

        {summary.overdue_tasks.length > 0 && (
          <div className="portal-section">
            <h2 className="section-title">Needs your attention</h2>
            {summary.overdue_tasks.map((t) => (
              <div className="portal-task" key={t.id}>
                <span className="status-dot overdue" />
                <div>
                  <div>{t.description}</div>
                  {t.due_date && (
                    <div className="patient-meta">
                      Was due {new Date(t.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="portal-section">
          <h2 className="section-title">Your care history</h2>
          {consultations.length === 0 ? (
            <p className="patient-meta">No consultations on record yet.</p>
          ) : (
            consultations.map((c) => (
              <div className="portal-consultation" key={c.id}>
                <div className="portal-consultation-header">
                  <strong>{c.condition || 'Consultation'}</strong>
                  <span className="patient-meta">
                    {new Date(c.consultation_date).toLocaleDateString()}
                  </span>
                </div>
                {c.follow_up_tasks.length > 0 && (
                  <ul className="portal-task-list">
                    {c.follow_up_tasks.map((t) => (
                      <li key={t.id}>
                        <span className={`status-dot ${t.status}`} />
                        {t.description}
                        {t.status === 'completed' && ' — done'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>

                <p className="portal-footnote">
          Questions about your care? Contact your clinic directly.
        </p>

        <div className="ai-assistant">
          <h2 className="ai-assistant-title">Ask FollowApp AI</h2>
          <p className="ai-assistant-subtitle">
            Ask general health questions or get help understanding your care.
          </p>

          {aiResponse && (
            <div className="ai-chat">
              <div className="ai-message assistant">
                {aiResponse.answer}
              </div>

              {aiResponse.requires_human_review && (
                <div className="ai-safety-note">
                  This question may need review by your healthcare professional.
                </div>
              )}
            </div>
          )}

          <div className="ai-input-row">
            <input
              type="text"
              className="ai-input"
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAskAI()
                }
              }}
              placeholder="Ask a health question..."
              disabled={aiLoading}
            />

            <button
              type="button"
              className="ai-button"
              onClick={handleAskAI}
              disabled={aiLoading || !aiMessage.trim()}
            >
              {aiLoading ? 'Asking…' : 'Ask'}
            </button>
          </div>

          <p className="ai-safety-note">
            FollowApp AI provides general health information and does not
            replace advice from your healthcare professional.
          </p>
        </div>
       </div>
      </div>
  )
}
