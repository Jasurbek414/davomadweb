import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Search, RefreshCw, ChevronDown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingSpinner'
import { usersAPI } from '../../api/auth'
import { format } from 'date-fns'

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-violet-100 text-violet-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
}

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 25

  const load = useCallback(() => {
    setLoading(true)
    usersAPI.getAuditLogs({ search, action: filterAction || undefined, page, page_size: PAGE_SIZE })
      .then(r => {
        setLogs(r.data.results || [])
        setTotal(r.data.count || 0)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [search, filterAction, page])

  useEffect(() => { load() }, [load])

  const formatDate = (d) => {
    try { return format(new Date(d), 'dd.MM.yyyy HH:mm') } catch { return d }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit loglari</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tizimda barcha o'zgarishlar tarixi</p>
        </div>
        <button onClick={load}
          className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Qidirish..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div className="relative">
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }}
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white appearance-none">
              <option value="">Barcha amallar</option>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map(a =>
                <option key={a} value={a}>{a}</option>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : logs.length === 0 ? (
          <EmptyState title="Loglar yo'q" description="Hozircha hech qanday amal qayd etilmagan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vaqt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Foydalanuvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ob'ekt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log, i) => (
                  <tr key={log.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{log.user_name || log.user || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.model_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.object_repr || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">Jami: {total} ta log</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Oldingi
              </button>
              <span className="text-sm text-slate-600 px-2">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Keyingi →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
