import { useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'
import { api } from '../api.js'

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  function handleOpen() {
    setOpen(true)
    setSent(false)
    setError(null)
  }

  function handleClose() {
    setOpen(false)
    setMessage('')
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      await api.submitFeedback(message.trim())
      setSent(true)
      setMessage('')
      setTimeout(() => {
        setOpen(false)
        setSent(false)
      }, 1800)
    } catch (err) {
      setError('Could not send feedback right now. Please try again shortly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        className="feedback-fab"
        onClick={handleOpen}
        aria-label="Send feedback"
        type="button"
      >
        <MessageSquarePlus size={20} strokeWidth={2.2} />
        <span>Feedback</span>
      </button>
    )
  }

  return (
    <div className="feedback-panel">
      <div className="feedback-panel-header">
        <span>Send feedback</span>
        <button
          className="feedback-panel-close"
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>

      {sent ? (
        <p className="feedback-panel-thanks">Thanks — your feedback was sent.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            className="feedback-panel-textarea"
            placeholder="What's working, what's confusing, what's broken?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            autoFocus
          />
          {error && <p className="feedback-panel-error">{error}</p>}
          <button
            className="btn feedback-panel-submit"
            type="submit"
            disabled={submitting || !message.trim()}
          >
            {submitting ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  )
}
