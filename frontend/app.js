const TOTAL_QUESTIONS = 5;
let userName = '';
let score = 0;
let questionCount = 0;
let category = '';
let startingDifficulty = '';

function saveName() {
  userName = document.getElementById('nameInput').value.trim();
  if (!userName) return alert("Skriv ditt namn först!");

  category = document.getElementById('categorySelect').value;
  startingDifficulty = document.getElementById('difficultySelect').value;

  // Visa quizet, göm formuläret
  document.getElementById('nameForm').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');

  // Skriv "Lycka till" i robotens pratbubbla med maskinskrivning
  typeWriterEffect("robotGreeting", `Lycka till, ${userName}! Nu kör vi!`);

  // Göm robotens hälsning efter 3 sekunder
  setTimeout(() => {
    document.getElementById("robotGreeting").classList.add("hidden");
  }, 3000);

  // Starta första frågan
  setTimeout(fetchNewQuestion, 3000);
}

async function fetchNewQuestion() {
  const res = await fetch('/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correct: null,
      category,
      startingDifficulty
    })
  });

  const data = await res.json();
  showQuestion(data);
}

async function submitAnswer(correct) {
  if (correct) score++;
  questionCount++;

  const res = await fetch('/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correct,
      category,
      startingDifficulty
    })
  });

  const data = await res.json();

  if (questionCount >= TOTAL_QUESTIONS) {
    document.getElementById('quiz').classList.add('hidden');

    let message = '';
    if (score >= 4) {
      message = 'Jag gissar att du kommer klara tentan finemang! 🏆';
    } else if (score >= 3) {
      message = 'Bra jobbat! Men jag tror du kan träna lite till 💪';
    } else {
      message = 'Jag tror du behöver träna lite mer innan tentan 😅';
    }

    const fullMessage = `${userName}, du fick ${score} av ${TOTAL_QUESTIONS} rätt! ${message}\n\nVill du spela igen? Tryck på knappen nedan! 🔁`;
    const robotBubble = document.getElementById('robotGreeting');
    robotBubble.classList.remove('hidden');
    typeWriterEffect("robotGreeting", fullMessage);

    document.getElementById('restart').classList.remove('hidden');
  } else {
    showQuestion(data);
  }
}

function showQuestion(data) {
  document.getElementById('question').innerText = decodeURIComponent(data.question);

  const helpButton = document.getElementById('helpBtn');
  const robotGreeting = document.getElementById('robotGreeting');

  helpButton.classList.remove('hidden');
  helpButton.innerText = '💡 Få hjälp';
  helpButton.disabled = false;

  helpButton.onclick = async () => {
    helpButton.innerText = '⏳ Hämtar tips...';
    helpButton.disabled = true;

    try {
      const res = await fetch('/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: data.question,
          options: data.options
        })
      });

      const result = await res.json();
      robotGreeting.classList.remove('hidden');
      typeWriterEffect("robotGreeting", result.hint);
    } catch (error) {
      robotGreeting.classList.remove('hidden');
      typeWriterEffect("robotGreeting", "❌ Kunde inte hämta tips.");
    }

    helpButton.innerText = '💡 Få AI-hjälp igen';
    helpButton.disabled = false;
  };

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';
  const buttons = [];

  data.options.forEach(option => {
    const btn = document.createElement('button');
    btn.innerText = decodeURIComponent(option);
    btn.className = 'w-full px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-all';
    btn.disabled = false;

    btn.onclick = () => {
      const isCorrect = option === data.answer;
    
      btn.classList.remove('bg-indigo-100', 'hover:bg-indigo-200');
      btn.classList.add(isCorrect ? 'bg-green-400' : 'bg-red-400');
    
      buttons.forEach(b => {
        if (b.innerText === decodeURIComponent(data.answer)) {
          b.classList.remove('bg-indigo-100', 'hover:bg-indigo-200');
          b.classList.add('bg-green-400');
        }
        b.disabled = true;
      });
    
      // Visa kort feedback i robotens bubbla
      fetch('/get-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: isCorrect })
      })
      .then(res => res.json())
      .then(data => {
        robotGreeting.classList.remove('hidden');
        typeWriterEffect("robotGreeting", data.feedback);
      })
      .catch(() => {
        robotGreeting.classList.remove('hidden');
        typeWriterEffect("robotGreeting", isCorrect ? "Bra!" : "Nästan!");
      });
      
    
      // ❗ Göm bara bubblan om det inte är sista frågan
      if (questionCount < TOTAL_QUESTIONS - 1) {
        setTimeout(() => {
          robotGreeting.classList.add('hidden');
        }, 2000);
      }
    
      // Nästa fråga
      setTimeout(() => {
        submitAnswer(isCorrect);
      }, 1000);
    };
    

    buttons.push(btn);
    optionsDiv.appendChild(btn);
  });
}

function restartQuiz() {
  score = 0;
  questionCount = 0;
  userName = '';
  category = '';
  startingDifficulty = '';

  document.getElementById('nameForm').classList.remove('hidden');
  document.getElementById('quiz').classList.add('hidden');
  document.getElementById('score')?.classList.add('hidden'); // if it exists
  document.getElementById('restart').classList.add('hidden');
  document.getElementById('nameInput').value = '';
  document.getElementById('robotGreeting').classList.add('hidden'); // 👈 denna rad!
}


function typeWriterEffect(elementId, text, speed = 30) {
  const element = document.getElementById(elementId);
  element.textContent = '';
  let index = 0;

  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }

  type();
}

window.addEventListener("DOMContentLoaded", () => {
  typeWriterEffect("robotGreeting", "Hej! Jag är din quizkompis. Redo att träna?");
});
