import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, UserX, Shield, Users, CheckCircle,
  Phone, Mail, Lock, Eye, EyeOff, ChevronDown, UserCheck
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, PasswordInput, Select } from '../../components/ui/Input'
import { RoleBadge, StatusBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState } from '../../components/ui/LoadingSpinner'
import { usersAPI } from '../../api/auth'
import { orgAPI } from '../../api/organizations'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  superadmin: 'Super Admin', region_director: 'Viloyat Direktori',
  district_director: 'Tuman Direktori', school_director: 'Maktab Direktori',
  operator: 'Operator', teacher: "O'qituvchi", parent: 'Ota-ona',
}

/* ── Role Assign Modal ── */
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
    }).catch(() => toast.error("Ma'lumotlarni yuklashda xatolik"))
  }, [userId])

  const handleAssign = async () => {
    if (!form.role) return toast.error('Rolni tanlang')
    setSaving(true)
    try {
      const payload = { role: form.role }
      if (form.region)   payload.region   = form.region
      if (form.district) payload.district = form.district
      if (form.school)   payload.school   = form.school
      await usersAPI.assignRole(userId, payload)
      const ur = await usersAPI.getUserRoles(userId)
      setUserRoles(ur.data || [])
      setForm({ role: '', region: '', district: '', school: '' })
      toast.success('Rol berildi!')
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.non_field_errors?.[0] || Object.values(err || {}).flat()[0] || 'Xatolik')
    } finally { setSaving(false) }
  }

  const sr = form.role
  const needsRegion   = ['region_director','district_director','school_director','operator','teacher'].includes(sr)
  const needsDistrict = ['district_director','school_director','operator','teacher'].includes(sr)
  const needsSchool   = ['school_director','operator','teacher'].includes(sr)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current roles */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Mavjud rollar</p>
        {userRoles.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>Rol tayinlanmagan</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {userRoles.map((ur, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 999,
                background: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE',
                fontSize: 12, fontWeight: 600,
              }}>
                <Shield style={{ width: 11, height: 11 }} />
                {ROLE_LABELS[ur.role_name] || ur.role_name}
                {ur.region_name ? ` · ${ur.region_name}` : ''}
                {ur.district_name ? ` · ${ur.district_name}` : ''}
                {ur.school_name ? ` · ${ur.school_name}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Yangi rol qo'shish</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select label="Rol *" value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value, region: '', district: '', school: '' }))}>
            <option value="">Rolni tanlang</option>
            {roles.map(r => <option key={r.name} value={r.name}>{ROLE_LABELS[r.name] || r.name}</option>)}
          </Select>
          {needsRegion && (
            <Select label="Viloyat" value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value, district: '', school: '' }))}>
              <option value="">Viloyatni tanlang</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          )}
          {needsDistrict && form.region && (
            <Select label="Tuman" value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value, school: '' }))}>
              <option value="">Tumanni tanlang</option>
              {districts.filter(d => String(d.region) === String(form.region)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          )}
          {needsSchool && form.district && (
            <Select label="Maktab" value={form.school}
              onChange={e => setForm(f => ({ ...f, school: e.target.value }))}>
              <option value="">Maktabni tanlang</option>
              {schools.filter(s => String(s.district) === String(form.district)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
          <Button onClick={handleAssign} loading={saving} style={{ width: '100%', justifyContent: 'center' }}>
            <Shield style={{ width: 14, height: 14 }} />
            Rol tayinlash
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Add User Modal ── */
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    phone: '+998', first_name: '', last_name: '', middle_name: '',
    email: '', password: '', password_confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleCreate = async () => {
    if (!form.phone || !form.first_name || !form.last_name || !form.password || !form.password_confirm)
      return toast.error("Majburiy maydonlarni to'ldiring")
    if (form.password.length < 8) return toast.error('Parol kamida 8 ta belgi bo\'lishi kerak')
    if (form.password !== form.password_confirm) return toast.error('Parollar mos kelmadi')
    setSaving(true)
    try {
      await usersAPI.createUser(form)
      toast.success('Foydalanuvchi yaratildi!')
      onCreated()
      onClose()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.phone?.[0] || err?.password?.[0] || err?.detail || 'Xatolik yuz berdi')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Familiya" required value={form.last_name} onChange={set('last_name')} placeholder="Karimov" />
        <Input label="Ismi" required value={form.first_name} onChange={set('first_name')} placeholder="Ali" />
      </div>
      <Input label="Otasining ismi" value={form.middle_name} onChange={set('middle_name')} placeholder="Valiyevich" />
      <Input label="Telefon raqami" required value={form.phone} onChange={set('phone')} placeholder="+998901234567" icon={Phone} />
      <Input label="Email" value={form.email} onChange={set('email')} type="email" placeholder="ali@example.com" icon={Mail} />
      <PasswordInput label="Parol" required value={form.password} onChange={set('password')} placeholder="Kamida 8 ta belgi" hint="Katta harf, raqam va belgi ishlatish tavsiya etiladi" />
      <PasswordInput label="Parolni tasdiqlash" required value={form.password_confirm} onChange={set('password_confirm')} placeholder="Parolni qayta kiriting" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
        <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
        <Button onClick={handleCreate} loading={saving}>Yaratish</Button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [roleModal, setRoleModal] = useState(null)
  const [deactivating, setDeactivating] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    usersAPI.getUsers({ search, page_size: 100 })
      .then(r => setUsers(r.data.results || r.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const handleDeactivate = async (user) => {
    if (!window.confirm(`"${user.full_name}" foydalanuvchini o'chirasizmi?`)) return
    setDeactivating(user.id)
    try {
      await usersAPI.deactivateUser(user.id)
      toast.success('Deaktivlashtirildi')
      load()
    } catch { toast.error('Xatolik yuz berdi') }
    finally { setDeactivating(null) }
  }

  const activeCount = users.filter(u => u.is_active).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Foydalanuvchilar</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Tizim foydalanuvchilari va rollarini boshqarish
          </p>
        </div>
        <Button icon={Plus} onClick={() => setAddModal(true)}>
          Foydalanuvchi qo'shish
        </Button>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { icon: Users, label: 'Jami', value: users.length, color: '#4F46E5' },
          { icon: CheckCircle, label: 'Faol', value: activeCount, color: '#10B981' },
          { icon: UserX, label: 'Nofaol', value: users.length - activeCount, color: '#EF4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
            padding: '10px 16px',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 15, height: 15, color }} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Search bar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94A3B8' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ism, telefon bo'yicha qidirish..."
              style={{
                width: '100%', padding: '7px 12px 7px 32px',
                border: '1.5px solid #E2E8F0', borderRadius: 9,
                fontSize: 13, outline: 'none', background: '#F8FAFC',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = '#4F46E5'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <span style={{ fontSize: 12.5, color: '#94A3B8' }}>{users.length} ta foydalanuvchi</span>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="Foydalanuvchilar topilmadi" description="Yangi foydalanuvchi qo'shish uchun yuqoridagi tugmani bosing" action={<Button icon={Plus} onClick={() => setAddModal(true)}>Qo'shish</Button>} />
        ) : (
          <>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 150px 1fr 100px 100px',
              gap: 8, padding: '9px 16px',
              background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
            }}>
              {['Foydalanuvchi', 'Telefon', 'Rollar', 'Holat', 'Amallar'].map((h, i) => (
                <span key={h} style={{
                  fontSize: 11, fontWeight: 700, color: '#94A3B8',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  textAlign: i >= 3 ? 'center' : 'left',
                }}>{h}</span>
              ))}
            </div>

            {users.map((user, i) => {
              const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase()
              return (
                <div key={user.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 150px 1fr 100px 100px',
                  gap: 8, padding: '12px 16px',
                  borderBottom: i < users.length - 1 ? '1px solid #F8FAFC' : 'none',
                  transition: 'background 0.1s', alignItems: 'center',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#4F46E5', flexShrink: 0,
                    }}>
                      {initials || 'U'}
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                        {user.full_name || `${user.last_name || ''} ${user.first_name || ''}`.trim()}
                      </p>
                      {user.email && <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{user.email}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <span style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone style={{ width: 12, height: 12, color: '#CBD5E1' }} />
                    {user.phone || '—'}
                  </span>

                  {/* Roles */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {user.roles?.length > 0
                      ? user.roles.slice(0, 2).map((r, ri) => <RoleBadge key={ri} role={r.role} />)
                      : <span style={{ fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>Rol yo'q</span>
                    }
                    {user.roles?.length > 2 && (
                      <span style={{ fontSize: 11, color: '#94A3B8', padding: '3px 7px', background: '#F8FAFC', borderRadius: 999, border: '1px solid #E2E8F0' }}>
                        +{user.roles.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <button onClick={() => setRoleModal(user.id)}
                      title="Rol tayinlash"
                      style={actionBtnStyle}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4F46E5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                    >
                      <Shield style={{ width: 15, height: 15 }} />
                    </button>
                    {user.is_active && (
                      <button onClick={() => handleDeactivate(user)}
                        title="Deaktivlashtirish"
                        disabled={deactivating === user.id}
                        style={{ ...actionBtnStyle, opacity: deactivating === user.id ? 0.5 : 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                      >
                        <UserX style={{ width: 15, height: 15 }} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Yangi foydalanuvchi qo'shish" size="md">
        <AddUserModal onClose={() => setAddModal(false)} onCreated={load} />
      </Modal>

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Rol tayinlash" size="md">
        {roleModal && <RoleAssignModal userId={roleModal} onClose={() => setRoleModal(null)} />}
      </Modal>
    </div>
  )
}

const actionBtnStyle = {
  width: 30, height: 30, borderRadius: 7, background: 'transparent',
  border: 'none', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
  transition: 'all 0.15s',
}
