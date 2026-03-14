import { useState } from 'react'
import { MessageCircle, Bot, Users, BarChart3, CheckCircle, ExternalLink, Copy, Bell } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

function StepBadge({ n }) {
  return (
    <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </div>
  )
}

function BotCard({ icon: Icon, color, title, description, username, features }) {
  const copyUsername = () => {
    if (!username || username.includes('...')) {
      toast.error('.env faylda bot tokenini sozlang')
      return
    }
    navigator.clipboard.writeText(`https://t.me/${username}`)
    toast.success('Link nusxalandi')
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      {username && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600 font-mono flex-1">@{username}</span>
          <button onClick={copyUsername}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          {!username.includes('...') && (
            <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">{f}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function TelegramPage() {
  const { user } = useSelector(state => state.auth)
  const parentBotUsername = import.meta.env.VITE_PARENT_BOT_USERNAME || 'davomad_parent_bot'
  const managementBotUsername = import.meta.env.VITE_MANAGEMENT_BOT_USERNAME || 'davomad_management_bot'

  const parentSteps = [
    { icon: '1', text: `Telegram da @${parentBotUsername} ni oching` },
    { icon: '2', text: '/start buyrug\'ini yuboring' },
    { icon: '3', text: 'Telefon raqamingizni ulashing (📱 tugma)' },
    { icon: '4', text: 'Bot sizni avtomatik o\'quvchingiz bilan bog\'laydi' },
    { icon: '5', text: 'Bugundan davomad xabarlari keladi' },
  ]

  const managementSteps = [
    { text: `@${managementBotUsername} botini oching` },
    { text: '/start buyrug\'ini yuboring' },
    { text: 'Hisobot buyruqlarini ishlating' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Telegram Bot</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Ota-onalar va boshqaruv uchun Telegram bot integratsiyasi
        </p>
      </div>

      {/* Bot cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotCard
          icon={Users}
          color="bg-blue-500"
          title="Ota-ona boti"
          description="Ota-onalar farzandlarining davomatidan xabardor bo'ladi"
          username={parentBotUsername}
          features={[
            'Farzand maktabga kelganda xabar olish',
            'Kech kelganda yoki kelmasa bildirishnoma',
            'Bugungi davomat holatini ko\'rish',
            'Bir nechta farzandni kuzatish',
            "Oylik davomat statistikasini olish",
          ]}
        />
        <BotCard
          icon={BarChart3}
          color="bg-emerald-500"
          title="Boshqaruv boti"
          description="Direktor va operatorlar uchun hisobot boti"
          username={managementBotUsername}
          features={[
            'Bugungi davomat hisobotini olish',
            'Barcha qurilmalar holatini ko\'rish',
            'Haftalik tendensiya grafiklar',
            'Xavfli holat ogohlantirishlari',
            'Maktab kesimida statistika',
          ]}
        />
      </div>

      {/* Parent connection guide */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 rounded-xl">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Ota-ona botini ulash qo'llanmasi</h2>
        </div>

        <div className="space-y-4">
          {parentSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-600 pt-0.5">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Muhim eslatma</p>
              <p className="text-sm text-amber-700">
                Ota-ona Telegramda ro'yxatdan o'tgan telefon raqami tizimda kiritilgan raqam bilan mos kelishi kerak.
                Aks holda bot ota-onani topa olmaydi.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Management bot guide */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Bot className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Boshqaruv botidagi buyruqlar</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { cmd: '/start', desc: 'Botni ishga tushirish' },
            { cmd: '/bugungi_hisobot', desc: 'Bugungi davomat hisoboti' },
            { cmd: '/qurilmalar', desc: 'Qurilmalar holati' },
            { cmd: '/haftalik_trend', desc: 'Haftalik davomat grafigi' },
            { cmd: '/statistika', desc: 'Umumiy statistika' },
            { cmd: '/yordam', desc: 'Barcha buyruqlar ro\'yxati' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <code className="text-sm font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">{cmd}</code>
              <span className="text-sm text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Setup guide for admins */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-violet-50 rounded-xl">
            <Bot className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Admin uchun sozlash</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-semibold text-slate-700 mb-2">1. BotFather orqali bot yarating</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ChevronRightIcon />
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono">@BotFather</a>
                <span>ga kiring va /newbot buyrug'ini yuboring</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ChevronRightIcon />Bot nomini va username kiriting (masalan: davomad_parent_bot)
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ChevronRightIcon />Olingan tokenni <code className="bg-slate-200 px-1 rounded">.env</code> ga saqlang
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-semibold text-slate-700 mb-2">2. <code className="bg-slate-200 px-1 rounded">.env</code> fayliga qo'shing</p>
            <pre className="text-xs bg-slate-800 text-emerald-400 p-3 rounded-lg overflow-x-auto">
{`PARENT_BOT_TOKEN=1234567890:AAF...
MANAGEMENT_BOT_TOKEN=9876543210:BBG...
BOT_SECRET=your-shared-secret-key`}
            </pre>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-semibold text-slate-700 mb-2">3. Botlarni ishga tushiring</p>
            <pre className="text-xs bg-slate-800 text-emerald-400 p-3 rounded-lg overflow-x-auto">
{`# Docker orqali (tavsiya etiladi)
docker-compose up -d parent-bot management-bot

# Yoki to'g'ridan-to'g'ri
cd bot && python parent_bot.py
cd bot && python management_bot.py`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ChevronRightIcon() {
  return <span className="w-4 h-4 text-slate-400 flex-shrink-0">›</span>
}
