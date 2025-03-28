import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('../ml-api/quiz.db'); // justera vägen vid behov

const username = 'test';
const password = 'test123';

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
      console.log('✔️ Användare "test" skapad med lösenord "test123"');
    });
  });
});
