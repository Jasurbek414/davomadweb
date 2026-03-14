import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Users, Phone, Link } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner, EmptyState, TableSkeleton } from '../../components/ui/LoadingSpinner'
import { studentsAPI } from '../../api/students'
import toast from 'react-hot-toast'

export default function ParentsPage() {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadParents = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await studentsAPI.getParents({ search })
      setParents(data.results || data)
    } catch (e) {
      toast.error('Ma\'lumot olishda xatolik')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { loadParents() }, [loadParents])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ota-onalar</h1>
          <p className="text-slate-500 text-sm">Tizimda ro'yxatdan o'tgan ota-onalar</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, Familiya yoki telefon..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Ota-ona", "Telefon", "Farzandlari", "Bot", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3 bg-slate-50 border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8"><TableSkeleton rows={5} cols={5} /></td></tr>
              ) : parents.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={Users} title="Ota-onalar topilmadi" description="Hali hech kim ro'yxatdan o'tmagan" /></td></tr>
              ) : parents.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{p.last_name} {p.first_name}</p>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 font-mono">{p.phone}</td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {p.students?.map((s, i) => (
                        <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">
                          {s.name} ({s.class})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100">
                    {p.is_registered ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Faol</span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Kutilmoqda</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-100 text-right">
                    {/* Actions if needed */}
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
