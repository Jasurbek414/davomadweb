import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, UserX, Shield, ChevronDown, User, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingSpinner'
import { usersAPI } from '../../api/auth'
import { orgAPI } from '../../api/organizations'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  region_director: 'Viloyat Direktori',
  district_director: 'Tuman Direktori',
  school_director: 'Maktab Direktori',
  operator: 'Operator',
  teacher: "O'qituvchi",
  parent: 'Ota-ona',
}

const ROLE_COLORS = {
  superadmin: 'bg-violet-100 text-violet-700',
  region_director: 'bg-blue-100 text-blue-700',
  district_director: 'bg-cyan-100 text-cyan-700',
  school_director: 'bg-emerald-100 text-emerald-700',
  operator: 'bg-orange-100 text-orange-700',
  teacher: 'bg-amber-100 text-amber-700',
  parent: 'bg-pink-100 text-pink-700',
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white appearance-none">
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

function RoleAssignModal({ userId, onClose }) {
  const [roles, setRoles] = useState([])
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [schools, setSchools] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [form, setForm] = useState({ role: '', region: '', district: '', school: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      usersAPI.getRoles(),
      usersAPI.getUserRoles(userId),
      orgAPI.getRegions({ page_size: 200 }),
      orgAPI.getDistricts({ page_size: 500 }),
      orgAPI.getSchools({ page_size: 500 }),
    ]).then(([r, ur, reg, dis, sch]) => {
      setRoles(r.data.results || r.data || [])
      setUserRoles(ur.data || [])
      setRegions(reg.data.results || [])
      setDistricts(dis.data.results || [])
      setSchools(sch.data.results || [])
    }).catch(err => {
      console.error("Error loading role data:", err)
      toast.error("Ma'lumotlarni yuklashda xatolik")
    })
  }, [userId])

  const handleAssign = async () => {
    if (!form.role) return toast.error('Rolni tanlang')
    setSaving(true)
    try {
      const payload = { role: form.role }
      if (form.region) payload.region = form.region
      if (form.district) payload.district = form.district
      if (form.school) payload.school = form.school
      await usersAPI.assignRole(userId, payload)
      const ur = await usersAPI.getUserRoles(userId)
      setUserRoles(ur.data || [])
      setForm({ role: '', region: '', district: '', school: '' })
      toast.success('Rol berildi')
    } catch (e) {
      const err = e.response?.data
      const msg = err?.non_field_errors?.[0] || Object.values(err || {}).flat()[0] || 'Xatolik yuz berdi'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const selectedRole = form.role
  const needsRegion = ['region_director', 'district_director', 'school_director', 'operator', 'teacher'].includes(selectedRole)
  const needsDistrict = ['district_director', 'school_director', 'operator', 'teacher'].includes(selectedRole)
  const needsSchool = ['school_director', 'operator', 'teacher'].includes(selectedRole)

  return (
    <div className="space-y-5">
      {/* Current roles */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Mavjud rollar</p>
        {userRoles.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Rol tayinlanmagan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userRoles && userRoles.map((ur, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[ur.role_name] || 'bg-slate-100 text-slate-700'}`}>
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[ur.role_name] || ur.role_display || ur.role_name}
                {ur.region_name && ` — ${ur.region_name}`}
                {ur.district_name && ` — ${ur.district_name}`}
                {ur.school_name && ` — ${ur.school_name}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Yangi rol qo'shish</p>
        <div className="space-y-3">
          <SelectField label="Rol *" value={form.role} onChange={v => setForm(f => ({ ...f, role: v, region: '', district: '', school: '' }))}
            options={roles.map(r => ({ value: r.name, label: ROLE_LABELS[r.name] || r.name }))}
            placeholder="Rolni tanlang" />
          {needsRegion && (
            <SelectField label="Viloyat" value={form.region} onChange={v => setForm(f => ({ ...f, region: v, district: '', school: '' }))}
              options={regions.map(r => ({ value: String(r.id), label: r.name }))}
              placeholder="Viloyatni tanlang" />
          )}
          {needsDistrict && form.region && (
            <SelectField label="Tuman" value={form.district} onChange={v => setForm(f => ({ ...f, district: v, school: '' }))}
              options={districts.filter(d => String(d.region) === form.region).map(d => ({ value: String(d.id), label: d.name }))}
              placeholder="Tumanni tanlang" />
          )}
          {needsSchool && form.district && (
            <SelectField label="Maktab" value={form.school} onChange={v => setForm(f => ({ ...f, school: v }))}
              options={schools.filter(s => String(s.district) === form.district).map(s => ({ value: String(s.id), label: s.name }))}
              placeholder="Maktabni tanlang" />
          )}
          <Button onClick={handleAssign} disabled={saving} className="w-full justify-center">
            {saving ? 'Tayinlanmoqda...' : 'Rol tayinlash'}
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button variant="secondary" onClick={onClose}>Yopish</Button>
      </div>
    </div>
  )
}

function AddUserModal({ onClose, onCreated }) {
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    phone: '', first_name: '', last_name: '', middle_name: '',
    email: '', password: '', password_confirm: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleCreate = async () => {
    if (!form.phone || !form.first_name || !form.last_name || !form.password || !form.password_confirm) {
      return toast.error('Majburiy maydonlarni to\'ldiring')
    }
    if (form.password.length < 8) return toast.error('Parol kamida 8 ta belgi')
    if (form.password !== form.password_confirm) return toast.error('Parollar mos kelmadi')
    setSaving(true)
    try {
      await usersAPI.createUser(form)
      toast.success('Foydalanuvchi yaratildi')
      onCreated()
      onClose()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.phone?.[0] || err?.password?.[0] || err?.detail || 'Xatolik yuz berdi'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Familiya *</label>
          <Input value={form.last_name} onChange={set('last_name')} placeholder="Karimov" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ismi *</label>
          <Input value={form.first_name} onChange={set('first_name')} placeholder="Ali" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Otasining ismi</label>
        <Input value={form.middle_name} onChange={set('middle_name')} placeholder="Valiyevich" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon raqami *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={form.phone} onChange={set('phone')} placeholder="+998901234567" className="pl-9" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (ixtiyoriy)</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={form.email} onChange={set('email')} placeholder="ali@example.com" type="email" className="pl-9" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Parol *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={form.password} onChange={set('password')} type={showPass ? 'text' : 'password'}
            placeholder="Kamida 8 ta belgi" className="pl-9 pr-10" />
          <button type="button" onClick={() => setShowPass(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Parolni tasdiqlash *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={form.password_confirm} onChange={set('password_confirm')} type={showPass ? 'text' : 'password'}
            placeholder="Parolni qayta kiriting" className="pl-9 pr-10" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleCreate} disabled={saving}>{saving ? 'Yaratilmoqda...' : 'Yaratish'}</Button>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [roleModal, setRoleModal] = useState(null) // userId

  const load = useCallback(() => {
    setLoading(true)
    usersAPI.getUsers({ search, page_size: 100 })
      .then(r => setUsers(r.data.results || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const handleDeactivate = async (user) => {
    if (!confirm(`"${user.full_name}" foydalanuvchini deaktivlashtirasizmi?`)) return
    try {
      await usersAPI.deactivateUser(user.id)
      toast.success('Deaktivlashtirildi')
      load()
    } catch { toast.error('Xatolik yuz berdi') }
  }

  const getPrimaryRole = (user) => user.roles?.[0]?.role || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Foydalanuvchilar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Barcha tizim foydalanuvchilarini boshqarish</p>
        </div>
        <Button onClick={() => setAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />Foydalanuvchi qo'shish
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, telefon qidirish..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState title="Foydalanuvchilar yo'q" description="Yangi foydalanuvchi qo'shish uchun + tugmasini bosing" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Foydalanuvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rollar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Holati</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => {
                  const primary = getPrimaryRole(user)
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-violet-600">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{user.full_name || `${user.last_name} ${user.first_name}`}</p>
                            {user.email && <p className="text-xs text-slate-400">{user.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{user.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.length > 0 ? user.roles.map((r, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[r.role] || 'bg-slate-100 text-slate-600'}`}>
                              {ROLE_LABELS[r.role] || r.role}
                            </span>
                          )) : (
                            <span className="text-xs text-slate-400 italic">Rol yo'q</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setRoleModal(user.id)}
                            title="Rol tayinlash"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                            <Shield className="w-4 h-4" />
                          </button>
                          {user.is_active && (
                            <button onClick={() => handleDeactivate(user)}
                              title="Deaktivlashtirish"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add user modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Yangi foydalanuvchi qo'shish">
        <AddUserModal onClose={() => setAddModal(false)} onCreated={load} />
      </Modal>

      {/* Role assign modal */}
      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Rol tayinlash">
        {roleModal && <RoleAssignModal userId={roleModal} onClose={() => setRoleModal(null)} />}
      </Modal>
    </div>
  )
}
