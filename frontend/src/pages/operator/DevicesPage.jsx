import { useState, useEffect, useCallback } from 'react'
import { Monitor, Plus, RefreshCw, Download, Wifi, WifiOff, Loader2, XCircle, Edit2, Trash2, History, ChevronDown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingSpinner'
import { devicesAPI } from '../../api/devices'
import { orgAPI } from '../../api/organizations'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const statusConfig = {
  online: { icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: 'Online' },
  offline: { icon: WifiOff, color: 'text-slate-500', bg: 'bg-slate-50', dot: 'bg-slate-400', label: 'Offline' },
  syncing: { icon: Loader2, color: 'text-violet-600', bg: 'bg-violet-50', dot: 'bg-violet-500', label: 'Sinxron' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', label: 'Xatolik' },
}

function DeviceCard({ device, onSync, onPullLogs, onRefresh, onEdit, onDelete, onLogs, syncing, pulling }) {
  const cfg = statusConfig[device.status] || statusConfig.offline
  const StatusIcon = cfg.icon
  const busy = syncing || pulling

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${cfg.bg}`}>
            <Monitor className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{device.name}</p>
            <p className="text-xs text-slate-500">{device.brand_display} • {device.ip_address}:{device.port}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(device)} title="Tahrirlash"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(device)} title="O'chirish"
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Maktab:</span>
          <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{device.school_name || '-'}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Joylashuv:</span>
          <span className="font-medium text-slate-800">{device.location || '-'}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Seriya:</span>
          <span className="font-medium text-slate-800">{device.serial_number || '-'}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Oxirgi faol:</span>
          <span className="font-medium text-slate-800 text-xs">
            {device.last_seen ? new Date(device.last_seen).toLocaleString('uz-UZ') : '-'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={() => onRefresh(device.id)} disabled={busy}
          className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Holat</span>
        </button>
        <button onClick={() => onSync(device.id)} disabled={busy}
          className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-40">
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Yuklash</span>
        </button>
        <button onClick={() => onPullLogs(device.id)} disabled={busy}
          className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-40">
          {pulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Log olish</span>
        </button>
        <button onClick={() => onLogs(device)} disabled={busy}
          className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40">
          <History className="w-3.5 h-3.5" />
          <span>Tarix</span>
        </button>
      </div>
    </Card>
  )
}

function SyncLogsModal({ device, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    devicesAPI.getSyncLogs(device.id)
      .then(({ data }) => setLogs(data))
      .catch(() => toast.error('Tarix yuklanmadi'))
      .finally(() => setLoading(false))
  }, [device.id])

  const statusColor = { success: 'text-emerald-600 bg-emerald-50', failed: 'text-red-600 bg-red-50', pending: 'text-violet-600 bg-violet-50', running: 'text-amber-600 bg-amber-50' }
  const typeColor = { push: 'text-violet-600 bg-violet-50', pull: 'text-emerald-600 bg-emerald-50' }

  return (
    <Modal isOpen onClose={onClose} title={`${device.name} — Sinxronizatsiya tarixi`}>
      {loading ? <LoadingSpinner /> : logs.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Tarix topilmadi</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[log.sync_type] || ''}`}>
                  {log.sync_type_display}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[log.status] || ''}`}>
                  {log.status_display}
                </span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{log.total_records} yozuv</p>
                <p>{log.started_at ? new Date(log.started_at).toLocaleString('uz-UZ') : '-'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function DeviceFormModal({ device, schools, onClose, onSaved }) {
  const isEdit = !!device
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: device ? {
      school: device.school,
      name: device.name,
      brand: device.brand,
      model: device.model || '',
      serial_number: device.serial_number || '',
      ip_address: device.ip_address,
      port: device.port,
      username: device.username || 'admin',
      location: device.location || '',
    } : { port: 80, username: 'admin', brand: 'hikvision' }
  })
  const [saving, setSaving] = useState(false)

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (isEdit) {
        if (!data.password) delete data.password
        await devicesAPI.updateDevice(device.id, data)
        toast.success('Qurilma yangilandi')
      } else {
        await devicesAPI.createDevice(data)
        toast.success("Qurilma qo'shildi")
      }
      onSaved()
      onClose()
    } catch (e) {
      const err = e.response?.data
      const msg = err?.detail || (typeof err === 'object' ? Object.values(err).flat().join(', ') : 'Xatolik')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Qurilmani tahrirlash' : "Yangi qurilma qo'shish"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Maktab *</label>
          <select {...register('school', { required: true })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">— Maktabni tanlang —</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.school && <p className="text-xs text-red-500 mt-1">Maktab majburiy</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Qurilma nomi *</label>
          <input {...register('name', { required: true })} placeholder="Asosiy kirish Face ID"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brend *</label>
            <select {...register('brand')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="hikvision">Hikvision</option>
              <option value="dahua">Dahua</option>
              <option value="zkteco">ZKTeco</option>
              <option value="anviz">Anviz</option>
              <option value="other">Boshqa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
            <input {...register('model')} placeholder="DS-K1T671TM"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">IP manzil *</label>
            <input {...register('ip_address', { required: true })} placeholder="192.168.1.100"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
            <input {...register('port')} type="number"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
            <input {...register('username')} placeholder="admin"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Parol {isEdit ? '(o\'zgartirish uchun)' : '*'}
            </label>
            <input {...register('password', { required: !isEdit })} type="password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seriya raqami</label>
          <input {...register('serial_number')} placeholder="DS2024XXXXX"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Joylashuv</label>
          <input {...register('location')} placeholder="Asosiy kirish, Orqa eshik..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Bekor qilish</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Saqlash' : "Qo'shish"}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([])
  const [schools, setSchools] = useState([])
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDevice, setEditDevice] = useState(null)
  const [logsDevice, setLogsDevice] = useState(null)
  const [syncingIds, setSyncingIds] = useState(new Set())
  const [pullingIds, setPullingIds] = useState(new Set())

  // Cascade filters
  const [filterRegion, setFilterRegion] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterSchool, setFilterSchool] = useState('')

  useEffect(() => {
    orgAPI.getRegions({ page_size: 200 }).then(({ data }) => setRegions(data.results || data)).catch(() => {})
    orgAPI.getSchools({ page_size: 500 }).then(({ data }) => setSchools(data.results || data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (filterRegion) {
      orgAPI.getDistricts({ region: filterRegion, page_size: 200 })
        .then(({ data }) => setDistricts(data.results || data))
        .catch(() => {})
      setFilterDistrict('')
      setFilterSchool('')
    } else {
      setDistricts([])
      setFilterDistrict('')
      setFilterSchool('')
    }
  }, [filterRegion])

  const filteredSchools = filterDistrict
    ? schools.filter(s => String(s.district) === String(filterDistrict))
    : filterRegion
    ? schools.filter(s => {
        const d = districts.find(d => String(d.id) === String(s.district))
        return d && String(d.region) === String(filterRegion)
      })
    : schools

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterSchool) params.school = filterSchool
      else if (filterDistrict) {
        const schoolIds = schools.filter(s => String(s.district) === String(filterDistrict)).map(s => s.id)
        if (schoolIds.length) params.school__in = schoolIds.join(',')
      }
      const { data } = await devicesAPI.getDevices(params)
      setDevices(data.results || data)
    } catch {
      toast.error('Qurilmalar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [filterSchool, filterDistrict, schools])

  useEffect(() => { loadDevices() }, [loadDevices])

  const handleRefresh = async (id) => {
    try {
      const { data } = await devicesAPI.getDeviceStatus(id)
      setDevices(prev => prev.map(d => d.id === id ? { ...d, status: data.status, last_seen: data.online ? new Date().toISOString() : d.last_seen } : d))
      toast.success(`Holat: ${data.status}`)
    } catch { toast.error('Holat olishda xatolik') }
  }

  const handleSync = async (id) => {
    setSyncingIds(prev => new Set(prev).add(id))
    try {
      await devicesAPI.syncStudents(id)
      toast.success("O'quvchilar yuklanmoqda...")
    } catch { toast.error('Sinxronizatsiya xatoligi') }
    finally { setSyncingIds(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  const handlePullLogs = async (id) => {
    setPullingIds(prev => new Set(prev).add(id))
    try {
      await devicesAPI.pullLogs(id)
      toast.success('Loglar olinmoqda...')
    } catch { toast.error('Log olishda xatolik') }
    finally { setPullingIds(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  const handleDelete = async (device) => {
    if (!window.confirm(`"${device.name}" qurilmasini o'chirishni tasdiqlaysizmi?`)) return
    try {
      await devicesAPI.deleteDevice(device.id)
      toast.success("Qurilma o'chirildi")
      loadDevices()
    } catch { toast.error("O'chirishda xatolik") }
  }

  const summaryStats = [
    { label: 'Jami', count: devices.length, color: 'bg-slate-100 text-slate-700' },
    { label: 'Online', count: devices.filter(d => d.status === 'online').length, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Offline', count: devices.filter(d => d.status === 'offline').length, color: 'bg-slate-100 text-slate-600' },
    { label: 'Xatolik', count: devices.filter(d => d.status === 'error').length, color: 'bg-red-100 text-red-700' },
  ]

  const selectCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Qurilmalar</h1>
          <p className="text-slate-500 text-sm">Face ID va davomad qurilmalarini boshqarish</p>
        </div>
        <Button onClick={() => { setEditDevice(null); setShowForm(true) }} icon={Plus}>Qurilma qo'shish</Button>
      </div>

      {/* Cascade filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Viloyat</label>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className={selectCls}>
              <option value="">Barcha viloyatlar</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tuman</label>
            <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} disabled={!filterRegion} className={selectCls}>
              <option value="">Barcha tumanlar</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Maktab</label>
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className={selectCls}>
              <option value="">Barcha maktablar</option>
              {filteredSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {summaryStats.map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : devices.length === 0 ? (
        <EmptyState icon={Monitor} title="Qurilmalar topilmadi"
          description="Yangi qurilma qo'shish uchun yuqoridagi tugmani bosing"
          action={<Button onClick={() => setShowForm(true)} icon={Plus}>Qurilma qo'shish</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              onSync={handleSync}
              onPullLogs={handlePullLogs}
              onRefresh={handleRefresh}
              onEdit={(d) => { setEditDevice(d); setShowForm(true) }}
              onDelete={handleDelete}
              onLogs={(d) => setLogsDevice(d)}
              syncing={syncingIds.has(device.id)}
              pulling={pullingIds.has(device.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <DeviceFormModal
          device={editDevice}
          schools={schools}
          onClose={() => { setShowForm(false); setEditDevice(null) }}
          onSaved={loadDevices}
        />
      )}

      {logsDevice && (
        <SyncLogsModal device={logsDevice} onClose={() => setLogsDevice(null)} />
      )}
    </div>
  )
}
