import requests
import random

def choose_question(history, category=9, starting_difficulty='easy'):
    # Anpassa svårighetsgrad beroende på de senaste svaren
    correct_last_3 = [x['correct'] for x in history[-3:] if x['correct'] is not None]

    if len(correct_last_3) == 3 and all(correct_last_3):
        difficulty = 'hard'
    elif correct_last_3.count(True) >= 2:
        difficulty = 'medium'
    else:
        difficulty = starting_difficulty

    # Bygg API-anrop till OpenTDB
    url = f"https://opentdb.com/api.php?amount=1&category={category}&difficulty={difficulty}&type=multiple&encode=url3986"
    response = requests.get(url)
    data = response.json()

    # Fallback om inget resultat kommer tillbaka
    if data["response_code"] != 0 or not data["results"]:
        return {
            "question": "Tyvärr gick det inte att hämta en fråga just nu.",
            "options": ["Försök igen", "Senare", "Kanske", "Nu"],
            "answer": "Försök igen"
        }

    q = data['results'][0]
    question_text = q['question']
    correct_answer = q['correct_answer']
    incorrect_answers = q['incorrect_answers']

    # Slå ihop och blanda alternativen
    options = incorrect_answers + [correct_answer]
    random.shuffle(options)

    return {
        "question": question_text,
        "options": options,
        "answer": correct_answer
    }
