import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { setToken, setRole } from '../auth.js'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [signupRole, setSignupRole] = useState('patient') // 'patient' | 'clinician'

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  // Shared
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sign up
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [practiceNumber, setPracticeNumber] = useState('')
  const [council, setCouncil] = useState('HPCSA')

  function resetMessages() {
    setError(null)
    setSuccess(null)
  }

  async function handleSignIn(e) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    try {
      const { access_token, role } = await api.login(email, password)
      setToken(access_token)
      setRole(role)
      navigate(role === 'patient' ? '/my-portal' : '/')
    } catch {
      setError(
        'Incorrect email or password. If the API has been idle, it may take up to a minute to wake up — try again shortly.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    resetMessages()
    setLoading(true)
    try {
      if (signupRole === 'patient') {
        await api.registerPatient({
          full_name: fullName,
          phone_number: phoneNumber || null,
          email,
          password,
        })
      } else {
        await api.registerClinician({
          full_name: fullName,
          practice_number: practiceNumber,
          council,
          email,
          password,
        })
      }
      setSuccess('Account created — you can now sign in.')
      setMode('signin')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Could not create that account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo-icon.png" alt="FollowApp" className="login-logo" />
        <h1 className="login-title">FollowApp</h1>
        <p className="login-subtitle">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </p>

        <div className="auth-tabs">
          <button
            className={'auth-tab' + (mode === 'signin' ? ' active' : '')}
            onClick={() => {
              setMode('signin')
              resetMessages()
            }}
          >
            Sign in
          </button>
          <button
            className={'auth-tab' + (mode === 'signup' ? ' active' : '')}
            onClick={() => {
              setMode('signup')
              resetMessages()
            }}
          >
            Sign up
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="role-toggle">
              <button
                type="button"
                className={'role-option' + (signupRole === 'patient' ? ' active' : '')}
                onClick={() => setSignupRole('patient')}
              >
                I'm a patient
              </button>
              <button
                type="button"
                className={'role-option' + (signupRole === 'clinician' ? ' active' : '')}
                onClick={() => setSignupRole('clinician')}
              >
                I'm a healthcare provider
              </button>
            </div>

            <div className="field">
              <label>Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            {signupRole === 'patient' ? (
              <div className="field">
                <label>Phone number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0821234567"
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Practice number</label>
                  <input
                    type="text"
                    value={practiceNumber}
                    onChange={(e) => setPracticeNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Council</label>
                  <select
                    value={council}
                    onChange={(e) => setCouncil(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--hairline)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14.5,
                    }}
                  >
                    <option value="HPCSA">HPCSA</option>
                    <option value="SANC">SANC</option>
                  </select>
                </div>
              </>
            )}

            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
