import { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { reportsAPI } from '../../api/reports'
import { attendanceAPI } from '../../api/attendance'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'daily', label: 'Kunlik' },
  { id: 'weekly', label: 'Haftalik' },
  { id: 'monthly', label: 'Oylik' },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('daily')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [tab, selectedDate, year, month])

  const loadData = async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'daily') {
        res = await reportsAPI.getDaily({ date: selectedDate })
      } else if (tab === 'weekly') {
        const end = selectedDate
        const start = format(subDays(new Date(selectedDate), 6), 'yyyy-MM-dd')
        res = await reportsAPI.getWeekly({ start_date: start, end_date: end })
      } else {
        res = await reportsAPI.getMonthly({ year, month })
      }
      setData(res.data)
    } catch {
      toast.error('Hisobot yuklanmadi')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      let params = {}
      if (tab === 'daily') params.date = selectedDate
      // For weekly/monthly we just export the current month/range if supported by backend
      const res = await attendanceAPI.exportExcel(params)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `hisobot_${tab}_${new Date().toISOString().slice(0,10)}.xlsx`)
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

  const renderDaily = () => {
    if (!data) return null
    const classData = (data.class_breakdown || []).map(c => ({
      name: c.student__class_ref__name || '',
      Keldi: c.present || 0,
      'Kech keldi': c.late || 0,
      Kelmadi: c.absent || 0,
    }))

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Jami', value: data.total || 0, color: 'text-slate-800' },
            { label: 'Keldi', value: data.present || 0, color: 'text-emerald-700' },
            { label: 'Kech keldi', value: data.late || 0, color: 'text-amber-700' },
            { label: 'Kelmadi', value: data.absent || 0, color: 'text-red-700' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Davomad ko'rsatkichi</h3>
            <span className="text-2xl font-bold text-violet-600">{data.attendance_rate}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full">
            <div className="h-full bg-violet-600 rounded-full" style={{ width: `${data.attendance_rate}%` }} />
          </div>
        </Card>

        {classData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Sinflar bo'yicha</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Keldi" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Kech keldi" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Kelmadi" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    )
  }

  const renderWeekly = () => {
    if (!data?.daily) return null
    const chartData = Object.entries(data.daily).map(([date, stats]) => ({
      date: date.slice(5),
      "Ko'rsatkich": stats.attendance_rate || 0,
      Keldi: stats.present || 0,
      Kelmadi: stats.absent || 0,
    }))

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Keldi', value: data.overall?.present || 0, color: 'text-emerald-700' },
            { label: 'Kech keldi', value: data.overall?.late || 0, color: 'text-amber-700' },
            { label: 'Kelmadi', value: data.overall?.absent || 0, color: 'text-red-700' },
            { label: "Ko'rsatkich", value: `${data.overall?.attendance_rate || 0}%`, color: 'text-violet-700' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Haftalik trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v, n) => n === "Ko'rsatkich" ? [`${v}%`, n] : [v, n]} />
              <Legend />
              <Line type="monotone" dataKey="Ko'rsatkich" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hisobotlar</h1>
          <p className="text-slate-500 text-sm">Davomad tahlili va statistikasi</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={handleExport} loading={exporting}>
          {exporting ? 'Tayyorlanmoqda...' : 'Yuklab olish'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 flex items-center gap-4">
        {tab === 'daily' && (
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        )}
        {tab === 'weekly' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Oxirgi hafta (dan):</span>
            <input type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        )}
        {tab === 'monthly' && (
          <div className="flex items-center gap-3">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
                .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}
      </Card>

      {loading ? <LoadingSpinner /> : (
        tab === 'daily' ? renderDaily() :
        tab === 'weekly' ? renderWeekly() :
        <div className="text-center text-slate-500 py-8">Oylik hisobot yuklanmoqda...</div>
      )}
    </div>
  )
}
