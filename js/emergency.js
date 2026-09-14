/* ==========================================================================
   SIKSHA SAATHI — EMERGENCY MODE CLIENT LOGIC (js/emergency.js)
   Situation Intelligence • Academic Crisis Recovery • Adaptive Live Sprint
   ========================================================================== */

(function(window) {
  'use strict';

  const EmergencyMode = {
    // State
    context: null,
    plan: null,
    sessionId: null,
    selectedTime: 20, // Default 20 minutes pre-selected for instant action
    selectedSubject: 'all',
    selectedScenario: 'auto',

    // Live session execution state
    currentPriorityIdx: 0,
    currentStepIdx: 0,
    timerInterval: null,
    timerSeconds: 0,
    initialSeconds: 0,
    timeSavedSeconds: 0,
    topicsCovered: [],
    stepsCompleted: 0,
    skippedSteps: [],
    selfRatings: {},

    // Subject Icon Resolver
    _getSubjectIcon: function(subjId) {
      const id = String(subjId || '').toLowerCase();
      if (id.includes('phys')) return '⚛️';
      if (id.includes('chem')) return '🧪';
      if (id.includes('math')) return '📐';
      if (id.includes('cs') || id.includes('comp')) return '💻';
      if (id.includes('bio')) return '🧬';
      return '📚';
    },

    _getApiUrl: function(path) {
      return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
        ? window.SIKSHA_CONFIG.getApiUrl(path)
        : path;
    },

    // =====================================================================
    // INITIALIZATION
    // =====================================================================

    init: async function() {
      this._showLoading(true);
      this._showError(false);
      const phasesEl = document.getElementById('emg-phases');
      if (phasesEl) phasesEl.style.display = 'none';

      try {
        const headers = window.SikshaSession ? SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
        const res = await fetch(this._getApiUrl('/api/emergency/context'), { headers });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        this.context = await res.json();
      } catch (err) {
        console.error('[Emergency] Failed to load context:', err);
        this._showLoading(false);
        this._showError(true, 'Could not load your study situation. Please check connection and try again.');
        return;
      }

      this._showLoading(false);
      if (phasesEl) phasesEl.style.display = 'block';

      this._renderSetupPhase();
      this._bindSetupEvents();
      this._showPhase('setup');
    },

    // =====================================================================
    // PHASE MANAGEMENT
    // =====================================================================

    _showPhase: function(phase) {
      document.querySelectorAll('.emg-phase').forEach(el => el.classList.remove('active'));
      const target = document.getElementById('phase-' + phase);
      if (target) {
        target.classList.add('active');
        const scrollContainer = document.querySelector('.main-content-scroll') || window;
        if (scrollContainer.scrollTo) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },

    _showLoading: function(show) {
      const el = document.getElementById('emg-loading');
      if (el) el.style.display = show ? 'flex' : 'none';
    },

    _showError: function(show, msg) {
      const el = document.getElementById('emg-error');
      const msgEl = document.getElementById('emg-error-msg');
      if (el) el.style.display = show ? 'block' : 'none';
      if (msgEl && msg) msgEl.textContent = msg;
    },

    // =====================================================================
    // PHASE 1: SITUATION INTELLIGENCE & SETUP
    // =====================================================================

    _renderSetupPhase: function() {
      const ctx = this.context;
      if (!ctx) return;

      // 1. Render Scenarios
      const scenarioGrid = document.getElementById('emg-scenario-grid');
      const detectedNote = document.getElementById('emg-detected-note');
      if (scenarioGrid && ctx.scenarios) {
        let recommendedTitle = '';
        scenarioGrid.innerHTML = ctx.scenarios.map(sc => {
          if (sc.is_recommended) {
            recommendedTitle = sc.title;
            if (!this.selectedScenario || this.selectedScenario === 'auto') {
              this.selectedScenario = sc.id;
            }
          }
          const isSelected = this.selectedScenario === sc.id;
          const badgeHTML = sc.is_recommended ? `<span class="emg-sc-badge">★ System Recommendation</span>` : '';
          return `
            <div class="emg-scenario-card ${isSelected ? 'selected' : ''}" data-scenario="${sc.id}">
              <div class="emg-sc-header">
                <span class="emg-sc-icon">${sc.icon || '🎯'}</span>
                ${badgeHTML}
              </div>
              <div class="emg-sc-title">${this._escapeHTML(sc.title)}</div>
              <div class="emg-sc-tagline">${this._escapeHTML(sc.tagline || '')}</div>
              <p class="emg-sc-desc">${this._escapeHTML(sc.description)}</p>
            </div>
          `;
        }).join('');

        if (detectedNote && ctx.detected_situation) {
          detectedNote.textContent = `• Recommended: ${recommendedTitle}`;
        }
      }

      // 2. Render Time Pills
      const timeGrid = document.getElementById('emg-time-grid');
      if (timeGrid) {
        const presets = ctx.time_presets || [5, 10, 15, 20, 30, 45, 60, 120, 180];
        let pillsHTML = presets.map(m => {
          const label = m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`;
          const isSelected = this.selectedTime === m;
          return `<button type="button" class="emg-time-pill ${isSelected ? 'selected' : ''}" data-minutes="${m}">${label}</button>`;
        }).join('');

        pillsHTML += `
          <div class="emg-custom-time-wrap">
            <input type="number" id="emg-custom-minutes" class="emg-custom-input" placeholder="Custom" min="5" max="300">
            <span style="font-size:0.82rem; color:#64748B; font-weight:600;">min</span>
          </div>
        `;
        timeGrid.innerHTML = pillsHTML;
      }

      // 3. Render Subject Pills
      const subjGrid = document.getElementById('emg-subject-grid');
      if (subjGrid) {
        let html = `<button type="button" class="emg-subject-pill ${this.selectedSubject === 'all' ? 'selected' : ''}" data-subject="all">🎯 All Subjects</button>`;
        for (const subj of (ctx.subjects || [])) {
          const isSelected = this.selectedSubject === subj.id;
          const icon = this._getSubjectIcon(subj.id);
          const accLabel = subj.accuracy_percent > 0 ? `<span class="subj-acc">${Math.round(subj.accuracy_percent)}% acc</span>` : '';
          html += `<button type="button" class="emg-subject-pill ${isSelected ? 'selected' : ''}" data-subject="${subj.id}">${icon} ${this._escapeHTML(subj.title || subj.name)} ${accLabel}</button>`;
        }
        subjGrid.innerHTML = html;
      }

      this._updateCTA();
    },

    _bindSetupEvents: function() {
      const self = this;

      // Scenario selection
      document.getElementById('emg-scenario-grid')?.addEventListener('click', function(e) {
        const card = e.target.closest('.emg-scenario-card');
        if (!card) return;
        document.querySelectorAll('.emg-scenario-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        self.selectedScenario = card.dataset.scenario;
      });

      // Time pills
      document.getElementById('emg-time-grid')?.addEventListener('click', function(e) {
        const pill = e.target.closest('.emg-time-pill');
        if (!pill) return;
        document.querySelectorAll('.emg-time-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        self.selectedTime = parseInt(pill.dataset.minutes, 10);
        const customInput = document.getElementById('emg-custom-minutes');
        if (customInput) customInput.value = '';
        self._updateCTA();
      });

      // Custom minute input
      document.getElementById('emg-custom-minutes')?.addEventListener('input', function(e) {
        const val = parseInt(e.target.value, 10);
        if (val >= 5 && val <= 300) {
          document.querySelectorAll('.emg-time-pill').forEach(p => p.classList.remove('selected'));
          self.selectedTime = val;
          self._updateCTA();
        }
      });

      // Subject pills
      document.getElementById('emg-subject-grid')?.addEventListener('click', function(e) {
        const pill = e.target.closest('.emg-subject-pill');
        if (!pill) return;
        document.querySelectorAll('.emg-subject-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        self.selectedSubject = pill.dataset.subject;
      });

      // Primary CTA: Build Plan
      document.getElementById('emg-build-plan')?.addEventListener('click', () => self._buildPlan());

      // Choose For Me (1-Click Recovery)
      document.getElementById('emg-choose-for-me')?.addEventListener('click', () => {
        self.selectedTime = self.selectedTime || 20;
        document.querySelectorAll('.emg-time-pill').forEach(p => {
          p.classList.toggle('selected', parseInt(p.dataset.minutes, 10) === self.selectedTime);
        });
        self.selectedSubject = 'all';
        self.selectedScenario = self.context?.detected_situation?.recommended_scenario_id || 'keep_making_mistakes';
        document.querySelectorAll('.emg-scenario-card').forEach(c => {
          c.classList.toggle('selected', c.dataset.scenario === self.selectedScenario);
        });
        self._updateCTA();
        self._buildPlan();
      });

      // Navigation buttons
      document.getElementById('emg-back-to-setup')?.addEventListener('click', () => self._showPhase('setup'));
      document.getElementById('emg-start-session')?.addEventListener('click', () => self._startSession());

      // "If You Only Do One Thing" quick launch
      document.getElementById('emg-one-start')?.addEventListener('click', () => self._startSession());

      // Live Session controls
      document.getElementById('emg-complete-step')?.addEventListener('click', () => self._completeStep());
      document.getElementById('emg-reallocate-step')?.addEventListener('click', () => self._reallocateStep());
      document.getElementById('emg-skip-step')?.addEventListener('click', () => self._skipStep());
      document.getElementById('emg-finish-early')?.addEventListener('click', () => self._finishSession());

      // Reset
      document.getElementById('emg-new-session')?.addEventListener('click', () => {
        self.plan = null;
        self.sessionId = null;
        self.selectedTime = 20;
        self.selectedSubject = 'all';
        self.currentPriorityIdx = 0;
        self.currentStepIdx = 0;
        self.topicsCovered = [];
        self.stepsCompleted = 0;
        self.skippedSteps = [];
        self.selfRatings = {};
        if (self.timerInterval) clearInterval(self.timerInterval);
        self.init();
      });
    },

    _updateCTA: function() {
      const btn = document.getElementById('emg-build-plan');
      if (btn) {
        btn.disabled = !this.selectedTime;
      }
    },

    // =====================================================================
    // PHASE 2: RESCUE PLAN & DIAGNOSIS PRESENTATION
    // =====================================================================

    _buildPlan: async function() {
      if (!this.selectedTime) return;

      const btn = document.getElementById('emg-build-plan');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Diagnosing & building plan...</span>';
      }

      try {
        const headers = window.SikshaSession ? SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
        const res = await fetch(this._getApiUrl('/api/emergency/plan'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            available_minutes: this.selectedTime,
            subject_focus: this.selectedSubject,
            situation: this.selectedScenario || 'auto',
            exam_name: document.getElementById('emg-exam-name')?.value || '',
            exam_date: document.getElementById('emg-exam-date')?.value || ''
          })
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        this.plan = await res.json();
      } catch (err) {
        console.error('[Emergency] Plan build failed:', err);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>DIAGNOSE & BUILD RESCUE PLAN</span>';
        }
        this._showError(true, 'Failed to build your rescue plan. Please try again.');
        return;
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>DIAGNOSE & BUILD RESCUE PLAN</span>';
      }

      // Handle insufficient data
      if (this.plan.status === 'insufficient_data') {
        this._renderEmptyState();
        return;
      }

      this.sessionId = this.plan.session_id;
      this._renderPlanPhase();
      this._showPhase('plan');
    },

    _renderEmptyState: function() {
      const cardsEl = document.getElementById('emg-plan-cards');
      if (!cardsEl) return;

      const plan = this.plan;
      const actions = plan.available_actions || [];

      let actionsHTML = '';
      for (const a of actions) {
        actionsHTML += `<a href="${a.url}" class="emg-cta-secondary" style="display:inline-flex;align-items:center;gap:0.3rem;">${a.icon} ${a.title}</a>`;
      }

      cardsEl.innerHTML = `
        <div style="text-align:center; padding:3rem 1.5rem; background:#FFF; border-radius:16px; border:1px solid #E2E8F0;">
          <div style="font-size:3rem; margin-bottom:1rem;">📊</div>
          <h3 style="font-size:1.2rem; font-weight:800; color:#0F172A; margin-bottom:0.5rem;">${this._escapeHTML(plan.message || 'Calibration Data Needed')}</h3>
          <p style="font-size:0.9rem; color:#64748B; max-width:480px; margin:0 auto 1.5rem; line-height:1.5;">${this._escapeHTML(plan.detail || 'Complete a few quick practice questions so Situation Intelligence can detect your exact weak spots.')}</p>
          <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
            ${actionsHTML}
            <button class="emg-cta-secondary" onclick="EmergencyMode._showPhase('setup')">← Back to Setup</button>
          </div>
        </div>
      `;

      document.getElementById('emg-skip-container').style.display = 'none';
      document.getElementById('emg-one-thing-card').style.display = 'none';
      document.getElementById('emg-time-breakdown-box').style.display = 'none';
      document.getElementById('emg-start-session').style.display = 'none';
      this._showPhase('plan');
    },

    _renderPlanPhase: function() {
      const plan = this.plan;
      if (!plan) return;

      // 1. Top Meta Banner
      const timeSummary = document.getElementById('emg-plan-time-summary');
      const sitBadge = document.getElementById('emg-plan-situation-badge');
      const stepsCount = document.getElementById('emg-plan-steps-count');

      if (timeSummary) {
        timeSummary.innerHTML = `<strong>${plan.total_planned_minutes} min planned</strong> (${plan.available_minutes} min budget)`;
      }
      if (sitBadge) {
        const scMeta = plan.situation_meta;
        sitBadge.textContent = scMeta ? `Strategy: ${scMeta.title}` : `Strategy: Adaptive Triage`;
      }
      if (stepsCount) {
        stepsCount.textContent = `${plan.total_steps} Action Steps`;
      }

      // 2. Crisis Diagnosis Card
      const diag = plan.diagnosis || {};
      const diagSit = document.getElementById('emg-diag-situation');
      const diagRisk = document.getElementById('emg-diag-risk');
      const diagOpp = document.getElementById('emg-diag-opportunity');
      const diagConf = document.getElementById('emg-diag-conf');
      const diagSource = document.getElementById('emg-diag-source');

      if (diagSit) diagSit.textContent = diag.current_situation || 'Evaluating available time and learning telemetry...';
      if (diagRisk) diagRisk.textContent = diag.biggest_risk || 'Risk of mark loss on unverified topics.';
      if (diagOpp) diagOpp.textContent = diag.best_opportunity || 'Focused high-yield practice.';
      if (diagConf) diagConf.textContent = diag.confidence_label || 'High Confidence';
      if (diagSource) diagSource.textContent = diag.data_source || 'Derived from active telemetry';

      // 3. "If You Only Do One Thing" Spotlight Card
      const oneCard = document.getElementById('emg-one-thing-card');
      const one = plan.one_thing;
      if (oneCard && one) {
        oneCard.style.display = 'flex';
        document.getElementById('emg-one-title').textContent = `${one.topic_name} — ${one.action_title} (${one.duration_minutes}m)`;
        document.getElementById('emg-one-reason').textContent = one.reason;
      } else if (oneCard) {
        oneCard.style.display = 'none';
      }

      // 4. Dynamic Time Breakdown Schedule
      const tbBox = document.getElementById('emg-time-breakdown-box');
      const tbBar = document.getElementById('emg-tb-bar');
      const tbLegend = document.getElementById('emg-tb-legend');
      const tbList = plan.time_breakdown || [];

      if (tbBox && tbList.length > 0) {
        tbBox.style.display = 'block';
        tbBar.innerHTML = tbList.map(item => `
          <div class="emg-tb-seg ${item.type}" style="width:${item.percent}%;" title="${item.title}: ${item.minutes}m (${item.percent}%)"></div>
        `).join('');

        tbLegend.innerHTML = tbList.map(item => `
          <div class="emg-tb-item">
            <div class="emg-tb-dot ${item.type}"></div>
            <span>${item.icon} ${item.title}: <strong>${item.minutes}m</strong> (${item.percent}%)</span>
          </div>
        `).join('');
      } else if (tbBox) {
        tbBox.style.display = 'none';
      }

      // 5. Priority Action Topic Cards
      const cardsEl = document.getElementById('emg-plan-cards');
      if (cardsEl) {
        let html = '';
        for (const p of (plan.priorities || [])) {
          let evidenceHTML = '';
          for (const ev of (p.evidence || [])) {
            const evText = typeof ev === 'string' ? ev : (ev.text || JSON.stringify(ev));
            evidenceHTML += `<div class="emg-evidence-item"><div class="emg-evidence-dot"></div><span>${this._escapeHTML(evText)}</span></div>`;
          }
          if (!evidenceHTML && p.reason && p.reason.summary) {
            evidenceHTML = `<div class="emg-evidence-item"><div class="emg-evidence-dot"></div><span>${this._escapeHTML(p.reason.summary)}</span></div>`;
          }

          let stepsHTML = '';
          for (const s of (p.steps || [])) {
            stepsHTML += `<span class="emg-step-chip">${this._escapeHTML(s.title)} (${s.duration_min}m)</span>`;
          }

          let metricsLine = '';
          if (p.accuracy_percent !== null && p.accuracy_percent !== undefined) {
            metricsLine += `<span>Accuracy: <strong style="color:${p.accuracy_percent >= 70 ? '#059669' : '#DC2626'}">${Math.round(p.accuracy_percent)}%</strong></span>`;
          }
          if (p.mistakes_count > 0) {
            metricsLine += `<span style="margin-left:0.75rem; color:#DC2626;">Mistakes: <strong>${p.mistakes_count}</strong></span>`;
          }

          const subjIcon = this._getSubjectIcon(p.subject_id);

          html += `
            <div class="emg-priority-card ${p.priority_level}">
              <div class="emg-card-top">
                <div>
                  <div class="emg-card-label ${p.priority_level}">${this._escapeHTML(p.priority_label)}</div>
                  <div class="emg-card-topic">${subjIcon} ${this._escapeHTML(p.topic_name)}</div>
                  <div class="emg-card-subject">${this._escapeHTML(p.subject_title)} ${metricsLine ? '• ' + metricsLine : ''}</div>
                </div>
                <div class="emg-card-time">${p.allocated_minutes}<span>minutes</span></div>
              </div>
              <button type="button" class="emg-why-toggle" data-toggle="why-${p.topic_id}">
                Why this topic? ▸
              </button>
              <div class="emg-why-content" id="why-${p.topic_id}">
                ${evidenceHTML || '<span style="color:#64748B;">Identified via value-per-minute optimization.</span>'}
              </div>
              <div class="emg-steps-preview">${stepsHTML}</div>
            </div>
          `;
        }
        cardsEl.innerHTML = html;

        // Attach why toggles
        cardsEl.querySelectorAll('.emg-why-toggle').forEach(btn => {
          btn.addEventListener('click', function() {
            const targetId = this.dataset.toggle;
            const content = document.getElementById(targetId);
            if (content) {
              const isOpen = content.classList.toggle('open');
              this.textContent = isOpen ? 'Why this topic? ▾' : 'Why this topic? ▸';
            }
          });
        });
      }

      // 6. "Don't Study This Now" (Time Protection Section)
      const skipContainer = document.getElementById('emg-skip-container');
      const skipGrid = document.getElementById('emg-skip-grid');
      const skipList = plan.skip_topics || [];

      if (skipContainer && skipGrid && skipList.length > 0) {
        skipContainer.style.display = 'block';
        skipGrid.innerHTML = skipList.map(s => {
          const sIcon = this._getSubjectIcon(s.subject_id || s.subject_title);
          return `
            <div class="emg-skip-row">
              <div class="emg-skip-left">
                <span class="emg-skip-tag ${s.badge_color || 'slate'}">${this._escapeHTML(s.tag || 'Skip')}</span>
                <strong style="font-size:0.9rem; color:#0F172A;">${sIcon} ${this._escapeHTML(s.topic_name)}</strong>
                <span style="font-size:0.8rem; color:#64748B;">(${this._escapeHTML(s.subject_title || '')})</span>
              </div>
              <div class="emg-skip-reason">${this._escapeHTML(s.reason)}</div>
            </div>
          `;
        }).join('');
      } else if (skipContainer) {
        skipContainer.style.display = 'none';
      }

      const startBtn = document.getElementById('emg-start-session');
      if (startBtn) startBtn.style.display = 'inline-flex';
    },

    // =====================================================================
    // PHASE 3: GUIDED LIVE FOCUS SPRINT
    // =====================================================================

    _startSession: function() {
      if (!this.plan || !this.plan.priorities || this.plan.priorities.length === 0) return;

      this.currentPriorityIdx = 0;
      this.currentStepIdx = 0;
      this.topicsCovered = [];
      this.stepsCompleted = 0;
      this.skippedSteps = [];
      this.selfRatings = {};

      const totalMins = this.plan.total_planned_minutes || this.plan.available_minutes || 20;
      this.timerSeconds = totalMins * 60;
      this.initialSeconds = this.timerSeconds;
      this.timeSavedSeconds = 0;

      this._updateTimerDisplay();
      this._renderCurrentStep();
      this._showPhase('session');

      // Start Countdown Timer
      if (this.timerInterval) clearInterval(this.timerInterval);
      const self = this;
      this.timerInterval = setInterval(() => {
        self.timerSeconds--;
        self._updateTimerDisplay();
        if (self.timerSeconds <= 0) {
          clearInterval(self.timerInterval);
          self._finishSession();
        }
      }, 1000);
    },

    _updateTimerDisplay: function() {
      const mins = Math.floor(Math.max(0, this.timerSeconds) / 60);
      const secs = Math.max(0, this.timerSeconds) % 60;
      const el = document.getElementById('emg-timer');
      if (el) el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const statusEl = document.getElementById('emg-budget-status');
      if (statusEl) {
        if (this.timeSavedSeconds > 60) {
          statusEl.textContent = `Ahead of Schedule (+${Math.round(this.timeSavedSeconds / 60)}m saved)`;
          statusEl.style.color = '#059669';
        } else {
          statusEl.textContent = 'Time Remaining • On Track';
          statusEl.style.color = '#64748B';
        }
      }
    },

    _renderCurrentStep: function() {
      const priorities = this.plan.priorities;
      if (this.currentPriorityIdx >= priorities.length) {
        this._finishSession();
        return;
      }

      const priority = priorities[this.currentPriorityIdx];
      const steps = priority.steps || [];

      if (this.currentStepIdx >= steps.length) {
        if (!this.topicsCovered.includes(priority.topic_name)) {
          this.topicsCovered.push(priority.topic_name);
        }
        this.currentPriorityIdx++;
        this.currentStepIdx = 0;
        this._renderCurrentStep();
        return;
      }

      const step = steps[this.currentStepIdx];
      const sIcon = this._getSubjectIcon(priority.subject_id);

      // Update Top Status
      document.getElementById('emg-session-topic').textContent = `${sIcon} ${priority.topic_name}`;
      const totalSteps = this.plan.total_steps || 1;
      document.getElementById('emg-session-progress').textContent = `Step ${this.stepsCompleted + 1} of ${totalSteps} • Topic ${this.currentPriorityIdx + 1} of ${priorities.length}`;

      const tipEl = document.getElementById('emg-session-situation-tip');
      if (tipEl && this.plan.adaptive_tips && this.plan.adaptive_tips.length > 0) {
        const tipIdx = this.currentStepIdx % this.plan.adaptive_tips.length;
        tipEl.textContent = `💡 ${this.plan.adaptive_tips[tipIdx]}`;
      }

      // Render Step Card
      const stepEl = document.getElementById('emg-current-step');
      if (!stepEl) return;

      let resourceAction = '';
      if (step.resource_url) {
        const btnLabel = step.type === 'practice_question' ? 'Open Practice Problems →' :
                         step.type === 'notes_review' ? 'Open Key Notes →' : 'Launch Resource →';
        resourceAction = `<a href="${step.resource_url}" target="_blank" class="emg-step-launch">${btnLabel}</a>`;
      }

      stepEl.innerHTML = `
        <div class="emg-session-step-card">
          <div class="emg-step-number">STEP ${step.step_num} of ${steps.length} • ${this._escapeHTML(step.type.replace('_', ' ').toUpperCase())}</div>
          <div class="emg-step-title">${this._escapeHTML(step.title)}</div>
          <div class="emg-step-duration">⏱ Target Duration: <strong>${step.duration_min} minutes</strong></div>
          <div class="emg-step-instruction">${this._escapeHTML(step.instruction)}</div>
          ${resourceAction}

          <div class="emg-step-selfcheck">
            <span class="emg-selfcheck-label">Rate your grasp on this step:</span>
            <div class="emg-selfcheck-btns" id="emg-step-ratings">
              <button type="button" class="emg-rating-btn" data-rating="1">Still Shaky</button>
              <button type="button" class="emg-rating-btn" data-rating="3">Got It</button>
              <button type="button" class="emg-rating-btn active" data-rating="5">Mastered</button>
            </div>
          </div>
        </div>
      `;

      // Rating click
      stepEl.querySelectorAll('.emg-rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          stepEl.querySelectorAll('.emg-rating-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selfRatings[priority.topic_name] = parseInt(btn.dataset.rating, 10);
        });
      });
    },

    _completeStep: function() {
      this.stepsCompleted++;
      this.currentStepIdx++;
      this._renderCurrentStep();
    },

    _reallocateStep: function() {
      // Signature interaction: Student already knows this concept
      const priorities = this.plan.priorities;
      if (this.currentPriorityIdx < priorities.length) {
        const priority = priorities[this.currentPriorityIdx];
        const step = priority.steps ? priority.steps[this.currentStepIdx] : null;
        const savedMin = step ? step.duration_min : 3;
        this.timeSavedSeconds += (savedMin * 60);

        this.stepsCompleted++;
        this.selfRatings[priority.topic_name] = 5;
        this.currentStepIdx++;
        this._updateTimerDisplay();
        this._renderCurrentStep();
      }
    },

    _skipStep: function() {
      this.skippedSteps.push(this.stepsCompleted + 1);
      this.currentStepIdx++;
      this._renderCurrentStep();
    },

    _finishSession: async function() {
      if (this.timerInterval) clearInterval(this.timerInterval);

      if (this.plan && this.plan.priorities && this.currentPriorityIdx < this.plan.priorities.length) {
        const currentTopic = this.plan.priorities[this.currentPriorityIdx].topic_name;
        if (!this.topicsCovered.includes(currentTopic) && this.currentStepIdx > 0) {
          this.topicsCovered.push(currentTopic);
        }
      }

      const elapsedSeconds = Math.max(60, this.initialSeconds - this.timerSeconds);

      let completeResponse = null;
      try {
        const headers = window.SikshaSession ? SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
        const res = await fetch(this._getApiUrl('/api/emergency/session/complete'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: this.sessionId,
            steps_completed: this.stepsCompleted,
            topics_covered: this.topicsCovered,
            performance: {
              total_time_spent_seconds: elapsedSeconds
            },
            self_ratings: this.selfRatings,
            skipped_steps: this.skippedSteps
          })
        });
        if (res.ok) {
          completeResponse = await res.json();
        }
      } catch (err) {
        console.warn('[Emergency] Failed to persist session completion:', err);
      }

      this._renderCompletion(completeResponse, elapsedSeconds);
      this._showPhase('complete');
    },

    // =====================================================================
    // PHASE 4: MEASURED OUTCOMES & ECOSYSTEM HANDOFF
    // =====================================================================

    _renderCompletion: function(serverResp, elapsedSeconds) {
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

      const timeEl = document.getElementById('emg-out-time');
      const stepsEl = document.getElementById('emg-out-steps');
      const topicsEl = document.getElementById('emg-out-topics');
      const handoffText = document.getElementById('emg-handoff-text');
      const handoffPrimaryBtn = document.getElementById('emg-handoff-primary-btn');

      if (timeEl) timeEl.textContent = `${elapsedMinutes}m`;
      if (stepsEl) stepsEl.textContent = `${this.stepsCompleted}`;
      if (topicsEl) topicsEl.textContent = `${this.topicsCovered.length}`;

      const handoff = serverResp?.handoff;
      if (handoff && handoffText) {
        handoffText.textContent = handoff.reason || 'Your emergency progress has been saved. Consolidate your gains on your scheduled spaced revision calendar.';
        if (handoffPrimaryBtn && handoff.recommended_page) {
          handoffPrimaryBtn.href = handoff.recommended_page;
          handoffPrimaryBtn.textContent = `${handoff.recommended_title || 'Open Smart Revision'} →`;
        }
      } else if (handoffText) {
        handoffText.textContent = `You covered ${this.topicsCovered.length} topic${this.topicsCovered.length !== 1 ? 's' : ''}. Head over to Smart Revision to reinforce your memory on the scheduled curve.`;
      }
    },

    // =====================================================================
    // UTILITIES
    // =====================================================================

    _escapeHTML: function(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(String(str)));
      return div.innerHTML;
    }
  };

  window.EmergencyMode = EmergencyMode;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EmergencyMode.init());
  } else {
    EmergencyMode.init();
  }

})(window);
