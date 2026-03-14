import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useDispatch } from 'react-redux'
import { fetchNotifications } from '../../store/notificationsSlice'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchNotifications())
    const interval = setInterval(() => {
      dispatch(fetchNotifications())
    }, 60000)
    return () => clearInterval(interval)
  }, [dispatch])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} sidebarCollapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
