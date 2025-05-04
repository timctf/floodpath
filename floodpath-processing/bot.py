import telebot
from telebot import types
import requests

BOT_TOKEN = '7850155396:AAEnNp3qttrlHy9coS4IeB9d29xeU_YKJA0'
bot = telebot.TeleBot(BOT_TOKEN)

API_URL = "http://localhost:8000/location-to-coordinates?location="

# Keep track of who is entering coordinates
awaiting_flood_location = set()

@bot.message_handler(commands=['help', 'start'])
def show_help(message):
    help_text = (
        "👋 *Welcome to FloodPath Bot!*\n\n"
        "Here are the available commands:\n"
        "/start or /help - Show this help message\n"
        "/location - Share your live location\n"
        "/flooding - Inform us about the area in Singapore that is flooding\n"
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

@bot.message_handler(commands=['flooding'])
def request_place_name(message):
    awaiting_flood_location.add(message.chat.id)
    bot.send_message(message.chat.id, "Please type the name of a place you'd like me to find.")

@bot.message_handler(func=lambda message: message.content_type == 'text')
def handle_text_location(message):
    if message.chat.id not in awaiting_flood_location:
        return  # Ignore messages not in flood location mode

    location_query = message.text.strip()
    res = requests.get(API_URL + location_query)

    if res.status_code == 200:
        data = res.json()
        if "latitude" in data:
            reply = (
                f"📍 Location found:\n"
                f"📌 {data['label']}\n"
                f"🧭 Latitude: {data['latitude']}\n"
                f"🧭 Longitude: {data['longitude']}"
                f"Thank you for reporting!"
            )
        else:
            reply = "❌ Sorry, I couldn't find that location."
    else:
        reply = "⚠️ There was an error retrieving coordinates."

    bot.reply_to(message, reply)
    awaiting_flood_location.discard(message.chat.id)  # Exit mode after use

bot.infinity_polling()
