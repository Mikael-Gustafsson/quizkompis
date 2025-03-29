import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('../ml-api/quiz.db');

const username = 'student';
const password = 'Gv9!qR2s#8kA'; // starkt lösenord

bcrypt.hash(password, 10, (err, hash) => {
  if (err) return console.error('Fel vid hash:', err);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT
      )
    `);

    db.run(`
      INSERT OR REPLACE INTO users (username, password_hash)
      VALUES (?, ?)
    `, [username, hash], (err) => {
      if (err) return console.error('Fel vid INSERT:', err);
      console.log(`✔️ Användare "${username}" skapad med starkt lösenord.`);
    });
  });
});
