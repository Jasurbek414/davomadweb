import { useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { fetchNotifications, markAsRead, markAllRead } from '../../store/notificationsSlice'
import { notificationsAPI } from '../../api/notifications'
import { format } from 'date-fns'
import { EmptyState } from '../../components/ui/LoadingSpinner'

const typeColors = {
  check_in: 'bg-emerald-100 text-emerald-700',
  check_out: 'bg-blue-100 text-blue-700',
  late: 'bg-amber-100 text-amber-700',
  absent: 'bg-red-100 text-red-700',
  system: 'bg-slate-100 text-slate-700',
  device: 'bg-violet-100 text-violet-700',
}

const typeEmojis = { check_in: '✅', check_out: '🏠', late: '⏰', absent: '❌', system: '🔔', device: '🖥️' }

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const { items, isLoading } = useSelector(state => state.notifications)

  useEffect(() => { dispatch(fetchNotifications()) }, [dispatch])

  const handleMarkRead = async (id) => {
    dispatch(markAsRead(id))
    await notificationsAPI.markRead(id)
  }

  const handleMarkAllRead = async () => {
    dispatch(markAllRead())
    await notificationsAPI.markAllRead()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bildirishnomalar</h1>
          <p className="text-slate-500 text-sm">{(items || []).filter(n => !n.is_read).length} ta o'qilmagan</p>
        </div>
        {Array.isArray(items) && items.some(n => !n.is_read) && (
          <Button variant="secondary" size="sm" icon={CheckCheck} onClick={handleMarkAllRead}>
            Barchasini o'qildi
          </Button>
        )}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="Bildirishnomalar yo'q" description="Yangi bildirishnomalar bu yerda ko'rinadi" />
        ) : (
          <div className="divide-y divide-slate-100">
            {(items || []).map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50
                  ${!n.is_read ? 'bg-violet-50/50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeColors[n.notification_type] || 'bg-slate-100'}`}>
                  {typeEmojis[n.notification_type] || '🔔'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
