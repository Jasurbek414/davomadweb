"""
Boshqaruv boti - Maktab rahbarlari va operatorlar uchun
Kunlik hisobotlar, qurilma holati va tezkor bildirishnomalar.
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.storage.memory import MemoryStorage
from decouple import config
import aiohttp
from datetime import date

BOT_TOKEN = config('BOT_TOKEN', default='')
API_URL = config('API_URL', default='http://localhost:8000')
BOT_SECRET = config('BOT_SECRET', default='')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
router = Router()


def main_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📊 Bugungi hisobot"), KeyboardButton(text="🖥️ Qurilmalar")],
            [KeyboardButton(text="📈 Haftalik trend"), KeyboardButton(text="🔔 Ogohlantirishlar")],
            [KeyboardButton(text="ℹ️ Yordam")],
        ],
        resize_keyboard=True
    )


async def get_api(endpoint, telegram_id, params=None):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{API_URL}/api/v1/{endpoint}",
            params=params or {},
            headers={"X-Telegram-ID": str(telegram_id), "X-Bot-Secret": BOT_SECRET},
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            if resp.status == 200:
                return await resp.json()
    return None


@router.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer(
        "👋 <b>Assalomu alaykum!</b>\n\n"
        "🏫 <b>Maktab Boshqaruv Botiga xush kelibsiz!</b>\n\n"
        "Bu bot orqali:\n"
        "📊 Kunlik davomad hisobotini ko'ring\n"
        "🖥️ Qurilmalar holatini kuzating\n"
        "🔔 Muhim ogohlantirishlar oling\n\n"
        "Buyruqni tanlang:",
        parse_mode="HTML",
        reply_markup=main_keyboard()
    )


@router.message(F.text == "📊 Bugungi hisobot")
@router.message(Command("hisobot"))
async def daily_report(message: Message):
    today = date.today().isoformat()
    data = await get_api(f"reports/daily/?date={today}", message.from_user.id)

    if not data:
        await message.answer("❌ Ma'lumot olishda xatolik. Keyinroq urinib ko'ring.", reply_markup=main_keyboard())
        return

    total = data.get('total', 0)
    present = data.get('present', 0)
    late = data.get('late', 0)
    absent = data.get('absent', 0)
    rate = data.get('attendance_rate', 0)

    bar_length = 20
    filled = int(bar_length * rate / 100)
    bar = '█' * filled + '░' * (bar_length - filled)

    text = (
        f"📊 <b>Bugungi Davomad Hisoboti</b>\n"
        f"📅 {today}\n\n"
        f"✅ Keldi: <b>{present}</b> ta\n"
        f"⏰ Kech keldi: <b>{late}</b> ta\n"
        f"❌ Kelmadi: <b>{absent}</b> ta\n"
        f"📋 Jami: <b>{total}</b> ta\n\n"
        f"📈 Ko'rsatkich: <b>{rate}%</b>\n"
        f"[{bar}]"
    )
    await message.answer(text, parse_mode="HTML", reply_markup=main_keyboard())


@router.message(F.text == "🖥️ Qurilmalar")
@router.message(Command("qurilmalar"))
async def devices_status(message: Message):
    data = await get_api("devices/", message.from_user.id)

    if not data:
        await message.answer("❌ Ma'lumot olishda xatolik.", reply_markup=main_keyboard())
        return

    devices = data.get('results', [])
    if not devices:
        await message.answer("❌ Qurilmalar topilmadi.", reply_markup=main_keyboard())
        return

    online = [d for d in devices if d.get('status') == 'online']
    offline = [d for d in devices if d.get('status') != 'online']

    text = f"🖥️ <b>Qurilmalar holati</b>\n\n"
    text += f"🟢 Online: {len(online)} ta\n"
    text += f"🔴 Offline: {len(offline)} ta\n\n"

    if online:
        text += "<b>✅ Online qurilmalar:</b>\n"
        for d in online[:5]:
            text += f"  🟢 {d['name']} ({d['ip_address']})\n"

    if offline:
        text += "\n<b>❌ Offline qurilmalar:</b>\n"
        for d in offline[:5]:
            text += f"  🔴 {d['name']} ({d['ip_address']})\n"

    await message.answer(text, parse_mode="HTML", reply_markup=main_keyboard())


@router.message(F.text == "📈 Haftalik trend")
@router.message(Command("trend"))
async def weekly_trend(message: Message):
    data = await get_api("reports/weekly/", message.from_user.id)

    if not data or not data.get('daily'):
        await message.answer("❌ Ma'lumot olishda xatolik.", reply_markup=main_keyboard())
        return

    overall = data.get('overall', {})
    text = (
        f"📈 <b>Haftalik Davomad Trendi</b>\n\n"
        f"📊 Umumiy ko'rsatkich: <b>{overall.get('attendance_rate', 0)}%</b>\n"
        f"✅ Jami keldi: <b>{overall.get('present', 0)}</b>\n"
        f"⏰ Kech keldi: <b>{overall.get('late', 0)}</b>\n"
        f"❌ Kelmadi: <b>{overall.get('absent', 0)}</b>\n\n"
        f"<b>Kunlik natijalar:</b>\n"
    )

    for date_str, stats in list(data['daily'].items())[-7:]:
        rate = stats.get('attendance_rate', 0)
        bar = '█' * int(rate / 10) + '░' * (10 - int(rate / 10))
        text += f"{date_str[5:]}: [{bar}] {rate}%\n"

    await message.answer(text, parse_mode="HTML", reply_markup=main_keyboard())


@router.message(F.text == "ℹ️ Yordam")
async def help_cmd(message: Message):
    await message.answer(
        "📌 <b>Buyruqlar ro'yxati:</b>\n\n"
        "📊 Bugungi hisobot\n"
        "🖥️ Qurilmalar\n"
        "📈 Haftalik trend\n\n"
        "❓ Yordam uchun tizim administratoriga murojaat qiling.",
        parse_mode="HTML",
        reply_markup=main_keyboard()
    )


dp.include_router(router)


async def main():
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN topilmadi!")
        return
    logger.info("Boshqaruv boti ishga tushmoqda...")
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
