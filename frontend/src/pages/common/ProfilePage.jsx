import { useState } from 'react'
import { useSelector } from 'react-redux'
import { User, Phone, Mail, Key, Shield, CheckCircle, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { RoleBadge } from '../../components/ui/Badge'
import { PasswordInput } from '../../components/ui/Input'
import { authAPI } from '../../api/auth'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #F8FAFC',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: 15, height: 15, color: '#64748B' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500, marginBottom: 1 }}>{label}</p>
        <p style={{
          fontSize: 14, color: '#0F172A', fontWeight: 600,
          fontFamily: mono ? 'monospace' : 'inherit',
        }}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

const ROLE_LABELS = {
  superadmin: 'Super Admin', region_director: 'Viloyat Direktori',
  district_director: 'Tuman Direktori', school_director: 'Maktab Direktori',
  operator: 'Operator', teacher: "O'qituvchi", parent: 'Ota-ona',
}

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth)
  const [changingPwd, setChangingPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm()

  const onChangePassword = async (data) => {
    if (data.new_password !== data.new_password_confirm)
      return toast.error('Parollar mos kelmadi')
    setSavingPwd(true)
    try {
      await authAPI.changePassword(data)
      toast.success("Parol muvaffaqiyatli o'zgartirildi!")
      reset()
      setChangingPwd(false)
    } catch (e) {
      toast.error(e.response?.data?.old_password?.[0] || e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally { setSavingPwd(false) }
  }

  if (!user) return null

  const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase()
  const primaryRole = user.roles?.[0]?.role

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Profil</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Shaxsiy ma'lumotlar va tizim sozlamalari</p>
      </div>

      {/* Profile hero card */}
      <div style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Cover gradient */}
        <div style={{
          height: 80,
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #818CF8 100%)',
          position: 'relative',
        }} />

        {/* Avatar + info */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 24, fontWeight: 800,
              border: '3px solid white',
              boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
            }}>
              {initials || 'U'}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: user.is_active ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${user.is_active ? '#A7F3D0' : '#FECACA'}`,
              borderRadius: 999, fontSize: 12, fontWeight: 700,
              color: user.is_active ? '#065F46' : '#991B1B',
              marginBottom: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.is_active ? '#10B981' : '#EF4444' }} />
              {user.is_active ? 'Faol' : 'Nofaol'}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user.roles?.map((r, i) => <RoleBadge key={i} role={r.role} />)}
              {user.is_superuser && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#F5F3FF', color: '#5B21B6', border: '1px solid #DDD6FE',
                  padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                }}>
                  <Shield style={{ width: 11, height: 11 }} />
                  Superuser
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User style={{ width: 15, height: 15, color: '#94A3B8' }} />
          Shaxsiy ma'lumotlar
        </h3>
        <div>
          <InfoRow icon={User}  label="To'liq ism"    value={user.full_name} />
          <InfoRow icon={Phone} label="Telefon raqam" value={user.phone} mono />
          <InfoRow icon={Mail}  label="Email manzil"  value={user.email || 'Kiritilmagan'} />
          <InfoRow icon={Shield} label="Asosiy rol"   value={ROLE_LABELS[primaryRole] || primaryRole || 'Belgilanmagan'} />
        </div>
      </div>

      {/* Change password card */}
      <div style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: changingPwd ? '1px solid #F1F5F9' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key style={{ width: 15, height: 15, color: '#7C3AED' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Parolni o'zgartirish</p>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>Tizimga kirish parolini yangilash</p>
            </div>
          </div>
          <Button
            variant={changingPwd ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => { setChangingPwd(v => !v); reset(); }}
          >
            {changingPwd ? 'Bekor qilish' : "O'zgartirish"}
          </Button>
        </div>

        {changingPwd && (
          <form onSubmit={handleSubmit(onChangePassword)} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PasswordInput
              label="Joriy parol" required
              {...register('old_password', { required: true })}
              placeholder="Joriy parolingizni kiriting"
            />
            <PasswordInput
              label="Yangi parol" required
              {...register('new_password', { required: true, minLength: { value: 8, message: 'Kamida 8 ta belgi' } })}
              error={errors.new_password?.message}
              placeholder="Yangi parolni kiriting"
              hint="Kamida 8 ta belgi, katta harf va raqam"
            />
            <PasswordInput
              label="Yangi parolni tasdiqlash" required
              {...register('new_password_confirm', { required: true })}
              placeholder="Yangi parolni qayta kiriting"
            />
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <Button type="submit" loading={savingPwd} icon={CheckCircle}>
                Parolni saqlash
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* System info */}
      <div style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 16,
        padding: '18px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield style={{ width: 15, height: 15, color: '#94A3B8' }} />
          Tizim ma'lumotlari
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Foydalanuvchi ID', value: user.id },
            { label: 'Foydalanuvchi nomi', value: user.phone, mono: true },
            { label: 'Tizim versiyasi', value: 'Maktab Davomad v2.0' },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
