"""
Ota-ona boti - Maktab Davomad tizimi
O'quvchilarning maktabga kelishi haqida ota-onalarga xabar beradi.
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
)
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from decouple import config
import aiohttp

BOT_TOKEN = config('PARENT_BOT_TOKEN', default=config('BOT_TOKEN', default=''))
API_URL = config('API_URL', default='http://localhost:8000')
BOT_SECRET = config('BOT_SECRET', default='')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())
router = Router()


class Registration(StatesGroup):
    waiting_phone = State()


def main_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="👨‍👩‍👦 Farzandlarim"), KeyboardButton(text="📊 Bugungi davomad")],
            [KeyboardButton(text="📋 Davomad tarixi"), KeyboardButton(text="ℹ️ Yordam")],
        ],
        resize_keyboard=True
    )


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    # Check if already registered
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{API_URL}/api/v1/telegram/my-children/",
                headers={"X-Telegram-ID": str(message.from_user.id), "X-Bot-Secret": BOT_SECRET},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('children'):
                        children_text = "\n".join([
                            f"👦 <b>{c['name']}</b> - {c['class']} ({c['school']})"
                            for c in data['children']
                        ])
                        await message.answer(
                            f"✅ <b>Siz allaqachon ro'yxatdan o'tgansiz!</b>\n\n"
                            f"Farzandlaringiz:\n{children_text}",
                            parse_mode="HTML",
                            reply_markup=main_keyboard()
                        )
                        return
        except Exception:
            pass

    # Not registered - start registration
    welcome = (
        "👋 <b>Assalomu alaykum!</b>\n\n"
        "🏫 <b>Maktab Davomad tizimiga xush kelibsiz!</b>\n\n"
        "Bu bot orqali farzandingizning maktabga kelishi va\n"
        "ketishi haqida real vaqtda xabar olasiz.\n\n"
        "📱 <b>Ro'yxatdan o'tish uchun:</b>\n"
        "Quyidagi tugmani bosib telefon raqamingizni ulashing."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Telefon raqamimni ulashish", callback_data="share_phone")]
    ])
    await message.answer(welcome, reply_markup=kb, parse_mode="HTML")


@router.callback_query(F.data == "share_phone")
async def request_phone(callback: CallbackQuery, state: FSMContext):
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Raqamni ulashish", request_contact=True)]],
        resize_keyboard=True, one_time_keyboard=True
    )
    await callback.message.answer("📱 Quyidagi tugmani bosing:", reply_markup=kb)
    await state.set_state(Registration.waiting_phone)
    await callback.answer()


@router.message(Registration.waiting_phone, F.contact)
async def handle_contact(message: Message, state: FSMContext):
    phone = message.contact.phone_number
    if not phone.startswith('+'):
        phone = '+' + phone

    telegram_id = message.from_user.id
    username = message.from_user.username or ''
    first_name = message.from_user.first_name or ''

    await message.answer("⏳ Ma'lumotlar tekshirilmoqda...", reply_markup=ReplyKeyboardRemove())

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{API_URL}/api/v1/telegram/link-parent/",
                json={"phone": phone, "telegram_id": telegram_id, "username": username, "first_name": first_name},
                headers={"X-Bot-Secret": BOT_SECRET},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()

                if resp.status == 200:
                    children = data.get('children', [])
                    if children:
                        children_text = "\n".join([
                            f"✅ <b>{c['name']}</b> - {c['class']}"
                            for c in children
                        ])
                        await message.answer(
                            f"🎉 <b>Muvaffaqiyatli ro'yxatdan o'tdingiz!</b>\n\n"
                            f"👨‍👩‍👦 Farzandlaringiz:\n{children_text}\n\n"
                            f"Endi ular maktabga kelganda yoki ketganda\n"
                            f"sizga xabar yuboriladi! 🔔",
                            parse_mode="HTML",
                            reply_markup=main_keyboard()
                        )
                    else:
                        await message.answer(
                            f"✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n"
                            f"⚠️ Hozircha farzandingiz tizimda topilmadi.\n\n"
                            f"Maktab operatori sizni tizimga qo'shgach,\n"
                            f"xabar olasiz. 📩",
                            parse_mode="HTML",
                            reply_markup=main_keyboard()
                        )
                    await state.clear()
                else:
                    err = data.get('detail', 'Noma\'lum xatolik')
                    await message.answer(f"❌ <b>Xatolik:</b> {err}", parse_mode="HTML")
        except Exception as e:
            logger.error(f"Link parent error: {e}")
            await message.answer("❌ Server bilan bog'lanishda xatolik. Qayta urinib ko'ring.")


@router.message(F.text == "👨‍👩‍👦 Farzandlarim")
@router.message(Command("farzandlar"))
async def my_children(message: Message):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{API_URL}/api/v1/telegram/my-children/",
                headers={"X-Telegram-ID": str(message.from_user.id), "X-Bot-Secret": BOT_SECRET},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()
                children = data.get('children', [])

                if not children:
                    await message.answer(
                        "❌ Farzandlar topilmadi.\n/start bilan ro'yxatdan o'ting.",
                        reply_markup=main_keyboard()
                    )
                    return

                text = "👨‍👩‍👦 <b>Farzandlaringiz:</b>\n\n"
                status_map = {'present': '✅ Keldi', 'late': '⏰ Kech keldi', 'absent': '❌ Kelmadi', 'excused': '📋 Sababli'}

                for child in children:
                    status = status_map.get(child['today_status'], '❓ Ma\'lumot yo\'q')
                    text += (
                        f"👦 <b>{child['name']}</b>\n"
                        f"   📚 Sinf: {child['class']}\n"
                        f"   🏫 Maktab: {child['school']}\n"
                        f"   📊 Bugun: {status}\n"
                    )
                    if child.get('check_in'):
                        text += f"   ⏰ Keldi: {child['check_in']}\n"
                    if child.get('check_out'):
                        text += f"   🏠 Ketdi: {child['check_out']}\n"
                    text += "\n"

                await message.answer(text, parse_mode="HTML", reply_markup=main_keyboard())
        except Exception as e:
            logger.error(f"my_children error: {e}")
            await message.answer("❌ Ma'lumot olishda xatolik.", reply_markup=main_keyboard())


@router.message(F.text == "📊 Bugungi davomad")
async def today_attendance(message: Message):
    await my_children(message)


@router.message(F.text == "ℹ️ Yordam")
async def help_cmd(message: Message):
    help_text = (
        "📌 <b>Bot buyruqlari:</b>\n\n"
        "👨‍👩‍👦 Farzandlarim - Farzandlar ro'yxati\n"
        "📊 Bugungi davomad - Bugungi holat\n"
        "📋 Davomad tarixi - Oxirgi yozuvlar\n\n"
        "❓ <b>Savollar uchun:</b>\n"
        "Maktab administratsiyasi bilan bog'laning."
    )
    await message.answer(help_text, parse_mode="HTML", reply_markup=main_keyboard())


@router.message(F.text == "📋 Davomad tarixi")
async def attendance_history(message: Message):
    """Oxirgi 7 kunlik davomad tarixi - avval farzandni tanlash"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{API_URL}/api/v1/telegram/my-children/",
                headers={"X-Telegram-ID": str(message.from_user.id), "X-Bot-Secret": BOT_SECRET},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()
                children = data.get('children', [])
        except Exception as e:
            logger.error(f"attendance_history get_children error: {e}")
            await message.answer("❌ Ma'lumot olishda xatolik.", reply_markup=main_keyboard())
            return

    if not children:
        await message.answer("❌ Farzandlar topilmadi. /start bilan ro'yxatdan o'ting.", reply_markup=main_keyboard())
        return

    if len(children) == 1:
        # Only one child — show directly
        await _show_attendance_history(message, children[0]['id'])
        return

    # Multiple children — show selection keyboard
    buttons = [[InlineKeyboardButton(text=f"👦 {c['name']}", callback_data=f"hist_{c['id']}")] for c in children]
    kb = InlineKeyboardMarkup(inline_keyboard=buttons)
    await message.answer("📋 Qaysi farzandning tarixini ko'rmoqchisiz?", reply_markup=kb)


async def _show_attendance_history(message, student_id: str):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{API_URL}/api/v1/telegram/attendance-history/",
                params={"student_id": student_id},
                headers={"X-Telegram-ID": str(message.from_user.id), "X-Bot-Secret": BOT_SECRET},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                data = await resp.json()
        except Exception as e:
            logger.error(f"attendance history fetch error: {e}")
            await message.answer("❌ Ma'lumot olishda xatolik.", reply_markup=main_keyboard())
            return

    history = data.get('history', [])
    student_name = data.get('student', '')
    if not history:
        await message.answer(f"📋 <b>{student_name}</b>\n\nOxirgi 7 kunda ma'lumot yo'q.", parse_mode="HTML", reply_markup=main_keyboard())
        return

    text = f"📋 <b>{student_name} — oxirgi 7 kun:</b>\n\n"
    for r in history:
        text += f"📅 {r['date']}: {r['status']}"
        if r.get('check_in'):
            text += f" | ⏰ {r['check_in']}"
        if r.get('check_out'):
            text += f" → 🏠 {r['check_out']}"
        text += "\n"
    await message.answer(text, parse_mode="HTML", reply_markup=main_keyboard())


@router.callback_query(F.data.startswith("hist_"))
async def history_child_selected(callback: CallbackQuery):
    student_id = callback.data.replace("hist_", "")
    await callback.answer()
    await _show_attendance_history(callback.message, student_id)


dp.include_router(router)


async def main():
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN muhit o'zgaruvchisi topilmadi!")
        return
    logger.info("Ota-ona boti ishga tushmoqda...")
    await dp.start_polling(bot, skip_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
