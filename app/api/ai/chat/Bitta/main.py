import os
import re
import sys
import sqlite3
import telebot
import threading
import traceback
from telebot.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from yt_dlp import YoutubeDL

# --- НАСТРОЙКА БОТА ---
TOKEN = "8609515467:AAHRJQXlCuSdd8ZjVpK6E_zqKIdgZKpz55g"
bot = telebot.TeleBot(TOKEN)

# Твой личный Telegram ID для получения уведомлений об анкетах
MY_TELEGRAM_ID = 123456789 

# Словарь для состояний пользователей (стейты)
user_states = {}

# --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ (SQLite) ---
def init_db():
    conn = sqlite3.connect("vacancies.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            listing_type TEXT,
            headline TEXT,
            description TEXT,
            contacts TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# --- ГЛАВНОЕ МЕНЮ БОТА ---
def main_reply_menu():
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    
    btn_youtube = KeyboardButton("YOUTUBE 🔲")
    btn_youtube.web_app = WebAppInfo(url="https://youtube.com")
    
    btn_instagram = KeyboardButton("INSTAGRAM 🔲")
    btn_instagram.web_app = WebAppInfo(url="https://instagram.com")
    
    btn_ielts = KeyboardButton("🇬🇧 IELTS Imtihonlari 🔲")
    btn_ielts.web_app = WebAppInfo(url="https://ielts.gg")
    
    btn_downloader = KeyboardButton("🎬 Bitta Downloader")
    btn_gamers = KeyboardButton("🎮 Geymerlar uchun")
    btn_trading = KeyboardButton("📈 Treyding / AI (II)")
    btn_reklama = KeyboardButton("ℹ️ Bitta Hub / Reklama")
    btn_vacancy = KeyboardButton("📌 ISHGA VAKANCIYA")
    
    markup.add(btn_youtube, btn_instagram)
    markup.add(btn_downloader, btn_gamers)
    markup.add(btn_trading, btn_ielts)
    markup.add(btn_vacancy, btn_reklama)
    return markup

# --- ПОДМЕНЮ ДЛЯ ВАКАНСИЙ ---
def vacancy_reply_menu():
    markup = ReplyKeyboardMarkup(resize_keyboard=True, row_width=3)
    markup.add(
        KeyboardButton("🔍 ISH TOPISH"), 
        KeyboardButton("🤝 ISHCHI TOPISH"), 
        KeyboardButton("🔎 QIDIRUV")
    )
    markup.add(KeyboardButton("⬅️ Orqaga"))
    return markup

@bot.message_handler(commands=['start'])
def send_welcome(message):
    user_states[message.chat.id] = None
    bot.send_message(
        message.chat.id, 
        "Assalomu alaykum! BITTA botiga xush kelibsiz. Quyidagi menyudan foydalaning:", 
        reply_markup=main_reply_menu()
    )

# --- ЛОГИКА СКАЧИВАНИЯ ВИДЕО ---
def download_and_send(chat_id, text, message_id):
    filename = f"video_{chat_id}.mp4"
    if os.path.exists(filename):
        try: os.remove(filename)
        except: pass
        
    ydl_opts = {
        'format': 'best[height<=720]/best',
        'outtmpl': filename,
        'quiet': True,
        'no_warnings': True,
        'socket_timeout': 30,
        'retries': 5,
        'extractor_args': {
            'youtube': {
                'player_client': 'web',
            },
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
        }
    }
    
    if "instagram.com" in text.lower():
        if os.path.exists("/home/ubuntu/Bitta/instagram_cookies.txt"):
            ydl_opts['cookiefile'] = "/home/ubuntu/Bitta/instagram_cookies.txt"
            print("[СИСТЕМА] Куки Инстаграма успешно подключены.")
    elif "youtube.com" in text.lower() or "youtu.be" in text.lower():
        if os.path.exists("/home/ubuntu/Bitta/youtube_cookies.txt"):
            ydl_opts['cookiefile'] = "/home/ubuntu/Bitta/youtube_cookies.txt"
            print("[СИСТЕМА] Куки Ютуба успешно подключены.")
    
    try:
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([text])
            
        if os.path.exists(filename) and os.path.getsize(filename) > 0:
            bot.edit_message_text("Video yuklab olindi! Telegramga yuborilmoqda... 🚀", chat_id, message_id)
            with open(filename, 'rb') as video_file:
                bot.send_video(chat_id=chat_id, video=video_file)
        else:
            bot.edit_message_text("Afsuski videoni yuklab bolmadi", chat_id, message_id)
    except Exception as e:
        print(traceback.format_exc())
        bot.edit_message_text("Afsuski videoni yuklab bolmadi (Ошибка авторизации / Rate-limit)", chat_id, message_id)
    finally:
        if os.path.exists(filename):
            try: os.remove(filename)
            except: pass

# --- ОБРАБОТКА ВСЕХ ТЕКСТОВЫХ ВВОДОВ ---
@bot.message_handler(func=lambda message: True)
def handle_text_inputs(message):
    chat_id = message.chat.id
    text = message.text
    current_state = user_states.get(chat_id)

    if current_state == "waiting_for_anketa":
        if text == "⬅️ Orqaga":
            user_states[chat_id] = None
            bot.send_message(chat_id, "Vakansiya bo'limi:", reply_markup=vacancy_reply_menu())
            return
        process_incoming_anketa(message)
        return

    if current_state == "waiting_for_search":
        if text == "⬅️ Orqaga":
            user_states[chat_id] = None
            bot.send_message(chat_id, "Vakansiya bo'limi:", reply_markup=vacancy_reply_menu())
            return
        process_search_query(message)
        return

    if text.startswith("http://") or text.startswith("https://"):
        msg = bot.send_message(chat_id, "Havola tekshirilmoqda... 🔄")
        threading.Thread(target=download_and_send, args=(chat_id, text, msg.message_id)).start()
            
    elif text == "🎬 Bitta Downloader":
        bot.send_message(chat_id, "Assalamu alekum! Video havolasini yuboring: 🎬")
        
    elif text == "ℹ️ Bitta Hub / Reklama":
        bot.send_message(chat_id, "📈 Reklama beruvchilar va hamkorlik uchun aloqa:\n\nTelegram: @qrMIFNE")
        
    elif text == "🎮 Geymerlar uchun":
        bot.send_message(chat_id, "🎮 Geymerlar bo'limi yaqin orada ishga tushadi!")
        
    elif text == "📈 Treyding / AI (II)":
        bot.send_message(chat_id, "📊 Treyding va Sun'iy Intellekt bo'limi yuklanmoqda...")

    elif text == "📌 ISHGA VAKANCIYA":
        bot.send_message(chat_id, "Kerakli bo'limni tanlang:", reply_markup=vacancy_reply_menu())

    elif text in ["🔍 ISH TOPISH", "🤝 ISHCHI TOPISH"]:
        user_states[chat_id] = "waiting_for_anketa"
        default_tur = "ISH KERAK" if text == "🔍 ISH TOPISH" else "ISHCHI KERAK"
        
        template = (
            f"TUR: {default_tur}\n"
            "---------------------------\n"
            "NIMA QIDIRYAPSIZ / QILA OLASIZ:\n"
            "[Bu yerga qisqa yozuv yozing, masalan: Manga montajor kerak]\n\n"
            "TO'LIQ MA'LUMOT:\n"
            "[Ish va sharoitlar haqida batafsil ma'lumot]\n\n"
            "ISMINGIZ VA LICHKANGIZ:\n"
            "[Ismingiz va aloqa, masalan: Bobur, @username]"
        )
        
        bot.send_message(
            chat_id, 
            "📋 ANKETA TO'LDIRISH FORMATI\n\n"
            "Quyidagi matnni nusxalab oling (ustiga bir marta bossangiz o'zi nusxalanadi), "
            "ichidagi ma'lumotlarni o'zingizniki bilan almashtiring va bitta xabar qilib botga qaytarib yuboring:"
        )
        bot.send_message(chat_id, f"<code>{template}</code>", parse_mode="HTML")

    elif text == "🔎 QIDIRUV":
        user_states[chat_id] = "waiting_for_search"
        markup = ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add(KeyboardButton("⬅️ Orqaga"))
        bot.send_message(chat_id, "🔎 Qidiruv uchun kalit so'z yoki sarlavhani kiriting (masalan: montaj yoki dizayn):", reply_markup=markup)

    elif text == "⬅️ Orqaga":
        user_states[chat_id] = None
        bot.send_message(chat_id, "Bosh menyu:", reply_markup=main_reply_menu())
        
    else:
        bot.send_message(chat_id, f"🔍 '{text}' bo'yicha xizmatlar qidirilmoqda...")

# --- ГИБКИЙ И НАДЕЖНЫЙ РАЗБОР АНКЕТЫ ---
def process_incoming_anketa(message):
    chat_id = message.chat.id
    text = message.text
    
    try:
        # Автоматически определяем тип объявления
        listing_type = "ISH KERAK"
        if "ishchi" in text.lower():
            listing_type = "ISHCHI KERAK"
        
        # Многострочный гибкий поиск контента между блоками
        headline_match = re.search(r"(?:NIMA QIDIRYAPSIZ|QILA OLASIZ)[\s:/]*([\s\S]*?)(?=TO'LIQ MA'LUMOT|MA'LUMOT|$)", text, re.IGNORECASE)
        description_match = re.search(r"MA'LUMOT[\s:]*([\s\S]*?)(?=ISMINGIZ|LICHKANGIZ|$)", text, re.IGNORECASE)
        contacts_match = re.search(r"(?:ISMINGIZ VA LICHKANGIZ|LICHKANGIZ)[\s:]*([\s\S]*)", text, re.IGNORECASE)
        
        headline = headline_match.group(1).strip() if headline_match else ""
        # Очищаем заголовок от декоративных линий, если они остались
        headline = re.sub(r"-{2,}", "", headline).strip()
        
        description = description_match.group(1).strip() if description_match else ""
        contacts = contacts_match.group(1).strip() if contacts_match else ""
        
        # Если базовые поля пустые — значит формат нарушен критически
        if not headline or not description or not contacts:
            bot.send_message(chat_id, "❌ Xatolik! Anketada ma'lumotlar yetarli emas. Iltimos, namunadagi bloklarni o'чириб tashlamasdan to'ldiring.")
            return

        username = message.from_user.username or "Mavjud emas"

        conn = sqlite3.connect("vacancies.db")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO listings (user_id, username, listing_type, headline, description, contacts) VALUES (?, ?, ?, ?, ?, ?)",
            (chat_id, username, listing_type, headline, description, contacts)
        )
        conn.commit()
        conn.close()

        bot.send_message(chat_id, "✅ Anketangiz muvaffaqiyatli qabul qilindi va bazaga qo'shildi!", reply_markup=vacancy_reply_menu())
        user_states[chat_id] = None

        admin_msg = (
            f"🔔 **YANGI ANKETA!**\n\n"
            f"👤 User: @{username} (ID: {chat_id})\n"
            f"🗂 Turi: {listing_type}\n"
            f"📌 Sarlavha: {headline}\n"
            f"📝 Batafsil: {description}\n"
            f"📞 Aloqa: {contacts}"
        )
        try:
            bot.send_message(MY_TELEGRAM_ID, admin_msg)
        except Exception as e:
            print(f"Не удалось отправить уведомление админу: {e}")

    except Exception as e:
        print(traceback.format_exc())
        bot.send_message(chat_id, "❌ Anketani saqlashda xatolik yuz berdi.")

# --- УМНЫЙ МНОГОСЛОВНЫЙ ПОИСК ПО БАЗЕ ДАННЫХ ---
def process_search_query(message):
    chat_id = message.chat.id
    query = message.text.strip()
    words = query.split() # Разбиваем поисковый запрос на отдельные слова
    
    if not words:
        bot.send_message(chat_id, "🔍 Qidiruv uchun biror kalit so'z kiriting.", reply_markup=vacancy_reply_menu())
        user_states[chat_id] = None
        return
        
    try:
        conn = sqlite3.connect("vacancies.db")
        cursor = conn.cursor()
        
        # Динамически собираем SQL-запрос под любое количество ключевых слов
        conditions = []
        params = []
        for word in words:
            conditions.append("(headline LIKE ? OR description LIKE ? OR listing_type LIKE ?)")
            bind_val = f"%{word}%"
            params.extend([bind_val, bind_val, bind_val])
            
        sql = f"SELECT listing_type, headline, description, contacts, username FROM listings WHERE {' AND '.join(conditions)}"
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        conn.close()
        
        if not results:
            bot.send_message(chat_id, f"🔍 '{query}' bo'yicha hech narsa topilmadi.", reply_markup=vacancy_reply_menu())
            user_states[chat_id] = None
            return
            
        bot.send_message(chat_id, f"📚 Natijalar ({len(results)} ta e'lon topildi):")
        for row in results:
            listing_type, headline, description, contacts, username = row
            msg = (
                f"🗂 **Turi:** {listing_type}\n"
                f"📌 **Sarlavha:** {headline}\n"
                f"📝 **Batafsil:** {description}\n"
                f"📞 **Aloqa:** {contacts}\n"
                f"👤 **Muallif:** @{username}"
            )
            bot.send_message(chat_id, msg)
            
        user_states[chat_id] = None
        bot.send_message(chat_id, "Qidiruv yakunlandi.", reply_markup=vacancy_reply_menu())
        
    except Exception as e:
        print(traceback.format_exc())
        bot.send_message(chat_id, "❌ Qidiruv paytida xatolik yuz berdi.")

# --- ЗАПУСК ПОЛЛИНГА БОТА ---
if __name__ == '__main__':
    print("[СИСТЕМА] Бот успешно запущен на хостинге!")
    bot.infinity_polling()