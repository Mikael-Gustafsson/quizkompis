import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('../ml-api/quiz.db'); // justera sökväg om nödvändigt

db.all('SELECT id, username, password_hash FROM users', (err, rows) => {
  if (err) {
    console.error('🚨 Fel vid hämtning:', err.message);
    return;
  }

  console.log('📋 Användare i databasen:');
  rows.forEach(row => {
    console.log(`🧑 ID: ${row.id} | Användarnamn: ${row.username} | pw_hash: ${row.password_hash}`);
  });
});
