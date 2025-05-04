import telebot
from telebot import types

BOT_TOKEN = '7850155396:AAEnNp3qttrlHy9coS4IeB9d29xeU_YKJA0'
bot = telebot.TeleBot(BOT_TOKEN)

# Keep track of who is entering coordinates
awaiting_coords = set()

@bot.message_handler(commands=['help', 'start'])
def show_help(message):
    help_text = (
        "👋 *Welcome to FloodPath Bot!*\n\n"
        "Here are the available commands:\n"
        "/start or /help - Show this help message\n"
        "/location - Share your live location\n"
        "/coordinates - Manually enter your latitude and longitude\n"
    )
    bot.send_message(message.chat.id, help_text, parse_mode="Markdown")

@bot.message_handler(commands=['location'])
def ask_for_location(message):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    location_btn = types.KeyboardButton("📍 Share my location", request_location=True)
    markup.add(location_btn)
    bot.send_message(message.chat.id, "Please tap the button below to send your current location:", reply_markup=markup)

@bot.message_handler(content_types=['location'])
def handle_location(message):
    lat = message.location.latitude
    lon = message.location.longitude
    bot.reply_to(message, f"📍 Thanks! Your current location:\nLatitude: {lat}\nLongitude: {lon}")

@bot.message_handler(commands=['coordinates'])
def request_coordinates(message):
    awaiting_coords.add(message.chat.id)
    bot.send_message(message.chat.id, "📌 Please enter your coordinates in this format:\n`latitude,longitude`\nExample: `1.3521,103.8198`", parse_mode="Markdown")

@bot.message_handler(func=lambda message: message.chat.id in awaiting_coords)
def handle_coordinates_input(message):
    try:
        lat_str, lon_str = message.text.split(',')
        lat = float(lat_str.strip())
        lon = float(lon_str.strip())
        bot.reply_to(message, f"📍 Coordinates received:\nLatitude: {lat}\nLongitude: {lon}")
        awaiting_coords.discard(message.chat.id)
    except Exception:
        bot.reply_to(message, "⚠️ Invalid format. Please enter coordinates as: `latitude,longitude`", parse_mode="Markdown")

bot.infinity_polling()
