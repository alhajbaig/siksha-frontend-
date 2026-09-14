/* ==========================================================================
   SIKSHA SAATHI — SMART REVISION & FORGETTING PREDICTION ENGINE
   Canonical Telemetry • Evidence-First Signals • Interactive Revision Studio
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  function getApiUrl(path) {
    return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(path)
      : path;
  }

  // State
  let _revisionData = null;
  let _activeQueueFilter = 'needs_attention';
  let _activeTimeBudget = 15;
  let _currentStudioSession = null;
  let _studioStepIndex = 0;
  let _studioScore = 0;
  let _studioTotalQuestions = 0;
  let _studioTimerInterval = null;
  let _studioSecondsElapsed = 0;

  // DOM Elements - Dashboard
  const elEmptyState = document.getElementById('revision-empty-state');
  const elMainDashboard = document.getElementById('revision-main-dashboard');
  const elStatDue = document.getElementById('rev-stat-due');
  const elStatRetention = document.getElementById('rev-stat-retention');
  const elStatCompleted = document.getElementById('rev-stat-completed');
  const elStatStreak = document.getElementById('rev-stat-streak');

  // Hero Card Elements
  const elHeroTopic = document.getElementById('rev-hero-topic');
  const elHeroSubject = document.getElementById('rev-hero-subject');
  const elHeroUrgency = document.getElementById('rev-hero-urgency');
  const elHeroExplanation = document.getElementById('rev-hero-explanation');
  const elHeroEvidenceStrip = document.getElementById('rev-hero-evidence-strip');
  const elHeroTimeBtns = document.querySelectorAll('.revision-time-btn');
  const elHeroStepsStrip = document.getElementById('rev-hero-steps-strip');
  const elHeroResourcesStrip = document.getElementById('rev-hero-resources-strip');
  const elHeroStartBtn = document.getElementById('rev-hero-start-btn');
  const elHeroInspectBtn = document.getElementById('rev-hero-inspect-btn');

  // Queue Elements
  const elQueueTabs = document.querySelectorAll('.revision-queue-tab');
  const elTopicsGrid = document.getElementById('revision-topics-grid');

  // History Elements
  const elHistoryTableBody = document.getElementById('revision-history-table-body');
  const elHistoryEmpty = document.getElementById('revision-history-empty');

  // Evidence Modal Elements
  const elEvidenceModal = document.getElementById('revision-evidence-modal');
  const elEvidenceModalClose = document.getElementById('revision-evidence-modal-close');
  const elEvidenceModalTitle = document.getElementById('evidence-modal-topic-title');
  const elEvidenceModalSubject = document.getElementById('evidence-modal-topic-subject');
  const elEvidenceModalExplanation = document.getElementById('evidence-modal-explanation');
  const elEvidenceModalSignals = document.getElementById('evidence-modal-signals-list');

  // Studio Elements
  const elStudioOverlay = document.getElementById('revision-studio-overlay');
  const elStudioExitBtn = document.getElementById('studio-exit-btn');
  const elStudioTopicTitle = document.getElementById('studio-topic-title');
  const elStudioSubjectBadge = document.getElementById('studio-subject-badge');
  const elStudioModeBadge = document.getElementById('studio-mode-badge');
  const elStudioTimer = document.getElementById('studio-timer');
  const elStudioStepper = document.getElementById('studio-stepper-wrap');
  const elStudioCardContainer = document.getElementById('studio-card-container');
  const elStudioPrevBtn = document.getElementById('studio-prev-btn');
  const elStudioNextBtn = document.getElementById('studio-next-btn');

  // KaTeX helper
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
        console.warn('[KaTeX Render]', err);
      }
    }
  }

  // Auth headers
  function getHeaders() {
    return window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
  }

  // =========================================================================
  // 1. LOAD DASHBOARD DATA
  // =========================================================================
  async function loadRevisionDashboard() {
    try {
      const res = await fetch(getApiUrl('/api/revision/overview'), { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      _revisionData = data;

      if (!data.has_history) {
        // Zero history state
        if (elEmptyState) elEmptyState.style.display = 'block';
        if (elMainDashboard) elMainDashboard.style.display = 'none';
        return;
      }

      if (elEmptyState) elEmptyState.style.display = 'none';
      if (elMainDashboard) elMainDashboard.style.display = 'flex';

      // 1. Stats strip
      const stats = data.summary_stats || {};
      if (elStatDue) elStatDue.textContent = `${stats.topics_due_count || 0} Topics`;
      if (elStatRetention) elStatRetention.textContent = `${stats.avg_retention_percent || 0}%`;
      if (elStatCompleted) elStatCompleted.textContent = `${stats.revisions_completed_count || 0} Sessions`;

      // Fetch active streak from telemetry if available
      try {
        const telRes = await fetch(getApiUrl('/api/student/telemetry'), { headers: getHeaders() });
        if (telRes.ok) {
          const tel = await telRes.json();
          if (elStatStreak) elStatStreak.textContent = `${tel.active_learning_streak_days || 0} Days 🔥`;
        }
      } catch (_) {}

      // 2. Render Today's Top Priority Hero Card
      renderHeroPriorityCard(data.today_top_priority);

      // 3. Render Categorized Queue Tabs & Cards
      updateQueueTabsCounts(data);
      renderQueueCards(_activeQueueFilter);

      // 4. Render Revision History Table
      renderHistoryTable(data.recent_history || []);

    } catch (err) {
      console.error('[Smart Revision] Failed to load revision data:', err);
    }
  }

  // Render Top Priority Hero Card
  function renderHeroPriorityCard(top) {
    if (!top) {
      if (elHeroTopic) elHeroTopic.textContent = "All Topics are Healthy";
      if (elHeroExplanation) elHeroExplanation.textContent = "Great job! All your attempted concepts maintain strong memory retention. Keep up your active study streak.";
      if (elHeroStartBtn) elHeroStartBtn.style.display = 'none';
      if (elHeroInspectBtn) elHeroInspectBtn.style.display = 'none';
      return;
    }

    if (elHeroTopic) elHeroTopic.textContent = top.topic;
    if (elHeroSubject) {
      elHeroSubject.innerHTML = `${top.subject_icon || '📚'} <span>${top.subject_title || top.subject_id}</span>`;
    }

    if (elHeroUrgency) {
      elHeroUrgency.className = `badge-urgency-${top.urgency}`;
      elHeroUrgency.textContent = top.badge || top.tier;
    }

    if (elHeroExplanation) {
      elHeroExplanation.textContent = top.student_explanation;
    }

    // Evidence chips
    if (elHeroEvidenceStrip) {
      elHeroEvidenceStrip.innerHTML = (top.signals || []).map(s => `
        <span class="revision-evidence-chip">
          <span style="color: #A5B4FC;">●</span>
          <span>${s.text}</span>
        </span>
      `).join('');
    }

    // Steps preview
    renderStepsPreview(top.smart_path ? top.smart_path.steps : []);

    // Verified resources
    if (elHeroResourcesStrip) {
      const res = top.resources || {};
      elHeroResourcesStrip.innerHTML = `
        <span style="font-weight: 700; color: #94A3B8;">VERIFIED RESOURCES:</span>
        <span class="revision-res-tag ${res.has_notes ? 'active' : ''}">
          <span>${res.has_notes ? '✓' : '○'}</span>
          <span>${res.notes_title ? `Notes: ${res.notes_title}` : 'Notes'}</span>
        </span>
        <span class="revision-res-tag ${res.has_practice ? 'active' : ''}">
          <span>${res.has_practice ? '✓' : '○'}</span>
          <span>${res.practice_count} Questions</span>
        </span>
        <span class="revision-res-tag ${res.has_flashcards ? 'active' : ''}">
          <span>${res.has_flashcards ? '✓' : '○'}</span>
          <span>${res.flashcards_count ? `${res.flashcards_count} Flashcards` : 'Flashcards'}</span>
        </span>
        <span class="revision-res-tag active">
          <span>✓</span>
          <span>AI Socratic Mentor</span>
        </span>
      `;
    }

    // Start button
    if (elHeroStartBtn) {
      elHeroStartBtn.style.display = 'inline-flex';
      elHeroStartBtn.onclick = () => {
        launchRevisionStudio(top.subject_id, top.topic, _activeTimeBudget);
      };
    }

    // Inspect evidence button
    if (elHeroInspectBtn) {
      elHeroInspectBtn.style.display = 'inline-flex';
      elHeroInspectBtn.onclick = () => {
        openEvidenceModal(top);
      };
    }

    renderMath(document.querySelector('.revision-priority-hero'));
  }

  // Render steps sequence preview
  function renderStepsPreview(steps) {
    if (!elHeroStepsStrip) return;
    if (!steps || steps.length === 0) {
      elHeroStepsStrip.innerHTML = '<div style="color: #94A3B8; font-size: 0.8rem;">Path dynamically generated on start.</div>';
      return;
    }

    elHeroStepsStrip.innerHTML = steps.map((s, idx) => `
      <div class="revision-step-preview-item">
        <span class="step-preview-num">Step 0${s.step_num || idx + 1}</span>
        <span class="step-preview-title">${s.title}</span>
        <span class="step-preview-meta">${s.duration_min} min</span>
      </div>
    `).join('');
  }

  // Time budget buttons handler
  elHeroTimeBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      elHeroTimeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeTimeBudget = parseInt(btn.getAttribute('data-time'), 10) || 15;

      // Re-fetch top priority smart path with updated budget
      if (_revisionData && _revisionData.today_top_priority) {
        const top = _revisionData.today_top_priority;
        try {
          const res = await fetch(getApiUrl(`/api/revision/topic/${top.subject_id}/${encodeURIComponent(top.topic)}?time_budget=${_activeTimeBudget}`), { headers: getHeaders() });
          if (res.ok) {
            const data = await res.json();
            if (data.topic && data.topic.smart_path) {
              renderStepsPreview(data.topic.smart_path.steps);
            }
          }
        } catch (_) {}
      }
    });
  });

  // =========================================================================
  // 2. CATEGORIZED QUEUES (NEEDS ATTENTION / REVIEW SOON / DOING WELL)
  // =========================================================================
  function updateQueueTabsCounts(data) {
    const naCount = (data.needs_attention || []).length;
    const rsCount = (data.review_soon || []).length;
    const dwCount = (data.doing_well || []).length;

    elQueueTabs.forEach(tab => {
      const filter = tab.getAttribute('data-filter');
      if (filter === 'needs_attention') tab.textContent = `Needs Attention (${naCount})`;
      if (filter === 'review_soon') tab.textContent = `Review Soon (${rsCount})`;
      if (filter === 'doing_well') tab.textContent = `Doing Well (${dwCount})`;
    });
  }

  elQueueTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elQueueTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _activeQueueFilter = tab.getAttribute('data-filter') || 'needs_attention';
      renderQueueCards(_activeQueueFilter);
    });
  });

  // Search input live filtering
  let _searchQuery = '';
  const elSearchInput = document.getElementById('revision-search-input');
  if (elSearchInput) {
    elSearchInput.addEventListener('input', (e) => {
      _searchQuery = (e.target.value || '').trim().toLowerCase();
      renderQueueCards(_activeQueueFilter);
    });
  }

  function renderQueueCards(filter) {
    if (!elTopicsGrid || !_revisionData) return;

    let topics = [];
    if (filter === 'needs_attention') topics = _revisionData.needs_attention || [];
    else if (filter === 'review_soon') topics = _revisionData.review_soon || [];
    else if (filter === 'doing_well') topics = _revisionData.doing_well || [];

    if (_searchQuery) {
      topics = topics.filter(t => 
        (t.topic || '').toLowerCase().includes(_searchQuery) ||
        (t.subject_title || '').toLowerCase().includes(_searchQuery)
      );
    }

    if (topics.length === 0) {
      elTopicsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: 16px;">
          <p style="margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 700;">${_searchQuery ? `No concepts matching "${_searchQuery}"` : 'No concepts in this category.'}</p>
          <span style="font-size: 0.82rem;">${_searchQuery ? 'Try searching another keyword or subject.' : 'All active topics are balanced in their respective retention curves.'}</span>
        </div>
      `;
      return;
    }

    elTopicsGrid.innerHTML = topics.map(t => {
      const ret = Math.round(t.retention_percent || 100);
      const acc = Math.round(t.accuracy_percent || 0);
      const days = t.days_elapsed || 0;
      const daysText = days === 0 ? 'Practiced today' : `${days}d ago`;

      return `
        <div class="revision-card" data-topic="${t.topic}" data-subject="${t.subject_id}">
          <div class="revision-card-top">
            <span class="revision-card-subject" style="color: ${t.subject_id === 'phys' ? '#D97706' : (t.subject_id === 'chem' ? '#059669' : (t.subject_id === 'math' ? '#2563EB' : '#7C3AED'))}">${t.subject_title}</span>
            <span class="badge-urgency-${t.urgency}">${t.badge}</span>
          </div>

          <h4 class="revision-card-title">${t.topic}</h4>

          <div class="revision-decay-meter-wrap">
            <div class="revision-decay-labels">
              <span>Memory Retention</span>
              <strong style="color: ${t.urgency === 'critical' ? '#EF4444' : (t.urgency === 'warning' ? '#F59E0B' : '#10B981')}">${ret}%</strong>
            </div>
            <div class="revision-decay-bg">
              <div class="revision-decay-fill ${t.urgency}" style="width: ${ret}%;"></div>
            </div>
          </div>

          <div class="revision-card-meta">
            <span>Accuracy: <strong>${acc}%</strong> (${t.attempts_count} att.)</span>
            <span>Last: <strong>${daysText}</strong></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; padding-top: 0.65rem; border-top: 1px solid #F1F5F9;">
            <button class="btn-inspect-link" style="background: none; border: none; color: var(--indigo-primary); font-size: 0.78rem; font-weight: 700; cursor: pointer;" onclick="window.inspectTopicEvidence('${t.subject_id}', '${t.topic.replace(/'/g, "\\'")}')">
              Why review? ℹ
            </button>
            <button class="btn-revise-card" onclick="window.startTopicRevision('${t.subject_id}', '${t.topic.replace(/'/g, "\\'")}')">
              <span>⚡ Revise Concept</span>
              <span>→</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    renderMath(elTopicsGrid);
  }

  // =========================================================================
  // 3. REVISION HISTORY TABLE
  // =========================================================================
  function renderHistoryTable(history) {
    if (!elHistoryTableBody) return;

    if (!history || history.length === 0) {
      if (elHistoryEmpty) elHistoryEmpty.style.display = 'block';
      elHistoryTableBody.innerHTML = '';
      return;
    }

    if (elHistoryEmpty) elHistoryEmpty.style.display = 'none';

    elHistoryTableBody.innerHTML = history.map(h => {
      const d = new Date(h.completed_at);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const scoreStr = h.total_questions > 0 ? `${h.score}/${h.total_questions} correct` : 'Complete';

      return `
        <tr>
          <td>
            <strong>${h.topic}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${h.subject_title}</div>
          </td>
          <td>${h.duration_minutes} min</td>
          <td>
            <span class="badge ${h.score >= h.total_questions && h.total_questions > 0 ? 'badge-emerald' : 'badge-indigo'}">
              ${scoreStr}
            </span>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">
            ${dateStr} at ${timeStr}
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 4. EVIDENCE INSPECTION MODAL
  // =========================================================================
  function openEvidenceModal(topicData) {
    if (!elEvidenceModal) return;

    if (elEvidenceModalTitle) elEvidenceModalTitle.textContent = topicData.topic;
    if (elEvidenceModalSubject) elEvidenceModalSubject.textContent = `${topicData.subject_icon || ''} ${topicData.subject_title}`;
    if (elEvidenceModalExplanation) elEvidenceModalExplanation.textContent = topicData.student_explanation;

    if (elEvidenceModalSignals) {
      elEvidenceModalSignals.innerHTML = (topicData.signals || []).map(s => `
        <div style="background: var(--bg-secondary, #F1F5F9); padding: 0.85rem 1rem; border-radius: 12px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main);">${s.text}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.15rem;">Source: SQLite ${s.source}</div>
          </div>
          <span style="font-size: 0.75rem; font-weight: 800; color: var(--indigo-primary);">${s.value !== undefined ? s.value : ''}</span>
        </div>
      `).join('');
    }

    elEvidenceModal.classList.add('open');
  }

  if (elEvidenceModalClose) {
    elEvidenceModalClose.onclick = () => elEvidenceModal.classList.remove('open');
  }
  if (elEvidenceModal) {
    elEvidenceModal.onclick = (e) => {
      if (e.target === elEvidenceModal) elEvidenceModal.classList.remove('open');
    };
  }

  // Global helper for card clicks
  window.inspectTopicEvidence = (subjectId, topicName) => {
    if (!_revisionData) return;
    const topic = (_revisionData.all_topics || []).find(t => t.topic === topicName && t.subject_id === subjectId);
    if (topic) openEvidenceModal(topic);
  };

  window.startTopicRevision = (subjectId, topicName) => {
    launchRevisionStudio(subjectId, topicName, 15);
  };

  // =========================================================================
  // 5. FOCUSED INTERACTIVE REVISION STUDIO
  // =========================================================================
  async function launchRevisionStudio(subjectId, topicName, timeBudget) {
    try {
      const res = await fetch(getApiUrl(`/api/revision/topic/${subjectId}/${encodeURIComponent(topicName)}?time_budget=${timeBudget}`), { headers: getHeaders() });
      if (!res.ok) throw new Error("Could not load topic revision details.");

      const data = await res.json();
      _currentStudioSession = data;
      _studioStepIndex = 0;
      _studioScore = 0;
      _studioTotalQuestions = 0;
      _studioSecondsElapsed = 0;

      // Header labels
      const top = data.topic;
      if (elStudioTopicTitle) elStudioTopicTitle.textContent = top.topic;
      if (elStudioSubjectBadge) elStudioSubjectBadge.textContent = top.subject_title;
      if (elStudioModeBadge) elStudioModeBadge.textContent = top.smart_path ? top.smart_path.mode_label : 'Adaptive Drill';

      // Start timer
      clearInterval(_studioTimerInterval);
      _studioTimerInterval = setInterval(() => {
        _studioSecondsElapsed++;
        const mins = Math.floor(_studioSecondsElapsed / 60);
        const secs = _studioSecondsElapsed % 60;
        if (elStudioTimer) {
          elStudioTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }, 1000);

      // Open Studio
      if (elStudioOverlay) elStudioOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Render first step
      renderStudioStep(0);

    } catch (err) {
      alert("Failed to initialize Revision Studio: " + err.message);
    }
  }

  // Render Stepper dots
  function updateStudioStepper(currentIndex, totalSteps) {
    if (!elStudioStepper) return;
    const steps = (_currentStudioSession.topic.smart_path || {}).steps || [];

    elStudioStepper.innerHTML = steps.map((s, idx) => {
      let statusClass = '';
      if (idx === currentIndex) statusClass = 'active';
      else if (idx < currentIndex) statusClass = 'completed';

      return `
        <div class="studio-step-dot ${statusClass}">
          <span class="studio-step-circle">${idx < currentIndex ? '✓' : (idx + 1)}</span>
          <span>${s.title}</span>
        </div>
      `;
    }).join('');
  }

  // Render Step Workspace
  function renderStudioStep(stepIdx) {
    if (!elStudioCardContainer || !_currentStudioSession) return;
    const session = _currentStudioSession;
    const path = session.topic.smart_path || {};
    const steps = path.steps || [];

    if (stepIdx >= steps.length) {
      // Completed all steps!
      renderStudioCompletion();
      return;
    }

    const curStep = steps[stepIdx];
    updateStudioStepper(stepIdx, steps.length);

    // Prev / Next button states
    if (elStudioPrevBtn) elStudioPrevBtn.style.display = stepIdx > 0 ? 'inline-block' : 'none';
    if (elStudioNextBtn) {
      elStudioNextBtn.textContent = (stepIdx === steps.length - 1) ? 'Complete Revision ✓' : 'Next Step →';
    }

    let bodyHtml = '';

    if (curStep.type === 'active_recall' || curStep.type === 'mistake_review') {
      // Step 1: Active Recall & Prompt Reflection
      bodyHtml = `
        <div class="studio-step-card">
          <div style="font-size: 0.78rem; font-weight: 800; color: #818CF8; text-transform: uppercase;">
            Step 0${stepIdx + 1} of 0${steps.length} • ${curStep.title} (${curStep.duration_min} min)
          </div>
          <h2 class="studio-step-title">Active Knowledge Retrieval</h2>
          <p class="studio-step-instruction">${curStep.instruction}</p>

          <div class="studio-recall-prompt-box">
            <strong>Diagnostic Question Prompt:</strong>
            <div style="margin-top: 0.5rem; font-size: 1.05rem;">
              "What is the foundational law or equation governing <strong>${session.topic.topic}</strong>, and under what conditions does it hold?"
            </div>
          </div>

          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.35rem; display: block;">
              Write your mental retrieval / self-explanation below:
            </label>
            <textarea class="studio-reflection-textarea" placeholder="Type what you remember before checking definitions..."></textarea>
          </div>

          <div>
            <button id="studio-reveal-btn" class="btn-studio-secondary" style="font-size: 0.82rem;">
              <span>Reveal Verified Principle 💡</span>
            </button>
            <div id="studio-revealed-box" class="studio-reveal-answer-box" style="margin-top: 0.75rem;">
              <strong>Core Law & Verification:</strong>
              <p style="margin: 0.35rem 0 0;">${session.topic.common_mistake_note || session.topic.student_explanation}</p>
            </div>
          </div>
        </div>
      `;
    } else if (curStep.type === 'notes_review') {
      // Step 2: Focused Core Notes Summary
      const noteHtml = session.note_excerpt ? session.note_excerpt.summary_html : `<p>${session.topic.student_explanation}</p>`;
      bodyHtml = `
        <div class="studio-step-card">
          <div style="font-size: 0.78rem; font-weight: 800; color: #818CF8; text-transform: uppercase;">
            Step 0${stepIdx + 1} of 0${steps.length} • ${curStep.title} (${curStep.duration_min} min)
          </div>
          <h2 class="studio-step-title">Verified Core Concept Summary</h2>
          <p class="studio-step-instruction">${curStep.instruction}</p>

          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1.5rem; font-size: 0.92rem; line-height: 1.6; color: #E2E8F0;">
            ${noteHtml}
          </div>
        </div>
      `;
    } else if (curStep.type === 'practice_question') {
      // Step 3: Targeted Practice Questions from SQLite & Dynamic Engine
      const questions = session.questions || [];
      _studioTotalQuestions = questions.length;

      if (questions.length === 0) {
        bodyHtml = `
          <div class="studio-step-card">
            <h2 class="studio-step-title">Practice Check</h2>
            <p>No practice questions currently logged for this concept. You may proceed to verification check.</p>
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="studio-step-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <div style="font-size: 0.78rem; font-weight: 800; color: #818CF8; text-transform: uppercase;">
                Step 0${stepIdx + 1} of 0${steps.length} • Targeted Practice (${questions.length} Dynamic Questions)
              </div>
              <button id="studio-variant-btn" class="btn-studio-variant" type="button" onclick="window.regenerateStudioQuestions()">
                <span>⚡ Generate Fresh Topic Variant</span>
              </button>
            </div>

            <h2 class="studio-step-title" style="margin-top: 0.25rem;">Targeted Problem Solving</h2>
            <p class="studio-step-instruction">Unique, curriculum-aligned questions for <strong>${session.topic.topic}</strong>. Select an answer for immediate verification and derivation.</p>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              ${questions.map((q, qIdx) => `
                <div class="studio-question-card" data-qid="${q.id}" data-correct="${q.correct_option}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; font-weight: 800; color: #818CF8; letter-spacing: 0.05em;">QUESTION ${qIdx + 1} OF ${questions.length}</div>
                    <div id="badge-status-${q.id}" style="font-size: 0.7rem; font-weight: 700; background: rgba(99, 102, 241, 0.15); color: #A5B4FC; border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.15rem 0.6rem; border-radius: 999px;">
                      ${q.difficulty || 'JEE Standard'}
                    </div>
                  </div>

                  <div class="studio-question-prompt">${q.question_text}</div>

                  <div class="studio-options-list">
                    ${q.options.map(opt => `
                      <div class="studio-option-item" data-opt-idx="${opt.index}" onclick="window.selectStudioOption('${q.id}', ${opt.index})">
                        <span class="studio-option-label">${opt.label}</span>
                        <span>${opt.text}</span>
                      </div>
                    `).join('')}
                  </div>

                  <div class="studio-explanation-box" id="expl-${q.id}">
                    <div style="font-weight: 800; color: #818CF8; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
                      <span>💡 Step-by-Step Derivation & Explanation:</span>
                    </div>
                    <div>${q.explanation}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } else {
      // Step 4: Self-check & Confidence Rating
      bodyHtml = `
        <div class="studio-step-card">
          <div style="font-size: 0.78rem; font-weight: 800; color: #818CF8; text-transform: uppercase;">
            Final Verification Step
          </div>
          <h2 class="studio-step-title">Recall Self-Evaluation</h2>
          <p class="studio-step-instruction">How confident do you feel applying <strong>${session.topic.topic}</strong> after completing this smart revision?</p>

          <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
            <button class="btn-studio-secondary" style="flex: 1; padding: 1rem; font-size: 0.9rem;" onclick="this.style.borderColor='#10B981'">
              🌟 Completely Confident
            </button>
            <button class="btn-studio-secondary" style="flex: 1; padding: 1rem; font-size: 0.9rem;" onclick="this.style.borderColor='#F59E0B'">
              👍 Good Grasp
            </button>
            <button class="btn-studio-secondary" style="flex: 1; padding: 1rem; font-size: 0.9rem;" onclick="this.style.borderColor='#EF4444'">
              🔄 Needs Another Review
            </button>
          </div>
        </div>
      `;
    }

    elStudioCardContainer.innerHTML = bodyHtml;

    // Attach step-specific listeners
    const revealBtn = document.getElementById('studio-reveal-btn');
    const revealedBox = document.getElementById('studio-revealed-box');
    if (revealBtn && revealedBox) {
      revealBtn.onclick = () => {
        revealedBox.style.display = 'block';
        revealBtn.style.display = 'none';
      };
    }

    renderMath(elStudioCardContainer);
  }

  // Dynamic Question Variant Regeneration Handler
  window.regenerateStudioQuestions = async () => {
    if (!_currentStudioSession) return;
    const btn = document.getElementById('studio-variant-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⚡ Synthesizing Fresh Variant... ⏳</span>';
    }

    try {
      const topic = _currentStudioSession.topic.topic;
      const subj = _currentStudioSession.topic.subject_id;
      const res = await fetch(getApiUrl(`/api/revision/topic/${subj}/${encodeURIComponent(topic)}/generate-questions?count=3`), {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.status === 'success' && data.questions && data.questions.length > 0) {
        _currentStudioSession.questions = data.questions;
        renderStudioStep(_studioStepIndex);
      } else {
        alert('Could not generate new variants. Please try again.');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ Generate Fresh Topic Variant</span>';
        }
      }
    } catch (err) {
      console.error('[Regenerate Questions Error]', err);
      alert('Error generating questions: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ Generate Fresh Topic Variant</span>';
      }
    }
  };

  // Interactive Question Selection Handler
  window.selectStudioOption = (qId, selectedIdx) => {
    const card = document.querySelector(`.studio-question-card[data-qid="${qId}"]`);
    if (!card || card.dataset.answered) return;
    card.dataset.answered = '1';

    const correctIdx = parseInt(card.dataset.correct, 10);
    const options = card.querySelectorAll('.studio-option-item');
    const explBox = document.getElementById(`expl-${qId}`);
    const statusBadge = document.getElementById(`badge-status-${qId}`);

    options.forEach(opt => {
      const idx = parseInt(opt.getAttribute('data-opt-idx'), 10);
      if (idx === correctIdx) {
        opt.classList.add('correct');
      } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
        opt.classList.add('incorrect');
      }
      opt.style.pointerEvents = 'none';
    });

    if (selectedIdx === correctIdx) {
      _studioScore++;
      if (statusBadge) {
        statusBadge.textContent = '✓ Correct (+1 Mark)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBadge.style.color = '#34D399';
        statusBadge.style.borderColor = '#10B981';
      }
    } else {
      if (statusBadge) {
        statusBadge.textContent = '✗ Misconception Detected';
        statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        statusBadge.style.color = '#F87171';
        statusBadge.style.borderColor = '#EF4444';
      }
    }

    if (explBox) {
      explBox.style.display = 'block';
      renderMath(explBox);
    }
  };

  // Stepper Next / Prev buttons
  if (elStudioNextBtn) {
    elStudioNextBtn.onclick = () => {
      _studioStepIndex++;
      renderStudioStep(_studioStepIndex);
    };
  }

  if (elStudioPrevBtn) {
    elStudioPrevBtn.onclick = () => {
      if (_studioStepIndex > 0) {
        _studioStepIndex--;
        renderStudioStep(_studioStepIndex);
      }
    };
  }

  // Exit Studio
  if (elStudioExitBtn) {
    elStudioExitBtn.onclick = () => {
      if (confirm("Exit Revision Studio? Your progress on uncompleted steps will not be saved.")) {
        closeStudio();
      }
    };
  }

  function closeStudio() {
    clearInterval(_studioTimerInterval);
    if (elStudioOverlay) elStudioOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // 6. PERSIST REVISION & FEEDBACK LOOP
  // =========================================================================
  async function renderStudioCompletion() {
    clearInterval(_studioTimerInterval);
    if (!elStudioCardContainer || !_currentStudioSession) return;

    const session = _currentStudioSession;
    const durMin = Math.max(1, Math.round(_studioSecondsElapsed / 60));
    const path = session.topic.smart_path || {};

    if (elStudioStepper) elStudioStepper.style.display = 'none';
    if (elStudioPrevBtn) elStudioPrevBtn.style.display = 'none';
    if (elStudioNextBtn) elStudioNextBtn.style.display = 'none';

    elStudioCardContainer.innerHTML = `
      <div class="studio-step-card" style="text-align: center; align-items: center;">
        <div style="width: 72px; height: 72px; border-radius: 9999px; background: rgba(16, 185, 129, 0.2); color: #34D399; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
          ✓
        </div>
        <h2 class="studio-step-title" style="font-size: 1.85rem;">Revision Session Complete!</h2>
        <p style="color: #CBD5E1; max-width: 520px; font-size: 1rem; line-height: 1.6;">
          Your memory decay for <strong>${session.topic.topic}</strong> has been reset. Retention restored to <strong>100%</strong>.
        </p>

        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 1.25rem 2rem; display: flex; gap: 2rem; margin: 1rem 0;">
          <div>
            <div style="font-size: 0.72rem; color: #94A3B8; text-transform: uppercase;">SCORE ACHIEVED</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #34D399;">${_studioScore} / ${_studioTotalQuestions}</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: #94A3B8; text-transform: uppercase;">DURATION</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #FFFFFF;">${durMin} Min</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: #94A3B8; text-transform: uppercase;">MEMORY STABILITY</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #818CF8;">+50% Boost</div>
          </div>
        </div>

        <p id="persist-status-text" style="font-size: 0.8rem; color: #94A3B8;">Saving session to database...</p>

        <button id="studio-finish-btn" class="btn-studio-primary" style="margin-top: 1rem; padding: 0.85rem 2.25rem; font-size: 1rem;">
          Return to Updated Dashboard →
        </button>
      </div>
    `;

    // Persist session to SQLite via API
    try {
      const payload = {
        topic: session.topic.topic,
        subject_id: session.topic.subject_id,
        duration_minutes: durMin,
        steps_total: (path.steps || []).length,
        steps_completed: (path.steps || []).length,
        score: _studioScore,
        total_questions: _studioTotalQuestions,
        review_mode: path.mode || 'standard',
        resources_used: ['Active Recall', 'Curriculum Notes', 'Practice Questions']
      };

      const res = await fetch(getApiUrl('/api/revision/session/complete'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const persistStatus = document.getElementById('persist-status-text');
      if (res.ok) {
        if (persistStatus) persistStatus.textContent = "✓ Session persisted to database. Retention signals refreshed.";
      } else {
        if (persistStatus) persistStatus.textContent = "Session completed locally.";
      }
    } catch (err) {
      console.warn('[Session Persist Warning]', err);
    }

    const finishBtn = document.getElementById('studio-finish-btn');
    if (finishBtn) {
      finishBtn.onclick = () => {
        closeStudio();
        // Immediately reload dashboard data with updated retention state
        loadRevisionDashboard();
      };
    }
  }

  // URL Query handling: check if opened with ?topic=...&subject=...
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('topic');
    const s = params.get('subject') || 'phys';
    if (t) {
      setTimeout(() => {
        launchRevisionStudio(s, t, 15);
      }, 300);
    }
  }

  // Initialize
  loadRevisionDashboard();
  checkUrlParams();
});
