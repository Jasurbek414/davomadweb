import { useState } from 'react'
import { useSelector } from 'react-redux'
import { User, Phone, Mail, Shield, Key } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { RoleBadge } from '../../components/ui/Badge'
import { authAPI } from '../../api/auth'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useSelector(state => state.auth)
  const [changingPassword, setChangingPassword] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onChangePassword = async (data) => {
    if (data.new_password !== data.new_password_confirm) {
      toast.error('Parollar mos kelmadi')
      return
    }
    try {
      await authAPI.changePassword(data)
      toast.success('Parol o\'zgartirildi')
      reset()
      setChangingPassword(false)
    } catch (e) {
      toast.error(e.response?.data?.old_password || 'Xatolik yuz berdi')
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profil</h1>
        <p className="text-slate-500 text-sm">Shaxsiy ma'lumotlar va sozlamalar</p>
      </div>

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.full_name}</h2>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.roles?.map((r, i) => <RoleBadge key={i} role={r.role} />)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Phone, label: 'Telefon', value: user.phone },
            { icon: Mail, label: 'Email', value: user.email || 'Kiritilmagan' },
            { icon: User, label: 'To\'liq ism', value: user.full_name },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Icon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Parolni o'zgartirish</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setChangingPassword(!changingPassword)}>
            {changingPassword ? 'Bekor qilish' : "O'zgartirish"}
          </Button>
        </div>

        {changingPassword && (
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Joriy parol</label>
              <input {...register('old_password', { required: true })} type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Yangi parol</label>
              <input {...register('new_password', { required: true, minLength: 8 })} type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Parolni tasdiqlang</label>
              <input {...register('new_password_confirm', { required: true })} type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <Button type="submit" size="sm">Saqlash</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
