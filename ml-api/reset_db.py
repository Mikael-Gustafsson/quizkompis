import sqlite3
import os

# Hitta absolut sökväg till quiz.db i samma mapp som detta skript
DB_PATH = os.path.join(os.path.dirname(__file__), "quiz.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Radera tabellen om den finns
c.execute("DROP TABLE IF EXISTS scores")

# Skapa tabellen på nytt
c.execute("""
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER
)
""")

conn.commit()
conn.close()

print(f"✅ scores-tabellen skapad i {DB_PATH}")
