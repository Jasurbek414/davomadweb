"""
Texnik Topshiriq PDF generatori
Maktab Davomad Face ID Tizimi
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os
import datetime

OUTPUT_FILE = "Maktab_Davomad_FaceID_TZ.pdf"

# Colors
PRIMARY = colors.HexColor('#7C3AED')
PRIMARY_LIGHT = colors.HexColor('#EDE9FE')
DARK = colors.HexColor('#1E293B')
GRAY = colors.HexColor('#64748B')
LIGHT_GRAY = colors.HexColor('#F8FAFC')
SUCCESS = colors.HexColor('#10B981')
WARNING = colors.HexColor('#F59E0B')
DANGER = colors.HexColor('#EF4444')
WHITE = colors.white


def create_styles():
    styles = getSampleStyleSheet()

    custom = {
        'Title': ParagraphStyle('Title', fontSize=24, textColor=PRIMARY, alignment=TA_CENTER,
                                 spaceAfter=6, fontName='Helvetica-Bold'),
        'Subtitle': ParagraphStyle('Subtitle', fontSize=14, textColor=DARK, alignment=TA_CENTER,
                                    spaceAfter=20, fontName='Helvetica'),
        'H1': ParagraphStyle('H1', fontSize=16, textColor=WHITE, spaceAfter=8, spaceBefore=16,
                              fontName='Helvetica-Bold', leftIndent=0),
        'H2': ParagraphStyle('H2', fontSize=13, textColor=PRIMARY, spaceAfter=6, spaceBefore=12,
                              fontName='Helvetica-Bold'),
        'H3': ParagraphStyle('H3', fontSize=11, textColor=DARK, spaceAfter=4, spaceBefore=8,
                              fontName='Helvetica-Bold'),
        'Body': ParagraphStyle('Body', fontSize=10, textColor=DARK, spaceAfter=4,
                                fontName='Helvetica', alignment=TA_JUSTIFY, leading=15),
        'Bullet': ParagraphStyle('Bullet', fontSize=10, textColor=DARK, spaceAfter=3,
                                  fontName='Helvetica', leftIndent=15, bulletIndent=5),
        'Code': ParagraphStyle('Code', fontSize=9, textColor=colors.HexColor('#1E293B'),
                                fontName='Courier', backColor=colors.HexColor('#F1F5F9'),
                                leftIndent=10, rightIndent=10, spaceAfter=4),
        'Caption': ParagraphStyle('Caption', fontSize=8, textColor=GRAY, alignment=TA_CENTER,
                                   fontName='Helvetica-Oblique'),
    }
    return custom


def section_header(text, styles):
    """Section header with background"""
    data = [[Paragraph(text, styles['H1'])]]
    t = Table(data, colWidths=[17*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PRIMARY),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [6]),
    ]))
    return t


def info_table(rows, styles, col_widths=None):
    """Styled info table"""
    if col_widths is None:
        col_widths = [5*cm, 12*cm]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,0), (0,-1), DARK),
        ('TEXTCOLOR', (1,0), (1,-1), DARK),
        ('BACKGROUND', (0,0), (0,-1), PRIMARY_LIGHT),
        ('ROWBACKGROUNDS', (1,0), (1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return t


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title="Maktab Davomad Face ID Tizimi - Texnik Topshiriq",
        author="Davomad Bot Loyihasi",
    )

    styles = create_styles()
    story = []
    W = 17 * cm  # content width

    # ============= TITLE PAGE =============
    story.append(Spacer(1, 2*cm))

    # Logo box
    logo_data = [[Paragraph("🏫", ParagraphStyle('Logo', fontSize=40, alignment=TA_CENTER))]]
    logo_t = Table(logo_data, colWidths=[W])
    logo_t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(logo_t)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("MAKTAB DAVOMAD", styles['Title']))
    story.append(Paragraph("Face ID Nazorat Tizimi", styles['Subtitle']))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("TEXNIK TOPSHIRIQ", ParagraphStyle(
        'TZ', fontSize=18, textColor=DARK, alignment=TA_CENTER,
        fontName='Helvetica-Bold', spaceAfter=20
    )))
    story.append(HRFlowable(width=W, thickness=2, color=PRIMARY))
    story.append(Spacer(1, 0.5*cm))

    # Meta table
    meta = [
        ['Hujjat nomi:', 'Maktab Davomad Face ID Tizimi - TZ'],
        ['Versiya:', '1.0'],
        ['Sana:', datetime.date.today().strftime('%d.%m.%Y')],
        ['Platforma:', 'Web + Telegram Bot + Mobile'],
        ['Arxitektura:', 'Yagona markazlashgan server'],
        ['Til:', "O'zbek tili"],
    ]
    story.append(info_table(meta, styles))
    story.append(Spacer(1, 1*cm))

    story.append(Paragraph(
        "Bu hujjat Maktab Davomad Face ID tizimining texnik topshirig'i bo'lib, "
        "tizimning barcha komponentlari, arxitekturasi, API endpointlari, "
        "ma'lumotlar bazasi sxemasi va integratsiya talablarini batafsil belgilab beradi.",
        styles['Body']
    ))
    story.append(PageBreak())

    # ============= TABLE OF CONTENTS =============
    story.append(section_header("MUNDARIJA", styles))
    story.append(Spacer(1, 0.3*cm))

    toc_items = [
        ("1. Loyiha haqida umumiy ma'lumot", "3"),
        ("2. Texnik stek", "4"),
        ("3. Tizim arxitekturasi", "5"),
        ("4. Foydalanuvchi rollari va vakolatlari", "6"),
        ("5. Ma'lumotlar bazasi sxemasi", "8"),
        ("6. API endpointlari", "11"),
        ("7. Face ID qurilma integratsiyasi", "14"),
        ("8. Telegram botlar", "16"),
        ("9. WebSocket (real-time)", "17"),
        ("10. Xavfsizlik talablari", "18"),
        ("11. Deployment va infra", "19"),
        ("12. Rivojlanish bosqichlari", "20"),
    ]
    for title, page in toc_items:
        toc_row_data = [[Paragraph(title, styles['Body']),
                          Paragraph(page, ParagraphStyle('PageNum', fontSize=10, alignment=TA_CENTER))]]
        toc_t = Table(toc_row_data, colWidths=[14*cm, 3*cm])
        toc_t.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (0,0), 0.3, colors.HexColor('#E2E8F0'), 1, (4, 1, 0)),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(toc_t)
    story.append(PageBreak())

    # ============= SECTION 1: OVERVIEW =============
    story.append(section_header("1. LOYIHA HAQIDA UMUMIY MA'LUMOT", styles))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("1.1 Maqsad va vazifalar", styles['H2']))
    story.append(Paragraph(
        "<b>Maktab Davomad Face ID Tizimi</b> — maktab o'quvchilarining "
        "davomatini Face ID qurilmalar orqali avtomatik ravishda qayd etuvchi, "
        "ota-onalarga real vaqtda xabarnoma yuboruvchi va maktab rahbariyatiga "
        "to'liq tahliliy ma'lumot taqdim etuvchi yagona markazlashgan platforma.",
        styles['Body']
    ))

    story.append(Paragraph("Asosiy vazifalar:", styles['H3']))
    tasks = [
        "Face ID qurilmalar orqali o'quvchilarning kelishi va ketishini avtomatik qayd etish",
        "Ota-onalarga Telegram bot orqali real vaqtda xabarnoma yuborish",
        "Maktab rahbariyatiga kunlik, haftalik va oylik hisobotlar taqdim etish",
        "Barcha maktablarni yagona markazlashgan servera ulash",
        "Ko'p bosqichli rol-asosli kirish nazoratini ta'minlash",
        "Face ID qurilmalar bilan ikki tomonlama integratsiya (push/pull)",
    ]
    for task in tasks:
        story.append(Paragraph(f"• {task}", styles['Bullet']))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("1.2 Asosiy prinsiplar", styles['H2']))

    principles = [
        ["Markazlashgan arxitektura", "Barcha maktablar bitta markaziy serverga ulangan. Lokal server yo'q."],
        ["Real-time", "WebSocket orqali tezkor yangilanishlar. Xabarlar 1-3 soniya ichida yetkaziladi."],
        ["Ikki tomonlama integratsiya", "Qurilmaga ma'lumot yuklash va qurilmadan log olish imkoniyati."],
        ["Modul arxitektura", "Har bir komponent mustaqil. Yangi qurilma brendini osongina qo'shish mumkin."],
        ["Ko'p rol qo'llab-quvvatlash", "Bir foydalanuvchi bir vaqtda bir nechta rolga ega bo'lishi mumkin."],
    ]
    for p in principles:
        p[0] = Paragraph(f"<b>{p[0]}</b>", styles['Body'])
        p[1] = Paragraph(p[1], styles['Body'])
    story.append(info_table(principles, styles))
    story.append(PageBreak())

    # ============= SECTION 2: TECH STACK =============
    story.append(section_header("2. TEXNIK STEK", styles))
    story.append(Spacer(1, 0.3*cm))

    tech_categories = [
        ("Backend", [
            ("Framework", "Django 4.2 + Django REST Framework"),
            ("Ma'lumotlar bazasi", "PostgreSQL 15"),
            ("Cache va Navbat", "Redis 7 + Celery 5"),
            ("WebSocket", "Django Channels 4 + Daphne"),
            ("Autentifikatsiya", "JWT (SimpleJWT)"),
            ("API Hujjati", "drf-spectacular (Swagger/Redoc)"),
            ("Konteyner", "Docker + docker-compose"),
        ]),
        ("Frontend", [
            ("Framework", "React 19 + Vite 8"),
            ("Stilizatsiya", "Tailwind CSS 4"),
            ("State management", "Redux Toolkit"),
            ("Routing", "React Router DOM 7"),
            ("HTTP klient", "Axios"),
            ("Grafiklar", "Recharts"),
            ("Formlar", "React Hook Form + Zod"),
        ]),
        ("Telegram Botlar", [
            ("Kutubxona", "aiogram 3.x (Python)"),
            ("Ota-ona boti", "Real-time xabarnomalar + davomad ko'rish"),
            ("Boshqaruv boti", "Hisobotlar + qurilma holati + ogohlantirishlar"),
        ]),
        ("Qurilma Integratsiyasi", [
            ("Hikvision", "ISAPI REST protokoli (HTTP Digest auth)"),
            ("Dahua", "HTTP API + CGI protokoli"),
            ("ZKTeco", "HTTP/TCP protokoli"),
            ("Arxitektura", "Adapter pattern - yangi brendlarni osongina qo'shish"),
        ]),
    ]

    for category, items in tech_categories:
        story.append(Paragraph(f"2.{tech_categories.index((category, items))+1} {category}", styles['H2']))
        rows = [[Paragraph(k, ParagraphStyle('TK', fontSize=10, fontName='Helvetica-Bold', textColor=DARK)),
                  Paragraph(v, styles['Body'])] for k, v in items]
        t = Table(rows, colWidths=[5*cm, 12*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), PRIMARY_LIGHT),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.2*cm))
    story.append(PageBreak())

    # ============= SECTION 3: ARCHITECTURE =============
    story.append(section_header("3. TIZIM ARXITEKTURASI", styles))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("3.1 Umumiy arxitektura sxemasi", styles['H2']))

    arch_text = """
                    ┌─────────────────────────────────────┐
                    │     MARKAZIY SERVER                 │
                    │  ┌─────────────────────────────┐   │
                    │  │  Django Backend (REST + WS)  │   │
                    │  └──────────────┬──────────────┘   │
                    │                 │                   │
                    │  ┌──────────────┼──────────────┐   │
                    │  │              │              │   │
                    │  ▼              ▼              ▼   │
                    │ [PostgreSQL] [Redis]      [Celery]  │
                    └─────────────────────────────────────┘
                           │          │          │
                    ┌──────┘   ┌──────┘   ┌──────┘
                    ▼          ▼          ▼
              [React Web]  [Ota-ona]  [Boshqaruv]
              [Dashboard]  [Bot]      [Bot]

    [Face ID Qurilmalar] ─────────────────────────────────►
    (Hikvision/Dahua/ZKTeco)   Xom loglar (HTTP push/pull)
    """
    story.append(Paragraph(arch_text.replace('\n', '<br/>'), styles['Code']))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("3.2 Ma'lumotlar oqimi", styles['H2']))

    flow_steps = [
        ("1", "Face ID qurilma", "O'quvchi yuzini tanib, event log yaratadi"),
        ("2", "Raw log", "Qurilma raw logni markaziy serverga yuboradi yoki server pull qiladi"),
        ("3", "Deduplication", "Server DeviceRawLog jadvalida takrorlanishni tekshiradi"),
        ("4", "Student mapping", "employee_no → student_id orqali o'quvchi aniqlanadi"),
        ("5", "Attendance engine", "Check-in/check-out, kechikish hisob-kitob qilinadi"),
        ("6", "AttendanceRecord", "Ma'lumotlar bazasiga saqlandi"),
        ("7", "Notifications", "Ota-onaga Telegram xabar yuboriladi"),
        ("8", "Dashboard update", "WebSocket orqali real-time yangilanish"),
    ]

    flow_data = [["#", "Bosqich", "Tavsif"]]
    for step, name, desc in flow_steps:
        flow_data.append([
            Paragraph(step, ParagraphStyle('StepNum', fontSize=11, fontName='Helvetica-Bold',
                                            textColor=WHITE, alignment=TA_CENTER)),
            Paragraph(f"<b>{name}</b>", styles['Body']),
            Paragraph(desc, styles['Body'])
        ])

    flow_t = Table(flow_data, colWidths=[1.5*cm, 4*cm, 11.5*cm])
    flow_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BACKGROUND', (0,1), (0,-1), PRIMARY),
        ('ROWBACKGROUNDS', (1,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(flow_t)
    story.append(PageBreak())

    # ============= SECTION 4: ROLES =============
    story.append(section_header("4. FOYDALANUVCHI ROLLARI VA VAKOLATLARI", styles))
    story.append(Spacer(1, 0.3*cm))

    roles_data = [
        ["Rol", "Kirish doirasi", "Asosiy vakolatlar"],
        ["Super Admin", "Butun tizim", "Barcha ma'lumotlar, rol tayinlash, tizim sozlamalari, audit"],
        ["Viloyat Direktori", "O'z viloyati", "Viloyat statistikasi, tumanlar va maktablar nazorati"],
        ["Tuman Direktori", "O'z tumani", "Tuman tahlili, maktablar nazorati"],
        ["Maktab Direktori", "O'z maktabi", "Sinflar, o'quvchilar, qurilmalar, hisobotlar"],
        ["Operator/IT", "O'z maktabi", "O'quvchi ro'yxatdan o'tkazish, qurilma boshqaruvi, ota-ona ulanishi"],
        ["O'qituvchi", "O'z sinflar", "O'z sinfi davomadini ko'rish"],
        ["Ota-ona", "Faqat o'z farzandlari", "Xabarnomalar, davomad tarixi"],
    ]

    roles_t = Table(roles_data, colWidths=[3.5*cm, 3.5*cm, 10*cm])
    roles_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(roles_t)

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("4.1 Muhim qoida: Ko'p rol", styles['H2']))
    story.append(Paragraph(
        "Bir foydalanuvchi bir vaqtda bir nechta rolga ega bo'lishi mumkin. "
        "Masalan, maktab direktori ayni vaqtda o'z farzandi uchun ota-ona bo'lishi mumkin. "
        "Har bir rol ma'lum bir tashkilot doirasiga (viloyat, tuman, maktab) bog'langan.",
        styles['Body']
    ))
    story.append(PageBreak())

    # ============= SECTION 5: DATABASE =============
    story.append(section_header("5. MA'LUMOTLAR BAZASI SXEMASI", styles))
    story.append(Spacer(1, 0.3*cm))

    tables_info = [
        ("accounts.User", "Barcha foydalanuvchilar (telefon, parol, JWT auth)", [
            "id (UUID, PK)", "phone (unique)", "first_name, last_name, middle_name",
            "is_active, is_staff, is_superuser", "created_at, updated_at"
        ]),
        ("accounts.Role", "Rol ta'riflari", [
            "name (choices: superadmin, region_director, ...)", "description"
        ]),
        ("accounts.UserRole", "Foydalanuvchi-rol bog'liq (scope bilan)", [
            "user (FK→User)", "role (FK→Role)", "region (FK→Region, null)",
            "district (FK→District, null)", "school (FK→School, null)",
            "is_active", "assigned_by (FK→User)"
        ]),
        ("organizations.Region", "Viloyatlar", ["name", "code (unique)", "is_active"]),
        ("organizations.District", "Tumanlar", ["region (FK→Region)", "name", "code", "is_active"]),
        ("organizations.School", "Maktablar", [
            "district (FK→District)", "name", "school_number",
            "address, phone, email", "director_name", "is_active"
        ]),
        ("organizations.Class", "Sinflar", [
            "school (FK→School)", "name", "grade (1-11)", "section (A, B, C)",
            "academic_year", "teacher (FK→Teacher, null)", "is_active"
        ]),
        ("students.Student", "O'quvchilar", [
            "id (UUID, PK)", "school (FK→School)", "class_ref (FK→Class)",
            "first_name, last_name, middle_name", "birth_date", "gender (M/F)",
            "student_id (unique)", "photo", "is_active"
        ]),
        ("students.Teacher", "O'qituvchilar", [
            "id (UUID, PK)", "user (FK→User, null)", "school (FK→School)",
            "first_name, last_name", "subject", "employee_id (unique)"
        ]),
        ("students.Parent", "Ota-onalar", [
            "id (UUID, PK)", "user (FK→User, null)", "phone (unique)",
            "telegram_id (unique, null)", "is_registered"
        ]),
        ("students.ParentStudentLink", "Ota-ona ↔ O'quvchi bog'liq", [
            "parent (FK→Parent, null - pending holat)", "student (FK→Student)",
            "parent_phone", "relationship (father/mother/guardian)",
            "status (pending/active/rejected)", "activated_at"
        ]),
        ("devices.Device", "Face ID qurilmalar", [
            "school (FK→School)", "name", "brand (hikvision/dahua/zkteco)",
            "serial_number (unique)", "ip_address", "port",
            "username, password", "location", "status", "last_seen"
        ]),
        ("devices.DeviceSyncLog", "Sinxronizatsiya loglari", [
            "device (FK→Device)", "sync_type (push/pull)", "status",
            "total_records, synced_records, failed_records",
            "error_message", "started_at, completed_at"
        ]),
        ("devices.DeviceRawLog", "Qurilmadan xom loglar", [
            "device (FK→Device)", "employee_no", "event_time",
            "event_type", "raw_data (JSON)", "processed",
            "UNIQUE: (device, employee_no, event_time)"
        ]),
        ("attendance.AttendanceRecord", "Qayta ishlangan davomad", [
            "student (FK→Student)", "date",
            "check_in (DateTime)", "check_out (DateTime)",
            "check_in_device (FK→Device)", "check_out_device (FK→Device)",
            "status (present/late/absent/excused)",
            "late_minutes", "raw_log (FK→DeviceRawLog)",
            "UNIQUE: (student, date)"
        ]),
        ("notifications.TelegramAccount", "Telegram akkountlar", [
            "user (FK→User)", "telegram_id (unique)", "username", "phone", "is_active"
        ]),
        ("notifications.Notification", "Xabarnomalar", [
            "recipient (FK→User)", "telegram_id", "notification_type",
            "title, message", "data (JSON)", "status", "is_read"
        ]),
        ("accounts.AuditLog", "Audit loglari", [
            "user (FK→User)", "action (create/update/delete/login)",
            "model_name", "object_id", "changes (JSON)",
            "ip_address", "created_at"
        ]),
    ]

    for table_name, description, fields in tables_info:
        story.append(Paragraph(f"<b>{table_name}</b>", styles['H3']))
        story.append(Paragraph(description, styles['Body']))
        fields_text = " | ".join(f"<font color='#7C3AED'>{f}</font>" for f in fields)
        story.append(Paragraph(fields_text, ParagraphStyle(
            'Fields', fontSize=8.5, fontName='Courier',
            backColor=colors.HexColor('#F8FAFC'), leftIndent=10, spaceAfter=6,
            borderPad=4
        )))
    story.append(PageBreak())

    # ============= SECTION 6: API =============
    story.append(section_header("6. API ENDPOINTLARI", styles))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("Base URL: /api/v1/", styles['H2']))

    api_sections = [
        ("Autentifikatsiya", [
            ("POST", "/auth/login/", "Kirish → {access, refresh, user}", "Hammaga"),
            ("POST", "/auth/refresh/", "Token yangilash", "Hammaga"),
            ("POST", "/auth/logout/", "Chiqish (token blacklist)", "Kirgan"),
            ("GET/PATCH", "/auth/me/", "Profil ko'rish/tahrirlash", "Kirgan"),
            ("POST", "/auth/change-password/", "Parol o'zgartirish", "Kirgan"),
        ]),
        ("Foydalanuvchilar", [
            ("GET/POST", "/auth/users/", "Barcha foydalanuvchilar", "Operator+"),
            ("GET/PATCH", "/auth/users/{id}/", "Foydalanuvchi batafsil", "Operator+"),
            ("GET/POST", "/auth/users/{id}/roles/", "Rollarni boshqarish", "SuperAdmin"),
            ("POST", "/auth/users/{id}/deactivate/", "Deaktivlash", "SuperAdmin"),
            ("GET", "/auth/audit-logs/", "Audit loglari", "SuperAdmin"),
        ]),
        ("Tashkilotlar", [
            ("GET/POST", "/regions/", "Viloyatlar CRUD", "SuperAdmin"),
            ("GET/POST", "/districts/", "Tumanlar CRUD", "SuperAdmin"),
            ("GET/POST", "/schools/", "Maktablar CRUD", "Direktor+"),
            ("GET/POST", "/classes/", "Sinflar CRUD", "Operator+"),
        ]),
        ("O'quvchilar", [
            ("GET/POST", "/students/", "O'quvchilar ro'yxati/yaratish", "Operator+"),
            ("GET/PATCH/DELETE", "/students/{id}/", "O'quvchi batafsil", "Operator+"),
            ("GET", "/students/{id}/attendance/", "O'quvchi davomadi", "O'qituvchi+"),
            ("GET/POST", "/teachers/", "O'qituvchilar CRUD", "Operator+"),
            ("GET/POST", "/parents/", "Ota-onalar ro'yxati", "Operator+"),
            ("GET/POST", "/parent-links/", "Ota-ona bog'liq", "Operator+"),
        ]),
        ("Qurilmalar", [
            ("GET/POST", "/devices/", "Qurilmalar CRUD", "Operator+"),
            ("GET", "/devices/{id}/status/", "Qurilma holati", "Operator+"),
            ("POST", "/devices/{id}/sync/", "O'quvchilarni qurilmaga yuklash", "Operator+"),
            ("POST", "/devices/{id}/pull-logs/", "Qurilmadan log olish", "Operator+"),
            ("GET", "/devices/{id}/sync-logs/", "Sinxronizatsiya loglari", "Operator+"),
            ("GET", "/raw-logs/", "Xom loglar", "Direktor+"),
        ]),
        ("Davomad", [
            ("GET", "/attendance/", "Davomad yozuvlari (filter bilan)", "O'qituvchi+"),
            ("GET", "/attendance/today/", "Bugungi davomad", "O'qituvchi+"),
            ("GET", "/attendance/statistics/", "Statistika", "O'qituvchi+"),
            ("PATCH", "/attendance/{id}/", "Davomadni tahrirlash", "Operator+"),
        ]),
        ("Hisobotlar", [
            ("GET", "/reports/daily/", "Kunlik hisobot (?date=YYYY-MM-DD)", "Hammaga"),
            ("GET", "/reports/weekly/", "Haftalik hisobot", "Hammaga"),
            ("GET", "/reports/monthly/", "Oylik hisobot (?year=&month=)", "Hammaga"),
            ("GET", "/reports/student/{id}/", "O'quvchi tarixi", "Hammaga"),
            ("GET", "/reports/overview/", "Dashboard umumiy statistika", "Hammaga"),
        ]),
        ("Telegram Bot API", [
            ("POST", "/telegram/link-parent/", "Ota-onani bog'lash (bot dan)", "Bot Secret"),
            ("GET", "/telegram/my-children/", "Farzandlar ro'yxati (bot dan)", "Bot Secret"),
        ]),
    ]

    for section_name, endpoints in api_sections:
        story.append(Paragraph(section_name, styles['H2']))

        ep_data = [["Metod", "Endpoint", "Tavsif", "Ruxsat"]]
        for method, path, desc, perm in endpoints:
            method_colors = {
                'GET': colors.HexColor('#10B981'),
                'POST': colors.HexColor('#3B82F6'),
                'PATCH': colors.HexColor('#F59E0B'),
                'PUT': colors.HexColor('#8B5CF6'),
                'DELETE': colors.HexColor('#EF4444'),
                'GET/POST': colors.HexColor('#10B981'),
                'GET/PATCH': colors.HexColor('#10B981'),
                'GET/PATCH/DELETE': colors.HexColor('#10B981'),
            }
            mc = method_colors.get(method, PRIMARY)
            ep_data.append([
                Paragraph(f"<b>{method}</b>", ParagraphStyle('Method', fontSize=8, fontName='Helvetica-Bold',
                                                               textColor=mc, alignment=TA_CENTER)),
                Paragraph(path, ParagraphStyle('Path', fontSize=8, fontName='Courier', textColor=DARK)),
                Paragraph(desc, ParagraphStyle('Desc', fontSize=8.5, fontName='Helvetica', textColor=DARK)),
                Paragraph(perm, ParagraphStyle('Perm', fontSize=8, fontName='Helvetica', textColor=GRAY)),
            ])

        ep_t = Table(ep_data, colWidths=[2.5*cm, 5*cm, 6.5*cm, 3*cm])
        ep_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(ep_t)
        story.append(Spacer(1, 0.2*cm))
    story.append(PageBreak())

    # ============= SECTION 7: DEVICE INTEGRATION =============
    story.append(section_header("7. FACE ID QURILMA INTEGRATSIYASI", styles))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("7.1 Adapter pattern arxitekturasi", styles['H2']))
    story.append(Paragraph(
        "Har bir Face ID qurilma brendi uchun alohida adapter sinfi yaratiladi. "
        "Barcha adapterlar BaseDeviceAdapter abstrakt sinfidan meros oladi. "
        "Yangi brend qo'shish uchun faqat yangi adapter sinfi yaratib, "
        "factory.py ga ro'yxatdan o'tkazish kifoya.",
        styles['Body']
    ))

    story.append(Paragraph("7.2 Qo'llab-quvvatlanadigan brendlar", styles['H2']))
    brands_data = [
        ["Brend", "Protokol", "Autentifikatsiya", "Holat"],
        ["Hikvision", "ISAPI REST", "HTTP Digest Auth", "✅ Tayyor"],
        ["Dahua", "HTTP/CGI", "HTTP Digest Auth", "✅ Tayyor"],
        ["ZKTeco", "HTTP REST", "Cookie/Token", "✅ Tayyor"],
        ["Anviz", "HTTP REST", "Cookie/Token", "✅ Tayyor"],
        ["Boshqa", "Sozlanuvchi", "Sozlanuvchi", "🔧 Kelajak"],
    ]
    brands_t = Table(brands_data, colWidths=[3.5*cm, 4*cm, 5.5*cm, 4*cm])
    brands_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(brands_t)

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("7.3 Adapter metodlari", styles['H2']))
    methods = [
        ("connect()", "Qurilmaga ulanish (HTTP/TCP)"),
        ("get_device_info()", "Model, firmware, serial raqam"),
        ("get_users()", "Qurilmadagi barcha foydalanuvchilar"),
        ("add_user(data)", "Yangi foydalanuvchi qo'shish"),
        ("delete_user(id)", "Foydalanuvchi o'chirish"),
        ("upload_face(id, image)", "Yuz rasmini yuklash"),
        ("get_raw_logs(start, end)", "Ma'lum vaqt oralig'idagi loglar"),
        ("get_status()", "Online/offline holat tekshirish"),
    ]
    for method, desc in methods:
        story.append(Paragraph(
            f"• <font name='Courier' color='#7C3AED'>{method}</font> — {desc}",
            styles['Bullet']
        ))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("7.4 Sinxronizatsiya jarayoni", styles['H2']))

    sync_flow = [
        ["Push (O'quvchilarni qurilmaga yuklash)", "Pull (Qurilmadan log olish)"],
        [
            "1. Operator «Yuklash» tugmasini bosadi\n"
            "2. Celery task yaratiladi\n"
            "3. Qurilmaga ulaniladi\n"
            "4. Barcha aktiv o'quvchilar iteratsiya qilinadi\n"
            "5. Har bir o'quvchi uchun add_user() + upload_face()\n"
            "6. Natija DeviceSyncLog da saqlanadi\n"
            "7. WebSocket orqali UI yangilanadi",

            "1. Operator «Log olish» tugmasini bosadi\n"
            "2. Celery task yaratiladi\n"
            "3. Qurilmaga ulaniladi\n"
            "4. get_raw_logs(last_24h) chaqiriladi\n"
            "5. Har bir log DeviceRawLog ga saqlanadi (takror yo'q)\n"
            "6. process_raw_logs task ishga tushadi\n"
            "7. AttendanceRecord yaratiladi\n"
            "8. Ota-onaga Telegram xabar"
        ]
    ]
    sync_t = Table(sync_flow, colWidths=[8.5*cm, 8.5*cm])
    sync_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,1), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,1), (-1,-1), LIGHT_GRAY),
    ]))
    story.append(sync_t)
    story.append(PageBreak())

    # ============= SECTION 8: BOTS =============
    story.append(section_header("8. TELEGRAM BOTLAR", styles))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("8.1 Ota-ona boti", styles['H2']))
    story.append(Paragraph(
        "Ota-onalar uchun Telegram boti. O'quvchi maktabga kelganda yoki "
        "ketganda real vaqtda xabar yuboradi.",
        styles['Body']
    ))

    parent_commands = [
        ["/start", "Ro'yxatdan o'tish (telefon raqami orqali avtomatik bog'lanish)"],
        ["Farzandlarim", "Barcha farzandlar ro'yxati va bugungi holat"],
        ["Bugungi davomad", "Bugungi davomad statistikasi"],
        ["Davomad tarixi", "Oxirgi 30 kunlik tarix"],
        ["Yordam", "Bot buyruqlari"],
    ]
    for cmd, desc in parent_commands:
        story.append(Paragraph(
            f"• <font name='Courier' color='#7C3AED'>{cmd}</font> — {desc}",
            styles['Bullet']
        ))

    story.append(Paragraph("8.2 Ota-ona auto-link jarayoni", styles['H3']))
    story.append(Paragraph(
        "1. Operator o'quvchi yaratishda ota-ona telefon raqamini kiritadi → "
        "ParentStudentLink (status=pending) yaratiladi<br/>"
        "2. Ota-ona Telegram botga /start bosadi<br/>"
        "3. Telefon raqamini ulashadi<br/>"
        "4. Bot backend /telegram/link-parent/ ga yuboradi<br/>"
        "5. Backend pending linkni active qiladi<br/>"
        "6. Xabarnomalar yoqiladi ✅",
        styles['Body']
    ))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("8.3 Boshqaruv boti", styles['H2']))
    story.append(Paragraph(
        "Maktab rahbarlari va operatorlar uchun. Tezkor statistika, "
        "qurilma holati va kunlik hisobotlar.",
        styles['Body']
    ))

    mgmt_commands = [
        ["Bugungi hisobot", "Bugungi present/late/absent statistikasi"],
        ["Qurilmalar", "Online/offline qurilmalar holati"],
        ["Haftalik trend", "7 kunlik davomad grafikasi"],
        ["Ogohlantirishlar", "Muhim tizim ogohlantirishlari"],
    ]
    for cmd, desc in mgmt_commands:
        story.append(Paragraph(f"• <b>{cmd}</b> — {desc}", styles['Bullet']))
    story.append(PageBreak())

    # ============= SECTION 9: WEBSOCKET =============
    story.append(section_header("9. WEBSOCKET (REAL-TIME)", styles))
    story.append(Spacer(1, 0.3*cm))

    ws_data = [
        ["Endpoint", "Maqsad", "Yuboriluvchi eventlar"],
        ["ws://server/ws/attendance/", "Real-time davomad feed", "attendance_update"],
        ["ws://server/ws/devices/", "Qurilma sinxronizatsiya holati", "device_event, sync_started, sync_completed"],
    ]
    ws_t = Table(ws_data, colWidths=[5*cm, 5*cm, 7*cm])
    ws_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(ws_t)
    story.append(PageBreak())

    # ============= SECTION 10: SECURITY =============
    story.append(section_header("10. XAVFSIZLIK TALABLARI", styles))
    story.append(Spacer(1, 0.3*cm))

    security_items = [
        ("JWT Autentifikatsiya", "Access token (60 daqiqa) + Refresh token (7 kun). Chiqishda blacklist."),
        ("Rol-asosli kirish", "Har bir endpoint uchun minimal zarur ruxsat. Boshqa ma'lumotlar ko'rinmaydi."),
        ("Audit logging", "Barcha muhim amallar (create/update/delete/login) AuditLog da qayd etiladi."),
        ("Bot xavfsizligi", "Bot→Backend so'rovlar X-Bot-Secret header orqali tekshiriladi."),
        ("Qurilma xavfsizligi", "Qurilma parollari shifrlangan. VPN yoki IP allowlist tavsiya etiladi."),
        ("Ma'lumot izolyatsiyasi", "Har bir foydalanuvchi faqat o'z doirasidagi ma'lumotlarni ko'radi."),
        ("Parol validatsiya", "Minimal 8 belgi. Kuchli parol tavsiya etiladi."),
    ]

    sec_data = [[Paragraph(f"<b>{k}</b>", styles['Body']), Paragraph(v, styles['Body'])]
                for k, v in security_items]
    sec_t = Table(sec_data, colWidths=[5*cm, 12*cm])
    sec_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), PRIMARY_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (1,0), (1,-1), [WHITE, LIGHT_GRAY]),
    ]))
    story.append(sec_t)
    story.append(PageBreak())

    # ============= SECTION 11: DEPLOYMENT =============
    story.append(section_header("11. DEPLOYMENT VA INFRA", styles))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("11.1 Docker Compose xizmatlar", styles['H2']))
    services_data = [
        ["Xizmat", "Port", "Tavsif"],
        ["postgres", "5432", "PostgreSQL 15 - asosiy ma'lumotlar bazasi"],
        ["redis", "6379", "Cache va Celery broker"],
        ["backend", "8000", "Daphne (ASGI) - HTTP + WebSocket"],
        ["celery", "-", "Celery worker (async tasks)"],
        ["celery-beat", "-", "Celery beat (scheduled tasks)"],
        ["parent-bot", "-", "Ota-ona Telegram boti"],
        ["management-bot", "-", "Boshqaruv Telegram boti"],
        ["frontend", "80", "Nginx - React production build"],
    ]
    svc_t = Table(services_data, colWidths=[4*cm, 3*cm, 10*cm])
    svc_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(svc_t)

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("11.2 Tez ishga tushirish", styles['H2']))

    quick_start = """# 1. Loyihani klonlash
git clone <repo_url> && cd davomad_bot

# 2. Muhit o'zgaruvchilarini sozlash
cp .env.example .env
# .env faylini tahrirlang (DB, Telegram tokens, SECRET_KEY)

# 3. Docker bilan ishga tushirish
docker-compose up -d

# 4. Superadmin yaratish (avtomatik ham qilinadi)
make superadmin

# 5. Kirish: http://localhost
# Login: +998901234567 | Parol: Admin1234!
# API docs: http://localhost:8000/api/docs/"""

    story.append(Paragraph(quick_start.replace('\n', '<br/>'), styles['Code']))
    story.append(PageBreak())

    # ============= SECTION 12: PHASES =============
    story.append(section_header("12. RIVOJLANISH BOSQICHLARI", styles))
    story.append(Spacer(1, 0.3*cm))

    phases = [
        ("1-bosqich", "Asosiy tuzilma", [
            "Loyiha bootstrap, Docker muhit",
            "Django sozlamalari va barcha applar",
            "Autentifikatsiya (JWT) va rol tizimi",
            "React frontend bazasi",
        ]),
        ("2-bosqich", "Tashkilot tuzilmasi", [
            "Viloyat, tuman, maktab, sinf CRUD",
            "O'quvchi va o'qituvchi modullari",
            "Ota-ona bog'liq tizimi",
        ]),
        ("3-bosqich", "Qurilma integratsiyasi", [
            "Device modellari va adapterlar",
            "Hikvision, Dahua, ZKTeco adapterlari",
            "Push/Pull sinxronizatsiya",
            "Yuz rasm yuklash",
        ]),
        ("4-bosqich", "Davomad mexanizmi", [
            "Xom log qayta ishlash",
            "Deduplication va student mapping",
            "AttendanceRecord yaratish",
            "Kechikish hisob-kitob",
        ]),
        ("5-bosqich", "Telegram botlar", [
            "Ota-ona boti",
            "Boshqaruv boti",
            "Auto-link tizimi",
            "Xabarnomalar (Celery tasks)",
        ]),
        ("6-bosqich", "Dashboard va hisobotlar", [
            "Rol-asosli dashboardlar",
            "Grafik va analitika (Recharts)",
            "Kunlik/haftalik/oylik hisobotlar",
            "WebSocket real-time yangilanish",
        ]),
        ("7-bosqich", "Xavfsizlik va polishing", [
            "Audit loglari",
            "Performance optimizatsiya",
            "Monitoring va alertlar",
            "Production deployment",
        ]),
    ]

    for phase_num, phase_name, tasks in phases:
        phase_data = [
            [Paragraph(phase_num, ParagraphStyle('Phase', fontSize=10, fontName='Helvetica-Bold',
                                                   textColor=WHITE, alignment=TA_CENTER)),
             Paragraph(f"<b>{phase_name}</b>", styles['H3']),
             Paragraph("\n".join(f"• {t}" for t in tasks), styles['Bullet'])]
        ]
        phase_t = Table(phase_data, colWidths=[2.5*cm, 5*cm, 9.5*cm])
        phase_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), PRIMARY),
            ('BACKGROUND', (1,0), (1,-1), PRIMARY_LIGHT),
            ('BACKGROUND', (2,0), (2,-1), LIGHT_GRAY),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('VALIGN', (0,0), (0,-1), 'MIDDLE'),
        ]))
        story.append(phase_t)
        story.append(Spacer(1, 0.15*cm))

    # FOOTER
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width=W, thickness=1, color=PRIMARY))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        f"Maktab Davomad Face ID Tizimi © {datetime.date.today().year} | "
        "Barcha huquqlar himoyalangan | "
        f"Hujjat yaratilgan: {datetime.date.today().strftime('%d.%m.%Y')}",
        ParagraphStyle('Footer', fontSize=8, textColor=GRAY, alignment=TA_CENTER)
    ))

    doc.build(story)
    print(f"✅ PDF muvaffaqiyatli yaratildi: {OUTPUT_FILE}")
    print(f"📄 Fayl hajmi: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")


if __name__ == '__main__':
    build_pdf()
