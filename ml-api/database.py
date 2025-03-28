import sqlite3
import os

# Säkerställ att quiz.db alltid ligger i samma mapp som denna fil
DB_PATH = os.path.join(os.path.dirname(__file__), "quiz.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER
        )
    """)
    conn.commit()
    conn.close()

def save_score(score):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO scores (score) VALUES (?)", (score,))
    conn.commit()
    conn.close()

def get_all_scores():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM scores ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return rows
