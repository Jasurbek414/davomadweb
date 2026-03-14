import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, UserSquare, Edit, Trash2, Mail, Phone } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner, EmptyState, TableSkeleton } from '../../components/ui/LoadingSpinner'
import { studentsAPI } from '../../api/students'
import { orgAPI } from '../../api/organizations'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editTeacher, setEditTeacher] = useState(null)
  const [schools, setSchools] = useState([])
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await studentsAPI.getTeachers({ search, page, page_size: 20 })
      setTeachers(data.results || data)
      setTotal(data.count || (data.results?.length ?? data.length))
    } catch (e) {
      toast.error('Ma\'lumot olishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { loadTeachers() }, [loadTeachers])

  useEffect(() => {
    orgAPI.getSchools({ page_size: 200 }).then(r => setSchools(r.data.results || r.data))
  }, [])

  const openCreate = () => { setEditTeacher(null); reset({}); setShowModal(true) }
  const openEdit = (t) => { setEditTeacher(t); reset(t); setShowModal(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editTeacher) {
        await studentsAPI.updateTeacher(editTeacher.id, data)
        toast.success('O\'qituvchi yangilandi')
      } else {
        await studentsAPI.createTeacher(data)
        toast.success('O\'qituvchi qo\'shildi')
      }
      setShowModal(false)
      loadTeachers()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">O'qituvchilar</h1>
          <p className="text-slate-500 text-sm">Jami: {total} ta o'qituvchi</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Yangi o'qituvchi</Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Ism, Familiya bo'yicha qidirish..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["O'qituvchi", "Maktab", "ID", "Fan", "Telefon", "Holat", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3 bg-slate-50 border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8"><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={UserSquare} title="O'qituvchilar topilmadi"
                    description="Yangi o'qituvchi qo'shish uchun yuqoridagi tugmani bosing"
                    action={<Button onClick={openCreate} icon={Plus}>Qo'shish</Button>} />
                </td></tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                        {t.first_name?.[0]?.toUpperCase()}{t.last_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{t.last_name} {t.first_name}</p>
                        <p className="text-xs text-slate-500">{t.middle_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">{t.school_name || '-'}</td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{t.employee_id}</span>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">{t.subject}</td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">{t.phone}</td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <StatusBadge status={t.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-violet-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Familiya *</label>
              <input {...register('last_name', { required: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Karimov" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ism *</label>
              <input {...register('first_name', { required: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Alisher" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Otasining ismi</label>
            <input {...register('middle_name')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Alijonovich" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam *</label>
              <input {...register('phone', { required: true })} placeholder="+998..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fan *</label>
              <input {...register('subject', { required: true })} placeholder="Matematika"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Maktab *</label>
            <select {...register('school', { required: true })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">-- Maktab tanlang --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Bekor qilish</Button>
            <Button type="submit" loading={saving}>{editTeacher ? 'Saqlash' : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
