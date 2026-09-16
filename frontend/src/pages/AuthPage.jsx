import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Phone, ShieldCheck, Activity } from 'lucide-react'
import { api } from '../api.js'
import { setToken, setRole } from '../auth.js'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [signupRole, setSignupRole] = useState('patient') // 'patient' | 'clinician'
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

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
  const [consent, setConsent] = useState(false)

  function resetMessages() {
    setError(null)
    setSuccess(null)
  }

  function switchMode(next) {
    setMode(next)
    setShowPassword(false)
    resetMessages()
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
        if (!consent) {
          setError('Please confirm you consent to your information being processed to continue.')
          setLoading(false)
          return
        }
        await api.registerPatient({
          full_name: fullName,
          phone_number: phoneNumber || null,
          email,
          password,
          consent: true,
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
      switchMode('signin')
      setPassword('')
      setConsent(false)
    } catch (err) {
      setError(err.message || 'Could not create that account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-hero-brand">
          <img src="/logo-icon.png" alt="" className="auth-hero-logo" />
          <span className="auth-hero-wordmark">
            Follow<em>App</em>
          </span>
        </div>

        <h1 className="auth-hero-headline">
          Better follow-ups.
          <br />
          Healthier tomorrows.
        </h1>
        <p className="auth-hero-sub">
          FollowApp keeps patients and care teams connected after the consultation —
          care plans, reminders and progress, all in one place.
        </p>

        <div className="auth-hero-pulse" aria-hidden="true">
          <Activity size={22} strokeWidth={2.2} />
          <svg viewBox="0 0 400 60" className="auth-hero-pulse-line" preserveAspectRatio="none">
            <polyline
              points="0,30 60,30 80,8 100,52 120,30 400,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <ul className="auth-hero-points">
          <li>Care plans that follow the patient home</li>
          <li>Automatic reminders for overdue follow-ups</li>
          <li>One shared view for every clinician on the case</li>
        </ul>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-panel-brand">
            <img src="/logo-icon.png" alt="FollowApp" className="auth-panel-logo" />
            <div>
              <div className="auth-panel-wordmark">
                Follow<em>App</em>
              </div>
              <div className="auth-panel-tagline">Care that continues</div>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={'auth-tab' + (mode === 'signin' ? ' active' : '')}
              onClick={() => switchMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={'auth-tab' + (mode === 'signup' ? ' active' : '')}
              onClick={() => switchMode('signup')}
              type="button"
            >
              Sign up
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div className="field-icon">
                <Mail size={17} className="field-icon-glyph" />
                <input
                  type="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field-icon">
                <Lock size={17} className="field-icon-glyph" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-icon-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="auth-row">
                <label className="remember-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    setSuccess(
                      'Ask your clinic to reset your password for now — self-service reset is coming soon.',
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button type="button" className="btn btn-outline auth-submit" onClick={() => switchMode('signup')}>
                Create an account
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

              <div className="field-icon">
                <User size={17} className="field-icon-glyph" />
                <input
                  type="text"
                  placeholder="Full name"
                  aria-label="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {signupRole === 'patient' ? (
                <div className="field-icon">
                  <Phone size={17} className="field-icon-glyph" />
                  <input
                    type="text"
                    placeholder="Phone number (e.g. 0821234567)"
                    aria-label="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
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
                      className="council-select"
                    >
                      <option value="HPCSA">HPCSA</option>
                      <option value="SANC">SANC</option>
                    </select>
                  </div>
                </>
              )}

              <div className="field-icon">
                <Mail size={17} className="field-icon-glyph" />
                <input
                  type="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field-icon">
                <Lock size={17} className="field-icon-glyph" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-icon-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {signupRole === 'patient' && (
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I consent to FollowApp processing my personal and health information,
                    in accordance with POPIA, for the purpose of coordinating my healthcare.
                  </span>
                </label>
              )}

              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <div className="auth-security-note">
            <ShieldCheck size={18} />
            <span>
              Your information is secure and private. FollowApp protects your data in line
              with POPIA.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
