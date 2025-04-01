import requests
import random

def choose_questions(amount=5, category=9, difficulty='easy'):
    """
    Hämtar ett visst antal frågor från Open Trivia Database.
    Returnerar en lista med frågor där alternativen är blandade.
    """
    url = f"https://opentdb.com/api.php?amount={amount}&category={category}&difficulty={difficulty}&type=multiple&encode=url3986"
    response = requests.get(url)
    data = response.json()

    if data["response_code"] != 0 or not data["results"]:
        return []

    questions = []
    for q in data['results']:
        options = q['incorrect_answers'] + [q['correct_answer']]
        random.shuffle(options)

        questions.append({
            "question": q['question'],
            "options": options,
            "answer": q['correct_answer']
        })

    return questions
