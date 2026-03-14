import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', text = 'Yuklanmoqda...' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className={`${sizes[size]} text-violet-600 animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {Icon && <div className="p-4 bg-slate-100 rounded-full"><Icon className="w-8 h-8 text-slate-400" /></div>}
      <h3 className="text-base font-medium text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 text-center max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
