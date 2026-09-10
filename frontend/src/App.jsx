import { Routes, Route, NavLink } from 'react-router-dom'
import PatientsList from './pages/PatientsList.jsx'
import PatientDetail from './pages/PatientDetail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="brand">FollowApp</p>
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
        <p className="sidebar-footer">Clinician view</p>
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
