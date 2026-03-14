import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, MapPin, School, BookOpen, UserSquare,
  Monitor, ClipboardList, BarChart3, Bell, Settings, LogOut,
  GraduationCap, ShieldCheck, MessageCircle, Building2, UserCog
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useSelector } from 'react-redux'

const navConfig = {
  superadmin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Foydalanuvchilar', path: '/users', icon: Users },
    { label: 'Tashkilotlar', path: '/regions', icon: MapPin },
    { label: "O'quvchilar", path: '/students', icon: GraduationCap },
    { label: "O'qituvchilar", path: '/teachers', icon: UserSquare },
    { label: 'Ota-onalar', path: '/parents', icon: Users },
    { label: 'Sinflar', path: '/classes', icon: BookOpen },
    { label: 'Qurilmalar', path: '/devices', icon: Monitor },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
    { label: 'Audit loglari', path: '/audit', icon: ShieldCheck },
  ],
  region_director: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tashkilotlar', path: '/regions', icon: MapPin },
    { label: 'Maktablar', path: '/schools', icon: School },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
  district_director: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tashkilotlar', path: '/regions', icon: Building2 },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
  school_director: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: "O'quvchilar", path: '/students', icon: GraduationCap },
    { label: 'Sinflar', path: '/classes', icon: BookOpen },
    { label: 'Qurilmalar', path: '/devices', icon: Monitor },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
  operator: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: "O'quvchilar", path: '/students', icon: GraduationCap },
    { label: "O'qituvchilar", path: '/teachers', icon: UserSquare },
    { label: 'Sinflar', path: '/classes', icon: BookOpen },
    { label: 'Ota-onalar', path: '/parents', icon: Users },
    { label: 'Qurilmalar', path: '/devices', icon: Monitor },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Sinf jadvali', path: '/classes', icon: BookOpen },
    { label: 'Davomad', path: '/attendance', icon: ClipboardList },
    { label: 'Hisobotlar', path: '/reports', icon: BarChart3 },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
  parent: [
    { label: 'Bolalarim', path: '/my-children', icon: GraduationCap },
    { label: 'Davomad tarixi', path: '/attendance', icon: ClipboardList },
    { label: 'Telegram Bot', path: '/telegram', icon: MessageCircle },
  ],
}

const ROLE_DISPLAY = {
  superadmin: 'Super Admin',
  region_director: 'Viloyat Direktori',
  district_director: 'Tuman Direktori',
  school_director: 'Maktab Direktori',
  operator: 'Operator',
  teacher: "O'qituvchi",
  parent: 'Ota-ona',
}

export function Sidebar({ collapsed, onToggle }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { primaryRole } = usePermissions()
  const { user } = useSelector(state => state.auth)

  const navItems = navConfig[primaryRole] || navConfig.operator
  const roleLabel = ROLE_DISPLAY[primaryRole] || primaryRole

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 50%, #2D2666 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/40">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Maktab Davomad</p>
            <p className="text-violet-300 text-xs">Face ID tizimi</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.full_name || `${user.first_name} ${user.last_name}`}</p>
              <p className="text-violet-300 text-[10px] truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
               ${isActive
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="border-t border-white/10 p-2 space-y-0.5">
        <NavLink to="/notifications"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
             ${isActive ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
             ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Bildirishnomalar' : ''}
        >
          <Bell style={{ width: 18, height: 18 }} className="flex-shrink-0" />
          {!collapsed && 'Bildirishnomalar'}
        </NavLink>
        <NavLink to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
             ${isActive ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
             ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Profil' : ''}
        >
          <Settings style={{ width: 18, height: 18 }} className="flex-shrink-0" />
          {!collapsed && 'Profil'}
        </NavLink>

        <button onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all
            ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Chiqish' : ''}
        >
          <LogOut style={{ width: 18, height: 18 }} className="flex-shrink-0" />
          {!collapsed && 'Chiqish'}
        </button>
      </div>
    </aside>
  )
}
