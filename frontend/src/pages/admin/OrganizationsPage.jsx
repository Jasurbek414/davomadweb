import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, MapPin, Building2, School, BookOpen, Search, X, ChevronDown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingSpinner'
import { orgAPI } from '../../api/organizations'
import { studentsAPI } from '../../api/students'
import toast from 'react-hot-toast'

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'regions', label: 'Viloyatlar', icon: MapPin, color: 'text-violet-600 bg-violet-50' },
  { id: 'districts', label: 'Tumanlar', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { id: 'schools', label: 'Maktablar', icon: School, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'classes', label: 'Sinflar', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
]

// ─── Reusable form field ──────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder, error }) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white appearance-none"
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </Field>
  )
}

// ─── Generic table ────────────────────────────────────────────────────────────
function DataTable({ columns, rows, onEdit, onDelete, loading, emptyText }) {
  if (loading) return <LoadingSpinner />
  if (!rows.length) return <EmptyState title={emptyText} description="Qo'shish uchun + tugmasini bosing" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map(c => (
              <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-slate-700">
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(row)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {onDelete && (
                    <button onClick={() => onDelete(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── REGIONS ─────────────────────────────────────────────────────────────────
function RegionsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', data? }
  const [form, setForm] = useState({ name: '', code: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    orgAPI.getRegions({ search, page_size: 100 })
      .then(r => setItems(r.data.results || []))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm({ name: '', code: '' }); setModal({ mode: 'add' }) }
  const openEdit = (row) => { setForm({ name: row.name, code: row.code || '' }); setModal({ mode: 'edit', data: row }) }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Viloyat nomini kiriting')
    setSaving(true)
    try {
      if (modal.mode === 'add') {
        await orgAPI.createRegion(form)
        toast.success('Viloyat qo\'shildi')
      } else {
        await orgAPI.updateRegion(modal.data.id, form)
        toast.success('Viloyat yangilandi')
      }
      setModal(null); load()
    } catch (e) {
      toast.error(e.response?.data?.name?.[0] || 'Xatolik yuz berdi')
    } finally { setSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!confirm(`"${row.name}" viloyatini o'chirasizmi?`)) return
    try {
      await orgAPI.deleteRegion(row.id)
      toast.success('O\'chirildi'); load()
    } catch { toast.error('O\'chirib bo\'lmadi — bog\'liq ma\'lumotlar bor') }
  }

  const cols = [
    { key: 'name', label: 'Viloyat nomi' },
    { key: 'code', label: 'Kod' },
    { key: 'districts_count', label: 'Tumanlar', render: r => <span className="font-semibold text-blue-600">{r.districts_count ?? 0}</span> },
    { key: 'schools_count', label: 'Maktablar', render: r => <span className="font-semibold text-emerald-600">{r.schools_count ?? 0}</span> },
    { key: 'students_count', label: "O'quvchilar", render: r => <span className="font-semibold text-violet-600">{r.students_count ?? 0}</span> },
  ]

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Viloyat qo'shish</Button>
      </div>
      <DataTable columns={cols} rows={items} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyText="Viloyatlar yo'q" />

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Yangi viloyat' : 'Viloyatni tahrirlash'}>
        <div className="space-y-4">
          <Field label="Viloyat nomi *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Masalan: Toshkent viloyati" />
          </Field>
          <Field label="Kod (ixtiyoriy)">
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="TSH" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── DISTRICTS ────────────────────────────────────────────────────────────────
function DistrictsTab() {
  const [items, setItems] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', region: '', code: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    orgAPI.getRegions({ page_size: 200 }).then(r => setRegions(r.data.results || []))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    orgAPI.getDistricts({ search, region: filterRegion || undefined, page_size: 200 })
      .then(r => setItems(r.data.results || []))
      .finally(() => setLoading(false))
  }, [search, filterRegion])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm({ name: '', region: filterRegion || '', code: '' }); setModal({ mode: 'add' }) }
  const openEdit = (row) => { setForm({ name: row.name, region: String(row.region), code: row.code || '' }); setModal({ mode: 'edit', data: row }) }
  const handleSave = async () => {
    if (!form.name.trim() || !form.region) return toast.error('Nom va viloyatni to\'ldiring')
    setSaving(true)
    try {
      const payload = { name: form.name, region: form.region, code: form.code }
      if (modal.mode === 'add') {
        await orgAPI.createDistrict(payload)
        toast.success('Tuman qo\'shildi')
      } else {
        await orgAPI.updateDistrict(modal.data.id, payload)
        toast.success('Tuman yangilandi')
      }
      setModal(null); load()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.name?.[0] || err?.code?.[0] || err?.detail || 'Xatolik yuz berdi'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const regionOptions = regions.map(r => ({ value: String(r.id), label: r.name }))
  const getRegionName = (id) => regions.find(r => r.id === id)?.name || id

  const cols = [
    { key: 'name', label: 'Tuman nomi' },
    { key: 'region', label: 'Viloyat', render: r => getRegionName(r.region) },
    { key: 'schools_count', label: 'Maktablar', render: r => <span className="font-semibold text-emerald-600">{r.schools_count ?? 0}</span> },
    { key: 'students_count', label: "O'quvchilar", render: r => <span className="font-semibold text-violet-600">{r.students_count ?? 0}</span> },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="relative">
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white appearance-none">
            <option value="">Barcha viloyatlar</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Tuman qo'shish</Button>
      </div>
      <DataTable columns={cols} rows={items} loading={loading} onEdit={openEdit}
        onDelete={async (row) => {
          if (!confirm(`"${row.name}" tumanni o'chirasizmi?`)) return
          try { await orgAPI.deleteDistrict(row.id); toast.success("O'chirildi"); load() }
          catch { toast.error("O'chirib bo'lmadi — bog'liq ma'lumotlar bor") }
        }}
        emptyText="Tumanlar yo'q" />

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Yangi tuman' : 'Tumanni tahrirlash'}>
        <div className="space-y-4">
          <Field label="Tuman nomi *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Masalan: Yunusobod tumani" />
          </Field>
          <Field label="Tuman kodi (Majburiy bo'lishi mumkin)">
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Masalan: YUN" />
          </Field>
          <SelectField label="Viloyat *" value={form.region} onChange={v => setForm(f => ({ ...f, region: v }))}
            options={regionOptions} placeholder="Viloyatni tanlang" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── SCHOOLS ─────────────────────────────────────────────────────────────────
function SchoolsTab() {
  const [items, setItems] = useState([])
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', district: '', address: '', phone: '', director_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    orgAPI.getRegions({ page_size: 200 }).then(r => setRegions(r.data.results || []))
    orgAPI.getDistricts({ page_size: 500 }).then(r => setDistricts(r.data.results || []))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    orgAPI.getSchools({ search, district: filterDistrict || undefined, page_size: 200 })
      .then(r => setItems(r.data.results || []))
      .finally(() => setLoading(false))
  }, [search, filterDistrict])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm({ name: '', district: '', address: '', phone: '', director_name: '' }); setModal({ mode: 'add' }) }
  const openEdit = (row) => {
    setForm({ name: row.name, district: String(row.district), address: row.address || '', phone: row.phone || '', director_name: row.director_name || '' })
    setModal({ mode: 'edit', data: row })
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.district) return toast.error('Nom va tumanni to\'ldiring')
    setSaving(true)
    try {
      const payload = { name: form.name, district: form.district }
      if (form.address) payload.address = form.address
      if (form.phone) payload.phone = form.phone
      if (form.director_name) payload.director_name = form.director_name
      if (modal.mode === 'add') {
        await orgAPI.createSchool(payload)
        toast.success('Maktab qo\'shildi')
      } else {
        await orgAPI.updateSchool(modal.data.id, payload)
        toast.success('Maktab yangilandi')
      }
      setModal(null); load()
    } catch (e) {
      toast.error(e.response?.data?.name?.[0] || 'Xatolik')
    } finally { setSaving(false) }
  }

  const districtOptions = districts.map(d => ({ value: String(d.id), label: d.name }))
  const getDistrictName = (id) => districts.find(d => d.id === id)?.name || '—'

  const cols = [
    { key: 'name', label: 'Maktab nomi' },
    { key: 'district', label: 'Tuman', render: r => getDistrictName(r.district) },
    { key: 'address', label: 'Manzil', render: r => r.address || '—' },
    { key: 'phone', label: 'Telefon', render: r => r.phone || '—' },
    { key: 'students_count', label: "O'quvchilar", render: r => <span className="font-semibold text-violet-600">{r.students_count ?? 0}</span> },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Maktab qidirish..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="relative">
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white appearance-none">
            <option value="">Barcha tumanlar</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Maktab qo'shish</Button>
      </div>
      <DataTable columns={cols} rows={items} loading={loading} onEdit={openEdit}
        onDelete={async (row) => {
          if (!confirm(`"${row.name}" maktabini o'chirasizmi?`)) return
          try { await orgAPI.deleteSchool(row.id); toast.success("O'chirildi"); load() }
          catch { toast.error("O'chirib bo'lmadi — bog'liq ma'lumotlar bor") }
        }}
        emptyText="Maktablar yo'q" />

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Yangi maktab' : 'Maktabni tahrirlash'}>
        <div className="space-y-4">
          <Field label="Maktab nomi *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Masalan: 145-son maktab" />
          </Field>
          <SelectField label="Tuman *" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))}
            options={districtOptions} placeholder="Tumanni tanlang" />
          <Field label="Manzil">
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Ko'cha, uy raqami" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998..." />
            </Field>
            <Field label="Direktor ismi">
              <Input value={form.director_name} onChange={e => setForm(f => ({ ...f, director_name: e.target.value }))} placeholder="F.I.O." />
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────
function ClassesTab() {
  const [items, setItems] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSchool, setFilterSchool] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ grade: '', section: '', name: '', school: '', academic_year: '2024-2025', teacher: '' })
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState([])

  useEffect(() => {
    orgAPI.getSchools({ page_size: 200 }).then(r => setSchools(r.data.results || []))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    orgAPI.getClasses({ school: filterSchool || undefined, page_size: 200 })
      .then(r => setItems(r.data.results || []))
      .finally(() => setLoading(false))
  }, [filterSchool])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (form.school) {
      studentsAPI.getTeachers({ school: form.school, page_size: 100 })
        .then(r => setTeachers(r.data.results || []))
        .catch(() => setTeachers([]))
    } else {
      setTeachers([])
    }
  }, [form.school])

  const openAdd = () => { setForm({ grade: '', section: '', name: '', school: filterSchool || '', academic_year: '2024-2025', teacher: '' }); setModal({ mode: 'add' }) }
  const openEdit = (row) => { setForm({ grade: String(row.grade), section: row.section, name: row.name || '', school: String(row.school), academic_year: row.academic_year || '2024-2025', teacher: row.teacher ? String(row.teacher) : '' }); setModal({ mode: 'edit', data: row }) }

  const handleSave = async () => {
    if (!form.grade || !form.section || !form.school) return toast.error('Barcha maydonlarni to\'ldiring')
    setSaving(true)
    try {
      const payload = { 
        grade: parseInt(form.grade), 
        section: form.section.toUpperCase(), 
        name: form.name || `${form.grade}-${form.section}`,
        school: form.school,
        academic_year: form.academic_year,
        teacher: form.teacher || null
      }
      if (modal.mode === 'add') {
        await orgAPI.createClass(payload)
        toast.success('Sinf qo\'shildi')
      } else {
        await orgAPI.updateClass(modal.data.id, payload)
        toast.success('Sinf yangilandi')
      }
      setModal(null); load()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.detail || Object.values(err || {}).flat()[0] || 'Xatolik yuz berdi'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!confirm(`"${row.name || row.grade + row.section}" sinfini o'chirasizmi?`)) return
    try {
      await orgAPI.deleteClass(row.id)
      toast.success('O\'chirildi'); load()
    } catch { toast.error('O\'chirib bo\'lmadi') }
  }

  const schoolOptions = schools.map(s => ({ value: String(s.id), label: s.name }))
  const getSchoolName = (id) => schools.find(s => s.id === id)?.name || '—'

  const cols = [
    { key: 'name', label: 'Sinf', render: r => <span className="font-semibold text-violet-700">{r.name || `${r.grade}-${r.section}`}</span> },
    { key: 'school', label: 'Maktab', render: r => getSchoolName(r.school) },
    { key: 'teacher_name', label: 'Sinf rahbari', render: r => r.teacher_name || <span className="text-slate-400 italic">Tayinlanmagan</span> },
    { key: 'students_count', label: "O'quvchilar soni", render: r => <span className="font-semibold">{r.students_count ?? 0}</span> },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white appearance-none">
            <option value="">Barcha maktablar</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Sinf qo'shish</Button>
      </div>
      <DataTable columns={cols} rows={items} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyText="Sinflar yo'q" />

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Yangi sinf' : 'Sinfni tahrirlash'}>
        <div className="space-y-4">
          <SelectField label="Maktab *" value={form.school} onChange={v => setForm(f => ({ ...f, school: v }))}
            options={schoolOptions} placeholder="Maktabni tanlang" />
          <Field label="Sinf nomi (Avtomatik: 5-A, 9-B)">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Masalan: 5-A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sinf raqami *">
              <Input type="number" min="1" max="11" value={form.grade}
                onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="1-11" />
            </Field>
            <Field label="Sinf harfi *">
              <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="A, B, V..." maxLength={2} />
            </Field>
          </div>
          <Field label="O'quv yili *">
            <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="2024-2025" />
          </Field>
          <SelectField label="Sinf rahbari" value={form.teacher} onChange={v => setForm(f => ({ ...f, teacher: v }))}
            options={teachers.map(t => ({ value: String(t.id), label: t.full_name }))} placeholder="Sinf rahbarini tanlang" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrganizationsPage() {
  const [tab, setTab] = useState('regions')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tashkilotlar</h1>
        <p className="text-slate-500 text-sm mt-0.5">Viloyat, tuman, maktab va sinflarni boshqarish</p>
      </div>

      <Card>
        {/* Tabs */}
        <div className="border-b border-slate-100">
          <div className="flex overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${active ? 'border-violet-500 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {tab === 'regions' && <RegionsTab />}
          {tab === 'districts' && <DistrictsTab />}
          {tab === 'schools' && <SchoolsTab />}
          {tab === 'classes' && <ClassesTab />}
        </div>
      </Card>
    </div>
  )
}
