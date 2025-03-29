from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, save_score, get_all_scores
from model import choose_questions
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)  # Viktigt för att frontend ska kunna göra POST-anrop
init_db()

# ✅ Ny: Hämta flera frågor på en gång
@app.route('/get-questions', methods=['POST'])
def get_questions():
    data = request.get_json()
    category = data.get('category', 9)
    starting_difficulty = data.get('startingDifficulty', 'easy')
    amount = int(data.get('amount', 5))

    questions = choose_questions(amount, category, starting_difficulty)

    return jsonify({'questions': questions})


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

Ge en kort och smart ledtråd (MAX 40 tecken, alltid på svenska) som kan hjälpa eleven hitta rätt svar, men avslöja inte svaret rakt ut.
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


@app.route('/get-feedback', methods=['POST'])
def get_feedback():
    data = request.get_json()
    correct = data.get("correct", False)

    user_prompt = (
        "Ge ett kort, positivt och peppande uttryck (max 2 ord, alltid på svenska) om eleven svarar rätt."
        if correct else
        "Ge ett kort, vänligt uttryck (max 2 ord, alltid på svenska) om eleven svarar fel."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Du är en peppig quizkompis som ger korta reaktioner."},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.9,
            max_tokens=10
        )
        feedback = response.choices[0].message.content.strip()
        print("🎉 Feedback från OpenAI:", feedback)
        return jsonify({"feedback": feedback})

    except Exception as e:
        print("🛑 Fel vid GPT-feedback:", e)
        return jsonify({"feedback": "Bra jobbat!" if correct else "Försök igen!"})


@app.route('/save-score', methods=['POST'])
def save_score_route():
    try:
        data = request.get_json()
        score = data.get("score")

        if score is None:
            return jsonify({ "status": "error", "message": "Ingen poäng skickades." }), 400

        print(f"📬 Mottagen poäng från frontend: {score}")  # 👈 logga till terminalen

        save_score(score)
        return jsonify({ "status": "ok" })
    except Exception as e:
        print("🛑 Fel vid sparande av poäng:", e)
        return jsonify({ "status": "error", "message": "Kunde inte spara poängen." }), 500


@app.route('/all-scores', methods=['GET'])
def all_scores_route():
    scores = get_all_scores()
    return jsonify(scores)

if __name__ == '__main__':
    print("🚀 Flask-servern körs på http://localhost:5000")
    app.run(port=5000)
