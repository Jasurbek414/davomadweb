import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, GraduationCap, Edit, Trash2, Camera, Upload, Cpu, CheckCircle, XCircle, Users, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingSpinner'
import { studentsAPI } from '../../api/students'
import { orgAPI } from '../../api/organizations'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// Photo upload cell - clickable area
function PhotoCell({ student, onPhotoUploaded }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleClick = () => inputRef.current?.click()

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validate image
    if (!file.type.startsWith('image/')) { toast.error("Faqat rasm fayli qabul qilinadi"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Rasm 5MB dan kichik bo'lishi kerak"); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data } = await studentsAPI.uploadPhoto(student.id, formData)
      toast.success("Rasm yuklandi")
      onPhotoUploaded(student.id, data.photo_url)
    } catch (e) {
      toast.error("Rasm yuklanmadi")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {student.photo_url ? (
        <img src={student.photo_url} alt={student.full_name}
          className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border-2 border-dashed border-slate-300">
          <Camera className="w-6 h-6 text-slate-400" />
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Upload className="w-5 h-5 text-white" />
        )}
      </div>
    </div>
  )
}

// Student card for grid view
function StudentCard({ student, onEdit, onDelete, onPushFace, onPhotoUploaded, pushingId }) {
  const hasFace = student.has_photo
  const isPushing = pushingId === student.id

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <PhotoCell student={student} onPhotoUploaded={onPhotoUploaded} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {student.last_name} {student.first_name}
          </p>
          <p className="text-xs text-slate-500 truncate">{student.middle_name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs font-mono bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">
              {student.student_id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{student.class_name || '—'}</p>
          <div className="flex items-center gap-1 mt-1.5">
            {hasFace ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-3 h-3" />Yuz bor
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                <XCircle className="w-3 h-3" />Yuz yo'q
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
        <button onClick={() => onPushFace(student)} disabled={!hasFace || isPushing}
          title="Yuzni qurilmaga yuklash"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {isPushing ? <LoadingSpinner size="xs" /> : <Cpu className="w-3.5 h-3.5" />}
          Yuklash
        </button>
        <button onClick={() => onEdit(student)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(student)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(24)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [showModal, setShowModal] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [filterSchool, setFilterSchool] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [saving, setSaving] = useState(false)
  const [pushingId, setPushingId] = useState(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm()
  const selectedSchool = watch('school')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (search) params.search = search
      if (filterSchool) params.school = filterSchool
      if (filterClass) params.class_ref = filterClass
      const { data } = await studentsAPI.getStudents(params)
      setStudents(data.results || data)
      setTotal(data.count || 0)
    } catch {
      toast.error("Ma'lumot yuklanmadi")
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, filterSchool, filterClass])

  useEffect(() => { loadStudents() }, [loadStudents])

  useEffect(() => {
    orgAPI.getSchools({ page_size: 500 }).then(r => setSchools(r.data.results || r.data)).catch(() => {})
    orgAPI.getClasses({ page_size: 1000 }).then(r => setClasses(r.data.results || r.data)).catch(() => {})
  }, [])

  const filteredClasses = filterSchool
    ? classes.filter(c => String(c.school) === String(filterSchool))
    : classes

  const formClasses = selectedSchool
    ? classes.filter(c => String(c.school) === String(selectedSchool))
    : classes

  const openCreate = () => { setEditStudent(null); reset({ gender: 'M', relationship: 'father' }); setShowModal(true) }
  const openEdit = (s) => { setEditStudent(s); reset({ ...s, class_ref: s.class_ref, school: s.school }); setShowModal(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          if (k === 'photo' && v instanceof FileList) {
            if (v[0]) formData.append('photo', v[0])
          } else {
            formData.append(k, v)
          }
        }
      })
      if (editStudent) {
        await studentsAPI.updateStudent(editStudent.id, formData)
        toast.success("O'quvchi yangilandi")
      } else {
        await studentsAPI.createStudent(formData)
        toast.success("O'quvchi qo'shildi")
      }
      setShowModal(false)
      loadStudents()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.detail || (typeof err === 'object' ? Object.values(err).flat().join(', ') : 'Xatolik')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (student) => {
    if (!confirm(`"${student.full_name || student.last_name + ' ' + student.first_name}" ni o'chirasizmi?`)) return
    try {
      await studentsAPI.deleteStudent(student.id)
      toast.success("O'chirildi")
      loadStudents()
    } catch { toast.error("O'chirishda xatolik") }
  }

  const handlePushFace = async (student) => {
    setPushingId(student.id)
    try {
      const { data } = await studentsAPI.pushFace(student.id)
      toast.success(data.message)
    } catch (e) {
      toast.error(e.response?.data?.detail || "Yuz yuborishda xatolik")
    } finally {
      setPushingId(null)
    }
  }

  const handlePhotoUploaded = (studentId, photoUrl) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, photo_url: photoUrl, has_photo: true } : s
    ))
  }

  const noPhotoCount = students.filter(s => !s.has_photo).length
  const withPhotoCount = students.filter(s => s.has_photo).length
  const totalPages = Math.ceil(total / pageSize)

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
  const selectCls = `${inputCls} bg-white`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">O'quvchilar</h1>
          <p className="text-slate-500 text-sm">
            Jami: {total} ta •
            <span className="text-emerald-600 ml-1">{withPhotoCount} rasmi bor</span> •
            <span className="text-red-500 ml-1">{noPhotoCount} rasmi yo'q</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={openCreate} icon={Plus}>Qo'shish</Button>
        </div>
      </div>

      {/* Face stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg"><GraduationCap className="w-5 h-5 text-violet-600" /></div>
          <div>
            <p className="text-xs text-slate-500">Jami o'quvchi</p>
            <p className="text-xl font-bold text-slate-800">{total}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <p className="text-xs text-slate-500">Rasmi bor (Face ID)</p>
            <p className="text-xl font-bold text-emerald-600">{withPhotoCount}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><XCircle className="w-5 h-5 text-red-500" /></div>
          <div>
            <p className="text-xs text-slate-500">Rasmi yo'q</p>
            <p className="text-xl font-bold text-red-500">{noPhotoCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Ism, ID bo'yicha..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <select value={filterSchool} onChange={e => { setFilterSchool(e.target.value); setFilterClass(''); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[160px]">
            <option value="">Barcha maktablar</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Barcha sinflar</option>
            {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(filterSchool || filterClass || search) && (
            <button onClick={() => { setFilterSchool(''); setFilterClass(''); setSearch(''); setPage(1) }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
              Tozalash
            </button>
          )}
        </div>
      </Card>

      {/* Content */}
      {loading ? <LoadingSpinner /> : students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="O'quvchilar topilmadi"
          description="Yangi o'quvchi qo'shish uchun yuqoridagi tugmani bosing"
          action={<Button onClick={openCreate} icon={Plus}>Qo'shish</Button>} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {students.map(s => (
            <StudentCard key={s.id} student={s}
              onEdit={openEdit} onDelete={handleDelete}
              onPushFace={handlePushFace} onPhotoUploaded={handlePhotoUploaded}
              pushingId={pushingId} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Rasm", "O'quvchi", "ID", "Sinf", "Jins", "Yuz holati", "Ota-ona", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <PhotoCell student={s} onPhotoUploaded={handlePhotoUploaded} />
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{s.last_name} {s.first_name}</p>
                      <p className="text-xs text-slate-400">{s.middle_name}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{s.student_id}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{s.class_name || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.gender === 'M' ? 'Erkak' : 'Ayol'}</td>
                    <td className="px-4 py-2.5">
                      {s.has_photo ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit font-medium">
                          <CheckCircle className="w-3 h-3" />Yuz bor
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full w-fit font-medium">
                          <XCircle className="w-3 h-3" />Yuz yo'q
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${s.parent_link_status === 'active' ? 'text-emerald-600' : s.parent_link_status === 'pending' ? 'text-amber-600' : 'text-slate-400'}`}>
                        {s.parent_link_status === 'active' ? 'Ulangan' : s.parent_link_status === 'pending' ? 'Kutilmoqda' : "Yo'q"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePushFace(s)} disabled={!s.has_photo || pushingId === s.id}
                          title="Yuzni qurilmaga yuklash"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-30">
                          <Cpu className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium border ${p === page ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Familiya *</label>
              <input {...register('last_name', { required: true })} className={inputCls} placeholder="Karimov" />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">Majburiy</p>}
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ism *</label>
              <input {...register('first_name', { required: true })} className={inputCls} placeholder="Alisher" />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">Majburiy</p>}
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Otasining ismi</label>
              <input {...register('middle_name')} className={inputCls} placeholder="Alijonovich" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tug'ilgan sana *</label>
              <input {...register('birth_date', { required: true })} type="date" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jinsi *</label>
              <select {...register('gender')} className={selectCls}>
                <option value="M">Erkak</option>
                <option value="F">Ayol</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Maktab *</label>
            <select {...register('school', { required: true })} className={selectCls}>
              <option value="">— Maktabni tanlang —</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.school && <p className="text-xs text-red-500 mt-1">Maktab majburiy</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sinf</label>
            <select {...register('class_ref')} className={selectCls}>
              <option value="">— Sinf tanlang —</option>
              {formClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rasm (Face ID uchun)
            </label>
            <input {...register('photo')} type="file" accept="image/*"
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-50 file:text-violet-600 hover:file:bg-violet-100" />
            <p className="text-xs text-slate-400 mt-1">JPG, PNG — max 5MB. Face ID uchun yuzni to'g'ri, aniq suratga oling.</p>
          </div>
          {!editStudent && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Ota-ona (ixtiyoriy)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input {...register('parent_phone')} className={inputCls} placeholder="+998..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Munosabat</label>
                  <select {...register('relationship')} className={selectCls}>
                    <option value="father">Ota</option>
                    <option value="mother">Ona</option>
                    <option value="guardian">Vasiy</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Bekor qilish</Button>
            <Button type="submit" loading={saving}>{editStudent ? 'Saqlash' : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
