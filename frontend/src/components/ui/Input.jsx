import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all outline-none
          ${error ? 'border-red-300 focus:ring-2 focus:ring-red-300' : 'border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export const PasswordInput = forwardRef(function PasswordInput({ label, error, ...props }, ref) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm transition-all outline-none
            ${error ? 'border-red-300 focus:ring-2 focus:ring-red-300' : 'border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent'}`}
          {...props}
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})
