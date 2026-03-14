export function StatusBadge({ status }) {
  const config = {
    present: { label: 'Keldi', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    late: { label: 'Kech keldi', cls: 'bg-amber-100 text-amber-800 border border-amber-200' },
    absent: { label: 'Kelmadi', cls: 'bg-red-100 text-red-800 border border-red-200' },
    excused: { label: 'Sababli', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
    online: { label: 'Online', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    offline: { label: 'Offline', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
    error: { label: 'Xatolik', cls: 'bg-red-100 text-red-800 border border-red-200' },
    active: { label: 'Faol', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    pending: { label: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-800 border border-amber-200' },
    inactive: { label: 'Nofaol', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  }
  const { label, cls } = config[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const labels = {
    superadmin: 'Super Admin',
    region_director: 'Viloyat Direktori',
    district_director: 'Tuman Direktori',
    school_director: 'Maktab Direktori',
    operator: 'Operator',
    teacher: "O'qituvchi",
    parent: 'Ota-ona',
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200">
      {labels[role] || role}
    </span>
  )
}
