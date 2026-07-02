// ── Default flashcard data ──────────────────────────────────────────────────
const defaultFlashcards = [
    {
        question: "What language is used to style web pages?",
        answer: "CSS"
    },
    {
        question: "What data structure operates on a Last-In, First-Out (LIFO) principle?",
        answer: "Stack"
    },
    {
        question: "What is the base-2 numeral system called?",
        answer: "Binary"
    },
    {
        question: "What is the brain of the computer that executes instructions?",
        answer: "CPU"
    },
    {
        question: "What data structure operates on a First-In, First-Out (FIFO) principle?",
        answer: "Queue"
    }
];

// ── State ───────────────────────────────────────────────────────────────────
let flashcards = [...defaultFlashcards];
let currentIndex = 0;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const card = document.getElementById('flashcard');
const questionEl = document.getElementById('card-question');
const answerEl = document.getElementById('card-answer');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const generateBtn = document.getElementById('generate-btn');
const topicInput = document.getElementById('topic-input');
const dotsWrap = document.getElementById('progress-dots');
const counter = document.getElementById('card-counter');
const loadingOv = document.getElementById('loading-overlay');
const errorMsg = document.getElementById('error-msg');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Rebuild progress dots to reflect the current deck and active index
function renderDots() {
    dotsWrap.innerHTML = '';
    flashcards.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = 'dot' + (i === currentIndex ? ' active' : '');
        dotsWrap.appendChild(d);
    });
}

// Update card content, flip back to front first if needed, refresh UI controls
function renderCard() {
    if (card.classList.contains('is-flipped')) {
        card.classList.remove('is-flipped');
        // Wait for the CSS flip-back animation (280ms) before swapping text
        setTimeout(() => {
            questionEl.textContent = flashcards[currentIndex].question;
            answerEl.textContent = flashcards[currentIndex].answer;
        }, 280);
    } else {
        questionEl.textContent = flashcards[currentIndex].question;
        answerEl.textContent = flashcards[currentIndex].answer;
    }

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === flashcards.length - 1;
    counter.textContent = `Card ${currentIndex + 1} of ${flashcards.length}`;
    renderDots();
}

// ── Flip on card click ───────────────────────────────────────────────────────
card.addEventListener('click', () => {
    card.classList.toggle('is-flipped');
});

// ── Navigation ────────────────────────────────────────────────────────────────
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderCard();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        renderCard();
    }
});

// ── Generate via Claude API ───────────────────────────────────────────────────
generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) { topicInput.focus(); return; }

    errorMsg.style.display = 'none';
    loadingOv.classList.add('visible');
    generateBtn.disabled = true;

    const prompt = `Create exactly 5 flashcards about "${topic}".
Return ONLY a JSON array with no markdown, no backticks, no explanation.
Each object must have exactly two keys: "question" and "answer".
Keep questions concise (under 20 words) and answers concise (under 25 words).
Example format: [{"question":"...","answer":"..."},...]`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-6",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const raw = data.content.map(b => b.text || '').join('');
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid response');

        flashcards = parsed;
        currentIndex = 0;

        // Flip back to front, then load new content
        card.classList.remove('is-flipped');
        setTimeout(() => {
            questionEl.textContent = flashcards[0].question;
            answerEl.textContent = flashcards[0].answer;
            renderCard();
        }, 50);

    } catch (err) {
        console.error(err);
        errorMsg.style.display = 'block';
    } finally {
        loadingOv.classList.remove('visible');
        generateBtn.disabled = false;
    }
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderCard();