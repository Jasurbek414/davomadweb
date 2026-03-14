import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react'
import { login } from '../../store/authSlice'
import toast from 'react-hot-toast'

const schema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri').regex(/^\+?998\d{9}$/, 'Format: +998XXXXXXXXX'),
  password: z.string().min(6, 'Kamida 6 belgi'),
})

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const { isLoading } = useSelector(state => state.auth)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+998', password: '' }
  })

  const onSubmit = async (data) => {
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) {
      toast.success('Muvaffaqiyatli kirdingiz!')
      navigate('/dashboard')
    } else {
      const err = result.payload
      const msg = err?.detail || err?.non_field_errors?.[0] || 'Login yoki parol noto\'g\'ri'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #7C3AED 100%)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Maktab Davomad</h1>
            <p className="text-slate-500 text-sm mt-1">Face ID boshqaruv tizimi</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Telefon raqam
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+998901234567"
                className={`w-full px-4 py-3 border rounded-xl text-sm transition-all outline-none
                  ${errors.phone ? 'border-red-300 focus:ring-2 focus:ring-red-300' : 'border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'}`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  className={`w-full px-4 py-3 pr-10 border rounded-xl text-sm transition-all outline-none
                    ${errors.password ? 'border-red-300 focus:ring-2 focus:ring-red-300' : 'border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all
                bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Kirish...</>
              ) : 'Kirish'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © 2024 Maktab Davomad Face ID Tizimi
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
