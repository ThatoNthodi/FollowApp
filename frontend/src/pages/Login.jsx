import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { setToken } from '../auth.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { access_token } = await api.login(email, password)
      setToken(access_token)
      navigate('/')
    } catch (err) {
      setError(
        'Incorrect email or password. If the API has been idle, it may also take up to a minute to wake up — try again shortly.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo-icon.png" alt="FollowApp" className="login-logo" />
        <h1 className="login-title">FollowApp</h1>
        <p className="login-subtitle">Sign in to your clinician account</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-footnote">
          New clinician accounts are created via the API's <code>/auth/register</code>{' '}
          endpoint for now.
        </p>
      </div>
    </div>
  )
}
