/**
 * SIKSHA SAATHI — DIAGNOSTIC ASSESSMENTS & EXAM SIMULATOR
 * High-fidelity test-taking client with:
 * - Dynamic catalog loading & search/category filtering
 * - Full Timed Exam Simulator with proctor countdown timer
 * - Interactive Question Matrix Palette (answered, current, flagged)
 * - Step-by-step KaTeX math rendering
 * - Real-time scoring, Gaussian percentiles, and instant diagnostic scorecards
 */

(function () {
  'use strict';

  function getApiUrl(path) {
    return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(path)
      : path;
  }

  // State Management
  let allAssessments = [];
  let currentCategory = 'all';
  let searchQuery = '';

  let activeSession = null;
  let currentQuestionIndex = 0;
  let studentAnswers = {}; // question_id -> selected_option_int
  let flaggedIndices = new Set();
  let timerInterval = null;
  let timeRemaining = 0;
  let totalTestDuration = 0;

  // DOM Elements
  const catalogGrid = document.getElementById('assessment-catalog-grid');
  const searchInput = document.getElementById('assessment-search-input');
  const categoryPillsContainer = document.getElementById('asmt-category-pills');

  const heroTitle = document.getElementById('hero-rec-title');
  const heroSubtitle = document.getElementById('hero-rec-subtitle');
  const heroDuration = document.getElementById('hero-rec-duration');
  const heroQuestions = document.getElementById('hero-rec-questions');
  const heroPercentile = document.getElementById('hero-predicted-percentile');
  const heroStartBtn = document.getElementById('hero-start-exam-btn');

  const examModal = document.getElementById('exam-simulator-modal');
  const closeExamBtn = document.getElementById('close-exam-btn');
  const examTitle = document.getElementById('exam-modal-title');
  const examBadge = document.getElementById('exam-modal-badge');
  const examTimer = document.getElementById('exam-countdown-timer');
  const examIndexChip = document.getElementById('exam-question-index-chip');
  const examTopicChip = document.getElementById('exam-topic-chip');
  const examQuestionText = document.getElementById('exam-question-text');
  const examOptionsContainer = document.getElementById('exam-options-container');
  const examPaletteGrid = document.getElementById('exam-palette-grid');
  const examAnsweredCounter = document.getElementById('exam-answered-counter');
  const examPrevBtn = document.getElementById('exam-prev-btn');
  const examNextBtn = document.getElementById('exam-next-btn');
  const examFlagBtn = document.getElementById('exam-flag-btn');
  const examClearBtn = document.getElementById('exam-clear-btn');
  const submitExamBtn = document.getElementById('submit-exam-btn');

  const scorecardModal = document.getElementById('exam-scorecard-modal');
  const closeScorecardBtn = document.getElementById('close-scorecard-btn');
  const scorecardTitle = document.getElementById('scorecard-title');
  const scorecardSubtitle = document.getElementById('scorecard-subtitle');
  const scorecardAccuracy = document.getElementById('scorecard-accuracy');
  const scorecardScore = document.getElementById('scorecard-score');
  const scorecardPercentile = document.getElementById('scorecard-percentile');
  const scorecardTime = document.getElementById('scorecard-time');
  const scorecardSubjectBreakdown = document.getElementById('scorecard-subject-breakdown');
  const scorecardStrongTopics = document.getElementById('scorecard-strong-topics');
  const scorecardWeakTopics = document.getElementById('scorecard-weak-topics');
  const scorecardSolutionsList = document.getElementById('scorecard-solutions-list');
  const scorecardBackCatalogBtn = document.getElementById('scorecard-back-catalog-btn');

  // Math Rendering Helper
  function renderMath(container) {
    if (!container) return;
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    }
  }

  // Get Auth Headers
  function getHeaders() {
    const token = window.SikshaSession ? window.SikshaSession.getToken() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Auth-Token'] = token;
    }
    return headers;
  }

  // =========================================================================
  // 1. CATALOG LOADING & FILTERING
  // =========================================================================
  async function loadAssessmentCatalog() {
    try {
      const res = await fetch(getApiUrl('/api/assessments/catalog'), { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.status !== 'success' || !body.data) return;

      const data = body.data;
      allAssessments = data.assessments || [];

      // Update Hero Section
      if (heroPercentile && data.predicted_percentile) {
        heroPercentile.innerHTML = `${data.predicted_percentile}<span style="font-size: 1.1rem; color: var(--emerald-primary);">%ile</span>`;
      }

      if (allAssessments.length > 0) {
        const heroTest = allAssessments[0];
        if (heroTitle) heroTitle.textContent = heroTest.title;
        if (heroSubtitle) heroSubtitle.textContent = heroTest.subtitle;
        if (heroDuration) heroDuration.textContent = `⏱ ${heroTest.duration_minutes} min duration`;
        if (heroQuestions) heroQuestions.textContent = `📋 ${heroTest.total_questions} questions`;
        if (heroStartBtn) heroStartBtn.setAttribute('data-assessment-id', heroTest.id);
      }

      renderCatalog();
    } catch (err) {
      console.error('Failed to load assessment catalog:', err);
      if (catalogGrid) {
        catalogGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--rose-accent);">
            Failed to connect to assessment service. Please check server status.
          </div>
        `;
      }
    }
  }

  function renderCatalog() {
    if (!catalogGrid) return;

    let filtered = allAssessments.filter(test => {
      // Category filter
      if (currentCategory !== 'all') {
        const cat = (test.category || '').toLowerCase();
        const subjs = (test.subjects || []).map(s => s.toLowerCase());
        if (currentCategory === 'multi-subject' && cat !== 'multi-subject') return false;
        if (currentCategory === 'physics' && !subjs.includes('phys') && !subjs.includes('physics')) return false;
        if (currentCategory === 'chemistry' && !subjs.includes('chem') && !subjs.includes('chemistry')) return false;
        if (currentCategory === 'mathematics' && !subjs.includes('math') && !subjs.includes('mathematics')) return false;
        if (currentCategory === 'cs' && !subjs.includes('cs') && !subjs.includes('computer_science')) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = test.title.toLowerCase().includes(q);
        const matchSub = (test.subtitle || '').toLowerCase().includes(q);
        const matchTags = (test.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSub && !matchTags) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          No assessments found matching "${searchQuery}".
        </div>
      `;
      return;
    }

    catalogGrid.innerHTML = filtered.map(test => {
      let badgeClass = 'badge-indigo';
      if (test.category === 'physics') badgeClass = 'badge-emerald';
      if (test.category === 'chemistry') badgeClass = 'badge-amber';
      if (test.category === 'cs') badgeClass = 'badge-soft';

      let lastAttemptHtml = '';
      if (test.last_attempt) {
        const la = test.last_attempt;
        lastAttemptHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(25, 184, 107, 0.08); border: 1px solid rgba(25, 184, 107, 0.2); border-radius: 8px; padding: 0.4rem 0.65rem; margin-top: 0.5rem; font-size: 0.75rem;">
            <span style="color: var(--emerald-primary); font-weight: 700;">✓ Completed: ${la.accuracy_percent}%</span>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-main);">${la.percentile}%ile</span>
          </div>
        `;
      }

      const tagsHtml = (test.tags || []).map(t => `
        <span style="font-size: 0.68rem; font-family: var(--font-mono); background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.2rem 0.45rem; border-radius: 4px; color: var(--text-muted);">${t}</span>
      `).join('');

      return `
        <div class="assessment-item-card" data-card-id="${test.id}" style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="badge ${badgeClass}">${test.badge || test.category.toUpperCase()}</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
              ⏱ ${test.duration_minutes} MIN • ${test.total_questions} Qs
            </span>
          </div>

          <h3 style="font-size: 1.12rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; line-height: 1.35;">
            ${test.title}
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.75rem;">
            ${test.subtitle}
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.75rem;">
            ${tagsHtml}
          </div>

          ${lastAttemptHtml}

          <div style="margin-top: auto; padding-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-primary start-test-btn" data-assessment-id="${test.id}" style="flex: 1; justify-content: space-between; padding: 0.65rem 1rem; font-size: 0.85rem;">
              <span>${test.last_attempt ? 'Retake Exam' : 'Start Test'}</span>
              <span>⚡</span>
            </button>
            ${test.last_attempt ? `
              <button class="btn btn-secondary view-past-scorecard-btn" data-attempt-id="${test.last_attempt.attempt_id}" title="Review Scorecard" style="padding: 0.65rem 0.85rem;">
                📊
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to test launch buttons
    catalogGrid.querySelectorAll('.start-test-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const asmtId = btn.getAttribute('data-assessment-id');
        if (asmtId) launchAssessment(asmtId);
      });
    });

    catalogGrid.querySelectorAll('.view-past-scorecard-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const attId = btn.getAttribute('data-attempt-id');
        if (attId) viewPastScorecard(attId);
      });
    });
  }

  // Category filter clicks
  if (categoryPillsContainer) {
    categoryPillsContainer.querySelectorAll('.asmt-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryPillsContainer.querySelectorAll('.asmt-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category') || 'all';
        renderCatalog();
      });
    });
  }

  // Live search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCatalog();
    });
  }

  // Hero Start Button
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => {
      const asmtId = heroStartBtn.getAttribute('data-assessment-id') || 'jee-mock-3';
      launchAssessment(asmtId);
    });
  }

  // =========================================================================
  // 2. EXAM SIMULATOR LAUNCH & SESSION MANAGEMENT
  // =========================================================================
  async function launchAssessment(assessmentId) {
    const originalBtnText = heroStartBtn ? heroStartBtn.innerHTML : '';
    if (heroStartBtn) heroStartBtn.innerHTML = '<span>Synthesizing Exam...</span><span>⏳</span>';

    try {
      const res = await fetch(getApiUrl(`/api/assessments/${assessmentId}/start`), {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const body = await res.json();
      if (body.status !== 'success' || !body.data) throw new Error('Invalid test payload.');

      activeSession = body.data;
      currentQuestionIndex = 0;
      studentAnswers = {};
      flaggedIndices.clear();

      totalTestDuration = activeSession.duration_seconds || 1500;
      timeRemaining = totalTestDuration;

      // Update Modal Header
      if (examTitle) examTitle.textContent = activeSession.title;
      if (examBadge) examBadge.textContent = `${activeSession.marking.correct} / ${activeSession.marking.incorrect} MARKING`;

      // Start countdown timer
      startExamTimer();

      // Open Modal
      if (examModal) examModal.classList.add('open');

      // Render Question 0 & Palette
      renderPalette();
      renderCurrentQuestion();

    } catch (err) {
      console.error('Failed to start assessment:', err);
      alert(`Could not launch assessment: ${err.message}`);
    } finally {
      if (heroStartBtn) heroStartBtn.innerHTML = originalBtnText;
    }
  }

  function startExamTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert('Time is up! Submitting your assessment automatically.');
        submitAssessment(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!examTimer) return;
    const mins = Math.floor(Math.max(timeRemaining, 0) / 60);
    const secs = Math.max(timeRemaining, 0) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    examTimer.textContent = formatted;

    if (timeRemaining < 300) {
      examTimer.classList.add('exam-timer-warning');
    } else {
      examTimer.classList.remove('exam-timer-warning');
    }
  }

  // =========================================================================
  // 3. QUESTION RENDERING & PALETTE INTERACTION
  // =========================================================================
  function renderCurrentQuestion() {
    if (!activeSession || !activeSession.questions || activeSession.questions.length === 0) return;

    const q = activeSession.questions[currentQuestionIndex];
    const total = activeSession.questions.length;

    // Header Meta
    if (examIndexChip) {
      examIndexChip.textContent = `QUESTION ${currentQuestionIndex + 1} OF ${total} • ${q.subject_id.toUpperCase()}`;
    }
    if (examTopicChip) {
      examTopicChip.textContent = q.topic;
    }

    // Question Prompt
    if (examQuestionText) {
      examQuestionText.innerHTML = q.question_text;
      renderMath(examQuestionText);
    }

    // Options Grid
    if (examOptionsContainer) {
      const selectedOpt = studentAnswers[q.question_id];

      examOptionsContainer.innerHTML = q.options.map((opt, i) => {
        const isSelected = selectedOpt !== undefined && selectedOpt === opt.index;
        return `
          <div class="exam-option-card ${isSelected ? 'selected' : ''}" data-option-index="${opt.index}">
            <span class="opt-badge">${opt.label}</span>
            <div class="opt-text" style="font-size: 0.95rem; color: var(--text-main); line-height: 1.5; flex: 1;">
              ${opt.text}
            </div>
          </div>
        `;
      }).join('');

      renderMath(examOptionsContainer);

      // Attach option click listeners
      examOptionsContainer.querySelectorAll('.exam-option-card').forEach(card => {
        card.addEventListener('click', () => {
          const optIdx = parseInt(card.getAttribute('data-option-index'), 10);
          studentAnswers[q.question_id] = optIdx;

          // Remove flag if answered
          flaggedIndices.delete(currentQuestionIndex);

          renderCurrentQuestion();
          renderPalette();
        });
      });
    }

    // Update Navigation Buttons
    if (examPrevBtn) {
      examPrevBtn.disabled = (currentQuestionIndex === 0);
      examPrevBtn.style.opacity = (currentQuestionIndex === 0) ? '0.5' : '1';
    }

    if (examNextBtn) {
      if (currentQuestionIndex === total - 1) {
        examNextBtn.textContent = 'Finish & Submit ✓';
      } else {
        examNextBtn.textContent = 'Next →';
      }
    }

    if (examFlagBtn) {
      const isFlagged = flaggedIndices.has(currentQuestionIndex);
      examFlagBtn.style.background = isFlagged ? 'var(--amber-accent)' : '';
      examFlagBtn.style.color = isFlagged ? '#FFFFFF' : 'var(--amber-accent)';
      examFlagBtn.textContent = isFlagged ? '⚐ Flagged' : '⚐ Mark for Review';
    }
  }

  function renderPalette() {
    if (!activeSession || !activeSession.questions || !examPaletteGrid) return;

    const questions = activeSession.questions;
    const answeredCount = Object.keys(studentAnswers).length;

    if (examAnsweredCounter) {
      examAnsweredCounter.textContent = `${answeredCount}/${questions.length} Answered`;
    }

    examPaletteGrid.innerHTML = questions.map((q, idx) => {
      let statusClass = '';
      if (idx === currentQuestionIndex) {
        statusClass = 'current';
      } else if (flaggedIndices.has(idx)) {
        statusClass = 'flagged';
      } else if (studentAnswers[q.question_id] !== undefined) {
        statusClass = 'answered';
      }

      return `
        <button class="palette-number-btn ${statusClass}" data-goto-index="${idx}">
          ${idx + 1}
        </button>
      `;
    }).join('');

    examPaletteGrid.querySelectorAll('.palette-number-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetIdx = parseInt(btn.getAttribute('data-goto-index'), 10);
        if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < questions.length) {
          currentQuestionIndex = targetIdx;
          renderCurrentQuestion();
          renderPalette();
        }
      });
    });
  }

  // Navigation handlers
  if (examPrevBtn) {
    examPrevBtn.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
        renderPalette();
      }
    });
  }

  if (examNextBtn) {
    examNextBtn.addEventListener('click', () => {
      if (!activeSession) return;
      if (currentQuestionIndex < activeSession.questions.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
        renderPalette();
      } else {
        // Last question -> Confirm submission
        submitAssessment(false);
      }
    });
  }

  if (examFlagBtn) {
    examFlagBtn.addEventListener('click', () => {
      if (flaggedIndices.has(currentQuestionIndex)) {
        flaggedIndices.delete(currentQuestionIndex);
      } else {
        flaggedIndices.add(currentQuestionIndex);
      }
      renderCurrentQuestion();
      renderPalette();
    });
  }

  if (examClearBtn) {
    examClearBtn.addEventListener('click', () => {
      if (!activeSession) return;
      const q = activeSession.questions[currentQuestionIndex];
      delete studentAnswers[q.question_id];
      renderCurrentQuestion();
      renderPalette();
    });
  }

  if (closeExamBtn) {
    closeExamBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit the exam? Your progress will be evaluated based on answered questions.')) {
        clearInterval(timerInterval);
        if (examModal) examModal.classList.remove('open');
      }
    });
  }

  if (submitExamBtn) {
    submitExamBtn.addEventListener('click', () => {
      submitAssessment(false);
    });
  }

  // =========================================================================
  // 4. ASSESSMENT SUBMISSION & SCORECARD ENGINE
  // =========================================================================
  async function submitAssessment(isAutoSubmit = false) {
    if (!activeSession) return;

    const totalQs = activeSession.questions.length;
    const answeredQs = Object.keys(studentAnswers).length;
    const unattempted = totalQs - answeredQs;

    clearInterval(timerInterval);
    const timeSpentSeconds = Math.max(1, totalTestDuration - timeRemaining);

    if (submitExamBtn) {
      submitExamBtn.disabled = true;
      submitExamBtn.textContent = 'Calculating Scorecard...';
    }

    try {
      const payload = {
        session_id: activeSession.session_id,
        answers: studentAnswers,
        time_spent_seconds: timeSpentSeconds
      };

      const res = await fetch(getApiUrl(`/api/assessments/${activeSession.assessment_id}/submit`), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const body = await res.json();
      if (body.status !== 'success' || !body.data) throw new Error('Invalid submission response.');

      // Close Exam Simulator Modal
      if (examModal) examModal.classList.remove('open');

      // Open Diagnostic Scorecard Modal
      renderScorecard(body.data);
      if (scorecardModal) scorecardModal.classList.add('open');

      // Refresh catalog to display updated completion badges
      loadAssessmentCatalog();

    } catch (err) {
      console.error('Failed to submit assessment:', err);
      alert(`Submission error: ${err.message}`);
    } finally {
      if (submitExamBtn) {
        submitExamBtn.disabled = false;
        submitExamBtn.textContent = 'Submit Assessment ✓';
      }
    }
  }

  // =========================================================================
  // 5. SCORECARD PRESENTATION & SOLUTIONS REVIEW
  // =========================================================================
  function renderScorecard(data) {
    if (!data) return;

    if (scorecardTitle) scorecardTitle.textContent = `${data.title} — Diagnostic Scorecard`;
    if (scorecardSubtitle) {
      scorecardSubtitle.textContent = `Completed on ${new Date(data.completed_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Authenticated with SQLite`;
    }

    // Top primary metrics
    if (scorecardAccuracy) scorecardAccuracy.textContent = `${data.accuracy_percent}%`;
    if (scorecardScore) scorecardScore.textContent = `${data.score}/${data.max_score}`;
    if (scorecardPercentile) scorecardPercentile.textContent = `${data.percentile}%ile`;
    
    if (scorecardTime) {
      const m = Math.floor((data.time_spent_seconds || 0) / 60);
      const s = (data.time_spent_seconds || 0) % 60;
      scorecardTime.textContent = `${m}m ${s}s`;
    }

    // Subject Performance Breakdown
    if (scorecardSubjectBreakdown) {
      const breakdown = data.subject_breakdown || [];
      if (breakdown.length === 0) {
        scorecardSubjectBreakdown.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted);">No subject breakdown available.</div>`;
      } else {
        scorecardSubjectBreakdown.innerHTML = breakdown.map(s => {
          let barColor = 'var(--indigo-primary)';
          if (s.subject_id === 'phys') barColor = 'var(--emerald-primary)';
          if (s.subject_id === 'chem') barColor = 'var(--amber-accent)';

          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.25rem;">
                <span style="color: var(--text-main);">${s.subject} (${s.correct}/${s.total} correct)</span>
                <span style="color: ${barColor}; font-family: var(--font-mono); font-weight: 700;">${s.accuracy}% • Score: ${s.score}</span>
              </div>
              <div style="height: 7px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden;">
                <div style="width: ${Math.min(100, s.accuracy)}%; height: 100%; background: ${barColor}; border-radius: 999px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Cognitive Strengths & Weaknesses
    if (scorecardStrongTopics) {
      const strong = data.strong_topics || [];
      if (strong.length === 0) {
        scorecardStrongTopics.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">None with ≥70% accuracy</span>`;
      } else {
        scorecardStrongTopics.innerHTML = strong.map(t => `
          <span style="font-size: 0.75rem; font-weight: 600; background: rgba(25, 184, 107, 0.12); color: var(--emerald-primary); padding: 0.25rem 0.6rem; border-radius: 6px;">
            ✓ ${t}
          </span>
        `).join('');
      }
    }

    if (scorecardWeakTopics) {
      const weak = data.weak_topics || [];
      if (weak.length === 0) {
        scorecardWeakTopics.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">No weak topics identified!</span>`;
      } else {
        scorecardWeakTopics.innerHTML = weak.map(t => `
          <span style="font-size: 0.75rem; font-weight: 600; background: rgba(239, 68, 68, 0.12); color: var(--rose-accent); padding: 0.25rem 0.6rem; border-radius: 6px;">
            ⚠ ${t}
          </span>
        `).join('');
      }
    }

    // Detailed Solutions List
    if (scorecardSolutionsList) {
      const solutions = data.solutions || [];
      if (solutions.length === 0) {
        scorecardSolutionsList.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">No solution details provided.</div>`;
      } else {
        scorecardSolutionsList.innerHTML = solutions.map((sol, idx) => {
          let cardType = 'skipped';
          let statusLabel = '⚠ SKIPPED';
          let badgeBg = 'var(--amber-accent)';

          if (sol.is_attempted) {
            if (sol.is_correct) {
              cardType = 'correct';
              statusLabel = '✓ CORRECT (+4)';
              badgeBg = 'var(--emerald-primary)';
            } else {
              cardType = 'incorrect';
              statusLabel = '✕ INCORRECT (-1)';
              badgeBg = 'var(--rose-accent)';
            }
          }

          const optionsHtml = (sol.options || []).map((optText, oIdx) => {
            const isStudentPick = (sol.selected_option === oIdx);
            const isCorrectOption = (sol.correct_option === oIdx);

            let optStyle = 'border: 1px solid var(--border-subtle); background: var(--bg-card);';
            let pillBadge = '';

            if (isCorrectOption) {
              optStyle = 'border: 1.5px solid var(--emerald-primary); background: rgba(25, 184, 107, 0.08);';
              pillBadge = '<span style="color: var(--emerald-primary); font-weight: 700; font-size: 0.72rem; margin-left: auto;">CORRECT ANSWER</span>';
            } else if (isStudentPick && !sol.is_correct) {
              optStyle = 'border: 1.5px solid var(--rose-accent); background: rgba(239, 68, 68, 0.08);';
              pillBadge = '<span style="color: var(--rose-accent); font-weight: 700; font-size: 0.72rem; margin-left: auto;">YOUR SELECTION</span>';
            }

            return `
              <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; margin-bottom: 0.4rem; ${optStyle}">
                <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.78rem;">${chr(65 + oIdx)}</span>
                <span style="font-size: 0.88rem; color: var(--text-main);">${optText}</span>
                ${pillBadge}
              </div>
            `;
          }).join('');

          return `
            <div class="solution-review-card ${cardType}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--text-main);">
                    Q${idx + 1}.
                  </span>
                  <span class="badge badge-soft" style="font-size: 0.72rem;">${sol.topic}</span>
                </div>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: #FFFFFF; background: ${badgeBg}; padding: 0.2rem 0.5rem; border-radius: 4px;">
                  ${statusLabel}
                </span>
              </div>

              <div class="solution-q-text" style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); line-height: 1.5; margin-bottom: 0.75rem;">
                ${sol.question_text}
              </div>

              <div class="solution-options-wrap" style="margin-bottom: 0.85rem;">
                ${optionsHtml}
              </div>

              <div class="solution-explanation-box" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem 1rem;">
                <div style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: var(--indigo-primary); margin-bottom: 0.35rem; text-transform: uppercase;">
                  STEP-BY-STEP ANALYTICAL SOLUTION
                </div>
                <div class="explanation-katex" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                  ${sol.explanation}
                </div>
              </div>

              <div style="margin-top: 0.75rem; text-align: right;">
                <a href="student-revision.html" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem; display: inline-flex;">
                  ⚡ Revise "${sol.topic}"
                </a>
              </div>
            </div>
          `;
        }).join('');

        renderMath(scorecardSolutionsList);
      }
    }
  }

  function chr(code) {
    return String.fromCharCode(code);
  }

  async function viewPastScorecard(attemptId) {
    try {
      const res = await fetch(getApiUrl(`/api/assessments/attempt/${attemptId}`), { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.status !== 'success' || !body.data) throw new Error('Attempt record not found.');

      renderScorecard(body.data);
      if (scorecardModal) scorecardModal.classList.add('open');
    } catch (err) {
      console.error('Failed to view past scorecard:', err);
      alert('Could not retrieve scorecard for this attempt.');
    }
  }

  if (closeScorecardBtn) {
    closeScorecardBtn.addEventListener('click', () => {
      if (scorecardModal) scorecardModal.classList.remove('open');
    });
  }

  if (scorecardBackCatalogBtn) {
    scorecardBackCatalogBtn.addEventListener('click', () => {
      if (scorecardModal) scorecardModal.classList.remove('open');
    });
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    loadAssessmentCatalog();
  });

})();
