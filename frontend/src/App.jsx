import AdminDashboard from './pages/AdminDashboard.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import PatientsList from './pages/PatientsList.jsx'
import PatientDetail from './pages/PatientDetail.jsx'
import AuthPage from './pages/AuthPage.jsx'
import PrivacyEthicsFAQ from './pages/PrivacyEthicsFAQ.jsx'
import PatientPortal from './pages/PatientPortal.jsx'
import MyPortal from './pages/MyPortal.jsx'
import FeedbackWidget from './components/FeedbackWidget.jsx'
import { isAuthenticated, getRole, clearToken } from './auth.js'
import { api } from './api.js'

function RequireAdmin({ children }) {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    api.getMe()
      .then((me) => {
        setIsAdmin(me.role === 'clinician' && me.clinician?.is_admin === true)
      })
      .catch(() => {
        setIsAdmin(false)
      })
      .finally(() => {
        setChecking(false)
      })
  }, [])

  if (!isAuthenticated() || getRole() !== 'clinician') {
    return <Navigate to="/login" replace />
  }

  if (checking) {
    return <div className="admin-loading">Checking administrator access...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function RequireClinician({ children }) {
  if (!isAuthenticated() || getRole() !== 'clinician') {
    return <Navigate to="/login" replace />
  }
  return children
}

function RequirePatient({ children }) {
  if (!isAuthenticated() || getRole() !== 'patient') {
    return <Navigate to="/login" replace />
  }
  return children
}

function ClinicianShell() {
  const navigate = useNavigate()
  const [clinician, setClinician] = useState(null)

  useEffect(() => {
    api.getMe().then((me) => setClinician(me.clinician)).catch(() => {})
  }, [])

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <img src="/logo-icon.png" alt="" />
          <p className="brand">FollowApp</p>
        </div>
        <p className="brand-tag">Care that continues</p>
        <ul className="nav-list">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              Patients
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          {clinician && <p className="sidebar-clinician">{clinician.full_name}</p>}
          <button className="btn sidebar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<PatientsList />} />
          <Route path="/patients/:patientId" element={<PatientDetail />} />
        </Routes>
      </main>

      <FeedbackWidget />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/privacy-ethics" element={<PrivacyEthicsFAQ />} />
      <Route path="/portal/:patientId" element={<PatientPortal />} />
      <Route
        path="/my-portal"
        element={
          <RequirePatient>
            <MyPortal />
          </RequirePatient>
        }
      />

       <Route
         path="/admin"
         element={
           <RequireAdmin>
             <AdminDashboard />
           </RequireAdmin>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAdmin>
            <Dashboard />
          </RequireAdmin>
        }
      />

      <Route
        path="/*"
        element={
          <RequireClinician>
            <ClinicianShell />
          </RequireClinician>
        }
      />

    </Routes>
  )
}
