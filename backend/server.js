import express from 'express';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';

const app = express();
app.use(session({
  secret: 'hemlig-nyckel',
  resave: false,
  saveUninitialized: false
}));

const db = new sqlite3.Database('../ml-api/quiz.db'); 


// Hantera __dirname i ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use((req, res, next) => {
  const publicPaths = ['/login', '/logout'];
  const isStatic = req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png');

  if (req.session.user || publicPaths.includes(req.path) || isStatic) {
    next();
  } else {
    res.redirect('/login.html');
  }
});



// Låt express servera frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

let userHistory = [];

// POST: /submit-answer → skickas vidare till Flask
app.post('/submit-answer', async (req, res) => {
  const { correct, category, startingDifficulty } = req.body;

  console.log("MOTTAGET FRÅN FRONTEND:");
  console.log("Svar:", correct);
  console.log("Kategori:", category);
  console.log("Startsvårighetsgrad:", startingDifficulty);

  if (typeof correct === 'boolean') {
    userHistory.push({ correct });
  }

  const response = await fetch('http://localhost:5000/get-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      history: userHistory,
      category,
      startingDifficulty
    })
  });

  const data = await response.json();
  res.json(data);
});

// POST: /get-hint → skickas vidare till Flask
app.post('/get-hint', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/get-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("💥 Fel vid vidarebefordran av hint:", err);
    res.status(500).json({ hint: "Kunde inte hämta hint just nu 😢" });
  }
});


// POST: /get-feedback → skickas vidare till Flask
app.post('/get-feedback', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/get-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("💥 Fel vid vidarebefordran av feedback:", err);
    res.status(500).json({ feedback: "🤖 Kunde inte hämta feedback just nu" });
  }
});


// POST: /save-score → skickas vidare till Flask
app.post('/save-score', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("💥 Fel vid vidarebefordran av poäng:", err);
    res.status(500).json({ status: "misslyckades" });
  }
});


// GET: /all-scores → skickas vidare till Flask
app.get('/all-scores', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/all-scores');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("💥 Fel vid vidarebefordran av historik:", err);
    res.status(500).json({ error: "Kunde inte hämta historik" });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Databasfel' });
    if (!row) return res.status(401).json({ error: 'Fel användarnamn eller lösenord' });

    const match = await bcrypt.compare(password, row.password_hash);
    if (match) {
      req.session.user = { username: row.username };
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Fel användarnamn eller lösenord' });
    }
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ loggedOut: true });
  });
});




// Starta servern
app.listen(3000, () => {
  console.log('Node server running at http://localhost:3000');
});
