import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import PatientsList from './pages/PatientsList.jsx'
import PatientDetail from './pages/PatientDetail.jsx'
import Login from './pages/Login.jsx'
import { isAuthenticated, clearToken } from './auth.js'
import { api } from './api.js'

function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function ClinicianShell() {
  const navigate = useNavigate()
  const [clinician, setClinician] = useState(null)

  useEffect(() => {
    api.getMe().then(setClinician).catch(() => {})
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
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <ClinicianShell />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
