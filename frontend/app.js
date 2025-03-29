const TOTAL_QUESTIONS = 5;
let userName = '';
let score = 0;
let questionCount = 0;
let category = '';
let startingDifficulty = '';
let startTime = 0;
let currentQuestionIndex = 0;
let allQuestions = [];
let currentIndex = 0;



function saveName() {
  userName = document.getElementById('nameInput').value.trim();
  if (!userName) return alert("Skriv ditt namn först!");

  category = document.getElementById('categorySelect').value;
  startingDifficulty = document.getElementById('difficultySelect').value;

  document.getElementById('nameForm').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');

  typeWriterEffect("robotGreeting", `Lycka till, ${userName}! Nu kör vi!`);

  startTime = Date.now();

  setTimeout(() => {
    document.getElementById("robotGreeting").classList.add("hidden");
  }, 3000);

  setTimeout(fetchNewQuestion, 3000);
}

async function fetchNewQuestion() {
  const res = await fetch('/get-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      startingDifficulty,
      amount: TOTAL_QUESTIONS
    })
  });

  const data = await res.json();
  allQuestions = data.questions;
  currentIndex = 0;
  questionCount = 0;
  score = 0;

  document.getElementById("progressContainer").classList.remove("hidden");
  updateProgressBar(currentIndex);

  showQuestion(allQuestions[currentIndex]);
}


async function submitAnswer(correct) {
  if (correct) score++;
  questionCount++;
  currentIndex++;

  updateProgressBar(currentIndex);

  if (questionCount >= TOTAL_QUESTIONS) {
    avslutaQuiz();
  } else {
    showQuestion(allQuestions[currentIndex]);
  }
}


function avslutaQuiz() {
  document.getElementById('quiz').classList.add('hidden');

  let message = '';
  if (score >= 4) {
    message = 'Jag gissar att du kommer klara tentan finemang! 🌟';
  } else if (score >= 3) {
    message = 'Bra jobbat! Men jag tror du kan träna lite till 💪';
  } else {
    message = 'Jag tror du behöver träna lite mer innan tentan 😅';
  }

  const fullMessage = `${userName}, du fick ${score} av ${TOTAL_QUESTIONS} rätt! ${message}\n\nVill du spela igen? Tryck på knappen nedan! 🔁`;
  const robotBubble = document.getElementById('robotGreeting');
  robotBubble.classList.remove('hidden');
  typeWriterEffect("robotGreeting", fullMessage);

  fetch('/save-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score })
  });

  document.getElementById('restart').classList.remove('hidden');
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

      if (questionCount < TOTAL_QUESTIONS - 1) {
        setTimeout(() => {
          robotGreeting.classList.add('hidden');
        }, 2000);
      }

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
  document.getElementById('score')?.classList.add('hidden');
  document.getElementById('restart').classList.add('hidden');
  document.getElementById('nameInput').value = '';
  document.getElementById('robotGreeting').classList.add('hidden');
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





async function showHistory() {
  const container = document.getElementById("historyContainer");

  // Växla visning av historiken
  if (!container.classList.contains("hidden")) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  try {
    const res = await fetch("/all-scores");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Inga tidigare rundor ännu 📭</p>";
    } else {
      // Visa de 5 senaste rundorna, nyast först (datan är redan sorterad)
      const senasteFem = data.slice(0, 5);

      container.innerHTML = `
        <h3 class="font-semibold mb-2">Senaste rundor:</h3>
        <ul class="space-y-1">
          ${senasteFem.map((r, i) => `
            <li>Poäng ${r[1]}</li>
          `).join('')}
        </ul>
      `;
    }

    container.classList.remove("hidden");
  } catch (err) {
    container.innerHTML = "<p>Kunde inte hämta historiken 😕</p>";
    container.classList.remove("hidden");
  }
}


function updateProgressBar(currentQuestionIndex) {
  const totalQuestions = 5;
  const progress = Math.min((currentQuestionIndex / totalQuestions) * 100, 100);
  const bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = `${progress}%`;
  }
}



