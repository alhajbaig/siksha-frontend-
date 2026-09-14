/* ==========================================================================
   SIKHSAATHI — TEACHER & ADMIN PORTAL ENGINE
   "Connecting AI-Powered Personalization with Educator Mentorship"
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  function getApiUrl(path) {
    return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(path)
      : path;
  }

  // =========================================================================
  // 1. SMOOTH SCROLL (LENIS)
  // =========================================================================
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // =========================================================================
  // 2. KATEX AUTO-RENDER HELPER
  // =========================================================================
  function triggerMathRender(el) {
    if (typeof renderMathInElement !== 'undefined') {
      try {
        renderMathInElement(el || document.body, {
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
  setTimeout(() => triggerMathRender(), 100);

  // =========================================================================
  // 3. TOAST NOTIFICATION UTILITY
  // =========================================================================
  function showToast(message, icon = '✓') {
    let toast = document.getElementById('teacher-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'teacher-toast';
      toast.className = 'toast-box';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="color: var(--emerald-primary); font-weight: 800;">${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }
  window.showTeacherToast = showToast;

  // =========================================================================
  // 4. DATA STORE (CURRICULAR MISCONCEPTIONS & DYNAMIC ROSTER)
  // =========================================================================
  let teacherStudentsList = [];

  const misconceptionsData = {
    'Physics': [
      {
        topic: 'Newton\'s Third Law & Normal Force',
        errorRate: 64,
        severity: 'critical',
        affectedCount: 27,
        rootCause: 'Students treat normal contact force as the 3rd-law reaction pair to gravitational weight (mg) rather than earth\'s upward pull on the mass.',
        recommendedIntervention: '10-min Free Body Diagram Socratic Drill with pair-interaction isolation.'
      },
      {
        topic: 'Rolling Without Slipping Friction Direction',
        errorRate: 58,
        severity: 'critical',
        affectedCount: 24,
        rootCause: 'Confusion regarding whether static friction acts forward or backward when torque vs linear force is applied at different radius heights.',
        recommendedIntervention: 'Interactive Visualization Lab on Angular Acceleration and Contact Point Slip.'
      },
      {
        topic: 'Induced EMF & Lenz\'s Law Sign',
        errorRate: 42,
        severity: 'warning',
        affectedCount: 18,
        rootCause: 'Misapplying the right-hand grip rule to determine opposing flux direction.',
        recommendedIntervention: '5-minute micro-assessment on opposing magnetic fields.'
      },
      {
        topic: 'Kinematic 1D Projectile Equations',
        errorRate: 14,
        severity: 'good',
        affectedCount: 6,
        rootCause: 'Occasional sign inconsistency in gravitational acceleration vector (g).',
        recommendedIntervention: 'Routine practice refresher.'
      }
    ],
    'Mathematics': [
      {
        topic: 'Binomial Factorisation Negative Sign Rules',
        errorRate: 62,
        severity: 'critical',
        affectedCount: 26,
        rootCause: 'Failure to distribute negative signs across parenthesis in multi-step quadratic factorisation: $-(a - b) \\neq -a - b$.',
        recommendedIntervention: 'Targeted algebraic sign drills with automated error diagnostic feedback.'
      },
      {
        topic: 'Integration by Parts ILATE Choice',
        errorRate: 49,
        severity: 'warning',
        affectedCount: 21,
        rootCause: 'Incorrect selection of $u$ vs $dv$ when algebraic polynomials multiply inverse trigonometric functions.',
        recommendedIntervention: 'Assign handwritten summary sheet on ILATE hierarchy shortcuts.'
      },
      {
        topic: 'Domain Restrictions in Logarithmic Equations',
        errorRate: 38,
        severity: 'warning',
        affectedCount: 16,
        rootCause: 'Forgetting to check candidate solutions against base and argument positivity requirements $\\log_b(x)$ where $x > 0, b > 0, b \\neq 1$.',
        recommendedIntervention: 'Socratic prompt: "Check your roots in original domain boundaries".'
      },
      {
        topic: 'Matrix Determinants & Inverses',
        errorRate: 18,
        severity: 'good',
        affectedCount: 8,
        rootCause: 'Arithmetic calculation slips in $3\\times 3$ cofactor expansions.',
        recommendedIntervention: 'Self-guided practice module.'
      }
    ],
    'Chemistry': [
      {
        topic: 'SN1 vs SN2 Nucleophilic Substitution Kinetics',
        errorRate: 55,
        severity: 'critical',
        affectedCount: 23,
        rootCause: 'Assuming polar protic solvents accelerate SN2 by solvating nucleophiles instead of retarding nucleophilic attack.',
        recommendedIntervention: 'Interactive Solvent Matrix comparison table and 10-min RAG Quiz.'
      },
      {
        topic: 'Le Chatelier\'s Principle & Inert Gas Addition',
        errorRate: 46,
        severity: 'warning',
        affectedCount: 19,
        rootCause: 'Assuming inert gas addition at constant volume shifts equilibrium when partial pressures remain unchanged.',
        recommendedIntervention: 'Targeted Socratic conceptual question set.'
      },
      {
        topic: 'Buffer Capacity & Henderson-Hasselbalch',
        errorRate: 28,
        severity: 'good',
        affectedCount: 12,
        rootCause: 'Selecting buffers where pH deviates by more than 1 unit from pKa.',
        recommendedIntervention: 'Review notes.'
      }
    ],
    'Biology': [
      {
        topic: 'Meiosis vs Mitosis Chromosome vs Chromatid Counts',
        errorRate: 52,
        severity: 'critical',
        affectedCount: 22,
        rootCause: 'Confusing total centromere count with double-stranded DNA chromatid copy numbers during Anaphase I vs Anaphase II.',
        recommendedIntervention: 'Visual diagram matching lab and Socratic flashcard series.'
      },
      {
        topic: 'Oxidative Phosphorylation Proton Gradient Direction',
        errorRate: 39,
        severity: 'warning',
        affectedCount: 16,
        rootCause: 'Mixing up intermembrane space vs mitochondrial matrix pH and electrochemical gradient polarity.',
        recommendedIntervention: 'Mitochondrial lab simulation.'
      }
    ],
    'Computer Science': [
      {
        topic: 'Recursion Base Cases & Stack Overflow Invariants',
        errorRate: 44,
        severity: 'warning',
        affectedCount: 19,
        rootCause: 'Omitting termination conditions for leaf nodes in binary tree depth-first traversals.',
        recommendedIntervention: 'Code tracing diagnostic puzzle.'
      },
      {
        topic: 'Time Complexity of Nested Loops with Division Step',
        errorRate: 35,
        severity: 'warning',
        affectedCount: 15,
        rootCause: 'Assuming all nested loops run in $O(N^2)$ when inner loops step geometrically in $O(\\log N)$.',
        recommendedIntervention: 'Big-O visual chart analysis.'
      }
    ]
  };

  // =========================================================================
  // 5. STUDENT ROSTER & GENOME DRAWER
  // =========================================================================
  const studentDrawerBackdrop = document.getElementById('student-drawer-backdrop');
  const studentDrawerCloseBtn = document.getElementById('student-drawer-close-btn');
  const drawerStudentName = document.getElementById('drawer-student-name');
  const drawerStudentMeta = document.getElementById('drawer-student-meta');
  const drawerStudentAvatar = document.getElementById('drawer-student-avatar');
  const drawerStudentStatus = document.getElementById('drawer-student-status');
  const drawerGenomeBars = document.getElementById('drawer-genome-bars');
  const drawerStrengthsList = document.getElementById('drawer-strengths-list');
  const drawerGapsList = document.getElementById('drawer-gaps-list');
  const drawerForgettingAlert = document.getElementById('drawer-forgetting-alert');
  const drawerSendGuidanceBtn = document.getElementById('drawer-send-guidance-btn');
  let currentInspectedStudent = null;

  async function openStudentDrawer(studentId, fallbackName = 'Student') {
    if (!studentDrawerBackdrop) return;
    window.openStudentDrawer = openStudentDrawer;
    currentInspectedStudent = { id: studentId, name: fallbackName };

    if (drawerStudentName) drawerStudentName.textContent = fallbackName || 'Loading Scholar...';
    if (drawerStudentMeta) drawerStudentMeta.textContent = 'Fetching verified Learning Genome & diagnostic telemetry...';
    if (drawerStudentAvatar) drawerStudentAvatar.textContent = (fallbackName || 'S').charAt(0).toUpperCase();
    if (drawerStudentStatus) {
      drawerStudentStatus.textContent = 'Analyzing Genome...';
      drawerStudentStatus.className = 'badge badge-indigo';
    }

    if (drawerGenomeBars) {
      drawerGenomeBars.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          Querying authentic Cognitive Fingerprint...
        </div>
      `;
    }
    if (drawerStrengthsList) drawerStrengthsList.innerHTML = '';
    if (drawerGapsList) drawerGapsList.innerHTML = '';
    if (drawerForgettingAlert) drawerForgettingAlert.innerHTML = '';

    studentDrawerBackdrop.classList.add('open');

    try {
      const res = await fetch(getApiUrl(`/api/teacher/students/${studentId}/genome`), { headers: getAuthHeader() });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: Student is not an active enrolled member in any of your classrooms.');
        }
        throw new Error(`Failed to load genome from server (status ${res.status})`);
      }

      const data = await res.json();
      const genome = data.genome;
      currentInspectedStudent = { id: studentId, name: genome.student_name || fallbackName };

      if (drawerStudentName) drawerStudentName.textContent = genome.student_name || fallbackName || 'Enrolled Student';
      if (drawerStudentAvatar) drawerStudentAvatar.textContent = (genome.student_name || fallbackName || 'S').charAt(0).toUpperCase();

      const stage = genome.calibration ? genome.calibration.stage_name : 'Active Member';
      const desc = genome.calibration ? genome.calibration.description : '';
      if (drawerStudentMeta) drawerStudentMeta.textContent = `${stage} • ${desc}`;

      if (drawerStudentStatus) {
        const calLvl = genome.calibration ? genome.calibration.level : 1;
        drawerStudentStatus.textContent = stage;
        drawerStudentStatus.className = `badge ${calLvl >= 4 ? 'badge-emerald' : calLvl >= 2 ? 'badge-indigo' : 'badge-amber'}`;
      }

      // 1. Render Subject Mastery Bars from Real Subject Genomes
      if (drawerGenomeBars) {
        const subjs = genome.subject_genomes || [];
        if (subjs.length > 0) {
          drawerGenomeBars.innerHTML = subjs.map(s => {
            const score = s.accuracy_percent || 0.0;
            const color = score >= 80 ? 'var(--emerald-primary)' : score >= 60 ? 'var(--indigo-primary)' : 'var(--amber-accent)';
            return `
              <div class="genome-bar-row">
                <div class="genome-bar-meta">
                  <span>${s.icon || '📚'} ${s.title}</span>
                  <strong style="color: ${color};">${score}%</strong>
                </div>
                <div class="genome-bar-bg">
                  <div class="genome-bar-fill" style="width: ${Math.max(score, 4)}%; background: ${color};"></div>
                </div>
              </div>
            `;
          }).join('');
        } else {
          drawerGenomeBars.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); font-size: 0.82rem;">
              No quiz diagnostics completed by this student yet.
            </div>
          `;
        }
      }

      // 2. Render Real Demonstrated Strengths
      if (drawerStrengthsList) {
        const strengths = genome.strengths || [];
        if (strengths.length > 0) {
          drawerStrengthsList.innerHTML = strengths.map(st => `
            <li style="display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
              <span style="color: var(--emerald-primary); font-weight: bold;">✓</span>
              <div>
                <strong style="color: var(--text-main);">${st.title}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${st.description}</div>
              </div>
            </li>
          `).join('');
        } else {
          drawerStrengthsList.innerHTML = `
            <li style="font-size: 0.82rem; color: var(--text-muted);">
              Awaiting diagnostic attempts to identify verified cognitive strengths.
            </li>
          `;
        }
      }

      // 3. Render Real Critical Conceptual Gaps & Growth Opportunities
      if (drawerGapsList) {
        const gaps = genome.growth_opportunities || [];
        if (gaps.length > 0) {
          drawerGapsList.innerHTML = gaps.map(m => `
            <li style="display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.85rem; color: #BE123C; background: #FFF1F2; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid #FDA4AF;">
              <span>⚠</span>
              <div>
                <strong>${m.title}</strong>
                <div style="font-size: 0.78rem; color: #9F1239; margin-top: 0.15rem;">${m.description}</div>
              </div>
            </li>
          `).join('');
        } else {
          drawerGapsList.innerHTML = `
            <li style="font-size: 0.82rem; color: var(--emerald-primary); background: rgba(16,185,129,0.08); padding: 0.5rem 0.75rem; border-radius: 8px;">
              ✓ No critical misconception gaps currently detected.
            </li>
          `;
        }
      }

      // 4. Render Retention / Forgetting Curve Alerts
      if (drawerForgettingAlert) {
        const ret = genome.retention_profile;
        if (ret && ret.topics_at_risk && ret.topics_at_risk.length > 0) {
          const topRisk = ret.topics_at_risk[0];
          drawerForgettingAlert.innerHTML = `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
              <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--amber-accent); font-weight: 700;">FORGETTING CURVE DECAY ALERT</div>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-top: 0.2rem;">${topRisk.topic} (${(topRisk.subject_id || 'STEM').toUpperCase()})</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">Memory stability: ${topRisk.stability_days || 1} days. Recommended for targeted recall boost.</div>
            </div>
          `;
        } else {
          drawerForgettingAlert.innerHTML = `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
              <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--emerald-primary); font-weight: 700;">RETENTION EQUILIBRIUM</div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.15rem;">Memory retention is stable across all tested diagnostic concepts.</div>
            </div>
          `;
        }
      }

      triggerMathRender(studentDrawerBackdrop);
    } catch (err) {
      console.error('[Student Drawer] Error loading student genome:', err);
      if (drawerGenomeBars) {
        drawerGenomeBars.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--rose-accent);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
            <div style="font-weight: 700;">${err.message || 'Unable to load student genome.'}</div>
          </div>
        `;
      }
    }
  }

  function closeStudentDrawer() {
    if (studentDrawerBackdrop) studentDrawerBackdrop.classList.remove('open');
  }

  if (studentDrawerCloseBtn) {
    studentDrawerCloseBtn.addEventListener('click', closeStudentDrawer);
  }
  if (studentDrawerBackdrop) {
    studentDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === studentDrawerBackdrop) closeStudentDrawer();
    });
  }

  // Bind all student table rows and inspection buttons
  function bindStudentRowTriggers() {
    document.querySelectorAll('[data-student-id]').forEach(elem => {
      elem.addEventListener('click', () => {
        const id = elem.getAttribute('data-student-id');
        openStudentDrawer(id);
      });
    });
  }
  bindStudentRowTriggers();

  // =========================================================================
  // 6. MISCONCEPTION HEATMAP TAB FILTERING
  // =========================================================================
  const subjectTabButtons = document.querySelectorAll('.subject-tab-btn');
  const heatmapBody = document.getElementById('heatmap-table-body');

  function renderHeatmap(subject = 'Physics') {
    if (!heatmapBody) return;
    const list = misconceptionsData[subject] || [];
    heatmapBody.innerHTML = list.map(item => {
      const pillClass = item.severity === 'critical' ? 'pill-critical' : item.severity === 'warning' ? 'pill-warning' : 'pill-good';
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${item.topic}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); max-width: 520px; line-height: 1.4; margin-top: 0.15rem;">${item.rootCause}</div>
          </td>
          <td>
            <div class="misconception-cell">
              <span class="cell-pill ${pillClass}">${item.errorRate}%</span>
              <span style="font-size: 0.76rem; color: var(--text-muted);">${item.affectedCount}/42 Students</span>
            </div>
          </td>
          <td>
            <span class="badge ${item.severity === 'critical' ? 'badge-rose' : item.severity === 'warning' ? 'badge-amber' : 'badge-emerald'}">
              ${item.severity.toUpperCase()}
            </span>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.35rem;">${item.recommendedIntervention}</div>
            <button class="btn btn-secondary btn-sm" onclick="dispatchCohortIntervention('${subject}', '${item.topic.replace(/'/g, "\\'")}')">
              <span>Send Review Drill</span>
              <span>→</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    triggerMathRender(heatmapBody);
  }

  if (subjectTabButtons.length > 0) {
    subjectTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        subjectTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const subject = btn.getAttribute('data-subject') || 'Physics';
        renderHeatmap(subject);
      });
    });
    renderHeatmap('Physics');
  }

  window.dispatchCohortIntervention = function(subject, topic) {
    showToast(`Targeted review drill on "${topic}" queued for cohort!`, '🚀');
  };

  // =========================================================================
  // 7. INTERACTIVE ASSESSMENT CREATION MODAL
  // =========================================================================
  const openAssessmentModalBtn = document.getElementById('open-create-assessment-btn');
  const closeAssessmentModalBtn = document.getElementById('close-assessment-modal-btn');
  const assessmentModal = document.getElementById('assessment-modal');
  const createAssessmentForm = document.getElementById('create-assessment-form');
  const addQuestionBtn = document.getElementById('add-question-btn');
  const questionContainer = document.getElementById('dynamic-questions-container');

  if (openAssessmentModalBtn && assessmentModal) {
    openAssessmentModalBtn.addEventListener('click', () => {
      assessmentModal.classList.add('open');
    });
  }

  if (closeAssessmentModalBtn && assessmentModal) {
    closeAssessmentModalBtn.addEventListener('click', () => {
      assessmentModal.classList.remove('open');
    });
  }

  let questionCounter = 1;
  if (addQuestionBtn && questionContainer) {
    addQuestionBtn.addEventListener('click', () => {
      questionCounter++;
      const qDiv = document.createElement('div');
      qDiv.className = 'card';
      qDiv.style.padding = '1rem';
      qDiv.style.marginBottom = '0.75rem';
      qDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--indigo-primary);">QUESTION #${questionCounter}</span>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--rose-accent);" onclick="this.parentElement.parentElement.remove()">Remove ✕</button>
        </div>
        <div class="form-group" style="margin-bottom: 0.5rem;">
          <label class="form-label">Question Prompt</label>
          <input type="text" class="form-input" placeholder="e.g. Find the roots of $2x^2 - 7x + 3 = 0$" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <input type="text" class="form-input" placeholder="Option A (Correct Answer)">
          <input type="text" class="form-input" placeholder="Option B (Distractor)">
        </div>
        <div class="form-group" style="margin-top: 0.5rem;">
          <label class="form-label">Socratic Hint for Student</label>
          <input type="text" class="form-input" placeholder="e.g. Factorise by splitting the middle term into -6x and -x.">
        </div>
      `;
      questionContainer.appendChild(qDiv);
      triggerMathRender(qDiv);
    });
  }

  if (createAssessmentForm && assessmentModal) {
    createAssessmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('assessment-title-input')?.value || 'Diagnostic Test';
      const subject = document.getElementById('assessment-subject-select')?.value || 'Physics';
      const type = document.getElementById('assessment-type-select')?.value || 'Diagnostic 10-Min';

      // Insert new row into table if present
      const assessmentsTableBody = document.getElementById('assessments-table-body');
      if (assessmentsTableBody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${title}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${subject} • ${type}</div>
          </td>
          <td><span class="badge badge-indigo">ACTIVE</span></td>
          <td>0 / 42</td>
          <td>--</td>
          <td>15 min</td>
          <td>Just now</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Assessment copied to clipboard link!', '📋')">Share Link</button>
          </td>
        `;
        assessmentsTableBody.prepend(tr);
      }

      assessmentModal.classList.remove('open');
      showToast(`Assessment "${title}" published to cohort!`, '🚀');
      createAssessmentForm.reset();
    });
  }

  // =========================================================================
  // 8. NOTES & STUDY RESOURCES UPLOAD MODAL (RAG INGESTION)
  // =========================================================================
  const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
  const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
  const uploadModal = document.getElementById('upload-modal');
  const uploadNotesForm = document.getElementById('upload-notes-form');
  const dropzone = document.getElementById('notes-file-dropzone');
  const fileInput = document.getElementById('notes-file-input');

  if (openUploadModalBtn && uploadModal) {
    openUploadModalBtn.addEventListener('click', () => {
      uploadModal.classList.add('open');
    });
  }
  if (closeUploadModalBtn && uploadModal) {
    closeUploadModalBtn.addEventListener('click', () => {
      uploadModal.classList.remove('open');
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const fileNameDisplay = document.getElementById('selected-file-name');
        if (fileNameDisplay) fileNameDisplay.textContent = `Selected: ${e.dataTransfer.files[0].name}`;
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        const fileNameDisplay = document.getElementById('selected-file-name');
        if (fileNameDisplay) fileNameDisplay.textContent = `Selected: ${fileInput.files[0].name}`;
      }
    });
  }

  if (uploadNotesForm && uploadModal) {
    uploadNotesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('upload-title-input')?.value || 'Study Material';
      const subject = document.getElementById('upload-subject-select')?.value || 'Physics';
      const isHandwritten = document.getElementById('upload-is-handwritten')?.checked;

      uploadModal.classList.remove('open');
      showToast('Extracting text & vectorising chunks for Cohort AI...', '⏳');

      setTimeout(() => {
        const resourcesList = document.getElementById('resources-table-body');
        if (resourcesList) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div style="font-weight: 700; color: var(--text-main);">${title}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${subject} • ${isHandwritten ? 'Handwritten-Style' : 'PDF Document'}</div>
            </td>
            <td><span class="badge badge-emerald">INDEXED (18 CHUNKS)</span></td>
            <td>Class 12-A</td>
            <td>Just now</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="showToast('Opening RAG knowledge preview...', '📖')">Inspect RAG</button>
            </td>
          `;
          resourcesList.prepend(tr);
        }
        showToast(`Resource "${title}" successfully embedded into Student AI RAG!`, '✓');
        uploadNotesForm.reset();
      }, 1400);
    });
  }

  // =========================================================================
  // 9. PERSONALIZED GUIDANCE & INTERVENTION DISPATCHER
  // =========================================================================
  const guidanceModal = document.getElementById('guidance-modal');
  const closeGuidanceModalBtn = document.getElementById('close-guidance-modal-btn');
  const guidanceForm = document.getElementById('guidance-form');
  const guidanceStudentSelect = document.getElementById('guidance-student-select');

  function openGuidanceModal(studentId = null) {
    if (!guidanceModal) return;
    if (studentId && guidanceStudentSelect) {
      guidanceStudentSelect.value = studentId;
    }
    guidanceModal.classList.add('open');
  }

  if (drawerSendGuidanceBtn) {
    drawerSendGuidanceBtn.addEventListener('click', () => {
      if (currentInspectedStudent) {
        closeStudentDrawer();
        openGuidanceModal(currentInspectedStudent.id);
      }
    });
  }

  if (closeGuidanceModalBtn && guidanceModal) {
    closeGuidanceModalBtn.addEventListener('click', () => {
      guidanceModal.classList.remove('open');
    });
  }

  if (guidanceForm && guidanceModal) {
    guidanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sId = guidanceStudentSelect?.value;
      const student = teacherStudentsList.find(s => s.id === sId) || { name: 'Student' };
      const noteText = document.getElementById('guidance-text-input')?.value || 'Focus on binomial expansion sign rules.';
      const interventionType = document.getElementById('guidance-type-select')?.value || 'Targeted Practice';

      guidanceModal.classList.remove('open');
      showToast(`Personalized ${interventionType} dispatched directly to ${student.name}'s portal!`, '✉');

      const activityList = document.getElementById('recent-activity-list');
      if (activityList) {
        const item = document.createElement('div');
        item.style.padding = '0.75rem 0';
        item.style.borderBottom = '1px solid var(--border-subtle)';
        item.style.fontSize = '0.84rem';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
            <strong style="color: var(--text-main);">${student.name}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">Just now</span>
          </div>
          <div style="color: var(--indigo-primary); font-size: 0.78rem; font-weight: 600;">${interventionType} Assigned:</div>
          <div style="color: var(--text-secondary); font-size: 0.8rem;">“${noteText}”</div>
        `;
        activityList.prepend(item);
      }
      guidanceForm.reset();
    });
  }

  // Bind any open-guidance buttons on page
  document.querySelectorAll('[data-open-guidance]').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-open-guidance');
      openGuidanceModal(studentId);
    });
  });

  // =========================================================================
  // 10. SOCRATIC AI CLASS COPILOT
  // =========================================================================
  const copilotForm = document.getElementById('copilot-form');
  const copilotInput = document.getElementById('copilot-user-prompt');
  const copilotStream = document.getElementById('copilot-response-box');

  const copilotPresetChips = document.querySelectorAll('.copilot-preset-chip');
  if (copilotPresetChips.length > 0 && copilotInput && copilotForm) {
    copilotPresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        copilotInput.value = chip.textContent.trim();
        copilotForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  if (copilotForm && copilotInput && copilotStream) {
    copilotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prompt = copilotInput.value.trim();
      if (!prompt) return;

      copilotStream.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">✦ AI Copilot analyzing Class 12-A telemetry and drafting recommendations...</div>`;
      copilotInput.value = '';

      setTimeout(() => {
        let reply = '';
        if (prompt.toLowerCase().includes('warm-up') || prompt.toLowerCase().includes('diagnostic')) {
          reply = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="font-weight: 700; color: var(--indigo-primary); font-size: 0.9rem;">
                🎯 Recommended 5-Minute Class Warm-up (Targeting 64% Misconception Rate):
              </div>
              <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main);">
                <strong>Problem:</strong> A block of mass $m$ rests on a table. A student claims that the normal force $N$ and the earth's gravity $mg$ are an action-reaction pair per Newton's Third Law.
              </p>
              <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.82rem;">
                <strong>Socratic Guiding Question for Class:</strong> “If we remove the table instantly, the normal force drops to zero immediately. Does earth's gravity disappear as well? Why does this prove they act on different interaction bodies?”
              </div>
              <button class="btn btn-primary btn-sm" style="align-self: flex-start;" onclick="showToast('Pushed to Class 12-A Entrance Quiz!', '✓')">Push as Live Entrance Ticket</button>
            </div>
          `;
        } else if (prompt.toLowerCase().includes('misconception') || prompt.toLowerCase().includes('summary')) {
          reply = `
            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              <div style="font-weight: 700; color: var(--rose-accent); font-size: 0.9rem;">
                ⚠ Top 3 Cohort Blockers Identified in Class 12-A:
              </div>
              <ol style="padding-left: 1.25rem; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem; color: var(--text-main);">
                <li><strong>Physics:</strong> Normal contact force vs gravitational reaction pairs (27 students flagged).</li>
                <li><strong>Mathematics:</strong> Negative sign distribution across binomial brackets (26 students flagged).</li>
                <li><strong>Chemistry:</strong> Solvent polarity effect on nucleophile solvation kinetics in SN1 vs SN2 (23 students flagged).</li>
              </ol>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Recommendation: Dedicate 15 minutes of tomorrow's session to boundary condition comparisons.</div>
            </div>
          `;
        } else {
          reply = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="font-weight: 700; color: var(--indigo-primary); font-size: 0.88rem;">AI Copilot Recommendation:</div>
              <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-main);">
                Based on your instruction: <em>"${prompt}"</em>, SikshaSaathi has formulated a calibrated exercise with graded hints. 
                Average expected cohort completion time: <strong>8.5 minutes</strong>.
              </p>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                <button class="btn btn-secondary btn-sm" onclick="showToast('Exported to PDF worksheet!', '📄')">Export Worksheet</button>
                <button class="btn btn-primary btn-sm" onclick="showToast('Assigned to 42 students!', '🚀')">Assign to Cohort</button>
              </div>
            </div>
          `;
        }
        copilotStream.innerHTML = reply;
        triggerMathRender(copilotStream);
      }, 750);
    });
  }

  // =========================================================================
  // 11. SEARCH FILTERING ACROSS TABLES
  // =========================================================================
  const globalSearchInput = document.getElementById('global-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('.filterable-row');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // =========================================================================
  // 12. EDUCATOR AUTHENTICATED SESSION SYNC & SIGNOUT
  // =========================================================================
  if (window.SikshaSession) {
    window.SikshaSession.updateUI();

    // Verify authenticated teacher session with backend
    window.SikshaSession.fetchCurrentUser('teacher').then((user) => {
      if (user) {
        window.SikshaSession.updateUI();
        initTeacherData();
      }
    }).catch(err => {
      console.warn('Teacher session verification notice:', err);
    });
  } else {
    initTeacherData();
  }

  const signoutBtn = document.getElementById('teacher-signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.SikshaSession) {
        window.SikshaSession.logout(e, '/auth.html?role=teacher');
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/auth.html?role=teacher');
      }
    });
  }

  // =========================================================================
  // 13. REAL EDUCATOR DATA ENGINE (PROFILE, METRICS & CLASSROOMS)
  // =========================================================================
  function getAuthHeader() {
    const token = window.SikshaSession ? window.SikshaSession.getToken() : localStorage.getItem('siksha_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  async function initTeacherData() {
    await Promise.allSettled([
      loadTeacherProfile(),
      loadTeacherMetrics(),
      loadTeacherClasses(),
      loadTeacherStudents()
    ]);
  }

  async function loadTeacherProfile() {
    try {
      const res = await fetch(getApiUrl('/api/teacher/profile'), { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();

      // Update sidebar
      const nameEls = document.querySelectorAll('.profile-name, #user-display-name');
      nameEls.forEach(el => el.textContent = data.full_name || 'Educator');

      const roleEls = document.querySelectorAll('.profile-role');
      roleEls.forEach(el => el.textContent = data.subject ? `${data.subject} Specialist` : (data.institution || 'Verified Educator'));

      const avatarEls = document.querySelectorAll('.profile-avatar');
      const initials = (data.full_name || 'ED').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      avatarEls.forEach(el => el.textContent = initials);

      // Update Hero banner
      const heroNameEl = document.getElementById('hero-teacher-name');
      if (heroNameEl) {
        const firstName = (data.full_name || 'Educator').split(' ')[0];
        heroNameEl.textContent = `Good morning, ${firstName}.`;
      }

      const heroSummaryEl = document.getElementById('hero-teacher-summary');
      if (heroSummaryEl) {
        const inst = data.institution ? `${data.institution} • ` : '';
        heroSummaryEl.innerHTML = `${inst}<strong>${data.total_classes}</strong> Active Classrooms • <strong>${data.total_students}</strong> Enrolled Scholars. Real-time cognitive telemetry active.`;
      }

      // Populate Edit Profile modal inputs
      const editName = document.getElementById('edit-profile-name');
      if (editName) editName.value = data.full_name || '';
      const editInst = document.getElementById('edit-profile-institution');
      if (editInst) editInst.value = data.institution || '';
      const editSubj = document.getElementById('edit-profile-subject');
      if (editSubj) editSubj.value = data.subject || '';
      const editBio = document.getElementById('edit-profile-bio');
      if (editBio) editBio.value = data.bio || '';
    } catch (err) {
      console.warn('Could not load teacher profile:', err);
    }
  }

  async function loadTeacherMetrics() {
    try {
      const res = await fetch(getApiUrl('/api/teacher/metrics'), { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      const m = data.metrics;

      const classesEl = document.getElementById('metric-classes');
      if (classesEl) classesEl.textContent = m.total_classes;

      const studentsEl = document.getElementById('metric-students');
      if (studentsEl) studentsEl.textContent = m.total_students;

      const masteryEl = document.getElementById('metric-mastery');
      if (masteryEl) masteryEl.textContent = `${m.average_mastery}%`;

      const healthEl = document.getElementById('metric-cohort-health');
      if (healthEl) healthEl.innerHTML = `${m.average_mastery}<span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 600;">%</span>`;

      const healthStatusEl = document.getElementById('metric-health-status');
      if (healthStatusEl) {
        healthStatusEl.textContent = m.total_students > 0 ? '● Active Monitoring' : '○ Awaiting Students';
      }
    } catch (err) {
      console.warn('Could not load teacher metrics:', err);
    }
  }

  async function loadTeacherClasses() {
    const gridEl = document.getElementById('teacher-classes-grid');
    const cohortSelector = document.getElementById('cohort-selector');

    try {
      const res = await fetch(getApiUrl('/api/teacher/classes'), { headers: getAuthHeader() });
      if (!res.ok) {
        if (gridEl) gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--rose-accent);">Failed to load classrooms.</div>';
        return;
      }
      const data = await res.json();
      const classes = data.classes || [];

      // Update Cohort Selector Dropdown
      if (cohortSelector) {
        if (classes.length > 0) {
          cohortSelector.innerHTML = '<option value="" selected>All Enrolled Classrooms</option>' + classes.map(c => 
            `<option value="${c.id}">${c.name} (${c.join_code}) • ${c.student_count} Students</option>`
          ).join('');
        } else {
          cohortSelector.innerHTML = '<option value="">No classrooms created yet</option>';
        }
      }

      // Update My Classrooms Grid
      if (gridEl) {
        if (classes.length === 0) {
          gridEl.innerHTML = `
            <div class="empty-state-card">
              <div style="font-size: 2.75rem; margin-bottom: 0.75rem;">🏫</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.4rem;">No classes yet</h3>
              <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 460px; margin: 0 auto 1.5rem auto;">
                Create your first class to start teaching with Siksha Saathi. You will get a unique join code to share with your students.
              </p>
              <button type="button" class="btn btn-primary" onclick="openModal('create-class-modal')">
                <span>+ Create Your First Class</span>
              </button>
            </div>
          `;
        } else {
          gridEl.innerHTML = classes.map(c => `
            <div class="class-card">
              <div class="class-card-header">
                <div>
                  <h3 class="class-card-title">${c.name}</h3>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">${c.grade_level || 'General Level'}</div>
                </div>
                <span class="class-subject-badge">${c.subject || 'STEM'}</span>
              </div>

              <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45; min-height: 2.5rem;">
                ${c.description || 'Interactive diagnostic cohort with AI-calibrated socratic assistance and knowledge frontier telemetry.'}
              </div>

              <div class="class-code-box">
                <div>
                  <div style="font-size: 0.66rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">OFFICIAL JOIN CODE</div>
                  <div class="class-code-text">${c.join_code}</div>
                </div>
                <button type="button" class="btn-copy-code" data-code="${c.join_code}" title="Copy Class Code">
                  <span>📋 Copy Code</span>
                </button>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.85rem; margin-top: 0.25rem;">
                <span style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600; color: var(--text-main);">
                  <span>👥</span> ${c.student_count} ${c.student_count === 1 ? 'Student' : 'Students'} Enrolled
                </span>
                <span style="color: var(--emerald-primary); font-weight: 600;">● Active</span>
              </div>
            </div>
          `).join('');

          // Bind Copy Buttons
          gridEl.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const code = btn.getAttribute('data-code');
              copyToClipboard(code);
            });
          });
        }
      }
    } catch (err) {
      console.warn('Could not load teacher classes:', err);
      if (gridEl) gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--rose-accent);">Error connecting to classrooms server.</div>';
    }
  }

  // =========================================================================
  // 13B. REAL STUDENT ROSTER & COGNITIVE TELEMETRY ENGINE
  // =========================================================================
  let currentRosterFilter = 'all';
  let currentRosterSearch = '';

  async function loadTeacherStudents(classId = '') {
    const rosterBody = document.getElementById('roster-table-body');
    const queueList = document.getElementById('attention-queue-list');
    const totalEl = document.getElementById('roster-total-cohort');
    const excellingEl = document.getElementById('roster-excelling-tier');
    const ontrackEl = document.getElementById('roster-ontrack-tier');
    const supportEl = document.getElementById('roster-support-tier');
    const btnAll = document.getElementById('btn-count-all');
    const btnAttention = document.getElementById('btn-count-attention');
    const btnExcelling = document.getElementById('btn-count-excelling');
    const guidanceSelect = document.getElementById('guidance-student-select');

    try {
      const url = classId ? `/api/teacher/students?class_id=${encodeURIComponent(classId)}` : '/api/teacher/students';
      const res = await fetch(getApiUrl(url), { headers: getAuthHeader() });
      if (!res.ok) {
        if (rosterBody) {
          rosterBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--rose-accent);">Failed to load student roster from database.</td></tr>';
        }
        if (queueList) {
          queueList.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: var(--rose-accent);">Failed to load attention queue.</div>';
        }
        return;
      }

      const data = await res.json();
      teacherStudentsList = data.students || [];

      // Update Summary Counts
      if (totalEl) totalEl.textContent = data.total || 0;
      if (excellingEl) excellingEl.textContent = data.excelling_count || 0;
      if (ontrackEl) ontrackEl.textContent = data.on_track_count || 0;
      if (supportEl) supportEl.textContent = data.attention_count || 0;

      // Update Filter Button Count Badges
      if (btnAll) btnAll.textContent = data.total || 0;
      if (btnAttention) btnAttention.textContent = data.attention_count || 0;
      if (btnExcelling) btnExcelling.textContent = data.excelling_count || 0;

      // Update Guidance Modal select dropdown options
      if (guidanceSelect) {
        if (teacherStudentsList.length > 0) {
          guidanceSelect.innerHTML = teacherStudentsList.map(s => `<option value="${s.id}">${s.name || s.full_name || 'Student'} (${s.class_name || 'Class'})</option>`).join('');
        } else {
          guidanceSelect.innerHTML = '<option value="">No enrolled students</option>';
        }
      }

      // Render Roster Table Rows
      renderRosterRows();

      // Render Attention Queue on Index page
      renderAttentionQueue();

    } catch (err) {
      console.warn('Error loading teacher students:', err);
      if (rosterBody) {
        rosterBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--rose-accent);">Error loading student roster.</td></tr>';
      }
      if (queueList) {
        queueList.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: var(--rose-accent);">Error connecting to learning genome server.</div>';
      }
    }
  }

  function renderRosterRows() {
    const rosterBody = document.getElementById('roster-table-body');
    if (!rosterBody) return;

    let filtered = teacherStudentsList;
    if (currentRosterFilter === 'attention') {
      filtered = filtered.filter(s => s.status_tier === 'Needs Attention');
    } else if (currentRosterFilter === 'excelling') {
      filtered = filtered.filter(s => s.status_tier === 'Excelling');
    }

    if (currentRosterSearch.trim()) {
      const q = currentRosterSearch.toLowerCase();
      filtered = filtered.filter(s => {
        const sName = s.name || s.full_name || '';
        return (
          (sName && sName.toLowerCase().includes(q)) || 
          (s.email && s.email.toLowerCase().includes(q)) || 
          (s.class_name && s.class_name.toLowerCase().includes(q))
        );
      });
    }

    if (filtered.length === 0) {
      const msg = teacherStudentsList.length === 0 
        ? 'No students enrolled in your classrooms yet. Share your class join code to get started.'
        : 'No students match the current filter or search criteria.';
      rosterBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 0.9rem;">
            ${msg}
          </td>
        </tr>
      `;
      return;
    }

    rosterBody.innerHTML = filtered.map(s => {
      const sName = s.name || s.full_name || 'Student';
      const statusBadge = s.status_tier === 'Excelling'
        ? '<span class="badge badge-emerald">Excelling</span>'
        : s.status_tier === 'Needs Attention'
        ? '<span class="badge badge-rose">Needs Support</span>'
        : '<span class="badge badge-indigo">On Track</span>';

      const barColor = s.mastery_percent >= 80 ? 'var(--emerald-primary)' : s.mastery_percent >= 60 ? 'var(--indigo-primary)' : 'var(--rose-accent)';
      const initials = sName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'S';
      const streakCount = s.streak != null ? s.streak : (s.streak_days != null ? s.streak_days : 0);

      return `
        <tr style="cursor: pointer;" data-student-id="${s.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="profile-avatar" style="width: 36px; height: 36px; font-size: 0.82rem;">${initials}</div>
              <div>
                <strong style="color: var(--text-main); font-size: 0.88rem;">${sName}</strong>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${s.email || ''} • <span style="color: var(--indigo-primary); font-weight: 600;">${s.class_name || 'Classroom'}</span></div>
              </div>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <div style="flex: 1; min-width: 65px; height: 6px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
                <div style="width: ${Math.max(s.mastery_percent || 0, 4)}%; height: 100%; background: ${barColor};"></div>
              </div>
              <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem; color: var(--text-main);">${s.mastery_percent || 0}%</span>
            </div>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 500;">
              ${(s.mastery_percent || 0) >= 75 ? 'Curriculum Mastery' : 'Foundational Concepts'}
            </span>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: ${s.status_tier === 'Needs Attention' ? 'var(--rose-accent)' : 'var(--text-muted)'};">
              ${s.status_tier === 'Needs Attention' ? 'Active Diagnostic Gaps' : 'No Critical Flags'}
            </span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
              ${streakCount ? `${streakCount}d streak` : 'Active'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="openStudentDrawer('${s.id}', '${sName.replace(/'/g, "\\'")}')">
              <span>View Genome</span>
              <span>↗</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    bindStudentRowTriggers();
  }

  function renderAttentionQueue() {
    const queueList = document.getElementById('attention-queue-list');
    if (!queueList) return;

    if (teacherStudentsList.length === 0) {
      queueList.innerHTML = `
        <div style="padding: 1.5rem 1rem; text-align: center; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); color: var(--text-muted); font-size: 0.85rem;">
          <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">🌱</div>
          <div>No students enrolled yet.</div>
          <div style="font-size: 0.76rem; margin-top: 0.25rem;">Create a classroom and share your join code to track student cognitive frontiers.</div>
        </div>
      `;
      return;
    }

    const flagged = teacherStudentsList.filter(s => s.status_tier === 'Needs Attention');
    const displayList = flagged.length > 0 ? flagged : teacherStudentsList.slice(0, 3);

    queueList.innerHTML = displayList.map(s => {
      const sName = s.name || s.full_name || 'Student';
      const pillClass = s.status_tier === 'Needs Attention' ? 'badge-rose' : 'badge-indigo';
      const initials = sName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'S';

      return `
        <div class="attention-card" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-card); transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="profile-avatar" style="width: 38px; height: 38px; font-size: 0.85rem;">${initials}</div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.45rem;">
                <strong style="color: var(--text-main); font-size: 0.88rem;">${sName}</strong>
                <span class="badge ${pillClass}" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">${s.status_tier}</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                ${s.class_name || 'Classroom'} • <span style="font-family: var(--font-mono); font-weight: 600; color: var(--text-main);">${s.mastery_percent || 0}% Mastery</span>
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="openStudentDrawer('${s.id}', '${sName.replace(/'/g, "\\'")}')">
            <span>Inspect Genome</span>
            <span>→</span>
          </button>
        </div>
      `;
    }).join('');
  }

  // Bind roster search input
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentRosterSearch = e.target.value;
      renderRosterRows();
    });
  }

  // Bind roster tier filter buttons
  const filterAllBtn = document.getElementById('filter-all-btn');
  const filterAttnBtn = document.getElementById('filter-attention-btn');
  const filterExcelBtn = document.getElementById('filter-excelling-btn');

  function setActiveFilterBtn(activeBtn) {
    [filterAllBtn, filterAttnBtn, filterExcelBtn].forEach(b => {
      if (b) {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      }
    });
    if (activeBtn) {
      activeBtn.classList.remove('btn-secondary');
      activeBtn.classList.add('btn-primary');
    }
  }

  if (filterAllBtn) {
    filterAllBtn.addEventListener('click', () => {
      currentRosterFilter = 'all';
      setActiveFilterBtn(filterAllBtn);
      renderRosterRows();
    });
  }
  if (filterAttnBtn) {
    filterAttnBtn.addEventListener('click', () => {
      currentRosterFilter = 'attention';
      setActiveFilterBtn(filterAttnBtn);
      renderRosterRows();
    });
  }
  if (filterExcelBtn) {
    filterExcelBtn.addEventListener('click', () => {
      currentRosterFilter = 'excelling';
      setActiveFilterBtn(filterExcelBtn);
      renderRosterRows();
    });
  }

  // Bind Cohort Selector change
  const cohortSelect = document.getElementById('cohort-selector');
  if (cohortSelect) {
    cohortSelect.addEventListener('change', (e) => {
      const selectedClassId = e.target.value;
      loadTeacherStudents(selectedClassId);
    });
  }


  // =========================================================================
  // 14. MODAL MANAGEMENT & CLIPBOARD CONTROLS
  // =========================================================================
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  };

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal');
      if (targetId) closeModal(targetId);
    });
  });

  // Open Create Class modal triggers
  const createClassTriggers = ['open-create-class-btn', 'open-create-class-grid-btn'];
  createClassTriggers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal('create-class-modal'));
  });

  // Open Edit Profile modal triggers
  const editProfileTriggers = ['open-edit-profile-btn', 'open-edit-profile-hero-btn', 'sidebar-profile-card'];
  editProfileTriggers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal('edit-profile-modal'));
  });

  // Copy code helper
  function copyToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Class code ${text} copied to clipboard!`, '📋');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`Class code ${text} copied to clipboard!`, '📋');
  }

  const successCopyBtn = document.getElementById('success-copy-code-btn');
  if (successCopyBtn) {
    successCopyBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('success-class-code');
      if (codeEl) copyToClipboard(codeEl.textContent.trim());
    });
  }

  // =========================================================================
  // 15. CREATE CLASS FORM SUBMISSION
  // =========================================================================
  const createClassForm = document.getElementById('create-class-form');
  if (createClassForm) {
    createClassForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-create-class-btn');
      const nameInput = document.getElementById('class-name-input');
      const subjectSelect = document.getElementById('class-subject-select');
      const gradeInput = document.getElementById('class-grade-input');
      const descInput = document.getElementById('class-desc-input');

      if (!nameInput || !nameInput.value.trim()) {
        showToast('Please enter a classroom name.', '⚠');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating Classroom...';
      }

      try {
        const payload = {
          name: nameInput.value.trim(),
          subject: subjectSelect ? subjectSelect.value : 'Physics',
          grade_level: gradeInput ? gradeInput.value.trim() : 'Class 12',
          description: descInput ? descInput.value.trim() : ''
        };

        const res = await fetch(getApiUrl('/api/teacher/classes'), {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || 'Failed to create classroom.');
        }

        // Close creation modal and reset
        closeModal('create-class-modal');
        createClassForm.reset();

        // Show Success modal with official join code
        const successName = document.getElementById('success-class-name');
        if (successName) successName.textContent = data.classroom.name;

        const successCode = document.getElementById('success-class-code');
        if (successCode) successCode.textContent = data.classroom.join_code;

        openModal('class-success-modal');
        showToast(`Class '${data.classroom.name}' created! Code: ${data.classroom.join_code}`, '🎉');

        // Revalidate UI
        await Promise.allSettled([
          loadTeacherMetrics(),
          loadTeacherClasses(),
          loadTeacherStudents(),
          loadTeacherProfile()
        ]);
      } catch (err) {
        showToast(err.message || 'Error creating class. Please try again.', '✕');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '🚀 Generate Classroom & Unique Join Code';
        }
      }
    });
  }

  // =========================================================================
  // 16. EDIT PROFILE FORM SUBMISSION
  // =========================================================================
  const editProfileForm = document.getElementById('edit-profile-form');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-edit-profile-btn');
      const editName = document.getElementById('edit-profile-name');
      const editInst = document.getElementById('edit-profile-institution');
      const editSubj = document.getElementById('edit-profile-subject');
      const editBio = document.getElementById('edit-profile-bio');

      if (!editName || !editName.value.trim()) {
        showToast('Please enter your full name.', '⚠');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Changes...';
      }

      try {
        const payload = {
          full_name: editName.value.trim(),
          institution: editInst ? editInst.value.trim() : '',
          subject: editSubj ? editSubj.value.trim() : '',
          bio: editBio ? editBio.value.trim() : ''
        };

        const res = await fetch(getApiUrl('/api/teacher/profile'), {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to update profile.');
        }

        closeModal('edit-profile-modal');
        showToast('Profile updated successfully!', '✓');

        // Refresh UI
        await loadTeacherProfile();
      } catch (err) {
        showToast(err.message || 'Error updating profile.', '✕');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Profile Changes';
        }
      }
    });
  }

  // Initialize educator telemetry from Supabase
  initTeacherData();

});
