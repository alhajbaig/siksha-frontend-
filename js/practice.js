/**
 * SIKHSAATHI — Practice & Quiz Engine
 * Minimal, Clean, Modern, Fully Interactive with Server-Side Validation,
 * Persistent 10-Question Answer Keys & Real-Time Progress Sync.
 */

(function () {
  'use strict';

  let currentSubject = null;
  let currentLevel = null;
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let userAnswers = {}; // question_id -> selected_option (int)
  let quizStartTime = null;
  let latestQuizResult = null;

  function getApiUrl(path) {
    return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(path)
      : path;
  }

  function renderMath(targetEl) {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(targetEl || document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('[KaTeX Practice]', err);
      }
    }
  }

  // View Containers
  const subjectsView = document.getElementById('practice-subjects-view');
  const levelsView = document.getElementById('practice-levels-view');
  const quizView = document.getElementById('practice-quiz-view');
  const resultView = document.getElementById('practice-result-view');
  const answerKeyView = document.getElementById('practice-answer-key-view');

  // Subjects & Levels DOM
  const subjectsGrid = document.getElementById('practice-subjects-grid');
  const levelsGrid = document.getElementById('practice-levels-grid');
  const selectedSubjectTitle = document.getElementById('selected-subject-title');
  const selectedSubjectDesc = document.getElementById('selected-subject-desc');

  // Quiz DOM
  const quizSubjectBadge = document.getElementById('quiz-subject-badge');
  const quizLevelTitle = document.getElementById('quiz-level-title');
  const quizCounter = document.getElementById('quiz-counter');
  const quizProgressBar = document.getElementById('quiz-progress-bar');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const quizFeedbackBox = document.getElementById('quiz-feedback-box');
  const quizNextBtn = document.getElementById('quiz-next-btn');

  // Result DOM
  const resultScoreText = document.getElementById('result-score-text');
  const resultAccuracyText = document.getElementById('result-accuracy-text');
  const resultCorrectCount = document.getElementById('result-correct-count');
  const resultIncorrectCount = document.getElementById('result-incorrect-count');
  const resultSubtitle = document.getElementById('result-subtitle');
  const resultViewAnswersBtn = document.getElementById('result-view-answers-btn');
  const resultRetryBtn = document.getElementById('result-retry-btn');
  const resultContinueBtn = document.getElementById('result-continue-btn');

  // Answer Key DOM
  const answerKeyTitle = document.getElementById('answer-key-title');
  const answerKeySubtitle = document.getElementById('answer-key-subtitle');
  const answerKeyScorePill = document.getElementById('answer-key-score-pill');
  const answerKeyQuestionsList = document.getElementById('answer-key-questions-list');
  const answerKeyBackBtn = document.getElementById('answer-key-back-btn');
  const answerKeyToLevelsBtn = document.getElementById('answer-key-to-levels-btn');
  const answerKeyBottomContinueBtn = document.getElementById('answer-key-bottom-continue-btn');

  // Navigation Back buttons
  const backToSubjectsBtn = document.getElementById('back-to-subjects-btn');
  const exitQuizBtn = document.getElementById('exit-quiz-btn');



  /**
   * Switch between views smoothly
   */
  function switchView(viewName) {
    const views = [subjectsView, levelsView, quizView, resultView, answerKeyView];
    views.forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (viewName === 'subjects' && subjectsView) {
      subjectsView.style.display = 'block';
    } else if (viewName === 'levels' && levelsView) {
      levelsView.style.display = 'block';
    } else if (viewName === 'quiz' && quizView) {
      quizView.style.display = 'block';
    } else if (viewName === 'result' && resultView) {
      resultView.style.display = 'block';
    } else if (viewName === 'answer-key' && answerKeyView) {
      answerKeyView.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 1. Load and Render Subjects
   */
  async function loadSubjects() {
    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/practice/subjects'), { headers });
      const data = await res.json();

      if (data.status === 'success' && data.subjects) {
        renderSubjects(data.subjects);
      }
    } catch (err) {
      console.error('Failed to load practice subjects:', err);
    }
  }

  function renderSubjects(subjects) {
    if (!subjectsGrid) return;
    subjectsGrid.innerHTML = '';

    const iconMap = {
      phys: '⚡',
      chem: '🧪',
      math: '📐',
      cs: '💻',
      bio: '🧬'
    };

    subjects.forEach(subj => {
      const card = document.createElement('div');
      card.className = 'card practice-subject-card';
      card.style.cursor = 'pointer';
      card.style.transition = 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';

      const icon = iconMap[subj.id] || '📚';
      const pct = subj.progress_percent || 0;
      const completed = subj.completed_levels || 0;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--indigo-soft); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
            ${icon}
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.15rem;">${subj.title}</h3>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">5 LEVELS • 50 MCQs</div>
          </div>
        </div>
        
        <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem; min-height: 2.5rem;">
          ${subj.description}
        </p>

        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-family: var(--font-mono); margin-bottom: 0.4rem;">
            <span style="color: var(--text-muted);">PROGRESS</span>
            <strong style="color: ${completed === 5 ? 'var(--emerald-primary)' : 'var(--indigo-primary)'};">${completed} / 5 Levels (${pct}%)</strong>
          </div>
          <div style="height: 6px; background: var(--bg-secondary); border-radius: 999px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${completed === 5 ? 'var(--emerald-primary)' : 'var(--indigo-primary)'}; border-radius: 999px; transition: width 0.4s ease;"></div>
          </div>
        </div>

        <button class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.6rem 1rem;">
          <span>${completed === 5 ? 'Review Levels' : 'Select Subject'}</span>
          <span>→</span>
        </button>
      `;

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-3px)';
        card.style.borderColor = 'var(--indigo-primary)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.borderColor = 'var(--border-card)';
      });

      card.addEventListener('click', () => selectSubject(subj));
      subjectsGrid.appendChild(card);
    });
  }

  /**
   * 2. Select Subject & Load Levels
   */
  async function selectSubject(subject) {
    currentSubject = subject;
    if (selectedSubjectTitle) selectedSubjectTitle.textContent = subject.title;
    if (selectedSubjectDesc) selectedSubjectDesc.textContent = subject.description;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl(`/api/practice/subject/${subject.id}/levels`), { headers });
      const data = await res.json();

      if (data.status === 'success' && data.levels) {
        renderLevels(data.levels);
        switchView('levels');
      }
    } catch (err) {
      console.error('Failed to load levels:', err);
    }
  }

  function renderLevels(levels) {
    if (!levelsGrid) return;
    levelsGrid.innerHTML = '';

    levels.forEach(lvl => {
      const card = document.createElement('div');
      card.className = 'card practice-level-card';
      card.style.transition = 'transform 0.2s ease, border-color 0.2s ease';

      const isCompleted = lvl.status === 'completed';
      const isLocked = lvl.status === 'locked';
      const isUnlocked = lvl.status === 'unlocked';

      let statusBadge = '';
      let actionBtn = '';

      if (isCompleted) {
        card.style.borderColor = 'rgba(5, 150, 105, 0.3)';
        card.style.background = 'linear-gradient(145deg, #FFFFFF, #F6FDF9)';
        statusBadge = `<span class="badge badge-emerald">✓ COMPLETED • BEST: ${lvl.best_score}/10 (${lvl.best_accuracy}%)</span>`;
        actionBtn = `
          <button class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.55rem 1.25rem;">
            <span>Retake Quiz ↺</span>
          </button>
        `;
      } else if (isUnlocked) {
        card.style.borderColor = 'var(--indigo-primary)';
        card.style.background = '#FFFFFF';
        statusBadge = `<span class="badge badge-indigo">→ READY TO START</span>`;
        actionBtn = `
          <button class="btn btn-primary" style="font-size: 0.85rem; padding: 0.55rem 1.4rem;">
            <span>Start Quiz</span>
            <span>→</span>
          </button>
        `;
      } else {
        card.style.opacity = '0.6';
        card.style.background = 'var(--bg-secondary)';
        card.style.cursor = 'not-allowed';
        statusBadge = `<span class="badge" style="background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border-subtle);">🔒 LOCKED</span>`;
        actionBtn = `
          <button class="btn btn-ghost" disabled style="font-size: 0.82rem; color: var(--text-muted); cursor: not-allowed;">
            <span>Complete Level ${lvl.level_number - 1} First</span>
          </button>
        `;
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 0.2rem;">LEVEL ${lvl.level_number} OF 5</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${lvl.title}</h3>
          </div>
          ${statusBadge}
        </div>

        <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem;">
          ${lvl.description}
        </p>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">
            10 MCQs • 1 Mark Each • Server Scored
          </div>
          <div>
            ${actionBtn}
          </div>
        </div>
      `;

      if (!isLocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
        });
        card.addEventListener('click', () => startQuiz(lvl));
      }

      levelsGrid.appendChild(card);
    });
  }

  /**
   * 3. Start 10-Question Quiz
   */
  async function startQuiz(level) {
    currentLevel = level;
    userAnswers = {};
    currentQuestionIndex = 0;
    quizStartTime = Date.now();
    latestQuizResult = null;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl(`/api/practice/quiz/${currentSubject.id}/${level.level_number}`), { headers });
      const data = await res.json();

      if (data.status === 'success' && data.questions && data.questions.length > 0) {
        quizQuestions = data.questions;
        renderCurrentQuestion();
        switchView('quiz');
      } else {
        alert(data.detail || 'Failed to load quiz questions.');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      alert('Unable to connect to quiz server.');
    }
  }

  /**
   * Render active question (1 to 10)
   */
  function renderCurrentQuestion() {
    if (!quizQuestions || quizQuestions.length === 0) return;
    const q = quizQuestions[currentQuestionIndex];
    const qNum = currentQuestionIndex + 1;
    const totalQ = quizQuestions.length;

    // Update Header & Progress Bar
    if (quizSubjectBadge) quizSubjectBadge.textContent = `${currentSubject.title.toUpperCase()} • LEVEL ${currentLevel.level_number}`;
    if (quizLevelTitle) quizLevelTitle.textContent = `${currentLevel.title}`;
    if (quizCounter) quizCounter.textContent = `QUESTION ${qNum} OF ${totalQ}`;
    if (quizProgressBar) quizProgressBar.style.width = `${(qNum / totalQ) * 100}%`;

    // Render Question Text
    if (quizQuestionText) {
      quizQuestionText.innerHTML = q.question_text;
      renderMath(quizQuestionText);
    }

    // Reset Feedback Box
    if (quizFeedbackBox) {
      quizFeedbackBox.style.display = 'none';
      quizFeedbackBox.innerHTML = '';
      quizFeedbackBox.className = 'practice-feedback-box';
    }

    // Render 4 Options
    if (quizOptionsContainer) {
      quizOptionsContainer.innerHTML = '';
      const options = [
        { key: 0, letter: 'A', text: q.option_a },
        { key: 1, letter: 'B', text: q.option_b },
        { key: 2, letter: 'C', text: q.option_c },
        { key: 3, letter: 'D', text: q.option_d }
      ];

      const selectedOpt = userAnswers[q.id];

      options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'option-item';
        if (selectedOpt === opt.key) {
          item.classList.add('selected');
        }

        item.innerHTML = `
          <span class="option-letter">${opt.letter}</span>
          <span class="option-text">${opt.text}</span>
        `;
        renderMath(item);

        item.addEventListener('click', () => {
          selectOption(q.id, opt.key);
        });

        quizOptionsContainer.appendChild(item);
      });
    }

    // Next button label
    if (quizNextBtn) {
      quizNextBtn.disabled = false;
      quizNextBtn.innerHTML = qNum === totalQ ? `<span>Submit Quiz</span> <span>→</span>` : `<span>Next Question</span> <span>→</span>`;
    }
  }

  function selectOption(questionId, optionIndex) {
    userAnswers[questionId] = optionIndex;

    // Highlight selected item
    if (quizOptionsContainer) {
      const items = quizOptionsContainer.querySelectorAll('.option-item');
      items.forEach((item, idx) => {
        if (idx === optionIndex) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  /**
   * Handle Next / Submit Quiz click with duplicate submission protection
   */
  async function handleNextQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    if (userAnswers[q.id] === undefined) {
      alert('Please select an option before proceeding.');
      return;
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
      renderCurrentQuestion();
    } else {
      // Final question — submit quiz to server
      await submitQuiz();
    }
  }

  /**
   * 4. Server-Side Submit Quiz (Atomic Transaction)
   */
  async function submitQuiz() {
    if (quizNextBtn) {
      quizNextBtn.disabled = true;
      quizNextBtn.innerHTML = `<span>Evaluating Answers...</span>`;
    }

    const timeSpent = Math.round((Date.now() - (quizStartTime || Date.now())) / 1000);
    const answersPayload = (quizQuestions && quizQuestions.length > 0 ? quizQuestions : Object.keys(userAnswers).map(id => ({ id }))).map(q => {
      const qId = q.id;
      const sel = userAnswers[qId];
      return {
        question_id: qId,
        selected_option: (sel !== undefined && sel !== null) ? parseInt(sel, 10) : -1
      };
    });

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {})
      };

      const res = await fetch(getApiUrl('/api/practice/quiz/submit'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject_id: currentSubject.id,
          level_number: currentLevel.level_number,
          answers: answersPayload,
          time_spent_seconds: timeSpent
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.result) {
        latestQuizResult = data.result;
        renderResult(data.result);
        switchView('result');

        // Trigger global progress sync across all pages
        if (window.SikshaSession) {
          window.SikshaSession.fetchCurrentUser();
        }
      } else {
        alert(data.detail || 'Failed to submit quiz.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz to server.');
    } finally {
      if (quizNextBtn) {
        quizNextBtn.disabled = false;
      }
    }
  }

  /**
   * 5. Render Clean Result Screen
   */
  function renderResult(result) {
    const score = result.score;
    const total = result.total_questions;
    const accuracy = result.accuracy_percent;
    const incorrect = total - score;

    if (resultScoreText) resultScoreText.textContent = `${score} / ${total}`;
    if (resultAccuracyText) resultAccuracyText.textContent = `${accuracy}% Accuracy`;
    if (resultCorrectCount) resultCorrectCount.textContent = score;
    if (resultIncorrectCount) resultIncorrectCount.textContent = incorrect;

    if (resultSubtitle) {
      if (score >= 8) {
        resultSubtitle.textContent = 'Outstanding mastery! You have unlocked the next stage in your Learning Genome.';
      } else if (score >= 5) {
        resultSubtitle.textContent = 'Solid effort. Review the step-by-step solutions below to turn mistakes into strengths.';
      } else {
        resultSubtitle.textContent = 'Keep practicing. Solid foundation comes from repeated diagnostic practice.';
      }
    }

    // Setup action buttons
    if (resultViewAnswersBtn) {
      resultViewAnswersBtn.onclick = () => {
        if (latestQuizResult) {
          renderAnswerKey(latestQuizResult);
          switchView('answer-key');
        }
      };
    }
    if (resultRetryBtn) {
      resultRetryBtn.onclick = () => startQuiz(currentLevel);
    }
    if (resultContinueBtn) {
      resultContinueBtn.onclick = () => selectSubject(currentSubject);
    }

    const studyNotesBtn = document.getElementById('result-study-notes-btn');
    if (studyNotesBtn && currentSubject) {
      studyNotesBtn.href = `student-notes.html?subject=${encodeURIComponent(currentSubject.id)}`;
    }

    const flashcardsBtn = document.getElementById('result-flashcards-btn');
    if (flashcardsBtn && currentSubject) {
      flashcardsBtn.href = `student-flashcards.html?deck=${encodeURIComponent(currentSubject.id)}`;
    }
  }

  /**
   * 6. Render Full 10-Question Answer Key & Step-by-Step Solutions
   */
  function renderAnswerKey(resultData) {
    if (!answerKeyQuestionsList) return;
    answerKeyQuestionsList.innerHTML = '';

    const score = resultData.score;
    const total = resultData.total_questions;
    const accuracy = resultData.accuracy_percent;
    const answersReview = resultData.answers_review || [];

    if (answerKeyTitle) {
      answerKeyTitle.textContent = `${(currentSubject?.title || resultData.subject_title || 'Quiz').toUpperCase()} • LEVEL ${resultData.level_number} ANSWER KEY`;
    }
    if (answerKeySubtitle) {
      answerKeySubtitle.textContent = `Completed with ${score} of ${total} correct (${accuracy}% accuracy). Verified explanations from the Master Question Bank.`;
    }
    if (answerKeyScorePill) {
      const isGood = score >= 7;
      answerKeyScorePill.innerHTML = `
        <span class="badge ${isGood ? 'badge-emerald' : 'badge-indigo'}" style="font-size: 0.9rem; padding: 0.45rem 1rem;">
          ${isGood ? '✓' : '●'} SCORE: ${score} / ${total} (${accuracy}%)
        </span>
      `;
    }

    const letters = ['A', 'B', 'C', 'D'];

    answersReview.forEach((item, index) => {
      const qNum = index + 1;
      const isCorrect = item.is_correct;
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '1.5rem 1.75rem';
      card.style.borderLeft = isCorrect ? '4px solid var(--emerald-primary)' : '4px solid var(--rose-accent)';
      card.style.background = isCorrect ? 'linear-gradient(145deg, #FFFFFF, #F7FCF9)' : 'linear-gradient(145deg, #FFFFFF, #FFF9F9)';

      const userOptLetter = item.selected_option >= 0 ? letters[item.selected_option] : 'None';
      const userOptText = item.selected_option >= 0 ? item.options[item.selected_option] : 'Unanswered';

      const correctOptLetter = letters[item.correct_option];
      const correctOptText = item.options[item.correct_option];

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
          <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted); font-weight: 700;">
            QUESTION ${qNum} OF ${total} ${item.topic ? '• ' + item.topic.toUpperCase() : ''}
          </div>
          <span class="badge ${isCorrect ? 'badge-emerald' : 'badge-rose'}" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;">
            ${isCorrect ? '✓ CORRECT' : '✕ INCORRECT'}
          </span>
        </div>

        <div class="question-text" style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); line-height: 1.5; margin-bottom: 1.25rem;">
          ${item.question_text}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.86rem; ${isCorrect ? 'background: rgba(25, 184, 107, 0.1); border: 1px solid rgba(25, 184, 107, 0.3); color: #0F5132;' : 'background: rgba(235, 87, 87, 0.1); border: 1px solid rgba(235, 87, 87, 0.3); color: #842029;'}">
            <strong>Your Choice (${userOptLetter}):</strong> ${userOptText}
          </div>

          <div style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.86rem; background: rgba(25, 184, 107, 0.1); border: 1px solid rgba(25, 184, 107, 0.3); color: #0F5132;">
            <strong>Correct Key (${correctOptLetter}):</strong> ${correctOptText}
          </div>
        </div>

        <div style="padding: 0.9rem 1.15rem; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-subtle); font-size: 0.86rem; color: var(--text-muted); line-height: 1.6;">
          <strong style="color: var(--text-main); display: block; margin-bottom: 0.3rem;">💡 Step-by-Step Educational Explanation:</strong>
          <span>${item.explanation}</span>
        </div>
      `;

      renderMath(card);
      answerKeyQuestionsList.appendChild(card);
    });
  }

  /**
   * Load and render historical review by attempt ID (Used when clicking past attempts from Dashboard / History)
   */
  async function loadAndRenderHistoricalReview(attemptId) {
    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl(`/api/practice/attempt/${attemptId}/review`), { headers });
      const data = await res.json();

      if (data.status === 'success' && data.attempt) {
        latestQuizResult = data.attempt;
        renderAnswerKey(data.attempt);
        switchView('answer-key');
      } else {
        alert(data.detail || 'Unable to load attempt review.');
      }
    } catch (err) {
      console.error('Failed to load historical review:', err);
      alert('Error fetching answer key.');
    }
  }

  // Export globally for cross-module integration
  window.SikshaPractice = {
    loadSubjects,
    selectSubject,
    startQuiz,
    loadAndRenderHistoricalReview
  };

  // Initialize Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for direct deep-linking
    const urlParams = new URLSearchParams(window.location.search);
    const reviewParam = urlParams.get('review') || urlParams.get('attempt');
    const subjectParam = urlParams.get('subject');
    const levelParam = urlParams.get('level');

    if (reviewParam) {
      loadAndRenderHistoricalReview(reviewParam);
    } else if (subjectParam) {
      loadSubjects().then(() => {
        fetch(getApiUrl('/api/practice/subjects'), { headers: window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {} })
          .then(r => r.json())
          .then(data => {
            const subj = (data.subjects || []).find(s => s.id === subjectParam);
            if (subj) {
              selectSubject(subj).then(() => {
                if (levelParam) {
                  const lvl = parseInt(levelParam, 10);
                  if (lvl >= 1 && lvl <= 5) {
                    startQuiz(lvl);
                  }
                }
              });
            }
          });
      });
    } else {
      loadSubjects();
    }

    if (quizNextBtn) {
      quizNextBtn.addEventListener('click', handleNextQuestion);
    }

    if (backToSubjectsBtn) {
      backToSubjectsBtn.addEventListener('click', () => {
        loadSubjects();
        switchView('subjects');
      });
    }

    if (exitQuizBtn) {
      exitQuizBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit this quiz? Your current question answers will not be saved.')) {
          selectSubject(currentSubject);
        }
      });
    }

    if (answerKeyBackBtn) {
      answerKeyBackBtn.addEventListener('click', () => {
        switchView('result');
      });
    }

    if (answerKeyToLevelsBtn || answerKeyBottomContinueBtn) {
      const handleToLevels = () => {
        if (currentSubject) {
          selectSubject(currentSubject);
        } else {
          loadSubjects();
          switchView('subjects');
        }
      };
      if (answerKeyToLevelsBtn) answerKeyToLevelsBtn.addEventListener('click', handleToLevels);
      if (answerKeyBottomContinueBtn) answerKeyBottomContinueBtn.addEventListener('click', handleToLevels);
    }
  });

})();
