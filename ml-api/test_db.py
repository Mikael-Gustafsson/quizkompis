import sqlite3
import os

# Samma logik som i reset_db.py
DB_PATH = os.path.join(os.path.dirname(__file__), "quiz.db")

# Anslut till rätt databas
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Test: Lägg till ett värde
c.execute("INSERT INTO scores (score) VALUES (?)", (3,))
conn.commit()

# Hämta och visa alla resultat
c.execute("SELECT * FROM scores")
rows = c.fetchall()

print("📊 Alla poäng i databasen:")
for row in rows:
    print(row)

conn.close()
