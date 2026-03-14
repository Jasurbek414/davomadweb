import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { LoadingSpinner, EmptyState, TableSkeleton } from '../../components/ui/LoadingSpinner'
import { attendanceAPI } from '../../api/attendance'
import { format, subDays, addDays } from 'date-fns'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({})
  const [exporting, setExporting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        attendanceAPI.getAttendance({ date: selectedDate, search, page_size: 100 }),
        attendanceAPI.getStatistics({ start_date: selectedDate, end_date: selectedDate }),
      ])
      setRecords(attendanceRes.data.results || attendanceRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Ma\'lumot olishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, search])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await attendanceAPI.exportExcel({ date: selectedDate, search })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `davomad_${selectedDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Excel fayl tayyor')
    } catch {
      toast.error('Excel yuklashda xatolik')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => { loadData() }, [loadData])

  const prevDay = () => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))
  const nextDay = () => {
    const next = addDays(new Date(selectedDate), 1)
    if (next <= new Date()) setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Davomad</h1>
          <p className="text-slate-500 text-sm">Kunlik davomad yozuvlari</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={handleExport} loading={exporting}>
          {exporting ? 'Tayyorlanmoqda...' : 'Excel yuklash'}
        </Button>
      </div>

      {/* Date picker + search */}
      <Card className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button onClick={nextDay} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="O'quvchi qidirish..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jami', value: stats.total || 0, color: 'bg-slate-50 border-slate-200', tc: 'text-slate-800' },
          { label: 'Keldi', value: stats.present || 0, color: 'bg-emerald-50 border-emerald-200', tc: 'text-emerald-700' },
          { label: 'Kech keldi', value: stats.late || 0, color: 'bg-amber-50 border-amber-200', tc: 'text-amber-700' },
          { label: 'Kelmadi', value: stats.absent || 0, color: 'bg-red-50 border-red-200', tc: 'text-red-700' },
        ].map(({ label, value, color, tc }) => (
          <div key={label} className={`rounded-xl border p-3 ${color}`}>
            <p className={`text-2xl font-bold ${tc}`}>{value}</p>
            <p className={`text-xs font-medium ${tc} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate */}
      {stats.total > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Davomad ko'rsatkichi</span>
            <span className="text-lg font-bold text-violet-700">{stats.attendance_rate || 0}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all"
              style={{ width: `${stats.attendance_rate || 0}%` }}
            />
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["O'quvchi", "Sinf", "Kelish", "Ketish", "Status", "Kechikish"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3 bg-slate-50 border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8"><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={ClipboardList} title="Davomad yozuvlari topilmadi"
                    description={`${selectedDate} sanasi uchun ma'lumot yo'q`} />
                </td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                        {r.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.student_name}</p>
                        <p className="text-xs text-slate-500">{r.student_id_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">{r.class_name || '-'}</td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-800">
                    {r.check_in_str || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-800">
                    {r.check_out_str || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm">
                    {r.late_minutes > 0 ? (
                      <span className="text-amber-600 font-medium">{r.late_minutes} daqiqa</span>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
