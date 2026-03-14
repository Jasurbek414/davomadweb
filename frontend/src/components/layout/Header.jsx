import { Bell, Menu, X, Search } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export function Header({ onToggleSidebar, sidebarCollapsed }) {
  const { user } = useSelector(state => state.auth)
  const { unreadCount } = useSelector(state => state.notifications)

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
      >
        {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Qidirish..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Date */}
      <p className="text-sm text-slate-500 hidden md:block">
        {format(new Date(), 'dd.MM.yyyy')}
      </p>

      {/* Notifications */}
      <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User avatar */}
      <Link to="/profile" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-semibold">
          {user?.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-slate-700 leading-tight">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
      </Link>
    </header>
  )
}
