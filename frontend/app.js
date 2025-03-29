// Huvudkonstanter och tillstånd
const TOTAL_QUESTIONS = 5;
let userName = '';
let score = 0;
let questionCount = 0;
let category = '';
let startingDifficulty = '';
let startTime = 0;
let currentIndex = 0;
let allQuestions = [];

function saveName() {

  userName = document.getElementById('nameInput').value.trim().replace(/\s+/g, ' ');
  if (!userName) return alert("Skriv ditt namn först!");

  category = document.getElementById('categorySelect').value;
  startingDifficulty = document.getElementById('difficultySelect').value;

  document.getElementById('nameForm').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');

  typeWriterEffect("robotGreeting", `Lycka till, ${userName}! Nu kör vi!`);
  startTime = Date.now();

  setTimeout(hideRobotBubble, 3000);
  setTimeout(fetchNewQuestion, 3000);
}

async function fetchNewQuestion() {
  const res = await fetch('/get-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, startingDifficulty, amount: TOTAL_QUESTIONS })
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

  // 🟡 Göm gammalt pratbubbel-meddelande
  hideRobotBubble();

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

  const fullMessage = `${userName}, du fick ${score} av ${TOTAL_QUESTIONS} rätt!<br><br>${message}<br><br>Vill du spela igen? Tryck på knappen nedan! 🔁`;

  const robotGreeting = document.getElementById("robotGreeting");
  const bubbleTail = document.getElementById("bubbleTail");

  // Göm pratbubblan helt
  robotGreeting.classList.add("hidden");
  if (bubbleTail) bubbleTail.classList.add("hidden");

  // Spara poäng till server direkt
  fetch('/save-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score })
  });

  // Visa slutmeddelande + bubbla efter 2.5 sekunder
  setTimeout(() => {
    robotGreeting.innerHTML = fullMessage;
    robotGreeting.classList.remove("hidden");
    robotGreeting.classList.add("min-h-[180px]");
    if (bubbleTail) bubbleTail.classList.remove("hidden");
    document.getElementById('restart').classList.remove('hidden');
  }, 1500);
}








async function showQuestion(data) {
  const questionElem = document.getElementById('question');
  const optionsDiv = document.getElementById('options');
  const helpButton = document.getElementById('helpBtn');

  questionElem.classList.add('transition-opacity', 'duration-300');
  optionsDiv.classList.add('transition-opacity', 'duration-300');
  questionElem.classList.add('opacity-0');
  optionsDiv.classList.add('opacity-0');

  await new Promise(resolve => setTimeout(resolve, 300));

  questionElem.innerText = decodeURIComponent(data.question);
  optionsDiv.innerHTML = '';

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
        body: JSON.stringify({ question: data.question, options: data.options })
      });

      const result = await res.json();
      typeWriterEffect("robotGreeting", result.hint);
    } catch {
      typeWriterEffect("robotGreeting", "❌ Kunde inte hämta tips.");
    }

    helpButton.innerText = '💡 Få AI-hjälp igen';
    helpButton.disabled = false;
  };

  data.options.forEach(option => {
    const btn = document.createElement('button');
    btn.innerText = decodeURIComponent(option);
    btn.className = 'w-full px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-all';
    btn.disabled = false;

    btn.onclick = () => {
      const isCorrect = option === data.answer;
      btn.classList.remove('bg-indigo-100', 'hover:bg-indigo-200');
      btn.classList.add(isCorrect ? 'bg-green-400' : 'bg-red-400');

      document.querySelectorAll('#options button').forEach(b => {
        b.disabled = true;
        if (b.innerText === decodeURIComponent(data.answer)) {
          b.classList.remove('bg-indigo-100', 'hover:bg-indigo-200');
          b.classList.add('bg-green-400');
        }
      });

      // ⬇️ Visa feedback bara om det inte är sista frågan
      if (questionCount < TOTAL_QUESTIONS - 1) {
        fetch('/get-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correct: isCorrect })
        })
          .then(res => res.json())
          .then(data => typeWriterEffect("robotGreeting", data.feedback))
          .catch(() => typeWriterEffect("robotGreeting", isCorrect ? "Bra!" : "Nästan!"));

        setTimeout(hideRobotBubble, 2500);
        setTimeout(() => submitAnswer(isCorrect), 2500);
      } else {
        submitAnswer(isCorrect);
      }
    };

    optionsDiv.appendChild(btn);
  });

  questionElem.classList.remove('opacity-0');
  optionsDiv.classList.remove('opacity-0');
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
  document.getElementById("robotGreeting").classList.remove("min-h-[180px]");
  hideRobotBubble();

}

function typeWriterEffect(elementId, text, speed = 30) {
  const element = document.getElementById(elementId);
  const bubbleTail = document.getElementById("bubbleTail");

  if (!element) return;

  element.classList.remove("hidden");
  if (bubbleTail) bubbleTail.classList.remove("hidden");

  // Dela upp HTML-texten i rena tecken utan att bryta taggar
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  const fullText = tempDiv.innerText; // Ren text, utan taggar
  element.innerHTML = '';

  let index = 0;

  function type() {
    if (index < fullText.length) {
      element.innerHTML += fullText.charAt(index);
      index++;
      setTimeout(type, speed);
    } else {
      // Lägg tillbaka HTML-versionen efter effekten
      element.innerHTML = text;
    }
  }

  type();
}




function hideRobotBubble() {
  const element = document.getElementById('robotGreeting');
  const bubbleTail = document.getElementById('bubbleTail');

  if (element) element.classList.add('hidden');
  if (bubbleTail) bubbleTail.classList.add('hidden');
}


window.addEventListener("DOMContentLoaded", () => {
  typeWriterEffect("robotGreeting", "Hej! Jag är din quizkompis. Redo att träna?");
});

function updateProgressBar(currentQuestionIndex) {
  const progress = Math.min((currentQuestionIndex / TOTAL_QUESTIONS) * 100, 100);
  const bar = document.getElementById("progressBar");
  if (bar) bar.style.width = `${progress}%`;
}

async function showHistory() {
  const container = document.getElementById("historyContainer");
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
      container.innerHTML = `
        <h3 class="font-semibold mb-2">Senaste rundor:</h3>
        <ul class="space-y-1">
          ${data.slice(0, 5).map(r => `<li>Poäng ${r[1]}</li>`).join('')}
        </ul>
      `;
    }

    container.classList.remove("hidden");
  } catch {
    container.innerHTML = "<p>Kunde inte hämta historiken 😕</p>";
    container.classList.remove("hidden");
  }
}