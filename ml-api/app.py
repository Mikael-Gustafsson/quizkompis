from flask import Flask, request, jsonify
from model import choose_question
from openai import OpenAI
import os

# Ladda API-nyckel från miljövariabel
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)

@app.route('/get-question', methods=['POST'])
def get_question():
    data = request.get_json()
    history = data.get('history', [])
    category = data.get('category', 9)
    starting_difficulty = data.get('startingDifficulty', 'easy')

    question = choose_question(history, category, starting_difficulty)
    return jsonify(question)

@app.route('/get-hint', methods=['POST'])
def get_hint():
    data = request.get_json()
    print("📩 Hint-anrop inkom:", data)

    question = data.get('question')
    options = data.get('options', [])

    if not question or not options:
        return jsonify({ "hint": "Kunde inte generera en hint – saknar fråga eller alternativ." })

    options_text = '\n'.join([f"- {opt}" for opt in options])

    prompt = f"""
Du är en vänlig AI-kompis som hjälper en elev med ledtrådar. Du får en fråga och fyra svarsalternativ.

Fråga: {question}
Alternativ:
{options_text}

Ge en smart ledtråd som kan hjälpa eleven hitta rätt svar, men avslöja inte svaret rakt ut.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Du är en hjälpande AI-assistent."},
                {"role": "user", "content": prompt}
            ]
        )
        hint = response.choices[0].message.content
        print("🧠 Hint från OpenAI:", hint)
        return jsonify({ "hint": hint })

    except Exception as e:
        print("🛑 Fel vid GPT-anrop:", e)
        return jsonify({ "hint": "AI:n kunde inte svara just nu 😢 Försök igen snart." })

if __name__ == '__main__':
    print("🚀 Flask-servern körs på http://localhost:5000")
    app.run(port=5000)
