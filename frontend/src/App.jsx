import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from './store/authSlice'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/operator/StudentsPage'
import TeachersPage from './pages/operator/TeachersPage'
import ParentsPage from './pages/operator/ParentsPage'
import DevicesPage from './pages/operator/DevicesPage'
import AttendancePage from './pages/attendance/AttendancePage'
import ReportsPage from './pages/reports/ReportsPage'
import ProfilePage from './pages/common/ProfilePage'
import NotificationsPage from './pages/common/NotificationsPage'
import TelegramPage from './pages/common/TelegramPage'
import OrganizationsPage from './pages/admin/OrganizationsPage'
import UsersPage from './pages/admin/UsersPage'
import AuditPage from './pages/admin/AuditPage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(state => state.auth)

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMe())
  }, [dispatch, isAuthenticated])

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Admin */}
        <Route path="users" element={<UsersPage />} />
        <Route path="regions" element={<OrganizationsPage />} />
        <Route path="schools" element={<OrganizationsPage />} />
        <Route path="districts" element={<OrganizationsPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="audit" element={<AuditPage />} />
        {/* Operator / teacher */}
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="classes" element={<OrganizationsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        {/* Attendance & reports */}
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        {/* Common */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="telegram" element={<TelegramPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
