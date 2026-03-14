import { useEffect, useState, useCallback } from 'react'
import { School, Users, Monitor, CheckCircle, Clock, XCircle, MapPin, RefreshCw, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { reportsAPI } from '../api/reports'
import { orgAPI } from '../api/organizations'
import { format } from 'date-fns'

// Mini donut chart inside stat card
function DonutStatCard({ title, value, total, color, bgColor, icon: Icon, sub, percent }) {
  const pct = percent ?? (total > 0 ? Math.round((value / total) * 100) : 0)
  const donutData = [
    { value: pct, fill: color },
    { value: Math.max(0, 100 - pct), fill: '#F1F5F9' },
  ]
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <PieChart width={64} height={64}>
          <Pie data={donutData} dataKey="value" cx={28} cy={28}
            innerRadius={22} outerRadius={31} startAngle={90} endAngle={-270} stroke="none">
            {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700">{pct}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${bgColor} flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </Card>
  )
}

function SimpleStatCard({ title, value, icon: Icon, bgColor, sub }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgColor} flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

// Analytics card for a breakdown item (region/district/school)
function AnalyticsCard({ item, onClick, clickable }) {
  const rate = item.rate ?? 0
  const donutData = [
    { value: rate, fill: rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444' },
    { value: Math.max(0, 100 - rate), fill: '#F1F5F9' },
  ]
  const rateColor = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'
  const rateBg = rate >= 80 ? 'bg-emerald-50' : rate >= 60 ? 'bg-amber-50' : 'bg-red-50'

  return (
    <Card className={`p-4 ${clickable ? 'cursor-pointer hover:shadow-md hover:border-violet-200 transition-all' : ''}`}
      onClick={clickable ? onClick : undefined}>
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 flex-shrink-0">
          <PieChart width={56} height={56}>
            <Pie data={donutData} dataKey="value" cx={24} cy={24}
              innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} stroke="none">
              {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-700">{rate}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{item.name}</p>
            {clickable && <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
          </div>
          <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${rateBg} ${rateColor}`}>
            {rate}% davomat
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            <div className="text-center">
              <p className="text-xs font-bold text-emerald-600">{item.present ?? 0}</p>
              <p className="text-[10px] text-slate-400">Keldi</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-amber-500">{item.late ?? 0}</p>
              <p className="text-[10px] text-slate-400">Kech</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-red-500">{item.absent ?? 0}</p>
              <p className="text-[10px] text-slate-400">Yo'q</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

const PERIODS = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Bu hafta' },
  { value: 'month', label: 'Bu oy' },
]

export default function DashboardPage() {
  const [overview, setOverview] = useState(null)
  const [orgStats, setOrgStats] = useState({ regions: 0, schools: 0 })
  const [baseLoading, setBaseLoading] = useState(true)

  // Analytics filters
  const [period, setPeriod] = useState('today')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [schools, setSchools] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Breadcrumb for drill-down
  const [breadcrumb, setBreadcrumb] = useState([])

  useEffect(() => {
    Promise.all([
      reportsAPI.getOverview().catch(() => ({ data: null })),
      orgAPI.getRegions({ page_size: 1 }).catch(() => ({ data: { count: 0 } })),
      orgAPI.getSchools({ page_size: 1 }).catch(() => ({ data: { count: 0 } })),
      orgAPI.getRegions({ page_size: 200 }).catch(() => ({ data: { results: [] } })),
    ]).then(([ovRes, regCount, schCount, regList]) => {
      setOverview(ovRes.data)
      setOrgStats({ regions: regCount.data?.count || 0, schools: schCount.data?.count || 0 })
      setRegions(regList.data?.results || regList.data || [])
    }).finally(() => setBaseLoading(false))
  }, [])

  useEffect(() => {
    if (filterRegion) {
      orgAPI.getDistricts({ region: filterRegion, page_size: 200 })
        .then(({ data }) => setDistricts(data.results || data))
        .catch(() => {})
    } else {
      setDistricts([])
    }
    setFilterDistrict('')
    setFilterSchool('')
  }, [filterRegion])

  useEffect(() => {
    if (filterDistrict) {
      orgAPI.getSchools({ district: filterDistrict, page_size: 200 })
        .then(({ data }) => setSchools(data.results || data))
        .catch(() => {})
    } else {
      setSchools([])
    }
    setFilterSchool('')
  }, [filterDistrict])

  const loadAnalytics = useCallback(() => {
    setAnalyticsLoading(true)
    const params = { period }
    if (filterSchool) params.school = filterSchool
    else if (filterDistrict) params.district = filterDistrict
    else if (filterRegion) params.region = filterRegion

    reportsAPI.getAnalytics(params)
      .then(({ data }) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false))
  }, [period, filterRegion, filterDistrict, filterSchool])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const handleDrillDown = (item, level) => {
    if (level === 'region') {
      const r = regions.find(r => r.name === item.name)
      if (r) {
        setBreadcrumb(prev => [...prev, { label: item.name, action: () => { setFilterRegion(''); setFilterDistrict(''); setFilterSchool(''); setBreadcrumb([]) } }])
        setFilterRegion(r.id)
      }
    } else if (level === 'district') {
      const d = districts.find(d => d.name === item.name)
      if (d) {
        setBreadcrumb(prev => [...prev, { label: item.name, action: () => { setFilterDistrict(''); setFilterSchool(''); setBreadcrumb(bc => bc.slice(0, 1)) } }])
        setFilterDistrict(d.id)
      }
    } else if (level === 'school') {
      const s = schools.find(s => s.name === item.name)
      if (s) {
        setBreadcrumb(prev => [...prev, { label: item.name, action: () => { setFilterSchool(''); setBreadcrumb(bc => bc.slice(0, 2)) } }])
        setFilterSchool(s.id)
      }
    }
  }

  const resetFilters = () => {
    setFilterRegion(''); setFilterDistrict(''); setFilterSchool(''); setBreadcrumb([])
  }

  if (baseLoading) return <LoadingSpinner />

  const today = overview?.today || {}
  const summary = overview?.summary || {}
  const total = today.total || 0
  const present = today.present || 0
  const late = today.late || 0
  const absent = today.absent || 0
  const rate = today.attendance_rate || 0
  const devOnline = summary.devices_online || 0
  const devTotal = summary.devices_total || 0

  const overall = analytics?.overall || {}
  const breakdown = analytics?.breakdown || []
  const breakdownLevel = analytics?.level || 'region'
  const levelLabels = { region: 'Viloyatlar', district: 'Tumanlar', school: 'Maktablar', class: 'Sinflar' }

  const selectCls = "px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(new Date(), 'dd MMMM yyyy')} — Umumiy holat
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-violet-700">Tizim faol</span>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DonutStatCard title="Bugungi davomad" value={`${present + late}/${total}`}
          percent={rate} color="#7C3AED" bgColor="bg-violet-500" icon={CheckCircle}
          sub={`${rate}% davomat`} />
        <DonutStatCard title="Vaqtida keldi" value={present} total={total}
          color="#10B981" bgColor="bg-emerald-500" icon={CheckCircle}
          sub={`${total > 0 ? Math.round((present / total) * 100) : 0}% o'quvchilar`} />
        <DonutStatCard title="Qurilmalar" value={`${devOnline}/${devTotal}`}
          percent={devTotal > 0 ? Math.round((devOnline / devTotal) * 100) : 0}
          color="#06B6D4" bgColor="bg-cyan-500" icon={Monitor}
          sub={`${devTotal - devOnline} ta offline`} />
        <DonutStatCard title="Kech keldi" value={late} total={total}
          color="#F59E0B" bgColor="bg-amber-500" icon={Clock}
          sub={`${total > 0 ? Math.round((late / total) * 100) : 0}% kech`} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SimpleStatCard title="Jami o'quvchilar" value={summary.students_count || 0}
          icon={Users} bgColor="bg-indigo-500" sub="tizimda ro'yxatda" />
        <SimpleStatCard title="Maktablar" value={orgStats.schools}
          icon={School} bgColor="bg-pink-500" sub="faol maktablar" />
        <SimpleStatCard title="Viloyatlar" value={orgStats.regions}
          icon={MapPin} bgColor="bg-orange-500" sub="hududlar" />
        <SimpleStatCard title="Kelmadi" value={absent}
          icon={XCircle} bgColor="bg-red-500"
          sub={`${total > 0 ? Math.round((absent / total) * 100) : 0}% yo'q`} />
      </div>

      {/* Analytics section */}
      <Card className="p-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Davr</p>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p.value ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Viloyat</p>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className={selectCls}>
              <option value="">Barcha viloyatlar</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {filterRegion && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Tuman</p>
              <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className={selectCls}>
                <option value="">Barcha tumanlar</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          {filterDistrict && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Maktab</p>
              <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className={selectCls}>
                <option value="">Barcha maktablar</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={loadAnalytics} disabled={analyticsLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
          {(filterRegion || filterDistrict || filterSchool) && (
            <button onClick={resetFilters}
              className="px-3 py-2 text-sm text-violet-600 hover:text-violet-800 font-medium">
              Tozalash
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 flex-wrap">
            <button onClick={resetFilters} className="hover:text-violet-600">Bosh sahifa</button>
            {breadcrumb.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button onClick={bc.action} className="hover:text-violet-600">{bc.label}</button>
              </span>
            ))}
          </div>
        )}

        {/* Overall summary bar */}
        {overall.total > 0 && (
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl mb-5">
            <div className="relative w-16 h-16 flex-shrink-0">
              <PieChart width={64} height={64}>
                <Pie data={[
                  { value: overall.rate || 0, fill: '#7C3AED' },
                  { value: Math.max(0, 100 - (overall.rate || 0)), fill: '#E2E8F0' }
                ]} dataKey="value" cx={28} cy={28} innerRadius={22} outerRadius={31}
                  startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="#7C3AED" /><Cell fill="#E2E8F0" />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{overall.rate}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-slate-500">Jami</p>
                <p className="text-xl font-bold text-slate-800">{(overall.total || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Keldi</p>
                <p className="text-xl font-bold text-emerald-600">{(overall.present || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kech keldi</p>
                <p className="text-xl font-bold text-amber-500">{(overall.late || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kelmadi</p>
                <p className="text-xl font-bold text-red-500">{(overall.absent || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Breakdown title */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {levelLabels[breakdownLevel] || 'Taqsimot'}
            {breakdown.length > 0 && <span className="ml-1 text-slate-400 font-normal">({breakdown.length} ta)</span>}
          </h3>
        </div>

        {/* Analytics cards */}
        {analyticsLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : breakdown.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <XCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {breakdown.map((item, idx) => (
              <AnalyticsCard
                key={idx}
                item={item}
                clickable={breakdownLevel !== 'class' && breakdownLevel !== 'school'}
                onClick={() => handleDrillDown(item, breakdownLevel)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
